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
import { GameView, InventoryView } from "../ui/views"
import { mapDefs, actorDefs } from "../loaders/map_loader"


export class Engine {
	map: GameMap
	world: GameWorld

	actors: Actor[] = []
	player: Actor
	messageLog = new MessageLog()
	scheduler = new ROT.Scheduler.Simple()
	playerActionQueue = new BlockingQueue<Action>()
	fov = new ROT.FOV.PreciseShadowcasting(this.transparency.bind(this))
	gameView = new GameView()
	inventoryView = new InventoryView()
	currEventListener?: { (e: KeyboardEvent): void }


	constructor() {
		console.log("Starting engine")
		this.setInputHandler(new GameInputHandler(this))
		this.setMouseHandler()

		this.world = new GameWorld(this)

		this.player = actorDefs["player"].clone()
		console.log("player.stats")
		console.log(this.player.stats)
		this.player.engine = this
		this.addActor(this.player)
		
		let startMap = mapDefs["test_map_world"]
		for (let e of startMap.entities) {
			if (e instanceof Actor) {
				e.engine = this
				this.addActor(e)
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

		this.gameView.renderMap(this.map)
		this.gameView.renderMapInfo()
		this.gameView.renderStats(this.player.stats)

		this.messageLog.addMessage("Welcome, adventurer!")
		//this.messageLog.addMessage("This is a very very long message to test message view does not get too wide")
		this.gameView.renderMessages(this.messageLog)
	}


	addActor(actor: Actor): void {
		this.actors.push(actor)
		this.scheduler.add(actor, true)
	}

	removeActor(actor: Actor): void {
		removeFromList<Actor>(this.actors, actor)
		this.map.entities.delete(actor)
		//TODO: remove from all maps
		this.scheduler.remove(actor)
	}

	deactivateActors(): void {
		this.scheduler.clear()
	}

	activateActors(): void {
		for (let actor of this.map.entities) {
			if (actor instanceof Actor)
				this.scheduler.add(actor, true)
		}
	}

	async processTurn(): Promise<void> {
		//console.log("processTurn")

		let currActor = <Actor>this.scheduler.next()
		let actionResult = await currActor.act();

		this.map.resetVisible()
		this.fov.compute(this.player.x, this.player.y, lightRadius, this.setFov.bind(this))

		this.gameView.renderMap(this.map)
		this.gameView.renderMapInfo()
		this.gameView.renderStats(this.player.stats)
		this.gameView.renderMessages(this.messageLog)
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
		//console.log("mouseEventListener")
		//console.log(`client coords: ${e.clientX}, ${e.clientY}`)
		let mapElem = document.getElementById("gameMap")
		let bRect = mapElem.getBoundingClientRect()
		//console.log(`bRect: ${bRect}`)

		let xPixels = e.clientX - bRect.left
		let yPixels = e.clientY - bRect.top
		//console.log(`net coords: ${x}, ${y}`)

		const tileSize = 20
		let xTiles = Math.floor(xPixels / tileSize) - this.map.xOffset
		let yTiles = Math.floor(yPixels / tileSize) - this.map.yOffset
		if ((xTiles >= 0 && xTiles < maxMapWidth && yTiles >= 0 && yTiles < maxMapHeight) &&
			(this.map.visible[xTiles][yTiles]) ) {
			this.gameView.renderMapInfo(this.map.getEntitiesAt(xTiles, yTiles))
		}
	}


	transparency(x: number, y: number) {
		if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height)
			return false
		else
			return this.map.tiles[x][y].transparent
	}

	setFov(x: number, y: number, r: number, visibility: number) {
		if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height)
			return
		
		this.map.visible[x][y] = !!visibility
		if (this.map.visible[x][y])
			this.map.explored[x][y] = true
	}
}
