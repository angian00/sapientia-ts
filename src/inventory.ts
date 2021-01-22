import { Game } from "./game"
import { Actor, Item } from "./entities"
import { removeFromList } from "./util"


export class Inventory {
	game: Game
	parent: Actor
	capacity: number
	items = new Set<Item>()

	constructor(game: Game, parent: Actor, capacity: number) {
		this.game = game
		this.parent = parent
		this.capacity = capacity
	}
		

	/** Removes an item from the inventory and restores it to the game map, at the player's current location */
	drop(item: Item): void {
		this.items.delete(item)
		this.game.map.place(item, this.parent.x, this.parent.y)

		this.game.messageLog.addMessage(`You dropped the ${item.name}`)
	}
}
