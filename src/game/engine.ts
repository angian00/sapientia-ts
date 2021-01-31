import * as ROT from "rot-js"

import { lightRadius } from "../layout"
import { Actor } from "./entities"
import { Action } from "./actions"
import { makeActor, ActorType, makeItem, ItemType, } from "./entity_factory"
import { GameMap } from "./map"
import { MessageLog } from "./messageLog"
import { BlockingQueue } from "../util"
import { InputHandler, GameInputHandler } from "../ui/input_handlers"
import { GameView, InventoryView } from "../ui/views"
import { gameMaps } from "../loaders/map_loader"


export class Engine {
	//map = new GameMap(mapWidth, mapHeight)
	map: GameMap
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

		this.map = gameMaps["test_map"]
		this.player = makeActor(this, ActorType.Player)
		this.addActor(this.player)
		this.map.place(this.player, 4, 4)

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

		//DEBUG: add monsters
		let orc = makeActor(this, ActorType.Orc)
		this.addActor(orc)
		this.map.place(orc, 22, 12)

		let troll = makeActor(this, ActorType.Troll)
		this.addActor(troll)
		this.map.place(troll, 32, 12)
		//
*/

		this.fov.compute(this.player.x, this.player.y, lightRadius, this.setFov.bind(this))

		this.gameView.renderMap(this.map)
		this.gameView.renderMapInfo()
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
