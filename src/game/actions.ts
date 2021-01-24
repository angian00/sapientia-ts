import { Entity, Actor, Item } from "./entities"
import { Engine } from "./engine"
import { removeFromList } from "../util"


export interface ActionResult {
	success: boolean
	reason?: string
}

export abstract class Action {
	actor: Actor
	game: Engine

	constructor(game: Engine, actor: Actor) {
		this.game = game
		this.actor = actor
	}

	abstract perform(): ActionResult
}

export class WaitAction extends Action {
	perform(): ActionResult {
		//do nothing, spend a turn
		if (this.game.map.visible[this.actor.x][this.actor.x])
			this.game.messageLog.addMessage(this.actor.name + " is waiting... ")

		return { success: true }
	}
}


abstract class DirectionAction extends Action {
	dx: number
	dy: number

	constructor(game: Engine, actor: Actor, dx: number, dy: number) {
		super(game, actor)
		this.dx = dx
		this.dy = dy
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

		//console.log("performing MeleeAction")
		//console.log(this.actor.name)
		//console.log(target.name)

		let damage = this.actor.stats.att - target.stats.def
		let attackDesc = `${this.actor.name} attacks ${target.name}`

		let msgClass
		if (this.actor === this.game.player)
			msgClass = "player-attack"
		else
			msgClass = "enemy-attack"

		if (damage > 0) {
			this.game.messageLog.addMessage(`\u2694 ${attackDesc} for ${damage} hit points`, msgClass)
			target.stats.hp -= damage
		} else {
			this.game.messageLog.addMessage(`\u2694 ${attackDesc} but does no damage`, msgClass)
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


/** Pickup an item and add it to the inventory, if there is room for it */
export class PickupAction extends Action {
	perform(): ActionResult {
		let actorX = this.actor.x
		let actorY = this.actor.y
		let inventory = this.actor.inventory

		for (let e of this.game.map.entities) {
			if (!(e instanceof Item))
				continue

			let item = <Item>e
			if (actorX != item.x || actorY != item.y)
				continue

			if (inventory.items.size >= inventory.capacity)
				return { success: false, reason: "your inventory is full" }
		
			this.game.map.entities.delete(item)

			item.parent = this.actor.inventory
			inventory.items.add(item)

			this.game.messageLog.addMessage(`you picked up the ${item.name}`)
			return { success: true }

		}

		return { success: false, reason: "There is nothing here to pick up" }
	}
}


export abstract class ItemAction extends Action {
	item: Item
	targetXY: [number, number]

	constructor(game: Engine, actor: Actor, item: Item, targetXY?: [number, number]) {
		super(game, actor)
		this.item = item
		if (targetXY)
			this.targetXY = targetXY
		else
			this.targetXY = [actor.x, actor.y]
	}

	/** Return the actor at this actions destination */
	get targetActor(): Actor {
		return this.game.map.getActor(this.targetXY[0], this.targetXY[1])
	}

	abstract perform(): ActionResult
}


export class DropAction extends ItemAction {
	perform(): ActionResult {
		if (this.actor.inventory.items.has(this.item)) {
			this.actor.inventory.drop(this.item)
			return { success: true }

		} else {
			return { success: false, reason: "You don't have that item" }
		}
	}
}
