import { Engine } from "./engine"
import { Actor, Item } from "./entities"
import { Stats } from "../components/stats"
import { PlayerAI, EnemyAI } from "../components/ai"
import { Inventory } from "../components/inventory"
import { Equipment } from "../components/equipment"
import { HealingConsumable } from "../components/consumable"
import { EquipmentType } from "../components/equipment"
import { Equippable } from "../components/equippable"
import { Combinable } from "../components/combinable"


export enum ActorType {
	Player,
	Orc,
	Troll
}

export enum ItemType {
	PotionHealth,
	PotionPoison,
	HerbHenbane,
	HerbNightshade,
	Dagger,
	LeatherArmor
}


export function makeActor(engine: Engine, actorType: ActorType): Actor {
	let char: string
	let color: string
	let name: string

	let hp: number
	let baseDef: number
	let baseAtt: number

	let inventorySize: number

	switch (actorType) {
		case ActorType.Player:
			char = "@"
			color = "blue"
			name = "player"

			hp = 30
			baseDef = 2
			baseAtt = 4

			inventorySize = 26

			break

		case ActorType.Orc:
			char = "o"
			color = "#408040"
			name = "orc"

			hp = 10
			baseDef = 0
			baseAtt = 3

			inventorySize = 0

			break

		case ActorType.Troll:
			char = "T"
			color = "#008000"
			name = "troll"

			hp = 16
			baseDef = 1
			baseAtt = 4

			inventorySize = 0

			break
	}

	let actor = new Actor(engine, name, char, color)
	actor.stats = new Stats(engine, actor, hp, baseDef, baseAtt)

	if (inventorySize) {
		actor.inventory = new Inventory(engine, actor, inventorySize)
		actor.equipment = new Equipment(engine, actor)
	}
	
	if (actorType === ActorType.Player)
		actor.ai = new PlayerAI(engine, actor)
	else
		actor.ai = new EnemyAI(engine, actor)

	return actor
}


export function makeItem(engine: Engine, itemType: ItemType): Item {
	let char: string
	let color: string
	let name: string

	switch (itemType) {
		case ItemType.PotionHealth:
			char = "!"
			color = "#8000FF"
			name = "health potion"
			break
		case ItemType.PotionPoison:
			char = "!"
			color = "purple"
			name = "poison potion"
			break

		case ItemType.HerbHenbane:
			char = ","
			color = "#55FF55"
			name = "henbane"
			break
		case ItemType.HerbNightshade:
			char = ","
			color = "#55FF55"
			name = "nightshade"
			break

		case ItemType.Dagger:
			char = "/"
			color = "#00BFFF"
			name = "dagger"
			break
		case ItemType.LeatherArmor:
			char = "["
			color = "#00BFFF"
			name = "leather armor"
			break
	}

	let item = new Item(engine, name, char, color)

	switch (itemType) {
		case ItemType.PotionHealth:
			item.consumable = new HealingConsumable(engine, item, 10)
			break
		case ItemType.PotionPoison:
			//item.consumable = new PoisonConsumable(engine, item, 10)
			break

		case ItemType.HerbHenbane:
			item.combinable = new Combinable(engine, item)
			break
		case ItemType.HerbNightshade:
			item.combinable = new Combinable(engine, item)
			break

		case ItemType.Dagger:
			item.equippable = new Equippable(engine, item, EquipmentType.Weapon, 2, 0)
			break
		case ItemType.LeatherArmor:
			item.equippable = new Equippable(engine, item, EquipmentType.Armor, 0, 1)
			break
	}

	return item
}
