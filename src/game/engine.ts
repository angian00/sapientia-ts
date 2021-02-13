import * as ROT from "rot-js"

import { lightRadius, maxMapWidth, maxMapHeight } from "../layout"
import { Actor } from "./entities"
import { Action } from "./actions"
import { makeActor, ActorType, makeItem, ItemType, } from "./entity_factory"
import { GameMap } from "./map"
import { GameWorld } from "./world"
import { MessageLog } from "./messageLog"
import { BlockingQueue, removeFromList } from "../util"
import { InputHandler, GameInputHandler } from "../ui/input_handlers"
import { gameView } from "../ui/views"
import { mapDefs, actorDefs } from "../loaders/map_loader"


export class Engine {
	currMap: GameMap
	world: GameWorld
	private isGameActive = false

	actors: Actor[] = []
	player: Actor
	exploredMaps = new Set<string>()
	messageLog = new MessageLog()
	scheduler = new ROT.Scheduler.Simple()
	playerActionQueue = new BlockingQueue<Action>()
	fov = new ROT.FOV.PreciseShadowcasting(this.transparency.bind(this))
	currEventListener?: { (e: KeyboardEvent): void }


	constructor() {
		console.log("Starting engine")
		this.setInputHandler(new GameInputHandler(this))
		this.setMouseHandler()

		this.world = new GameWorld(this)
	}

	newGame(): void {
		this.player = actorDefs["player"].clone()
		this.player.engine = this

		let startMap = mapDefs["test_map_world"]
		//TODO: move to pushMap
		for (let e of startMap.entities) {
			if (e instanceof Actor) {
				e.engine = this
			}
		}
		this.world.pushMap(startMap)

		/*
		//DEBUG: add a consumable item
		let potion = makeItem(this, ItemType.PotionHealth)
		this.map.place(potion, 16, 8)
		//

		//DEBUG: add equipment items
		let dagger = makeItem(this, ItemType.Dagger)
		this.map.place(dagger, 19, 8)

		let armor = makeItem(this, ItemType.LeatherArmor)
		this.map.place(armor, 19, 10)
		//

		//DEBUG: add ingredients
		let herb1 = makeItem(this, ItemType.HerbHenbane)
		this.map.place(herb1, 17, 8)

		let herb2 = makeItem(this, ItemType.HerbNightshade)
		this.map.place(herb2, 17, 10)
		//
	*/
		this.fov.compute(this.player.x, this.player.y, lightRadius, this.setFov.bind(this))

		this.messageLog.addMessage("Welcome, adventurer!")

		gameView.renderAll(this)
	}


	async startGameLoop(): Promise<void> {
		this.isGameActive = true

		while (this.isGameActive) {
			await this.processTurn()
		}
	}
	
	stopGameLoop() {
		this.isGameActive = false
		this.deactivateActors()
	}

	removeActor(actor: Actor): void {
		this.currMap.entities.delete(actor)
		//TODO: remove from all maps
		this.scheduler.remove(actor)
	}

	deactivateActors(): void {
		this.scheduler.clear()
	}

	/** Player is added first */
	activateActors(): void {
		this.scheduler.add(this.player, true)

		for (let actor of this.currMap.entities) {
			if (actor instanceof Actor && actor.name != "player")
				this.scheduler.add(actor, true)
		}
	}

	async processTurn(): Promise<void> {
		console.log("processTurn")

		let currActor = <Actor>this.scheduler.next()
		if (!currActor)
			return

		let actionResult = await currActor.act();

		this.currMap.resetVisible()
		this.fov.compute(this.player.x, this.player.y, lightRadius, this.setFov.bind(this))

		gameView.renderMap(this.currMap)
		gameView.renderMapInfo()
		gameView.renderStats(this.player.stats)
		gameView.renderMessages(this.messageLog)
	}


	setInputHandler(newInputHandler: InputHandler): void {
		if (this.currEventListener)
			document.body.removeEventListener("keydown", this.currEventListener)

		this.currEventListener = newInputHandler.eventListener
		document.body.addEventListener("keydown", this.currEventListener)
	}

	setMouseHandler(): void {
		document.body.addEventListener("mousemove", this.mouseEventListener.bind(this))
	}

	mouseEventListener(e: MouseEvent): void {
		if (!this.currMap)
			return

		//console.log("mouseEventListener")
		//console.log(`client coords: ${e.clientX}, ${e.clientY}`)
		let mapElem = document.getElementById("gameMap")
		let bRect = mapElem.getBoundingClientRect()
		//console.log(`bRect: ${bRect}`)

		let xPixels = e.clientX - bRect.left
		let yPixels = e.clientY - bRect.top
		//console.log(`net coords: ${x}, ${y}`)

		const tileSize = 20
		let xTiles = Math.floor(xPixels / tileSize) - this.currMap.xOffset
		let yTiles = Math.floor(yPixels / tileSize) - this.currMap.yOffset

		if ((xTiles >= 0 && xTiles < maxMapWidth && yTiles >= 0 && yTiles < maxMapHeight) &&
			(this.currMap.visible[xTiles][yTiles]) ) {
			gameView.renderMapInfo(this.currMap.getEntitiesAt(xTiles, yTiles))
		}
	}


	transparency(x: number, y: number) {
		if (x < 0 || x >= this.currMap.width || y < 0 || y >= this.currMap.height)
			return false
		else
			return this.currMap.tiles[x][y].transparent
	}

	setFov(x: number, y: number, r: number, visibility: number) {
		if (x < 0 || x >= this.currMap.width || y < 0 || y >= this.currMap.height)
			return
		
		this.currMap.visible[x][y] = !!visibility
		if (this.currMap.visible[x][y])
			this.currMap.explored[x][y] = true
	}
}
