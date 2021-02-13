import * as ROT from "rot-js"

import * as colors from "./colors"
import { Entity, Actor, Item, Site } from "../game/entities"
import { Engine } from "../game/engine"
import { GameMap } from "../game/map"
import { MessageLog } from "../game/messageLog"
import { UnexploredTile } from "../game/terrain"
import { Inventory } from "../components/inventory"
import { Equipment } from "../components/equipment"
import { Stats } from "../components/stats"
import { Dictionary } from "../util"
import { maxMapWidth, maxMapHeight } from "../layout"


let display: ROT.Display

class GameView {
	constructor() {
		if (!display)
			display = initDisplay()
	}

	renderAll(engine: Engine) {
		this.renderMap(engine.currMap)
		this.renderMapInfo()
		this.renderStats(engine.player.stats)
		this.renderMessages(engine.messageLog)
	}

	renderMap(map: GameMap, highlightedTile?: [number, number]): void {
		//console.log("rendering map")
		document.getElementById("mapLabel").textContent = map.label

		let entityTiles = entities2tiles(map.width, map.height, map.entities)
		display.clear()
		
		for (let x = 0; x < map.width; x++) {
			for (let y = 0; y < map.height; y++) {
				let currTile

				if (map.visible[x][y])
					currTile = map.tiles[x][y].lightTile
				else if (map.explored[x][y])
					currTile = map.tiles[x][y].darkTile
				else
					currTile = UnexploredTile

				let char = currTile.char
				let fgColor = currTile.fgColor
				let bgColor = currTile.bgColor
				if (highlightedTile && highlightedTile[0] == x && highlightedTile[1] == y)
					bgColor = colors.highlightTile

				let e = entityTiles[x][y]
				if (map.visible[x][y] && e) {
					char = e.char
					fgColor = e.color
				} else if (map.explored[x][y]) {
					let site = map.getSiteAt(x, y)
					if (site) {
						char = site.char
						fgColor = site.darkColor
					}
				}

				display.draw(x + map.xOffset, y + map.yOffset, char, fgColor, bgColor);
			}
		}
	}

	renderMapInfo(entities?: Entity[]): void {
		let actor: Actor
		let site: Site
		let items: Item[] = []
		let newDiv

		let container = document.getElementById("mapInfo")
		container.textContent = ""

		if (!entities)
			return

		for (let e of entities) {
			if (e instanceof Actor) {
				actor = e
			} else if (e instanceof Site) {
				site = e
			} else if (e instanceof Item) {
				items.push(e)
			}
		}

		if (site) {
			newDiv = document.createElement("div")
			newDiv.innerHTML = `[${site.name}]`
			container.appendChild(newDiv)
		}

		if (actor) {
			newDiv = document.createElement("div")
			newDiv.innerHTML = `${actor.name}`
			container.appendChild(newDiv)
		}

		let itemText = ""
		let firstItem = true
		for (let item of items) {
			if (!firstItem)
				itemText += `, `
			itemText += `${item.name}`
			firstItem = false
		}

		newDiv = document.createElement("div")
		newDiv.innerHTML = itemText
		container.appendChild(newDiv)
	}

	renderMessages(messageLog: MessageLog): void {
		//console.log("rendering messages")
		let container = document.getElementById("gameMessages")

		//FIXME: clears all old messages everytime
		container.textContent = ''

		for (let m of messageLog.messages.slice().reverse()) {
			let newDiv = document.createElement("div")
			if (m.cssClass)
				newDiv.classList.add(m.cssClass);
			newDiv.appendChild(document.createTextNode(m.fullText))
			container.appendChild(newDiv)
		}
	}

	renderStats(stats: Stats): void {
		//console.log("rendering stats")

		let elem = document.getElementById("statHp")
		elem.textContent = `hp: ${stats.hp} / ${stats.maxHp}`

		//TODO: other stats
	}

}


function initDisplay(): ROT.Display {
	display = new ROT.Display({
		width: maxMapWidth,
		height: maxMapHeight,
		fontFamily: "menlo",
		fontSize: 20,
		forceSquareRatio: true,
		fg: colors.defaultLight,
		bg: "black",
	})

	document.getElementById("gameMap").appendChild(display.getContainer())

	return display
}


function entities2tiles(w: number, h: number, entities: Set<Entity>): Entity[][] {
	let res: Entity[][] = []

	for (let x = 0; x < w; x++) {
		res[x] = []
		for (let y = 0; y < h; y++) {
			res.push(null)
		}
	}

	entities.forEach((e, i) => {
		if ((!res[e.x][e.y]) || res[e.x][e.y].renderOrder < e.renderOrder)
			res[e.x][e.y] = e
	})

	return res
}


class InventoryView {
	render(inventory: Inventory, equipment: Equipment): Dictionary<Item> {
		let itemMap: Dictionary<Item> = {}

		let container = document.getElementById("inventoryContent")

		if (inventory.items.size == 0) {
			container.innerHTML = "&lt; empty &gt;"
		
		} else {
			container.textContent = ""

			let currLetter = "a"
			let currAscii = currLetter.charCodeAt(0)
			for (let item of inventory.items) {
				itemMap[currLetter] = item
				let nameStr = item.name
				let commandStr

				if (item.equippable) {
					if (equipment && equipment.isEquipped(item)) {
						commandStr = "(d)rop / (t)akeoff"
						nameStr += " [equipped]"
					} else {
						commandStr = "(d)rop / (e)quip"
					}
				} else if (item.combinable) {
					commandStr = "(d)rop / (c)ombine with..."
				} else if (item.consumable) {
					commandStr = "(d)rop / (u)se"
				} else {
					commandStr = "(d)rop"
				}

				let newDiv = document.createElement("div")
				newDiv.innerHTML = `<div class="dialog-row">` +
						`<div class="dialog-item-letter">(${currLetter})</div>` +
						`<div class="dialog-item-name">${nameStr}</div>` +
						`<div class="dialog-item-command">${commandStr}</div>` +
					`</div>`
				container.appendChild(newDiv)
					
				currLetter = String.fromCharCode(currAscii + 1);
				currAscii = currLetter.charCodeAt(0)
			}
		}

		return itemMap
	}
}

const NEW_SLOT_NAME = "[New]"
class SavedGamesView {
	render(savedGames: { gameName: string, ts: number }[], forSaving=false): Dictionary<{ gameName: string, ts: number }> {
		let savedGameMapping: Dictionary<{ gameName: string, ts: number }> = {}

		let container = document.getElementById("savedGamesContent")
		container.textContent = ""

		savedGames.unshift({ gameName: NEW_SLOT_NAME, ts: null })

		let currLetter = "a"
		let currAscii = currLetter.charCodeAt(0)
		for (let savedGame of savedGames) {
			savedGameMapping[currLetter] = { gameName: savedGame.gameName, ts: savedGame.ts }

			let nameStr = savedGame.gameName
			let tsStr
			let commandStr
			if (savedGame.gameName == NEW_SLOT_NAME) {
				tsStr = "&nbsp;"
				if (forSaving)
					commandStr = "(c)reate"
				else
					commandStr = "(n)ew game"
					
			} else {
				tsStr = `[${new Date(savedGame.ts).toLocaleString()}]`
				if (forSaving)
					commandStr = "(o)verwrite"
				else
					commandStr = "(l)oad"

				commandStr += " / (d)elete"
			}

			let newDiv = document.createElement("div")
			newDiv.innerHTML = `<div class="dialog-row">` +
				`<div class="dialog-item-letter">(${currLetter})</div>` +
				`<div class="dialog-item-name">${nameStr}</div>` +
				`<div class="dialog-item-ts">${tsStr}</div>` +
				`<div class="dialog-item-command">${commandStr}</div>` +
				`</div>`
			container.appendChild(newDiv)

			currLetter = String.fromCharCode(currAscii + 1);
			currAscii = currLetter.charCodeAt(0)
		}

		return savedGameMapping
	}
}

export var gameView = new GameView()
export var inventoryView = new InventoryView()
export var savedGamesView = new SavedGamesView()

