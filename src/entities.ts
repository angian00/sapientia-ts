
import { Game } from "./game"
import { GameMap } from "./map"
import { Stats } from "./stats"
import { Inventory } from "./inventory"
import { AI, PlayerAI } from "./ai"


export class Entity {
	name: string
	char: string
	color: string
	isBlocking: boolean
	x: number
	y: number

	constructor(name: string, char = "?", color = "darkgrey", isBlocking = false) {
		this.name = name
		this.char = char
		this.color = color
		this.x = 0
		this.y = 0
	}

	move(dx: number, dy: number) {
		this.x += dx
		this.y += dy
	}
}


export class Actor extends Entity {
	game: Game
	stats?: Stats
	inventory?: Inventory
	ai?: AI

	constructor(game: Game, name: string, char = "?", color = "black") {
		super(name, char, color, true)
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
					this.game.view.renderMessages(this.game.messageLog)
				}

				//only monsters waste a turn on failed actions
				if (actionResult.success || !(this.ai instanceof PlayerAI) )
					break;
			}
		}
	}
}



export class Item extends Entity {
	game: Game
	parent?: Inventory | GameMap
	//consumable?: Consumable
	//equippable?: Equippable
	//combinable?: Combinable

	constructor(game: Game, name: string, char = "?", color = "black") {
		super(name, char, color, true)
		this.game = game
	}
}
