/**
 * Copyright 2019-present Densebrain.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Copyright 2019-present Facebook.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @format
 */
import CertificateProvider, { SecureServerConfig } from "./utils/CertificateProvider"
import { Logger } from "./fb-interfaces/Logger"
import { Store } from "./reducers"
import * as Os from "os"
import { BufferEncoders, IdentitySerializer, RSocketServer, Serializer } from "rsocket-core"
import RSocketTCPServer from "rsocket-tcp-server"
import { Single } from "rsocket-flowable"
import Client from "./Client"
import { UninitializedClient } from "./UninitializedClient"
import { reportPlatformFailures } from "./utils/metrics"
import * as net from "net"
import { PartialResponder, Payload, ReactiveSocket } from "rsocket-types"
import { getLogger, Models } from "@stato/common"
import invariant from "invariant"
import * as tls from "tls"
import { MessageHandlerConfig } from "./messaging/Messages"
import { Messenger } from "./messaging/Messenger"
import { MessageChannelEvents } from "./messaging/MessageChannelEvents"
import * as _ from "lodash"
import { envelopFromPayload } from "./messaging/Messages"
import { stato } from "@stato/models"
import { Option } from "prelude-ts"

const log = getLogger(__filename),
  MDNS:any = require("multicast-dns")(),
  MDNS_NAME = "stato._stato._tcp.local"

type ClientInfo = {
  connection:ReactiveSocket<Uint8Array, Uint8Array> | null | undefined
  client:Client
}
export default class Server extends Messenger {
  connections:Map<string, ClientInfo>
  secureServer:Promise<RSocketServer<Uint8Array, Uint8Array>> | null = null
  insecureServer:Promise<RSocketServer<Uint8Array, Uint8Array>> | null = null
  certificateProvider:CertificateProvider
  connectionTracker:ConnectionTracker
  logger:Logger
  store:Store
  initialisePromise:Promise<void> | null = null
  
  constructor(logger:Logger, store:Store) {
    super()
    
    this.on("error", err => {
      log.error("A server error occurred", err)
    })
    
    this.logger = logger
    this.connections = new Map()
    this.certificateProvider = new CertificateProvider(this, logger)
    this.connectionTracker = new ConnectionTracker(logger)
    this.store = store
  }
  
  
  getCertificateProvider():CertificateProvider {
    return this.certificateProvider
  }
  
  on<Error>(event:"error", callback:(err:Error) => void):this
  on<Client>(event:"new-client", callback:(client:Client) => void):this
  on<undefined>(event:"clients-change", callback:() => void):this
  on<E>(
    event:MessageChannelEvents[number],
    callback:(event?:E) => void
  ):this {
    return super.on(event, callback)
  }
  
  init() {
    const { insecure, secure } = this.store.getState().application.serverPorts
    
    try {
      this.startMDnsServer(insecure, secure)
    } catch (err) {
      console.error("Unable to start MDNS advertiser", err)
    }
    
    this.initialisePromise = this.certificateProvider
      .loadSecureServerConfig()
      .then(options => (this.secureServer = this.startServer(secure, options)))
      .then(() => {
        this.insecureServer = this.startServer(insecure)
        return
      })
    
    reportPlatformFailures(this.initialisePromise, "initializeServer")
    return this.initialisePromise
  }
  
  /**
   * Responds to mDns queries with network info
   *
   * @param insecure
   * @param secure
   */
  
  startMDnsServer(insecure:number, secure:number) {
    // mdns.on("response", (_response: any) => {
    // })
    MDNS.on("query", (query:any) => {
      if (!Array.isArray(query.questions)) {
        return
      }
      
      const question = query.questions.find(function(q:any) {
        return (
          (q.type === "PTR" && q.class.includes("UNKNOWN")) ||
          q.name.includes("stato")
        )
      })
      
      if (question) {
        //console.log('got a query packet:', question, query);
        const addresses = getNetworkAddresses()
        MDNS.respond({
          additionals: [
            {
              class: "IN",
              name: MDNS_NAME,
              type: "TXT",
              flush: true,
              ttl: 30,
              data: [
                Buffer.from(`ips=${addresses.join(",")}`),
                Buffer.from(`insecurePort=${insecure}`),
                Buffer.from(`securePort=${secure}`)
              ]
            },
            ...addresses.reduce(
              (additionals, address) => {
                additionals.push(
                  {
                    class: "IN",
                    name: MDNS_NAME,
                    type: "A",
                    flush: true,
                    ttl: 30,
                    data: address
                  },
                  {
                    class: "IN",
                    name: MDNS_NAME,
                    type: "SRV",
                    flush: true,
                    ttl: 30,
                    data: {
                      target: MDNS_NAME,
                      insecure
                    }
                  }
                )
                return additionals
              },
              [] as any
            )
          ],
          answers: [
            {
              class: "IN",
              data: "stato._stato._tcp.local",
              type: "PTR",
              flush: true,
              ttl: 30,
              name: "_stato._tcp.local"
            }
          ]
        })
      }
    })
  }
  
  startServer(
    port:number,
    sslConfig?:SecureServerConfig
  ):Promise<RSocketServer<string, string>> {
    
    const server = this
    
    return new Promise((resolve, reject) => {
      let rsServer:RSocketServer<string, string> | null = null
      
      const serverFactory = (
        onConnect:(socket:net.Socket) => void
      ):net.Server => {
        
        const transportServer = sslConfig
          ? tls.createServer(sslConfig, (socket:net.Socket) => {
            socket.on("error", err => {
              log.error("TLS socket error", err)
            })
            onConnect(socket)
          })
          : net.createServer((socket:net.Socket) => {
            socket.on("error", err => {
              log.error("Certificate socket error", err)
            })
            onConnect(socket)
          })
        
        transportServer
          .on("error", (err:Error) => {
            server.emit("error", err)
            log.error(`Error opening server on port ${port}`, "server")
            reject(err)
          })
          .on("listening", () => {
            const name = sslConfig ? "Secure" : "Certificate"
            log.debug(
              `${name} server started on port ${port}`,
              "server"
            )
            server.emit("listening", port)
            resolve(rsServer!!)
          })
        
        return transportServer
      }
      
      rsServer = new RSocketServer<Uint8Array, Uint8Array>({
        serializers: {
          data: IdentitySerializer as Serializer<Uint8Array>,
          metadata: IdentitySerializer as Serializer<Uint8Array>
        },
        getRequestHandler: sslConfig
          ? this.trustedRequestHandler
          : this.untrustedRequestHandler,
        transport: new RSocketTCPServer({
          port,
          serverFactory
        },BufferEncoders)
      })
      rsServer.start()
    })
  }
  
  /**
   * Trusted handler
   *
   * @param conn
   * @param connectRequest
   */
  trustedRequestHandler = (
    conn:ReactiveSocket<Uint8Array, Uint8Array>,
    connectRequest:Payload<Uint8Array, Uint8Array>
  ):PartialResponder<Uint8Array, Uint8Array> => {
    log.info("Trusted connection", connectRequest)
    const server = this,
      clientData = Models.SDKState.decode(connectRequest.metadata!!)// as Models.SDKState
    
    this.connectionTracker.logConnectionAttempt(clientData)
    
    const client = this.addConnection(conn, clientData)
    
    conn.connectionStatus().subscribe({
      onNext(payload) {
        if (payload.kind == "ERROR" || payload.kind == "CLOSED") {
          log.debug(`Device disconnected ${client.id}`, "server")
          server.removeConnection(client.id)
        }
      },
      onSubscribe(subscription) {
        subscription.request(Number.MAX_SAFE_INTEGER)
      }
    })
    return client.responder
  }
  
  /**
   * Certificate exchange
   *
   * @param _conn
   * @param connectRequest
   */
  untrustedRequestHandler = (
    _conn:ReactiveSocket<Uint8Array, Uint8Array>,
    connectRequest:Payload<Uint8Array, Uint8Array>
  ):PartialResponder<Uint8Array, Uint8Array> => {
    log.info("Data for cert sign", connectRequest)
    
    return Option.of(connectRequest.metadata)
      .ifNone(() => {
        throw new Error("No metadata")
      })
      .map(connectionMetadata => {
        const metadata = Models.SDKState.decode(connectionMetadata), //as Models.SDKState,
          client = {
            metadata
          } as UninitializedClient
        //
        // this.connectionTracker.logConnectionAttempt(metadata)
      
        this.emit("start-client-setup", client)
      
        return {
          requestResponse: (payload:Payload<Uint8Array,Uint8Array>) => new Single<Payload<Uint8Array, Uint8Array>>(async (subscriber) => {
            log.info("requestResponse payload", payload)
            subscriber.onSubscribe()
            if (!payload.data) {
              subscriber.onError(new Error("No payload"))
              return
            }
            
            try {
              Option.of(payload.data)
                .ifSome(async () => {
                  const [handler, envelope, envelopePayload, message] = envelopFromPayload(payload)
                
                  const
                    result = await handler(
                      Object.assign(_.clone(this), {
                        ...this,
                        getConnectionId() {
                          return metadata.connectionId
                        },
                      
                        getSDKState() {
                          return metadata
                        }
                      }),
                      message,
                      envelopePayload,
                      envelope
                    ),
                    resultPayload = !result ? {
                        data: stato.Envelope.encode(stato.Envelope.create()).finish(),
                        metadata: Uint8Array.of()
                      } :
                      this.toPayload(envelope, result)
                
                
                  log.info("Signing result", result, resultPayload)
                  //if (resultPayload)
                  subscriber.onComplete(resultPayload)
                  // Single<Payload<Uint8Array, Uint8Array>>
                
                })
                .ifNone(() => subscriber.onError(new Error("Unknown result")))
              
            } catch (err) {
              log.error("Unable to handle cert exchange", err)
              subscriber.onError(err)
            }
            return {
              onSubscribe: () => {
                log.warn("cancelled")
              }
            }
            // if (!isString(payload.data)) {
            //   return
            // }
            //
            // let rawData
            //
            // try {
            //   rawData = JSON.parse(payload.data)
            // } catch (err) {
            //   log.error(
            //     `Invalid JSON: ${payload.data}`,
            //     "clientMessage",
            //     "server"
            //   )
            //   return Single.of({} as Payload<Uint8Array, Uint8Array>)
            // }
            //
            // const json = rawData as
          
            //return Single.of({} as Payload<Uint8Array, Uint8Array>)
          }),
          // Leaving this here for a while for backwards compatibility,
          // but for up to date SDKs it will no longer used.
          // We can delete it after the SDK change has been using requestResponse for a few weeks.
          fireAndForget: (payload:Payload<Uint8Array,Uint8Array>) => {
            log.info("fireAndForget payload", payload)
            if (!payload.data)
              return
            
            Option.of(envelopFromPayload(payload))
              .map(([handler, envelope, envelopePayload, message]:MessageHandlerConfig) =>
                handler(this, message, envelopePayload, envelope)
              )
          
            // if (!isString(payload.data)) {
            //   return
            // }
            //
            // let rawData
            //
            // try {
            //   rawData = JSON.parse(payload.data!!)
            // } catch (err) {
            //   console.error(`Invalid JSON: ${payload.data}`, "server")
            //   return
            // }
            //
            // const json:  = rawData
            //
            // if (json.method === "signCertificate") {
            //   log.debug("CSR received from device", "server")
            //   const { csr, destination } = json
            //   this.certificateProvider
            //     .processCertificateSigningRequest(csr, clientData.os, destination)
            //     .catch(e => {
            //       log.error(e)
            //     })
            // }
          }
        } as PartialResponder<Uint8Array, Uint8Array>
      }).getOrThrow()
  }
  
  close():Promise<void> {
    if (this.initialisePromise) {
      return this.initialisePromise.then(_ => {
        return Promise.all([
          this.secureServer!!.then(server => server.stop()),
          this.insecureServer!!.then(server => server.stop())
        ]).then(() => undefined)
      })
    }
    
    return Promise.resolve()
  }
  
  toJSON():null {
    return null
  }
  
  addConnection(
    conn:ReactiveSocket<Uint8Array, Uint8Array>,
    query:Models.SDKState
  ):Client {
    invariant(query, "expected query")
    const id = `${query.appPackage}#${query.os}#${query.nodeName}#${query.nodeId}`
    console.debug(`Device connected: ${id}`, "server")
    const client = new Client(id, query, conn, this.logger, this.store)
    const info = {
      client,
      connection: conn
    }
    client.init().then(() => {
      log.info(
        `Device client initialised: ${id}. Supported plugins: ${client.plugins.join(
          ", "
        )}`,
        "server"
      )
      /* If a device gets disconnected without being cleaned up properly,
       *Stato won't be aware until it attempts to reconnect.
       * When it does we need to terminate the zombie connection.
       */
      
      if (this.connections.has(id)) {
        const connectionInfo = this.connections.get(id)
        connectionInfo &&
        connectionInfo.connection &&
        connectionInfo.connection.close()
        this.removeConnection(id)
      }
      
      this.connections.set(id, info)
      this.emit("new-client", client)
      this.emit("clients-change")
      client.emit("plugins-change")
    })
    return client
  }
  
  attachFakeClient(client:Client) {
    this.connections.set(client.id, {
      client,
      connection: null
    })
  }
  
  removeConnection(id:string) {
    const info = this.connections.get(id)
    
    if (info) {
      info.client.emit("close")
      this.connections.delete(id)
      this.emit("clients-change")
      this.emit("removed-client", id)
    }
  }
}

class ConnectionTracker {
  timeWindowMillis = 20 * 1000
  connectionProblemThreshold = 4 // "${device}.${app}" -> [timestamp1, timestamp2...]
  
  connectionAttempts:Map<string, Array<number>> = new Map()
  logger:Logger
  
  constructor(logger:Logger) {
    this.logger = logger
  }
  
  logConnectionAttempt(client:Models.SDKState) {
    const key = `${client.os}-${client.nodeName}-${client.appName}`
    const time = Date.now()
    var entry = this.connectionAttempts.get(key) || []
    entry.push(time)
    entry = entry.filter(t => t >= time - this.timeWindowMillis)
    this.connectionAttempts.set(key, entry)
    
    if (entry.length >= this.connectionProblemThreshold) {
      log.error(
        `Connection loop detected with ${key}. Connected ${
          this.connectionProblemThreshold
          } times within ${this.timeWindowMillis / 1000}s.`,
        "server"
      )
    }
  }
}

function getNetworkAddresses():Array<string> {
  return Object.entries(Os.networkInterfaces()).reduce(
    (addresses, [_name, iface]:[string, Array<Os.NetworkInterfaceInfo>]) => {
      addresses.push(
        ...iface
          .filter(
            (it:Os.NetworkInterfaceInfo) =>
              "IPv4" === it.family && !it.internal && it.address
          )
          .map(it => it.address)
      )
      return addresses
    },
    Array<string>()
  )
}
