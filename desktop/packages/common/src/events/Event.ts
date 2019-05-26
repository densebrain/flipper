import {EventEmitter} from "events"
import {isMain} from "../util/Process"
import * as Electron from 'electron'
//import {getLogger} from "../logging/Logger"
// import {isString} from "typeguard"
// import {convertEnumValuesToString} from "../util/ObjectUtil"
import {StatesConfig, StringMap} from "../Types"

const
	ForwardEvent = "forward-event"
	//_log = getLogger(__filename)

export enum Events {
	ConfigChanged,
	WindowClosed,
	AcceleratorsChanged,
	CommandsChanged
}

export type EventNames = keyof typeof Events

function isElectron():boolean {
	return !!Electron.ipcMain || !!Electron.ipcRenderer
}

class EventHubEmitter {

	private emitter = new EventEmitter()

	private onForwardEvent = (_event:Electron.Event, eventName:EventNames,args:any[]) => {
		//log.info("On forwarded event",event,args)
		this.emitter.emit(eventName,...args)
	}

	constructor() {
		this.emitter.setMaxListeners(Number.MAX_SAFE_INTEGER)
		
		if (!isElectron()) return
		
		if (isMain())
			Electron.ipcMain.on(ForwardEvent,this.onForwardEvent)
		else
			Electron.ipcRenderer.on(ForwardEvent,this.onForwardEvent)
	}



	on(event:"ConfigChanged", listener: (config:StatesConfig) => void):() => void
  	on(event:"WindowClosed", listener: () => void):() => void
	on(event:"CommandsChanged", listener: () => void):() => void
  on(event:"AcceleratorsChanged", listener: () => void):() => void
	on(event:EventNames, listener:(...args:any[]) => void):() => void {
		this.emitter.on(event,listener)
		return () => this.emitter.off(event,listener)
	}

	off(event:EventNames, listener?:(...args:any[]) => void) {
		this.emitter.removeListener(event,listener)
	}

	emit(event:"ConfigChanged", config:StatesConfig):void
	emit(event:"WindowClosed"):void
	emit(event:"CommandsChanged"):void
  emit(event:"AcceleratorsChanged",accelerators:StringMap<string>):void
	emit(event:EventNames, ...args:any[]):void {
		this.emitter.emit(event,...args)
		if (!isElectron()) return
		if (isMain())
			Electron.BrowserWindow.getAllWindows().forEach(win => win.webContents.send(ForwardEvent,event,args))
		else
			Electron.ipcRenderer.send(ForwardEvent,event,args)
	}
}

export type EventNameMap = {[key in EventNames]:EventNames}

export type EventHubType = (EventHubEmitter & EventNameMap)

function create():EventHubType {
	const EventHub = new EventHubEmitter()
	Object.assign(EventHub,Events)
	return EventHub as any
}

export const EventHub = create()
