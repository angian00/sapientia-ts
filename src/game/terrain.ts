import * as colors from "../ui/colors"


export class TerrainAspect {
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
	darkTile: TerrainAspect
	lightTile: TerrainAspect

	constructor(walkable: boolean, transparent: boolean, darkTile: TerrainAspect, lightTile: TerrainAspect) {
		this.walkable = walkable
		this.transparent = transparent
		this.darkTile = darkTile
		this.lightTile = lightTile
	}
}

export const UnexploredTile = new TerrainAspect("\u2591", "#909090", "black")

export const Floor = new Terrain(true, true, 
	new TerrainAspect(".", colors.black, colors.floorDark),
	new TerrainAspect(".", colors.black, colors.floorLight),
)

export const Wall = new Terrain(false, false, 
	new TerrainAspect(" ", colors.wallDark, colors.wallDark),
	new TerrainAspect(" ", colors.wallLight, colors.wallLight),
)
