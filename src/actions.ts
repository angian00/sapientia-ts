import { Actor } from "./game"


export abstract class Action {
	actor: Actor

	constructor(actor: Actor) {
		this.actor = actor
	}

	abstract perform(): void
}

export class WaitAction extends Action {
	perform(): void {
		//do nothing, spend a turn
		console.log(this.actor.name + " is waiting... ")

	}
}


export class MovementAction extends Action {
	dx: number
	dy: number

	constructor(actor: Actor, dx: number, dy: number) {
		super(actor)
		this.dx = dx
		this.dy = dy
	}
	
	perform(): void {
		this.actor.move(this.dx, this.dy)
	}
}
