import { Game } from "./game"
import { Actor, Item } from "./entities"
import { Stats } from "./stats"
import { PlayerAI, EnemyAI } from "./ai"
import { Inventory } from "./inventory"


export enum ActorTypes {
	Player,
	Orc
}

export enum ItemTypes {
	HealthPotion
}


export function makeActor(game: Game, actorType: ActorTypes): Actor {
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

	let actor = new Actor(game, name, char, color)
	actor.stats = new Stats(game, actor, hp, baseDef, baseAtt)

	if (inventorySize)
		actor.inventory = new Inventory(game, actor, inventorySize)

	if (actorType === ActorTypes.Player)
		actor.ai = new PlayerAI(game, actor)
	else
		actor.ai = new EnemyAI(game, actor)

	return actor
}


export function makeItem(game: Game, itemType: ItemTypes): Item {
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

	let item = new Item(game, name, char, color)

	return item
}
