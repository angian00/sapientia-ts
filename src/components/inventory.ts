import { Engine } from "../game/engine"
import { Actor, Item } from "../game/entities"
import { removeFromList } from "../util"


export class Inventory {
	engine: Engine
	parent: Actor
	capacity: number
	items = new Set<Item>()

	constructor(engine: Engine, parent: Actor, capacity: number) {
		this.engine = engine
		this.parent = parent
		this.capacity = capacity
	}
		
	clone(newParent: Actor) {
		let newInventory = new Inventory(this.engine, newParent, this.capacity)

		for (let item of this.items) {
			newInventory.items.add(item.clone(newInventory))
		}

		return newInventory
	}


	/** Removes an item from the inventory and restores it to the game map, at the player's current location */
	drop(item: Item): void {
		this.items.delete(item)
		this.engine.map.place(item, this.parent.x, this.parent.y)
	}
}
