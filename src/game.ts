import * as ROT from "rot-js"

import { mapWidth, mapHeight } from "./constants"
import { Tile } from "./tile"
import { Action, MovementAction, WaitAction } from "./actions"
import { BlockingQueue } from "./util"
import { DisplayView } from "./view"


export class Entity {
	readonly name: string
	readonly char: string
	readonly color: string
	x: number
	y: number

	constructor(name: string, char = "?", color = "darkgrey") {
		this.name = name
		this.char = char
		this.color = color
		this.x = 0
		this.y = 0
	}

	move(dx: number, dy: number) {
		this.x += dx
		this.y += dy
	}
}


export class Actor extends Entity {
	async act() {
		//do nothing
	}
}

class Player extends Actor {
	game: Game

	constructor(game: Game) {
		super("Player", "@", "blue")

		this.game = game
	}

	async act() {
		let a = await this.game.playerActionQueue.dequeue()

		a.perform()
	}
}




export class Game {
	map = new GameMap()
	actors: Actor[] = []
	player = new Player(this)
	scheduler = new ROT.Scheduler.Simple()
	playerActionQueue = new BlockingQueue<Action>()
	view = new DisplayView(this)


	constructor() {
		console.log("Game constructor")

		//TODO: clean old event handlers
		//document.body.addEventListener("keydown", this.handleKeyboardInput)
		document.body.addEventListener("keydown", this.handleKeyboardInput.bind(this))

		this.addActor(this.player)
		this.map.place(this.player, 10, 10)
		this.view.render()
	}


	addActor(actor: Actor): void {
		this.actors.push(actor)
		this.scheduler.add(actor, true)
	}

	async processTurn(): Promise<void> {
		console.log("processTurn")

		let currActor = <Actor>this.scheduler.next()
		await currActor.act();

		this.view.render();
	}

	handleKeyboardInput(e: KeyboardEvent): void {

		let newAction = null
		let keyCode = e.code

		if (MOVE_KEYS.has(keyCode)) {
			let move = MOVE_KEYS.get(keyCode)

			console.log("inside handleKeyboardInput")
			console.log(this)
			console.log(this.player)
			newAction = new MovementAction(this.player, move[0], move[1])

		} else if (keyCode in WAIT_KEYS) {
			newAction = new WaitAction(this.player)
		}

		if (newAction)
			this.playerActionQueue.enqueue(newAction)
	}
}

export class GameMap {
	tiles: Tile[][] = genMap()
	actors: Set<Actor> = new Set()

	place(a: Actor, x: number, y: number): void {
		a.x = x
		a.y = y

		this.actors.add(a)
	}
}

function genMap(): Tile[][] {
	let map: Tile[][] = []

	for (let x = 0; x < mapWidth; x++) {
		map[x] = []
		for (let y = 0; y < mapHeight; y++) {
			//walls on the borders
			if (x == 0 || x == mapWidth - 1 || y == 0 || y == mapHeight - 1)
				map[x].push(Tile.Wall)
			else
				map[x].push(Tile.Floor)
		}
	}

	return map
}

interface Dictionary<T> {
	[Key: string]: T;
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