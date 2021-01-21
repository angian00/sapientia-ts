
import { Game } from "./game"
import { Stats } from "./stats"


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
	stats?: Stats
	//inventory?: Inventory
	//ai?: AI

	constructor(name: string, char = "?", color = "black") {
		super(name, char, color, true)
	}

	async act() {
		//do nothing
	}
}

export class Player extends Actor {
	game: Game

	//TODO: uniform with monsters (move act() logic to PlayerAI)
	constructor(game: Game) {
		super("player", "@", "blue")

		this.game = game

		this.stats = new Stats(30, 2, 5)
		this.stats.parent = this
		this.stats.game = game
	}

	async act() {
		while (true) {
			let a = await this.game.playerActionQueue.dequeue()
			let actionResult = a.perform()
			if (actionResult.success) {
				break
			} else {
				this.game.messageLog.addMessage(actionResult.reason!, "warning")
				this.game.view.renderMessages(this.game.messageLog)
			}
		}

	}
}
