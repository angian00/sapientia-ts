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
		
	/** Removes an item from the inventory and restores it to the game map, at the player's current location */
	drop(item: Item): void {
		this.items.delete(item)
		this.engine.currMap.place(item, this.parent.x, this.parent.y)
	}


	clone(newParent: Actor) {
		let newInventory = new Inventory(this.engine, newParent, this.capacity)

		for (let item of this.items) {
			newInventory.items.add(item.clone(newInventory))
		}

		return newInventory
	}

	toObject(): any {
		let itemObjs = new Array<any>()
		for (let item of this.items) {
			itemObjs.push(item.toObject())
		}

		return { capacity: this.capacity, items: itemObjs }
	}

	static fromObject(obj: any): Inventory {
		let newInventory = new Inventory(null, null, +obj.capacity)

		for (let itemData of obj.items) {
			let newItem = Item.fromObject(itemData)
			newInventory.items.add(newItem)
			newItem.parent = newInventory
		}

		return newInventory		
	}

}
