import * as ROT from "rot-js"

import { mapWidth, mapHeight } from "./layout"
import { Actor, Player } from "./entities"
import { Action, MovementAction, WaitAction } from "./actions"
import { makeMonster, MonsterTypes } from "./monsters"
import { GameMap } from "./map"
import { MessageLog } from "./messageLog"
import { BlockingQueue } from "./util"
import { DisplayView } from "./view"


export class Game {
	map = new GameMap(mapWidth, mapHeight)
	actors: Actor[] = []
	player: Player
	messageLog = new MessageLog()
	scheduler = new ROT.Scheduler.Simple()
	playerActionQueue = new BlockingQueue<Action>()
	
	view = new DisplayView()


	constructor() {
		console.log("Game constructor")

		//TODO: clean old event handlers
		//document.body.addEventListener("keydown", this.handleKeyboardInput)
		document.body.addEventListener("keydown", this.handleKeyboardInput.bind(this))

		this.player = new Player(this)
		this.addActor(this.player)
		this.map.place(this.player, 10, 10)

		//DEBUG: add a single monster
		let monster = makeMonster(MonsterTypes.Orc)
		this.addActor(monster)
		this.map.place(monster, 20, 10)
		//

		this.view.renderMap(this.map)

		this.messageLog.addMessage("Welcome, adventurer!")
		this.view.renderMessages(this.messageLog)
	}


	addActor(actor: Actor): void {
		this.actors.push(actor)
		this.scheduler.add(actor, true)
	}

	async processTurn(): Promise<void> {
		console.log("processTurn")

		let currActor = <Actor>this.scheduler.next()
		let actionResult = await currActor.act();

		this.view.renderMap(this.map)
		this.view.renderMessages(this.messageLog)
	}

	handleKeyboardInput(e: KeyboardEvent): void {
		let newAction = null
		let keyCode = e.code

		if (MOVE_KEYS.has(keyCode)) {
			let move = MOVE_KEYS.get(keyCode)

			newAction = new MovementAction(this, this.player, move[0], move[1])

		} else if (keyCode in WAIT_KEYS) {
			newAction = new WaitAction(this, this.player)
		}

		if (newAction)
			this.playerActionQueue.enqueue(newAction)
	}
}


let MOVE_KEYS = new Map<string, [number, number]>();
// arrow keys
MOVE_KEYS.set("ArrowUp", [0, -1])
MOVE_KEYS.set("ArrowDown", [0, 1])
MOVE_KEYS.set("ArrowLeft", [-1, 0])
MOVE_KEYS.set("ArrowRight", [1, 0])
MOVE_KEYS.set("Home", [-1, -1])
MOVE_KEYS.set("End", [-1, 1])
MOVE_KEYS.set("PageUp", [1, -1])
MOVE_KEYS.set("PageDown", [1, 1])

// numpad keys
MOVE_KEYS.set("Numpad1", [-1, 1])
MOVE_KEYS.set("Numpad2", [0, 1])
MOVE_KEYS.set("Numpad3", [1, 1])
MOVE_KEYS.set("Numpad4", [-1, 0])
MOVE_KEYS.set("Numpad6", [1, 0])
MOVE_KEYS.set("Numpad7", [-1, -1])
MOVE_KEYS.set("Numpad8", [0, -1])
MOVE_KEYS.set("Numpad9", [1, -1])

// vi keys
MOVE_KEYS.set("KeyH", [-1, 0])
MOVE_KEYS.set("KeyJ", [0, 1])
MOVE_KEYS.set("KeyK", [0, -1])
MOVE_KEYS.set("KeyL", [1, 0])
MOVE_KEYS.set("KeyY", [-1, -1])
MOVE_KEYS.set("KeyU", [1, -1])
MOVE_KEYS.set("KeyB", [-1, 1])
MOVE_KEYS.set("KeyN", [1, 1])


enum WAIT_KEYS {
	"Period",
	"Numpad5",
	"Delete",
}

enum CONFIRM_KEYS {
	"Enter",
	"NumpadEnter",
}