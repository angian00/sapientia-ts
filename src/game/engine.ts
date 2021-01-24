import * as ROT from "rot-js"

import { mapWidth, mapHeight, lightRadius } from "../layout"
import { Actor } from "./entities"
import { Action, BumpAction, WaitAction, PickupAction } from "./actions"
import { makeActor, ActorTypes, makeItem, ItemTypes, } from "./entity_factory"
import { GameMap } from "./map"
import { MessageLog } from "./messageLog"
import { BlockingQueue } from "../util"
import { InputHandler, GameInputHandler } from "../ui/input_handlers"
import { GameView, InventoryView } from "../ui/views"


export class Engine {
	map = new GameMap(mapWidth, mapHeight)
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
		console.log("Game constructor")

		this.setInputHandler(new GameInputHandler(this))

		this.player = makeActor(this, ActorTypes.Player)
		this.addActor(this.player)
		this.map.place(this.player, 10, 10)

		//DEBUG: add a single monster
		let monster = makeActor(this, ActorTypes.Orc)
		this.addActor(monster)
		this.map.place(monster, 22, 12)
		//

		//DEBUG: add a single item
		let item = makeItem(this, ItemTypes.HealthPotion)
		this.map.place(item, 16, 8)
		//

		this.fov.compute(this.player.x, this.player.y, lightRadius, this.setFov.bind(this))

		this.gameView.renderMap(this.map)
		this.gameView.renderStats(this.player.stats)

		this.messageLog.addMessage("Welcome, adventurer!")
		this.gameView.renderMessages(this.messageLog)
	}


	addActor(actor: Actor): void {
		this.actors.push(actor)
		this.scheduler.add(actor, true)
	}

	async processTurn(): Promise<void> {
		console.log("processTurn")

		let currActor = <Actor>this.scheduler.next()
		let actionResult = await currActor.act();

		this.map.resetVisible()
		this.fov.compute(this.player.x, this.player.y, lightRadius, this.setFov.bind(this))

		this.gameView.renderMap(this.map)
		this.gameView.renderStats(this.player.stats)
		this.gameView.renderMessages(this.messageLog)
	}


	setInputHandler(newInputHandler: InputHandler): void {
		if (this.currEventListener)
			document.body.removeEventListener("keydown", this.currEventListener)

		this.currEventListener = newInputHandler.eventListener
		document.body.addEventListener("keydown", this.currEventListener)
	}

	transparency(x: number, y: number) {
		if (x < 0 || x >= this.map.width || y < 0 || y >= this.map.height)
			return false
		else
			return this.map.tiles[x][y].transparent
	}

	setFov(x: number, y: number, r: number, visibility: number) {
		this.map.visible[x][y] = !!visibility
		if (this.map.visible[x][y])
			this.map.explored[x][y] = true
	}
}
