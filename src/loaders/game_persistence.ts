import { PlayerAI } from "../components/ai"
import { Engine } from "../game/engine"
import { Entity, Actor, Item, Site } from "../game/entities"
import { MessageLog } from "../game/messageLog"
import { Dictionary } from "../util"
import { mapDefs, loadAllData } from "./map_loader"

import { openDB, IDBPDatabase } from "idb"


const DB_NAME = "sapientia-db"
const MAX_LAST_MESSAGES = 10


export class SavedGamesManager {
	private dbFactory: IDBFactory
	private db: IDBPDatabase


	constructor() {
		this.dbFactory = window.indexedDB
		this.initDb()
	}

	private async initDb() {
		this.db = await openDB(DB_NAME, null, {
			upgrade(db, oldVersion, newVersion, transaction) {
				this.db = db
				this.db.createObjectStore("savedGames", { keyPath: "gameName" })
			},
		})
	}

	async getGameList(): Promise<{ gameName: string, ts: number }[]> {
		let gameList = new Array<{ gameName: string, ts: number }>()

		return new Promise(async (resolve, reject) => {
			let objStore = this.db.transaction(["savedGames"], "readwrite").objectStore("savedGames")
			let cursor = await objStore.openCursor()
			while (cursor) {
				gameList.push({ gameName: cursor.value.gameName, ts: cursor.value.ts })
				cursor = await cursor.continue()
			}

			//sort by ts desc
			gameList.sort((a, b) => (a.ts < b.ts) ? 1 : ((a.ts > b.ts) ? -1 : 0))
			resolve(gameList)
		})
	}

	async saveGame(gameName: string, engine: Engine) {
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
		return objStore.put({ "gameName": gameName, "data": gameData, "ts": Date.now() })
	}

	
	async loadGame(gameName: string, engine: Engine) {
		console.log("loadGame")
		await loadAllData()

		let objStore = this.db.transaction(["savedGames"], "readonly").objectStore("savedGames")
		objStore.get(gameName).then( (result) => {
			console.log("Game data successfully retrieved")
			let gameData = result.data
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
		})
	}

	async deleteGame(gameName: string) {
		console.log("deleteGame")
		
		let objStore = this.db.transaction(["savedGames"], "readwrite").objectStore("savedGames")
		return objStore.delete(gameName)
	}
}


class GameData {
	messageLog: MessageLog
	maps = new Dictionary<any>()
	mapStack = new Array<{ map: string, pos ?: [number, number] }>()
}
