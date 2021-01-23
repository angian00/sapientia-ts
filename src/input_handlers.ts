
import { Action, BumpAction, WaitAction, PickupAction, DropAction } from "./actions"
import { Game } from "./game"
import { Dictionary } from "./util"
import { Item } from "./entities"


export abstract class InputHandler {
	game: Game
	eventListener: { (e: KeyboardEvent): void }

	constructor(game: Game) {
		this.game = game
		this.eventListener = this.handleEvent.bind(this)
	}

	abstract handleEvent(e: KeyboardEvent): void 
}


export class GameInputHandler extends InputHandler {
	handleEvent(e: KeyboardEvent): void {
		console.log(this)
		let game = this.game

		let newAction = null
		let keyCode = e.code

		if (MOVE_KEYS.has(keyCode)) {
			let move = MOVE_KEYS.get(keyCode)

			newAction = new BumpAction(game, game.player, move[0], move[1])

		} else if (keyCode in WAIT_KEYS) {
			newAction = new WaitAction(game, game.player)
		
		} else if (keyCode == "KeyG") {
			newAction = new PickupAction(game, game.player)

		} else if (keyCode == "KeyI") {			
			let itemMap = game.inventoryView.render(game.player.inventory)
			let inventoryInputHandler = new InventoryInputHandler(game, itemMap)
			game.setInputHandler(inventoryInputHandler)

			document.getElementById("dialogContainer").style.display = "block";
			document.getElementById("inventoryDialog").style.display = "block";

/*		} elseif (keyCode == "KeyD") {
			return InventoryDropHandler(self.engine)
		}
*/
		}

		if (newAction)
			game.playerActionQueue.enqueue(newAction)
	}
}

export class InventoryInputHandler extends InputHandler {
	itemMap: Dictionary<Item>

	constructor(game: Game, itemMap: Dictionary<Item>) {
		super(game)

		this.itemMap = itemMap
	}
	
	handleEvent(e: KeyboardEvent): void {
		let game = this.game

		let keyCode = e.code

		if (keyCode == "Escape") {
			this.backToGame()

		} else if (e.key in this.itemMap) {
			let newAction = new DropAction(game, game.player, this.itemMap[e.key])
			game.playerActionQueue.enqueue(newAction)

			this.backToGame()
		}

		
	}

	backToGame(): void {
		let game = this.game
		
		game.setInputHandler(new GameInputHandler(game))

		game.gameView.renderMap(game.map)
		game.gameView.renderMessages(game.messageLog)
		document.getElementById("dialogContainer").style.display = "none";
		document.getElementById("inventoryDialog").style.display = "none";
	}
}


let MOVE_KEYS = new Map<string, [number, number]>();
// arrow keys
MOVE_KEYS.set("ArrowUp", [0, -1])
MOVE_KEYS.set("ArrowDown", [0, 1])
MOVE_KEYS.set("ArrowLeft", [-1, 0])
MOVE_KEYS.set("ArrowRight", [1, 0])
MOVE_KEYS.set("Home", [-1, -1])
MOVE_KEYS.set("End", [-1, 1])
MOVE_KEYS.set("PageUp", [1, -1])
MOVE_KEYS.set("PageDown", [1, 1])

// numpad keys
MOVE_KEYS.set("Numpad1", [-1, 1])
MOVE_KEYS.set("Numpad2", [0, 1])
MOVE_KEYS.set("Numpad3", [1, 1])
MOVE_KEYS.set("Numpad4", [-1, 0])
MOVE_KEYS.set("Numpad6", [1, 0])
MOVE_KEYS.set("Numpad7", [-1, -1])
MOVE_KEYS.set("Numpad8", [0, -1])
MOVE_KEYS.set("Numpad9", [1, -1])

// vi keys
MOVE_KEYS.set("KeyH", [-1, 0])
MOVE_KEYS.set("KeyJ", [0, 1])
MOVE_KEYS.set("KeyK", [0, -1])
MOVE_KEYS.set("KeyL", [1, 0])
MOVE_KEYS.set("KeyY", [-1, -1])
MOVE_KEYS.set("KeyU", [1, -1])
MOVE_KEYS.set("KeyB", [-1, 1])
MOVE_KEYS.set("KeyN", [1, 1])


enum WAIT_KEYS {
	"Period",
	"Numpad5",
	"Delete",
}

enum CONFIRM_KEYS {
	"Enter",
	"NumpadEnter",
}
