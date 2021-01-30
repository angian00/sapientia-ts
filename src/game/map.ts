import * as ROT from "rot-js"

import { mapWidth, mapHeight } from "../layout"
import * as tiles from "./tiles"
import { Entity, Actor } from "./entities"


export class GameMap {
	width: number
	height: number
	tiles: tiles.Terrain[][] = genMap()
	entities: Set<Entity> = new Set()
	visible: boolean[][]
	explored: boolean[][]

	constructor(width: number, height: number) {
		this.width = width
		this.height = height

		this.visible = []
		this.explored = []
		for (let x = 0; x < width; x++) {
			this.visible.push([])
			this.explored.push([])
			for (let y=0; y < height; y++) {
				this.visible[x].push(false)
				this.explored[x].push(false)
			}
		}
	}

	resetVisible(): void {
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				this.visible[x][y] = false
			}
		}

	}

	place(e: Entity, x: number, y: number): void {
		e.x = x
		e.y = y

		this.entities.add(e)
	}

	inBounds(x: number, y: number): boolean {
		return (0 <= x && x < this.width && 0 <= y && y < this.height)
	}


	getActor(x: number, y: number): Actor {
		for (let e of this.entities) {
			if (e.x == x && e.y == y && (e instanceof Actor) && (e.stats))
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


	getEntities(x: number, y: number): Entity[] {
		let result: Entity[] = []

		for (let e of this.entities) {
			if (e.x == x && e.y == y)
				result.push(e)
		}

		return result
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

