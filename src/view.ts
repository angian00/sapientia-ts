import * as ROT from "rot-js"

import { mapWidth, mapHeight } from "./layout"
import * as colors from "./colors"
import { Entity } from "./entities"
import { GameMap } from "./map"
import { MessageLog } from "./messageLog"


let display: ROT.Display;


export class DisplayView {

	constructor() {
		if (!display)
			display = initDisplay()
	}

	renderMap(map: GameMap): void {
		console.log("rendering map")

		let entityTiles = entities2tiles(map.entities)

		for (let x = 0; x < mapWidth; x++) {
			for (let y = 0; y < mapHeight; y++) {
				let currTile = map.tiles[x][y].lightTile
				let char = currTile.char
				let fgColor = currTile.fgColor
				let bgColor = currTile.bgColor

				let e = entityTiles[x][y]
				if (e) {
					char = e.char
					fgColor = e.color
				}

				display.draw(x, y, char, fgColor, bgColor);
			}
		}
	}

	renderMessages(messageLog: MessageLog): void {
		console.log("rendering messages")

		let container = document.getElementById("gameMessages")
		console.log(container)

		//FIXME: clears old message everytime
		container.textContent = ''

		for (let m of messageLog.messages.slice().reverse()) {
			console.log(m)

			let newDiv = document.createElement("div")
			if (m.cssClass)
				newDiv.classList.add(m.cssClass);
			newDiv.appendChild(document.createTextNode(m.fullText))
			container.appendChild(newDiv)
		}
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

	//TODO: use viewing order
	entities.forEach((a, i) => {
		res[a.x][a.y] = a
	})

	return res
}