
import { Engine } from "./engine"
import { GameMap } from "./map"
import { Stats } from "../components/stats"
import { Inventory } from "../components/inventory"
import { AI, PlayerAI } from "../components/ai"


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
	game: Engine
	stats?: Stats
	inventory?: Inventory
	ai?: AI

	constructor(game: Engine, name: string, char = "?", color = "black") {
		super(name, char, color, true, RenderOrder.Actor)
		this.game = game
	}

	async act() {
		if (this.ai) {
			while (true) {
				let a = await this.ai.chooseAction()
				console.log(`Performing action ${a.constructor.name}`)
				console.log(a)

				let actionResult = a.perform()
				if (!actionResult.success) {
					this.game.messageLog.addMessage(actionResult.reason!, "warning")
					this.game.gameView.renderMessages(this.game.messageLog)
				}

				//only monsters waste a turn on failed actions
				if (actionResult.success || !(this.ai instanceof PlayerAI) )
					break;
			}
		}
	}
}



export class Item extends Entity {
	game: Engine
	parent?: Inventory | GameMap
	//consumable?: Consumable
	//equippable?: Equippable
	//combinable?: Combinable

	constructor(game: Engine, name: string, char = "?", color = "black") {
		super(name, char, color, false, RenderOrder.Item)
		this.game = game
	}

	use(): void {

	}
}
