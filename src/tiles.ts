import * as colors from "./colors"


class Tile {
	char: string
	fgColor: string
	bgColor: string

	constructor(char: string, fgColor: string, bgColor: string) {
		this.char = char
		this.fgColor = fgColor
		this.bgColor = bgColor
	}
}

export class Terrain {
	walkable: boolean
	transparent: boolean
	darkTile: Tile
	lightTile: Tile

	constructor(walkable: boolean, transparent: boolean, darkTile: Tile, lightTile: Tile) {
		this.walkable = walkable
		this.transparent = transparent
		this.darkTile = darkTile
		this.lightTile = lightTile
	}
}

export const UnexploredTile = new Tile("\u2591", "#909090", "black")

export const Floor = new Terrain(true, true, 
	new Tile(".", colors.black, colors.floorDark),
	new Tile(".", colors.black, colors.floorLight),
)

export const Wall = new Terrain(false, false, 
	new Tile(" ", colors.wallDark, colors.wallDark),
	new Tile(" ", colors.wallLight, colors.wallLight),
)
