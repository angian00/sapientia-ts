import { Engine } from "./engine"
import { Actor, Item } from "./entities"
import { Stats } from "../components/stats"
import { PlayerAI, EnemyAI } from "../components/ai"
import { Inventory } from "../components/inventory"
import { Consumable, HealingConsumable } from "../components/consumable"


export enum ActorTypes {
	Player,
	Orc
}

export enum ItemTypes {
	HealthPotion
}


export function makeActor(engine: Engine, actorType: ActorTypes): Actor {
	let char: string
	let color: string
	let name: string

	let hp: number
	let baseDef: number
	let baseAtt: number

	let inventorySize: number

	switch (actorType) {
		case ActorTypes.Player:
			char = "@"
			color = "blue"
			name = "player"

			hp = 30
			baseDef = 2
			baseAtt = 5

			inventorySize = 26

			break

		case ActorTypes.Orc:
			char = "o"
			color = "#408040"
			name = "orc"

			hp = 10
			baseDef = 0
			baseAtt = 3

			inventorySize = 0

			break
	}

	let actor = new Actor(engine, name, char, color)
	actor.stats = new Stats(engine, actor, hp, baseDef, baseAtt)

	if (inventorySize)
		actor.inventory = new Inventory(engine, actor, inventorySize)

	if (actorType === ActorTypes.Player)
		actor.ai = new PlayerAI(engine, actor)
	else
		actor.ai = new EnemyAI(engine, actor)

	return actor
}


export function makeItem(engine: Engine, itemType: ItemTypes): Item {
	let char: string
	let color: string
	let name: string

	switch (itemType) {
		case ItemTypes.HealthPotion:
			char = "!"
			color = "#8000FF"
			name = "health potion"
			break
	}

	let item = new Item(engine, name, char, color)

	switch (itemType) {
		case ItemTypes.HealthPotion:
			item.consumable = new HealingConsumable(engine, item, 10)
			break
	}

	return item
}
