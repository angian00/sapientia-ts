import * as ROT from "rot-js"

import { mapWidth, mapHeight } from "../layout"
import { UnexploredTile } from "../game/tiles"
import * as colors from "./colors"
import { Entity } from "../game/entities"
import { GameMap } from "../game/map"
import { MessageLog } from "../game/messageLog"
import { Inventory } from "../components/inventory"
import { Stats } from "../components/stats"
import { Dictionary } from "../util"
import { Item } from "../game/entities"

let display: ROT.Display;


export class GameView {

	constructor() {
		if (!display)
			display = initDisplay()
	}

	renderMap(map: GameMap): void {
		//console.log("rendering map")

		let entityTiles = entities2tiles(map.entities)

		for (let x = 0; x < mapWidth; x++) {
			for (let y = 0; y < mapHeight; y++) {
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

				let e = entityTiles[x][y]
				if (map.visible[x][y] && e) {
					char = e.char
					fgColor = e.color
				}

				display.draw(x, y, char, fgColor, bgColor);
			}
		}
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
		width: mapWidth,
		height: mapHeight,
		fontFamily: "menlo",
		fontSize: 20,
		forceSquareRatio: true,
		fg: colors.defaultLight,
		bg: "black",
	})

	document.getElementById("gameMap").appendChild(display.getContainer())

	return display
}


function entities2tiles(entities: Set<Entity>): Entity[][] {
	let res: Entity[][] = []

	for (let x = 0; x < mapWidth; x++) {
		res[x] = []
		for (let y = 0; y < mapHeight; y++) {
			res.push(null)
		}
	}

	entities.forEach((e, i) => {
		if ((!res[e.x][e.y]) || res[e.x][e.y].renderOrder < e.renderOrder)
			res[e.x][e.y] = e
	})

	return res
}


export class InventoryView {
	render(inventory: Inventory): Dictionary<Item> {
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

				let newDiv = document.createElement("div")
				newDiv.innerHTML = `<div class="inventory-row">` +
						`<div class="inventory-item-letter">(${currLetter})</div>` +
						`<div class="inventory-item-name">${item.name}</div>` +
						`<div class="inventory-item-command">(d)rop / (u)se</div>` +
					`</div>`
				container.appendChild(newDiv)
					
				currLetter = String.fromCharCode(currAscii + 1);
				currAscii = currLetter.charCodeAt(0)
			}
		}

		return itemMap
	}
}
