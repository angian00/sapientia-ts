
import { BumpAction, WaitAction, PickupAction, DropAction, 
	UseAction, EquipAction, CombineAction } from "../game/actions"
import { Engine } from "../game/engine"
import { Item } from "../game/entities"
import { gameView, inventoryView, savedGamesView } from "../ui/views"
import { Dictionary } from "../util"
import { SavedGamesManager } from "../loaders/game_persistence"


let savedGames = new SavedGamesManager()


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
				gameView.renderMap(this.engine.currMap, this.tileSelection)

			} else if (keyCode in CONFIRM_KEYS) {
				if (this.engine.currMap.visible[this.tileSelection[0]][this.tileSelection[1]])
					gameView.renderMapInfo(
						this.engine.currMap.getEntitiesAt(this.tileSelection[0], this.tileSelection[1]))

				this.compositeCommand = null
				this.tileSelection = null
				gameView.renderMap(this.engine.currMap)
			}

		} else {
			if (MOVE_KEYS.has(keyCode)) {
				let move = MOVE_KEYS.get(keyCode)

				newAction = new BumpAction(engine, engine.player, move[0], move[1])

			} else if (keyCode in WAIT_KEYS) {
				newAction = new WaitAction(engine, engine.player)
			
			} else if (keyCode == "KeyG") {
				newAction = new PickupAction(engine, engine.player)

			} else if (keyCode == "KeyV") {
				this.compositeCommand = keyCode
				this.tileSelection = [this.engine.player.x, this.engine.player.y] 
				gameView.renderMap(this.engine.currMap, this.tileSelection)

			} else if (keyCode == "KeyI") {
				let itemMapping = inventoryView.render(engine.player.inventory, engine.player.equipment)
				let inventoryInputHandler = new InventoryInputHandler(engine, itemMapping)
				engine.setInputHandler(inventoryInputHandler)

				document.getElementById("dialogContainer").style.display = "block";
				document.getElementById("inventoryDialog").style.display = "block";

			/*		} elseif (keyCode == "KeyD") {
						return InventoryDropHandler(self.engine)
					}
			*/

			} else if (keyCode == "KeyS") {
				savedGames.getGameList(gameList => {
					let savedGamesMapping = savedGamesView.render(gameList, true)
					let saveGameInputHandler = new SavedGamesInputHandler(engine, savedGamesMapping, true)
					engine.setInputHandler(saveGameInputHandler)

					document.getElementById("dialogContainer").style.display = "block";
					document.getElementById("savedGamesDialog").style.display = "block";
				})

			} else if (keyCode == "KeyL") {
				//this.savedGames.saveGame("prova", engine, 
				//	() => { alert(`Game saved`) })
				savedGames.getGameList(gameList => {
					let savedGamesMapping = savedGamesView.render(gameList)
					let loadGameInputHandler = new SavedGamesInputHandler(engine, savedGamesMapping)
					engine.setInputHandler(loadGameInputHandler)

					document.getElementById("dialogContainer").style.display = "block";
					document.getElementById("savedGamesDialog").style.display = "block";
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

	constructor(engine: Engine, itemMap: Dictionary<Item>) {
		super(engine)

		this.itemMap = itemMap
	}
	
	get selectedItem(): Item {
		if (this.selectedItemKey)
			return this.itemMap[this.selectedItemKey]
		else
			return null
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
		let rows = document.querySelectorAll("#inventoryDialog .dialog-row")
		for (let row of rows) {
			if (this.selectedItem && 
				row.querySelector(".dialog-item-letter").textContent == "(" + key + ")") {
				row.classList.add("selected")

			} else {
				row.classList.remove("selected")
				row.querySelector(".dialog-item-command").textContent = ""
			}
		}
	}

	backToGame(): void {
		let engine = this.engine
		
		engine.setInputHandler(new GameInputHandler(engine))

		gameView.renderMap(engine.currMap)
		gameView.renderStats(engine.player.stats)
		gameView.renderMessages(engine.messageLog)
		document.getElementById("dialogContainer").style.display = "none";
		document.getElementById("inventoryDialog").style.display = "none";
	}
}

export class SavedGamesInputHandler extends InputHandler {
	savedGamesMapping: Dictionary<{ gameName: string, ts: number }>
	selectedItemKey?: string
	forSaving: boolean

	constructor(engine: Engine, savedGamesMapping: Dictionary<{ gameName: string, ts: number }>, forSaving=false) {
		super(engine)

		this.savedGamesMapping = savedGamesMapping
		this.forSaving = forSaving
	}

	get selectedItem(): { gameName: string, ts: number } {
		if (this.selectedItemKey)
			return this.savedGamesMapping[this.selectedItemKey]
		else
			return null
	}

	handleEvent(e: KeyboardEvent): void {
		let engine = this.engine

		let actionOk = false
		let keyCode = e.code

		if (keyCode == "Escape") {
			this.selectedItemKey = null
			this.backToGame()

		} else if (!this.selectedItemKey) {
			if (e.key in this.savedGamesMapping) {
				this.selectedItemKey = e.key
				this.setSelectedRow()
			}

		} else {
			if (this.selectedItem && (!this.selectedItem.ts) && keyCode == "KeyC") {
				let newSaveName
				while (!actionOk) {
					newSaveName = prompt("Enter a name for the new save", "New Save")
					if (!newSaveName) {
						//Cancel pressed in prompt dialog: cancel new save
						break
					}

					//check that the new name is not already in use
					actionOk = true
					for (let k in this.savedGamesMapping) {
						let savedGameName = this.savedGamesMapping[k].gameName
						if (newSaveName == savedGameName) {
							actionOk = false
							alert("A save with this name already exists")
							break
						}
					}
				}

				if (newSaveName)
					savedGames.saveGame(newSaveName, engine, () => { alert(`Game saved`) })

			} else if (this.selectedItem && this.selectedItem.ts) {
				if (this.forSaving && keyCode == "KeyO") {
					savedGames.saveGame(this.selectedItem.gameName, engine, () => { alert(`Game saved`) })
					actionOk = true

				} else if ((!this.forSaving) && keyCode == "KeyL") {
					savedGames.loadGame(this.selectedItem.gameName, engine, () => { gameView.renderAll(engine) })
					actionOk = true

				} else if (keyCode == "KeyD") {
					savedGames.deleteGame(this.selectedItem.gameName, () => { alert(`Game deleted`) })
					actionOk = true
				}
			}
		}

		if (actionOk) {
			//reset status
			this.selectedItemKey = null
			this.setSelectedRow()
			this.backToGame()
		}
	}

	setSelectedRow(key = this.selectedItemKey): void {
		let rows = document.querySelectorAll("#savedGamesDialog .dialog-row")
		for (let row of rows) {
			if (this.selectedItem &&
				row.querySelector(".dialog-item-letter").textContent == "(" + key + ")") {
				row.classList.add("selected")

			} else {
				row.classList.remove("selected")
				//row.querySelector(".dialog-item-command").textContent = "&nbsp;"
			}
		}
	}

	backToGame(): void {
		let engine = this.engine

		engine.setInputHandler(new GameInputHandler(engine))

		gameView.renderMap(engine.currMap)
		gameView.renderStats(engine.player.stats)
		gameView.renderMessages(engine.messageLog)
		document.getElementById("dialogContainer").style.display = "none";
		document.getElementById("savedGamesDialog").style.display = "none";
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
