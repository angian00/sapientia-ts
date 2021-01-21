import * as ROT from "rot-js"

import { mapWidth, mapHeight, lightColor, darkColor } from "./constants"
import { Game, Actor } from "./game"
import { Tile } from "./tile"


let display: ROT.Display;


export class DisplayView {
	game: Game

	constructor(game: Game) {
		this.game = game

		if (!display)
			display = initDisplay()
	}

	render(): void {
		console.log("rendering view")

		let tiles = this.game.map.tiles
		let actorTiles = actors2tiles(this.game.map.actors)

		for (let x = 0; x < mapWidth; x++) {
			for (let y = 0; y < mapHeight; y++) {
				let char
				let fgColor
				let bgColor
				
				switch (tiles[x][y]) {
					case Tile.Floor:
						char = "."
						fgColor = darkColor;
						bgColor = lightColor;
						break;

					case Tile.Wall:
						char = " "
						fgColor = darkColor;
						bgColor = darkColor;
						break;
				}

				let actor = actorTiles[x][y]
				if (actor) {
					char = actor.char
					fgColor = actor.color
				}

				display.draw(x, y, char, fgColor, bgColor);
			}
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
		fg: lightColor,
		bg: "black",
	})

	document.getElementById("gameMap").appendChild(display.getContainer())

	return display
}


function actors2tiles(actors: Set<Actor>): Actor[][] {
	let res: Actor[][] = []

	for (let x = 0; x < mapWidth; x++) {
		res[x] = []
		for (let y = 0; y < mapHeight; y++) {
			res.push(null)
		}
	}

	actors.forEach((a, i) => {
		res[a.x][a.y] = a
	})

	return res
}