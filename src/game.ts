import * as ROT from "rot-js"

import { mapWidth, mapHeight } from "./constants"
import { DisplayView } from "./view"
import { Tile } from "./tile"


export class Actor {
	readonly char: string
	readonly color: string
	x: number
	y: number
	
	constructor(char="?", color="grey") {
		this.char = char
		this.color = color
		this.x = 0
		this.y = 0
	}

	act(): void {
		//do nothing
	}
}

class Player extends Actor {
	constructor() {
		super("@", "blue")
	}

	act(): void {
		//TODO
	}
}

export class Game {
	actors: Actor[] = []
	scheduler = new ROT.Scheduler.Simple()
	map = new GameMap()
	view = new DisplayView(this)


	constructor() {
		//TODO: clean old event handlers
		//document.body.addEventListener("keydown", this.handleKeyboardInput)
		document.body.addEventListener("keydown", this.handleKeyboardInput.bind(this))

		let player = new Player()

		this.addActor(player)
		this.map.place(player, 10, 10)
		this.view.render();
	}


	addActor(actor: Actor): void {
		this.actors.push(actor)
		this.scheduler.add(actor, true)
	}

	processTurn(): void {
		let currActor = this.scheduler.next()
		currActor.update();

		this.view.render();
	}

	handleKeyboardInput(e: KeyboardEvent): void {
		console.log(e.code)
		//if e.code == "KeyJ"
		//if e.code == "ArrowDown"
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

