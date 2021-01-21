import * as ROT from "rot-js"

import { mapWidth, mapHeight } from "./layout"
import * as tiles from "./tiles"
import { Entity, Actor } from "./entities"


export class GameMap {
	width: number
	height: number
	tiles: tiles.Terrain[][] = genMap()
	entities: Set<Entity> = new Set()

	constructor(width: number, height: number) {
		this.width = width
		this.height = height
	}

	place(e: Entity, x: number, y: number): void {
		e.x = x
		e.y = y

		this.entities.add(e)
	}

	inBounds(x: number, y: number): boolean {
		return (0 <= x && x < this.width && 0 <= y && x < this.height)
	}


	getActor(x: number, y: number): Actor {
		for (let e of this.entities) {
			if (e.x == x && e.y == y && (e instanceof Actor))
				return e
		}

		return null
	}

	getBlockingEntity(x: number, y: number): Entity {
		for (let e of this.entities) {
			if (e.x == x && e.y == y && e.isBlocking)
				return e
		}

		return null
	}
}

function genMap(): tiles.Terrain[][] {
	let map: tiles.Terrain[][] = []

	for (let x = 0; x < mapWidth; x++) {
		map[x] = []
		for (let y = 0; y < mapHeight; y++) {
			//walls on the borders
			if (x == 0 || x == mapWidth - 1 || y == 0 || y == mapHeight - 1)
				map[x].push(tiles.Wall)
			else
				map[x].push(tiles.Floor)
		}
	}

	return map
}

