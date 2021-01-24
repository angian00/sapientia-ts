
import { Action, BumpAction, WaitAction, PickupAction, DropAction, UseAction } from "../game/actions"
import { Engine } from "../game/engine"
import { Dictionary } from "../util"
import { Item } from "../game/entities"


export abstract class InputHandler {
	engine: Engine
	eventListener: { (e: KeyboardEvent): void }

	constructor(engine: Engine) {
		this.engine = engine
		this.eventListener = this.handleEvent.bind(this)
	}

	abstract handleEvent(e: KeyboardEvent): void 
}


export class GameInputHandler extends InputHandler {
	handleEvent(e: KeyboardEvent): void {
		let engine = this.engine

		let newAction = null
		let keyCode = e.code

		if (MOVE_KEYS.has(keyCode)) {
			let move = MOVE_KEYS.get(keyCode)

			newAction = new BumpAction(engine, engine.player, move[0], move[1])

		} else if (keyCode in WAIT_KEYS) {
			newAction = new WaitAction(engine, engine.player)
		
		} else if (keyCode == "KeyG") {
			newAction = new PickupAction(engine, engine.player)

		} else if (keyCode == "KeyI") {			
			let itemMap = engine.inventoryView.render(engine.player.inventory)
			let inventoryInputHandler = new InventoryInputHandler(engine, itemMap)
			engine.setInputHandler(inventoryInputHandler)

			document.getElementById("dialogContainer").style.display = "block";
			document.getElementById("inventoryDialog").style.display = "block";

/*		} elseif (keyCode == "KeyD") {
			return InventoryDropHandler(self.engine)
		}
*/
		}

		if (newAction)
			engine.playerActionQueue.enqueue(newAction)
	}
}

export class InventoryInputHandler extends InputHandler {
	itemMap: Dictionary<Item>
	selectedItemKey?: string

	get selectedItem(): Item {
		if (this.selectedItemKey)
			return this.itemMap[this.selectedItemKey]
		else
			return null
	}

	constructor(engine: Engine, itemMap: Dictionary<Item>) {
		super(engine)

		this.itemMap = itemMap
	}
	
	handleEvent(e: KeyboardEvent): void {
		let engine = this.engine

		let keyCode = e.code

		if (keyCode == "Escape") {
			this.backToGame()

		} else if (!this.selectedItemKey) {
			console.log("setting selected key:" + e.key)
			if (e.key in this.itemMap) {
				this.selectedItemKey = e.key
				this.setSelectedRow()
			}
		} else {
			let newAction;

			if (keyCode == "KeyD") {
				newAction = new DropAction(engine, engine.player, this.selectedItem)
			} else if(keyCode == "KeyU") {
				newAction = new UseAction(engine, engine.player, this.selectedItem)
			}

			if (newAction) {
				//reset status
				this.selectedItemKey = null
				this.setSelectedRow()

				engine.playerActionQueue.enqueue(newAction)
				this.backToGame()
			}
		}
	}

	setSelectedRow(): void {
		console.log("setSelectedRow")

		let rows = document.querySelectorAll(".inventory-row")
		for (let row of rows) {
			console.log(row.querySelector(".inventory-item-letter").textContent)
			console.log(this.selectedItemKey)

			if (this.selectedItem && 
				row.querySelector(".inventory-item-letter").textContent == "(" + this.selectedItemKey + ")") {
				row.classList.add("selected")

			} else {
				row.classList.remove("selected")
				row.querySelector(".inventory-item-command").textContent = ""
			}
		}
	}

	backToGame(): void {
		let engine = this.engine
		
		engine.setInputHandler(new GameInputHandler(engine))

		engine.gameView.renderMap(engine.map)
		engine.gameView.renderStats(engine.player.stats)
		engine.gameView.renderMessages(engine.messageLog)
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
