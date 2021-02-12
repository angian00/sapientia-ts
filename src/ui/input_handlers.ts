
import { BumpAction, WaitAction, PickupAction, DropAction, 
	UseAction, EquipAction, CombineAction } from "../game/actions"
import { Engine } from "../game/engine"
import { Item } from "../game/entities"
import { Dictionary } from "../util"
import { SavedGamesManager } from "../loaders/game_persistence"

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
	compositeCommand?: string
	tileSelection?: [number, number]
	savedGames = new SavedGamesManager()


	handleEvent(e: KeyboardEvent): void {
		let engine = this.engine

		let newAction = null
		let keyCode = e.code

		if (this.compositeCommand) {
			if (MOVE_KEYS.has(keyCode)) {
				let moveMulti = 1

				if (e.getModifierState("Shift"))
					moveMulti *= 5
				if (e.getModifierState("Control"))
					moveMulti *= 10
				if (e.getModifierState("Alt"))
					moveMulti *= 20

				let move = MOVE_KEYS.get(keyCode)

				let [x, y] = this.tileSelection
				let [dx, dy] = move
				x += dx * moveMulti
				y += dy * moveMulti
				x = Math.max(0, Math.min(x, this.engine.currMap.width - 1))
				y = Math.max(0, Math.min(y, this.engine.currMap.height - 1))
				this.tileSelection = [x, y]
				this.engine.gameView.renderMap(this.engine.currMap, this.tileSelection)

			} else if (keyCode in CONFIRM_KEYS) {
				if (this.engine.currMap.visible[this.tileSelection[0]][this.tileSelection[1]])
					this.engine.gameView.renderMapInfo(
						this.engine.currMap.getEntitiesAt(this.tileSelection[0], this.tileSelection[1]))

				this.compositeCommand = null
				this.tileSelection = null
				this.engine.gameView.renderMap(this.engine.currMap)
			}

		} else {
			if (MOVE_KEYS.has(keyCode)) {
				let move = MOVE_KEYS.get(keyCode)

				newAction = new BumpAction(engine, engine.player, move[0], move[1])

			} else if (keyCode in WAIT_KEYS) {
				newAction = new WaitAction(engine, engine.player)
			
			} else if (keyCode == "KeyG") {
				newAction = new PickupAction(engine, engine.player)

			} else if (keyCode == "KeyL") {
				this.compositeCommand = keyCode
				this.tileSelection = [this.engine.player.x, this.engine.player.y] 
				this.engine.gameView.renderMap(this.engine.currMap, this.tileSelection)

			} else if (keyCode == "KeyI") {
				let itemMap = engine.inventoryView.render(engine.player.inventory, engine.player.equipment)
				let inventoryInputHandler = new InventoryInputHandler(engine, itemMap)
				engine.setInputHandler(inventoryInputHandler)

				document.getElementById("dialogContainer").style.display = "block";
				document.getElementById("inventoryDialog").style.display = "block";

			/*		} elseif (keyCode == "KeyD") {
						return InventoryDropHandler(self.engine)
					}
			*/

			} else if (keyCode == "KeyS") {
				//this.savedGames.saveGame("prova", engine, 
				//	() => { alert(`Game saved`) })
				this.savedGames.getGameList( gameList => {
					engine.saveGameView.render(gameList)
					let saveGameInputHandler = new SaveGameInputHandler(gameList)
					engine.setInputHandler(saveGameInputHandler)

					document.getElementById("dialogContainer").style.display = "block";
					document.getElementById("saveGameDialog").style.display = "block";
				})
			}
		}

		if (newAction)
			engine.playerActionQueue.enqueue(newAction)
	}
}

export class InventoryInputHandler extends InputHandler {
	itemMap: Dictionary<Item>
	selectedItemKey?: string
	compositeCommand?: string

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

		let newAction
		let keyCode = e.code

		if (keyCode == "Escape") {
			this.selectedItemKey = null
			this.compositeCommand = null
			this.backToGame()

		} else if (!this.selectedItemKey) {
			//console.log("setting selected key:" + e.key)
			if (e.key in this.itemMap) {
				this.selectedItemKey = e.key
				this.setSelectedRow()
			}
		} else if (this.compositeCommand) {
			if (e.key in this.itemMap) {
				let secondItem = this.itemMap[e.key]
				
				if (this.compositeCommand == "KeyC") {
					newAction = new CombineAction(engine, engine.player, 
						this.selectedItem, secondItem)
				}
			}

		} else {
			if (keyCode == "KeyD") {
				newAction = new DropAction(engine, engine.player, this.selectedItem)
			} else if (keyCode == "KeyU") {
				newAction = new UseAction(engine, engine.player, this.selectedItem)
			} else if (keyCode == "KeyE" || keyCode == "KeyT") {
				newAction = new EquipAction(engine, engine.player, this.selectedItem)
			} else if (keyCode == "KeyC") {
				this.compositeCommand = keyCode
				this.setSelectedRow(null)
			}
		}

		if (newAction) {
			//reset status
			this.selectedItemKey = null
			this.compositeCommand = null
			this.setSelectedRow()

			engine.playerActionQueue.enqueue(newAction)
			this.backToGame()
		}

	}

	setSelectedRow(key=this.selectedItemKey): void {
		console.log("setSelectedRow")

		let rows = document.querySelectorAll(".inventory-row")
		for (let row of rows) {
			console.log(row.querySelector(".inventory-item-letter").textContent)
			console.log(this.selectedItemKey)

			if (this.selectedItem && 
				row.querySelector(".inventory-item-letter").textContent == "(" + key + ")") {
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

		engine.gameView.renderMap(engine.currMap)
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
//MOVE_KEYS.set("KeyH", [-1, 0])
//MOVE_KEYS.set("KeyJ", [0, 1])
//MOVE_KEYS.set("KeyK", [0, -1])
//MOVE_KEYS.set("KeyL", [1, 0])
//MOVE_KEYS.set("KeyY", [-1, -1])
//MOVE_KEYS.set("KeyU", [1, -1])
//MOVE_KEYS.set("KeyB", [-1, 1])
//MOVE_KEYS.set("KeyN", [1, 1])


enum WAIT_KEYS {
	"Period",
	"Numpad5",
	"Delete",
}

enum CONFIRM_KEYS {
	"Enter",
	"NumpadEnter",
}
