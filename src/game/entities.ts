
import { Engine } from "./engine"
import { GameMap } from "./map"
import { Stats } from "../components/stats"
import { Inventory } from "../components/inventory"
import { Equipment } from "../components/equipment"
import { AI, PlayerAI } from "../components/ai"
import { Consumable } from "../components/consumable"
import { Equippable } from "../components/equippable"
import { Combinable } from "../components/combinable"
import * as colors from "../ui/colors"


export enum RenderOrder {
	Site,
	Corpse,
	Item,
	Actor
}


export class Entity {
	name: string
	char: string
	color: string
	isBlocking: boolean
	x: number
	y: number
	renderOrder: RenderOrder


	constructor(name: string, char = "?", color = "darkgrey", isBlocking = false, renderOrder = RenderOrder.Item) {
		this.name = name
		this.char = char
		this.color = color
		this.isBlocking = isBlocking
		this.renderOrder = renderOrder
		this.x = 0
		this.y = 0
	}

	move(dx: number, dy: number) {
		this.x += dx
		this.y += dy
	}
}


export class Actor extends Entity {
	private _engine: Engine
	stats?: Stats
	inventory?: Inventory
	equipment?: Equipment
	ai?: AI

	constructor(engine: Engine, name: string, char = "?", color = "black") {
		super(name, char, color, true, RenderOrder.Actor)
		this._engine = engine
	}

	get engine(): Engine {
		return this._engine

	}

	set engine(engine: Engine) {
		this._engine = engine

		if (this.stats)
			this.stats.engine = engine

			if (this.inventory)
			this.inventory.engine = engine

		if (this.equipment)
			this.equipment.engine = engine

		if (this.ai)
			this.ai.engine = engine
	}

	clone(): Actor {
		let newActor = new Actor(this.engine, this.name, this.char, this.color)
		newActor.x = this.x
		newActor.y = this.y

		if (this.inventory) {
			newActor.inventory = this.inventory.clone(newActor)
		} if (this.stats) {
			newActor.stats = this.stats.clone(newActor)
		} if (this.equipment) {
			newActor.equipment = this.equipment.clone(newActor)
		} if (this.ai) {
			newActor.ai = this.ai.clone(newActor)
		}

		return newActor
	}

	async act() {
		if (this.ai) {
			while (true) {
				let a = await this.ai.chooseAction()
				console.log(`Performing ${a.constructor.name}`)
				//console.log(a)

				let actionResult = a.perform()
				if (!actionResult.success) {
					this.engine.messageLog.addMessage(actionResult.reason!, "warning")
					this.engine.gameView.renderMessages(this.engine.messageLog)
				}

				//only monsters waste a turn on failed actions
				if (actionResult.success || !(this.ai instanceof PlayerAI) )
					break;
			}
		}
	}

	die(): void {
		let deathMessage: string
		let deathMessageClass: string
		let corpseColor: string

		if (this.engine.player == this) {
			deathMessage = "\u271F you died"
			deathMessageClass = "player-death"
			corpseColor = colors.playerDeath
		} else {
			deathMessage = `\u271F ${this.name} is dead`
			deathMessageClass = "enemy-death"
			corpseColor = colors.enemyDeath
		}

		this.engine.messageLog.addMessage(deathMessage, deathMessageClass)

		//this.game.player.level.add_xp(this.parent.level.xp_given)

		let corpse = new Item(`remains of ${this.name}`, "%", corpseColor)
		this.engine.map.place(corpse, this.x, this.y)
		this.engine.removeActor(this)
	}
}



export class Item extends Entity {
	parent?: Inventory | GameMap
	consumable?: Consumable
	equippable?: Equippable
	combinable?: Combinable

	constructor(name: string, char = "?", color = "black") {
		super(name, char, color, false, RenderOrder.Item)
	}

	clone(newParent: Inventory | GameMap): Item {
		//TODO: clone items
		return this
	}

	use(): void {

	}
}


export class Site extends Entity {
	parent?: GameMap
	darkColor: string
	mapName: string

	constructor(name: string, char = "*", color = "black", darkColor = "darkgrey", mapName: string) {
		super(name, char, color, false, RenderOrder.Site)
		this.darkColor = darkColor
		this.mapName = mapName
	}
}
