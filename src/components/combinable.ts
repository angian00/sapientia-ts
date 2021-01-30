import { Engine } from "../game/engine"
import { Item } from "../game/entities"
import { ActionResult } from "../game/actions"
import { Inventory } from "../components/inventory"
import { makeItem } from "../game/entity_factory"
import { getCombination } from "../game/ingredients"


export class Combinable {
	engine: Engine
	parent: Item

	constructor(engine: Engine, parent: Item) {
		this.engine = engine
		this.parent = parent
	}

	combine(ingr2Comb: Combinable): ActionResult {
		let ingr1 = this.parent
		let ingr2 = ingr2Comb.parent

		let inventory = ingr1.parent
		if (!(inventory instanceof Inventory) || (ingr2.parent != inventory))
			return { success: false, reason: "one of the ingredients is not available" }

		let prodType = getCombination(ingr1.name, ingr2.name)
		if (!prodType)
			return { success: false, reason: "Those ingredients cannot be combined" }

		inventory.items.delete(ingr1)
		inventory.items.delete(ingr2)

		let prod = makeItem(this.engine, prodType)
		this.engine.messageLog.addMessage(`${ingr1.name} + ${ingr2.name} produced --> ${prod.name}`)

		prod.parent = inventory
		inventory.items.add(prod)

		return { success: true }
	}
}