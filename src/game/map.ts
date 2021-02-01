import * as ROT from "rot-js"

import { Terrain } from "./terrain"
import { Entity, Actor, Site } from "./entities"
import { getRandomInt } from "../util" 


export class GameMap {
	name: string
	label: string
	width: number
	height: number
	tiles: Terrain[][]
	entities: Set<Entity> = new Set()
	visible: boolean[][]
	explored: boolean[][]


	constructor(name: string, label: string, width: number, height: number, tiles?: Terrain[][]) {
		this.name = name
		this.label = label
		this.width = width
		this.height = height
		this.tiles = tiles

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

		//TODO: remove e from old map entities
		this.entities.add(e)
	}

	inBounds(x: number, y: number): boolean {
		return (0 <= x && x < this.width && 0 <= y && y < this.height)
	}


	getActorAt(x: number, y: number): Actor {
		for (let e of this.entities) {
			if (e.x == x && e.y == y && (e instanceof Actor) && (e.stats))
				return e
		}

		return null
	}

	getSiteAt(x: number, y: number): Site {
		for (let e of this.entities) {
			if (e.x == x && e.y == y && (e instanceof Site))
				return e
		}

		return null
	}

	getBlockingEntityAt(x: number, y: number): Entity {
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

	placeRandom(entity: Entity): void {
		let x: number
		let y: number

		while (true) {
			x = getRandomInt(0, this.width - 1)
			y = getRandomInt(0, this.height - 1)

			if (this.tiles[x][y].walkable && (!this.getBlockingEntityAt(x, y)))
				break
		}

		this.place(entity, x, y)
	}



}
