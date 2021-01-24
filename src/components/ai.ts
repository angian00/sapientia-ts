import { Path } from "rot-js"

import { Engine } from "../game/engine"
import { Actor } from "../game/entities"
import { Action, MeleeAction, MovementAction, WaitAction } from "../game/actions"


export abstract class AI {
	game: Engine
	parent: Actor

	constructor(game: Engine, parent: Actor) {
		this.game = game
		this.parent = parent
	}

	/** 
	 * Compute and return a path to the target position.
	 * If there is no valid path then returns an empty list.
	 */
	getPathTo(destX: number, destY: number): [number, number][] {
		let map = this.game.map
		let walkables: boolean[][] = []

		for (let x=0; x < map.width; x++) {
			walkables.push([])
			for (let y = 0; y < map.height; y++) {
				walkables[x].push(map.tiles[x][y].walkable)
			}
		}

		for (let e of map.entities) {
			if (e.isBlocking && !(e === this.parent) && !(e.x == destX && e.y == destY))
				walkables[e.x][e.y] = false
		}

		let passableCallback = function (x: number, y: number): boolean {
			return walkables[x][y]
		}

		let outputPath: [number, number][] = []
		let outputCallback = function (x: number, y: number): void {
			outputPath.push([x, y])
		}

		let dijkstra = new Path.Dijkstra(destX, destY, passableCallback, null)
		dijkstra.compute(this.parent.x, this.parent.y, outputCallback)

		//remove starting position from path
		outputPath.shift()
		
		return outputPath
	}

	abstract chooseAction(): Promise<Action>
}


export class EnemyAI extends AI {
	path: [number, number][] = []

	async chooseAction(): Promise<Action> {
		console.log("EnemyAI.chooseAction")
		let target = this.game.player

		let dx = target.x - this.parent.x
		let dy = target.y - this.parent.y
		let distance = Math.max(Math.abs(dx), Math.abs(dy))

		if (this.game.map.visible[this.parent.x][this.parent.y]) {
			//if monster is visible to player, 
			//then player is visible to monster
			if (distance <= 1)
				return new MeleeAction(this.game, this.parent, dx, dy)

			this.path = this.getPathTo(target.x, target.y)
		}

		if (this.path.length) {
			let [destX, destY] = this.path.shift()
			console.log("EnemyAI chose MovementAction")

			return new MovementAction(this.game, this.parent, 
				destX - this.parent.x, destY - this.parent.y)
		}

		return new WaitAction(this.game, this.parent)
	}
}


export class PlayerAI extends AI {
	async chooseAction(): Promise<Action> {
		return this.game.playerActionQueue.dequeue()
	}
}
