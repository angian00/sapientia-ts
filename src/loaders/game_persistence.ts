import { PlayerAI } from "../components/ai"
import { Engine } from "../game/engine"
import { Entity, Actor, Item, Site } from "../game/entities"
import { MessageLog } from "../game/messageLog"
import { Dictionary } from "../util"
import { mapDefs } from "./map_loader"


const DB_NAME = "sapientia-db"
const MAX_LAST_MESSAGES = 10


export class SavedGamesManager {
	private dbFactory: IDBFactory
	private db: IDBDatabase


	constructor() {
		this.dbFactory = window.indexedDB
		this.initDb()
	}

	private initDb(): void {
		let req: IDBOpenDBRequest

		req = this.dbFactory.open(DB_NAME)
		req.onerror = (event) => {
			console.log(`!! Could not open IndexedDB [${DB_NAME}]: ${event}`)	
		}

		req.onupgradeneeded = this.onUpgradeNeeded.bind(this)
		req.onsuccess = this.onOpenSuccess.bind(this)
	}

	private onOpenSuccess(e: any) {
		this.db = e.target.result
	}

	private onUpgradeNeeded(e: any) {
		this.db = e.target.result
		this.addTables()
	}

	private addTables(): void {
		this.db.createObjectStore("savedGames", { keyPath: "gameName" })
	}

	private resetDb(): void {
		this.db.close()
		this.dbFactory.deleteDatabase(DB_NAME)
		this.initDb()
	}

	getGameList(callback: { (savedGames: { gameName: string, ts: number }[]): void }): void {
		let gameList = new Array<{ gameName: string, ts: number }>()

		let objStore = this.db.transaction(["savedGames"], "readwrite").objectStore("savedGames")
		let req = objStore.openCursor()
		req.onsuccess = (event) => {
			let cursor = req.result
			if (cursor) {
				gameList.push({ gameName: cursor.value.gameName, ts: cursor.value.ts })
				cursor.continue()
			} else {
				//sort by ts desc
				gameList.sort((a, b) => (a.ts < b.ts) ? 1 : ((a.ts > b.ts) ? -1 : 0))
				callback(gameList)
			}
		}
	}

	saveGame(gameName: string, engine: Engine, callback: {(): void }): void {
		console.log("saveGame")
		let gameData = new GameData()

		// message log
		let messageLog = engine.messageLog.clone()
		// truncate to MAX_LAST_MESSAGES
		let nMessages = engine.messageLog.messages.length
		if (nMessages > MAX_LAST_MESSAGES)
			nMessages = MAX_LAST_MESSAGES
		messageLog.messages = messageLog.messages.slice(-nMessages)

		gameData.messageLog = messageLog

		// maps(visible, explored, entities)
		for (let mapName of engine.exploredMaps) {
			let currMap = mapDefs[mapName]
			let entityData = new Array<any>()

			for (let entity of currMap.entities) {
				entityData.push(entity.toObject())
			}

			gameData.maps[mapName] = {
				visible: currMap.visible,
				explored: currMap.explored,
				entities: entityData,
			}
		}

		// map stack
		for (let mss of engine.world.mapStack) {
			gameData.mapStack.push({map: mss.map.name, pos: mss.pos})
		}

		console.log(gameData)

		let objStore = this.db.transaction(["savedGames"], "readwrite").objectStore("savedGames")
		let req = objStore.put({ "gameName": gameName, "data": gameData, "ts": Date.now() })
		req.onsuccess = (event) => {
			console.log("Game successfully saved!")
			callback()
		}

		req.onerror = (event) => {
			console.log("!! Could not save game")
			console.log(event)
		}
	}

	loadGame(gameName: string, engine: Engine, callback: { (): void }): void {
		console.log("loadGame")

		let objStore = this.db.transaction(["savedGames"], "readonly").objectStore("savedGames")
		let req = objStore.get(gameName)
		req.onerror = (event) => {
			console.log("!! Could not load game")
			console.log(event)
		}

		req.onsuccess = (event) => {
			console.log("Game data successfully retrieved")
			let gameData = req.result.data
			console.log(gameData)

			engine.deactivateActors()

			// message log
			engine.messageLog = MessageLog.fromObject(gameData.messageLog)

			// maps(visible, explored, entities)
			for (let mapName in gameData.maps) {
				engine.exploredMaps.add(mapName)

				let currMapData = gameData.maps[mapName]
				let targetMap = mapDefs[mapName]
				targetMap.visible = currMapData.visible
				targetMap.explored = currMapData.explored
				
				targetMap.entities.clear()
				for (let eData of currMapData.entities) {
					let e = Entity.fromObject(eData)
					
					if (e instanceof Actor) {
						e.engine = engine
						if (e.ai && e.ai instanceof PlayerAI)
							engine.player = e

					} else if (e instanceof Item) {
						e.parent = targetMap
					} else if (e instanceof Site) {
						e.parent = targetMap
					}

					targetMap.entities.add(e)
					
				}
			}

			// map stack
			for (let mss of gameData.mapStack) {
				engine.world.mapStack.push({ map: mapDefs[mss.map], pos: mss.pos })
			}

			engine.currMap = engine.world.currMap
			engine.activateActors()

			callback()
		}
	}

	deleteGame(gameName: string, callback: { (): void }): void {
		console.log("deleteGame")
		
		let objStore = this.db.transaction(["savedGames"], "readwrite").objectStore("savedGames")
		let req = objStore.delete(gameName)
		req.onsuccess = (event) => {
			console.log("Game successfully deleted")
			callback()
		}

		req.onerror = (event) => {
			console.log("!! Could not delete game")
			console.log(event)
		}
	}
}


class GameData {
	messageLog: MessageLog
	maps = new Dictionary<any>()
	mapStack = new Array<{ map: string, pos ?: [number, number] }>()
}
