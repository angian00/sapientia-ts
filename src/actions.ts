import { Actor } from "./entities"
import { Game, } from "./game"


export interface ActionResult {
	success: boolean
	reason?: string
}

export abstract class Action {
	actor: Actor
	game: Game

	constructor(game: Game, actor: Actor) {
		this.game = game
		this.actor = actor
	}

	abstract perform(): ActionResult
}

export class WaitAction extends Action {
	perform(): ActionResult {
		//do nothing, spend a turn
		this.game.messageLog.addMessage(this.actor.name + " is waiting... ")

		return { success: true }
	}
}


export class MovementAction extends Action {
	dx: number
	dy: number

	constructor(game: Game, actor: Actor, dx: number, dy: number) {
		super(game, actor)
		this.dx = dx
		this.dy = dy
	}
	
	/** Returns this actions destination */
	get destXY(): [number, number] {
		return [this.actor.x + this.dx, this.actor.y + this.dy]
	}

	perform(): ActionResult {
		let [destX, destY] = this.destXY

		if (!this.game.map.inBounds(destX, destY) || !this.game.map.tiles[destX][destY].walkable)
			return { success: false, reason: "That way is blocked" }

		if (this.game.map.getBlockingEntity(destX, destY))
			return { success: false, reason: "That way is blocked" }
	
		this.actor.move(this.dx, this.dy)
		return { success: true }
	}
}
