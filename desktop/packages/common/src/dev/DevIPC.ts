
import "../Types"
import {WebpackAssetInfo} from "@flipper/common"
import { Deferred } from "../async/Deferred"
import { getLogger } from "../logging/Logger"


const messageTypes = ["getPlugins", "pluginUpdated"],
  eventTypes = [
    "connect",
    "disconnect",
    "destroy",
    "error",
    "socket.disconnected"
  ]


export interface DevPluginModule {
  id: string
  name: string
  path: string
  assets?: Array<WebpackAssetInfo>
}

export type DevIPCMessagePayload<Type extends DevIPCMessageType> =
  Type extends  "pluginUpdated" ? {
    plugin: DevPluginModule
  } : Type extends "getPlugins" ? {
    plugins?: Array<DevPluginModule>
    }
  : never

export type DevIPCMessageType = typeof messageTypes[number]

export type DevIPCMessage<Type extends DevIPCMessageType> = {
  type: Type
  payload: DevIPCMessagePayload<Type>
}

export type DevIPCMessageHandler<Type extends DevIPCMessageType, Message extends DevIPCMessage<Type> = DevIPCMessage<Type>> = (
  ipc: DevIPC,
  type: Type,
  msg: Message
) => void

export type DevIPCMessagePayloadParam<Type extends DevIPCMessageType> =
  Omit<DevIPCMessagePayload<Type>,'type'>

export interface DevIPC {
  on<Type extends DevIPCMessageType>(type: Type, handler: DevIPCMessageHandler<typeof type>): void
  off<Type extends DevIPCMessageType>(type: Type, handler: DevIPCMessageHandler<typeof type>): void
  emit<Type extends DevIPCMessageType>(
    type: Type,
    payload: DevIPCMessagePayloadParam<typeof type>
  ): void
  start(): Promise<void>
  stop(): void
}

export interface DevIPCConstructor {
  new (): DevIPC
}

let devIPCServer: DevIPCConstructor | null = null,
  devIPCClient: DevIPCConstructor | null = null


if (isDev === true) {
  const
    ipcImport = import("node-ipc"),
    log = getLogger(__filename),
    serverId = "flipper-dev-ipc"

  abstract class AbstractDevIPC implements DevIPC {
    
    static eventHandlers = {
      connect: () => log.info("connected"),
      disconnect: () => log.info("disconnected"),
      destroy: () => log.info("destroy"),
      "socket.disconnected": () => log.info("Socket disconnected"),
      error: (err: any) => log.error("An error occurred", err)
    } as {
      [type in typeof eventTypes[number]]: (
        server: DevIPC,
        ...args: any[]
      ) => void
    }

    protected messageHandlers = {} as {
      [type in DevIPCMessageType]: Array<DevIPCMessageHandler<type>>
    }

    protected startDeferred: Deferred<void> | null = null

    protected config: any = null

    protected get canStart() {
      return !this.startDeferred
    }

    get isRunning() {
      return !!this.startDeferred
    }

    protected onMessage = <Type extends DevIPCMessageType>(msg: DevIPCMessage<Type>, _socket: any) => {
      try {
        const { type } = msg
        log.info("Received message from", type, msg)

        const handlers = this.messageHandlers[type]
        if (!handlers) {
          log.warn(`No handler is registered for: ${type}`)
          return
        }

        handlers.forEach(handler => handler(this as any, type, msg))
      } catch (err) {
        log.error(`Unable to handle error for message`, msg, err)
      }
    }

    off<Type extends DevIPCMessageType>(
      type: Type,
      handler: DevIPCMessageHandler<typeof type>
    ): void {
      const handlers = (this.messageHandlers[type] =
          this.messageHandlers[type] ||
          Array<DevIPCMessageHandler<typeof type>>()),
        index = handlers.indexOf(handler)

      if (index > -1) handlers.splice(index, 1)
    }

    on<Type extends DevIPCMessageType>(
      type: Type,
      handler: DevIPCMessageHandler<typeof type>
    ): void {
      const handlers = (this.messageHandlers[type] =
        this.messageHandlers[type] ||
        Array<DevIPCMessageHandler<typeof type>>())

      handlers.push(handler)
    }

    abstract emit<Type extends DevIPCMessageType>(type: Type, payload: DevIPCMessagePayloadParam<Type>): void

    abstract start(): Promise<void>

    abstract stop(): void
  }

  class DevIPCServer extends AbstractDevIPC {
    private server: any = null

    stop() {
      if (!this.isRunning) return
      this.server.stop()
    }

    async start() {
      if (!this.canStart) {
        return await this.startDeferred.promise
      }

      this.startDeferred = new Deferred()

      try {
        const NodeIPC = await ipcImport,
          ipc = new NodeIPC.IPC(),
          { config } = ipc

        Object.assign(config, {
          id: serverId,
          retry: 500,
          silent: true
        })

        Object.assign(this, {
          log,
          config
        })
  
        log.info(`IPC Server Starting`)
        ;(ipc as any).serve(() => {
          log.info(`IPC Server Started`)
          eventTypes.forEach(type =>
            ipc.server.on(type, (...args: any[]) =>
              AbstractDevIPC.eventHandlers[type](this, ...args)
            )
          )
          messageTypes.forEach(type => ipc.server.on(type, this.onMessage))

          this.startDeferred.resolve()
        })
        
        const server = this.server = ipc.server
        server.start()
        return await this.startDeferred.promise
      } catch (err) {
        log.error(`Unable to start IPC server`, err)
        this.startDeferred.reject(err)
        this.startDeferred = null
        throw err
      }
    }
    
    emit<Type extends DevIPCMessageType>(
      type: Type,
      payload: DevIPCMessagePayloadParam<Type>
    ): void {
      (this.server as any).broadcast(type, {
        id: this.config.id,
        type,
        payload
      })
    }
    
  }
  
  type NodeIPC = Unwrap<typeof ipcImport>["IPC"]
  type IPCClient = InstanceType<NodeIPC>["server"]
  
  class DevIPCClient extends AbstractDevIPC {
    
    private ipc: InstanceType<NodeIPC> | null = null
    private client: IPCClient | null = null
    
    stop() {
      if (!this.isRunning) return
      this.ipc.disconnect(serverId)
    }
    
    async start() {
      if (!this.canStart) {
        return await this.startDeferred.promise
      }
      
      this.startDeferred = new Deferred()
      
      try {
        const NodeIPC = await ipcImport,
          ipc = this.ipc = new NodeIPC.IPC(),
          { config } = ipc
        
        Object.assign(config, {
          id: `flipper-dev-ipc-client-${process.pid}`,
          retry: 500,
          silent: true
        })
        
        Object.assign(this, {
          log,
          config
        })
  
        ipc.connectTo(serverId, () => {
          log.info(`Client connected to ${serverId}`)
          const client = this.client = ipc.of[serverId] as IPCClient
          eventTypes.forEach(type =>
            client.on(type, (...args: any[]) =>
              AbstractDevIPC.eventHandlers[type](this, ...args)
            )
          )
          messageTypes.forEach(type => client.on(type, this.onMessage))
          
          this.startDeferred.resolve()
        })
        
        return await this.startDeferred.promise
      } catch (err) {
        log.error(`Unable to start IPC server`, err)
        this.startDeferred.reject(err)
        this.startDeferred = null
        throw err
      }
    }
    emit<Type extends DevIPCMessageType>(
      type: Type,
      payload: DevIPCMessagePayloadParam<Type>
    ): void {
      ;(this.client as any).emit(type, {
        id: this.config.id,
        type,
        payload
      })
    }
  }

  devIPCServer = DevIPCServer
  devIPCClient = DevIPCClient
}

export async function getDevIPCServer(): Promise<DevIPC | null> {
  if (isDev) {
    const server = new devIPCServer()
    await server.start()
    return server
  } else {
    return null
  }
}

let client: DevIPC | null = null

export async function getDevIPCClient(): Promise<DevIPC | null> {
  if (isDev) {
    if (client)
      return client
    
    client = new devIPCClient()
    await client.start()
    return client
  } else {
    return null
  }
}
