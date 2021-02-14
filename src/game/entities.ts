
import { Engine } from "./engine"
import { GameMap } from "./map"
import { Stats } from "../components/stats"
import { Inventory } from "../components/inventory"
import { Equipment } from "../components/equipment"
import { AI, PlayerAI } from "../components/ai"
import { Consumable } from "../components/consumable"
import { Equippable } from "../components/equippable"
import { Combinable } from "../components/combinable"
import { gameView } from "../ui/views"
import * as colors from "../ui/colors"


export enum RenderOrder {
	Site,
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

	toObject(): any {
		return {
			name: this.name,
			char: this.char,
			color: this.color,
			renderOrder: this.renderOrder,
			x: this.x,
			y: this.y,
		}
	}

	static fromObject(obj: any): Entity {
		if (obj.subclass == "Actor")
			return Actor.fromObject(obj)
		else if (obj.subclass == "Item")
			return Item.fromObject(obj)
		else if (obj.subclass == "Site")
			return Site.fromObject(obj)
		else
			return null
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

	async act() {
		if (this.ai) {
			while (true) {
				let a = await this.ai.chooseAction()
				console.log(`Performing ${a.constructor.name}`)
				//console.log(a)

				let actionResult = a.perform()
				if (!actionResult.success) {
					this.engine.messageLog.addMessage(actionResult.reason!, "warning")
					gameView.renderMessages(this.engine.messageLog)
				}

				//only monsters waste a turn on failed actions
				if (actionResult.success || !(this.ai instanceof PlayerAI))
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
		this.engine.currMap.place(corpse, this.x, this.y)
		this.engine.removeActor(this)

		//TODO: ask for a new game instead
		if (this.engine.player == this)
			this.engine.scheduler.clear()
	}


	clone(): Actor {
		let newActor = new Actor(this.engine, this.name, this.char, this.color)
		newActor.x = this.x
		newActor.y = this.y

		if (this.stats)
			newActor.stats = this.stats.clone(newActor)
		
		if (this.ai)
			newActor.ai = this.ai.clone(newActor)

		if (this.inventory)
			newActor.inventory = this.inventory.clone(newActor)

		if (this.equipment)
			newActor.equipment = this.equipment.clone(newActor)

		return newActor
	}

	toObject(): any {
		let res = super.toObject()
		res.subclass = "Actor"

		if (this.stats)
			res.stats = this.stats.toObject()

		if (this.ai)
			res.ai = this.ai.toObject()

		if (this.inventory)
			res.inventory = this.inventory.toObject()

		if (this.equipment)
			res.equipment = this.equipment.toObject()

		return res
	}

	static fromObject(obj: any): Actor {
		let newActor = new Actor(null, obj.name, obj.char, obj.color)
		newActor.x = obj.x
		newActor.y = obj.y

		if (obj.stats) {
			newActor.stats = Stats.fromObject(obj.stats)
			newActor.stats.parent = newActor
		}

		if (obj.ai) {
			newActor.ai = AI.fromObject(obj.ai)
			newActor.ai.parent = newActor
		}

		if (obj.inventory) {
			newActor.inventory = Inventory.fromObject(obj.inventory)
			newActor.inventory.parent = newActor
		}

		if (obj.equipment) {
			newActor.equipment = Equipment.fromObject(obj.equipment, newActor.inventory)
			newActor.equipment.parent = newActor
		}

		return newActor
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


	use(): void {

	}

	clone(newParent: Inventory | GameMap): Item {
		//TODO: clone items
		return this
	}

	toObject(): any {
		let res = super.toObject()
		res.subclass = "Item"

		return res

	}

	static fromObject(obj: any): Item {
		//TODO: Item.fromObject
		return null
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

	toObject(): any {
		let res = super.toObject()
		res.subclass = "Site"
		res.darkColor = this.darkColor
		res.mapName = this.mapName

		return res
	}

	static fromObject(obj: any): Site {
		let newSite = new Site(obj.name, obj.char, obj.color, obj.darkColor, obj.mapName)

		newSite.x = +obj.x
		newSite.y = +obj.y

		return newSite
	}
}
