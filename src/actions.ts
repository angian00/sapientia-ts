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


abstract class DirectionAction extends Action {
	dx: number
	dy: number

	constructor(game: Game, actor: Actor, dx: number, dy: number) {
		super(game, actor)
		this.dx = dx
		this.dy = dy

		console.log("creating DirectionAction with actor")
		console.log(this.actor)
	}
	
	/** Returns this actions destination */
	get destXY(): [number, number] {
		return [this.actor.x + this.dx, this.actor.y + this.dy]
	}


	/** Return the actor at this actions destination */
	get targetActor(): Actor {
		return this.game.map.getActor(this.destXY[0], this.destXY[1])
	}

	abstract perform(): ActionResult
}

export class BumpAction extends DirectionAction {
	perform(): ActionResult {
		if (this.targetActor)
			return (new MeleeAction(this.game, this.actor, this.dx, this.dy)).perform()
		else
			return (new MovementAction(this.game, this.actor, this.dx, this.dy)).perform()
	}
}



export class MeleeAction extends DirectionAction {
	perform(): ActionResult {
		let target = this.targetActor
		if (!target)
			return { success: false, reason: "Nothing to attack" }

		console.log("performing MeleeAction")
		console.log(this.actor)
		console.log(target)

		let damage = this.actor.stats.att - target.stats.def
		let attackDesc = `${this.actor.name} attacks ${target.name}`

		let msgClass
		if (this.actor === this.game.player)
			msgClass = "player-attack"
		else
			msgClass = "enemy-attack"

		if (damage > 0) {
			this.game.messageLog.addMessage(`${attackDesc} for ${damage} hit points`, msgClass)
			target.stats.hp -= damage
		} else {
			this.game.messageLog.addMessage(`${attackDesc} but does no damage`, msgClass)
		}
		
		return { success: true }
	}
}

export class MovementAction extends DirectionAction {
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
