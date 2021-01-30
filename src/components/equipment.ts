import { Engine } from "../game/engine"
import { Actor, Item } from "../game/entities"
import { Dictionary } from "../util"

export enum EquipmentType {
	Weapon,
	Armor
}

export class Equipment {
	engine: Engine
	parent: Actor
	items = new Dictionary<Item>()

	constructor(engine: Engine, parent: Actor, weapon?: Item, armor?: Item) {
		this.engine = engine
		this.parent = parent
		if (weapon)
			this.items[EquipmentType.Weapon] = weapon
		if (armor)
			this.items[EquipmentType.Armor] = armor
	}

	get bonusDef(): number {
		let bonus = 0

		for (let k in this.items) {
			let e = this.items[k]
			if (e.equippable)
				bonus += e.equippable.bonusDef
		}

		return bonus
	}


	get bonusAtt(): number {
		let bonus = 0

		for (let k in this.items) {
			let e = this.items[k]
			if (e.equippable)
				bonus += e.equippable.bonusAtt
		}

		return bonus
	}


	isEquipped(item: Item): boolean {
		for (let k in this.items) {
			let e = this.items[k]
			if (e === item)
				return true
		}

		return false
	}

	unequipMessage(itemName: string): void {
		this.parent.engine.messageLog.addMessage(`${this.parent} removes the ${itemName}`)
	}

	equipMessage(itemName: string): void {
		this.parent.engine.messageLog.addMessage(`${this.parent} equips the ${itemName}`)
	}


	equip(newItem: Item, equipType: EquipmentType, addMessage: boolean): void {
		let currentItem = this.items[equipType]

		if (currentItem)
			this.unequip(equipType, addMessage)

		this.items[equipType] = newItem

		if (addMessage)
			this.equipMessage(newItem.name)
	}

	unequip(equipType: EquipmentType, addMessage: boolean): void {
		let currentItem = this.items[equipType]

		if (currentItem && addMessage)
			this.unequipMessage(currentItem.name)
		
		delete this.items[equipType]
	}

	toggle(item: Item, addMessage: boolean = true): void {
		if (!item.equippable) 
			return

		if (this.items[item.equippable.equipmentType] === item)
			this.unequip(item.equippable.equipmentType, addMessage)
		else
			this.equip(item, item.equippable.equipmentType, addMessage)
	}
}

