import { Entity, Actor, Item, Site } from "./entities"
import { Engine } from "./engine"
import { mapDefs } from "../loaders/map_loader"


export interface ActionResult {
	success: boolean
	reason?: string
}

export abstract class Action {
	actor: Actor
	engine: Engine

	constructor(engine: Engine, actor: Actor) {
		this.engine = engine
		this.actor = actor
	}

	abstract perform(): ActionResult
}

export class WaitAction extends Action {
	perform(): ActionResult {
		//do nothing, spend a turn
		if (this.engine.map.visible[this.actor.x][this.actor.y]) {
			this.engine.messageLog.addMessage(this.actor.name + " is waiting... ")
		}

		return { success: true }
	}
}

/** Pickup an item and add it to the inventory, if there is room for it */
export class PickupAction extends Action {
	perform(): ActionResult {
		let actorX = this.actor.x
		let actorY = this.actor.y
		let inventory = this.actor.inventory

		for (let e of this.engine.map.entities) {
			if (!(e instanceof Item))
				continue

			let item = <Item>e
			if (actorX != item.x || actorY != item.y)
				continue

			if (inventory.items.size >= inventory.capacity)
				return { success: false, reason: `${this.actor.name} inventory is full` }

			this.engine.map.entities.delete(item)

			item.parent = this.actor.inventory
			inventory.items.add(item)

			this.engine.messageLog.addMessage(`${this.actor.name} picks up the ${item.name}`)
			return { success: true }

		}

		return { success: false, reason: "There is nothing here to pick up" }
	}
}

//-----------------------------------------------------
// Direction Actions
//-----------------------------------------------------

abstract class DirectionAction extends Action {
	dx: number
	dy: number

	constructor(engine: Engine, actor: Actor, dx: number, dy: number) {
		super(engine, actor)
		this.dx = dx
		this.dy = dy
	}
	
	/** Returns this actions destination */
	get destXY(): [number, number] {
		return [this.actor.x + this.dx, this.actor.y + this.dy]
	}


	/** Return the actor at this actions destination */
	get targetActor(): Actor {
		return this.engine.map.getActorAt(this.destXY[0], this.destXY[1])
	}

	/** Return the site at this actions destination */
	get targetSite(): Site {
		return this.engine.map.getSiteAt(this.destXY[0], this.destXY[1])
	}

	abstract perform(): ActionResult
}

export class BumpAction extends DirectionAction {
	perform(): ActionResult {
		if (this.targetActor)
			return (new MeleeAction(this.engine, this.actor, this.dx, this.dy)).perform()
		else if (this.targetSite)
			return (new EnterMapAction(this.engine, this.actor, this.dx, this.dy)).perform()

		else
			return (new MovementAction(this.engine, this.actor, this.dx, this.dy)).perform()
	}
}


export class MeleeAction extends DirectionAction {
	perform(): ActionResult {
		let target = this.targetActor
		if (!target)
			return { success: false, reason: "Nothing to attack" }

		let damage = this.actor.stats.att - target.stats.def
		let attackDesc = `${this.actor.name} attacks ${target.name}`

		let msgClass
		if (this.actor === this.engine.player)
			msgClass = "player-attack"
		else
			msgClass = "enemy-attack"

		if (damage > 0) {
			this.engine.messageLog.addMessage(`\u2694 ${attackDesc} for ${damage} hit points`, msgClass)
			target.stats.hp -= damage
		} else {
			this.engine.messageLog.addMessage(`\u2694 ${attackDesc} but does no damage`, msgClass)
		}
		
		return { success: true }
	}
}

export class MovementAction extends DirectionAction {
	perform(): ActionResult {
		let [destX, destY] = this.destXY

		if (!this.engine.map.inBounds(destX, destY))
			return (new ExitMapAction(this.engine, this.actor, this.dx, this.dy)).perform()

		if (!this.engine.map.tiles[destX][destY].walkable)
			return { success: false, reason: "That way is blocked" }

		if (this.engine.map.getBlockingEntityAt(destX, destY))
			return { success: false, reason: "That way is blocked" }

		this.actor.move(this.dx, this.dy)
		return { success: true }
	}
}


export class EnterMapAction extends DirectionAction {
	perform(): ActionResult {
		let target = this.targetSite
		if (!target)
			return { success: false, reason: "No site to enter" }

		this.engine.messageLog.addMessage(`Entering ${target.name}`)
		this.actor.move(this.dx, this.dy)

		if (!(target.mapName in mapDefs))
			return { success: false, reason: `Unknown map: [${target.mapName}]` }
		this.engine.world.pushMap(mapDefs[target.mapName])
		
		return { success: true }
	}
}

export class ExitMapAction extends DirectionAction {
	perform(): ActionResult {
		if (this.engine.world.mapStack.length > 1) {
			this.engine.world.popMap()
			this.engine.messageLog.addMessage(`Returning to ${this.engine.world.currMap.name}`)
			return { success: true }
		} else {
			return { success: false, reason: "That way is blocked" }
		}
	}
}

//-----------------------------------------------------
// Item Actions
//-----------------------------------------------------

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
		return this.engine.map.getActorAt(this.targetXY[0], this.targetXY[1])
	}

	abstract perform(): ActionResult
}


export class DropAction extends ItemAction {
	perform(): ActionResult {
		if (this.actor.inventory.items.has(this.item)) {
			this.actor.inventory.drop(this.item)

			this.engine.messageLog.addMessage(`${this.actor.name} drops the ${this.item.name}`)

			return { success: true }

		} else {
			return { success: false, reason: `${this.actor.name} doesn't have that item` }
		}
	}
}

export class UseAction extends ItemAction {
	perform(): ActionResult {
		if (this.item.consumable) {
			return this.item.consumable.use(this)
		}
	}
}

export class EquipAction extends ItemAction {
	perform(): ActionResult {
		if (this.item.equippable) {
			this.actor.equipment.toggle(this.item)
			return { success: true }
		} else {
			return { success: false, reason: "This item is not equippable" }
		}
	}
}


export class CombineAction extends Action {
	item1: Item
	item2: Item

	constructor(engine: Engine, actor: Actor, item1: Item, item2: Item) {
		super(engine, actor)
		this.item1 = item1
		this.item2 = item2
	}

	perform(): ActionResult {
		if (this.item1.combinable && this.item2.combinable)
			return this.item1.combinable.combine(this.item2.combinable)
		else
			return { success: false, reason: "Only ingredients can be combined" }
	}

}

