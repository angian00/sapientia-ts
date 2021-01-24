import { Engine } from "../game/engine"
import { Item, Actor } from "../game/entities"
import { Action, ItemAction, ActionResult } from "../game/actions"
import { GameMap } from "../game/map"
import { Inventory } from "./inventory"
import * as colors from "../ui/colors"


export abstract class Consumable {
	engine: Engine
	parent: Item

	constructor(engine: Engine, parent: Item) {
		this.engine = engine
		this.parent = parent
	}

	/** Try to return the action for this item */
	getAction(consumer: Actor): Action {
		return new ItemAction(this.engine, consumer, this.parent)
	}

	/** 
	 * Invoke this items ability.
	 * `action` is the context for this activation.
	 */
	abstract use(action: ItemAction): ActionResult

	/** Remove the consumed item from its containing inventory */
	consume(): void {
		let item = this.parent
		let container = item.parent

		if (container instanceof Inventory)
			container.items.delete(item)
		else if (container instanceof GameMap)
			container.entities.delete(item)
	}
}


export class HealingConsumable extends Consumable {
	amount: number
	
	constructor(engine: Engine, parent: Item, amount: number) {
		super(engine, parent)
		this.amount = amount
	}

	use(action: ItemAction): ActionResult {
		let consumer = action.actor
		let amountHealed = consumer.stats.heal(this.amount)

		if (amountHealed) {
			this.engine.messageLog.addMessage(
				`${consumer.name} consumes the ${self.parent.name}, and recovers ${amountHealed} hp`,
				colors.healthRecovered)

			this.consume()
			return { success: true }

		} else {
			return { success: false, reason: `health is already full` }
		}
	}
}
