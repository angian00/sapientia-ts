import { Terrain, TerrainAspect } from "../game/terrain"
import { GameMap } from "../game/map"
import { Dictionary } from "../util"

const dataDir = "./data"

export var terrainDefs: Dictionary<Terrain>
export var gameMaps = new Dictionary<GameMap>()


enum DataType {
	TerrainDef,
	Map,
}

export async function loadAllData(): Promise<any> {
	terrainDefs = await loadData("terrains.txt", DataType.TerrainDef)
	
	loadData("test_map.txt", DataType.Map).then(map => { gameMaps[map.name] = map })
}


export async function loadData(filename: string, dataType: DataType): Promise<any> {
	console.log(`loadData(${filename})`)

	let parseFunction: { (rawText: string): any }
	switch (dataType) {
		case DataType.TerrainDef:
			parseFunction = parseTerrainDef
			break
		case DataType.Map:
			parseFunction = parseMap
			break
		default:
			parseFunction = null
	}

	return await fetch(`${dataDir}/${filename}`).then(res => {
		return res.text().then(text => parseFunction(text))
	})
}



function parseTerrainDef(text: string): Dictionary<Terrain> {
	let terrains = new Dictionary<Terrain>()
	let lines: string[] = text.split("\n")

	for (let line of lines) {
		if ((line.startsWith("#")) || line.trim() == "") {
			//comment or blank line
			continue

		} else {
			let tokens = line.split("|")
			if (tokens.length != 9) {
				console.log("!! Malformed terrain definition line")
				console.log(`[${line}]`)
				continue
			}

			let name = tokens[0]
			let walkable = (tokens[1].toLowerCase() == "true")
			let transparent = (tokens[2].toLowerCase() == "true")
			let darkChar = tokens[3]
			let darkFgColor = tokens[4]
			let darkBgColor = tokens[5]
			let lightChar = tokens[6]
			let lightFgColor = tokens[7]
			let lightBgColor = tokens[8]

			//TODO: better validate fields

			let newTerrain = new Terrain(
				walkable,
				transparent,
				new TerrainAspect(darkChar, darkFgColor, darkBgColor),
				new TerrainAspect(lightChar, lightFgColor, lightBgColor),
			)

			terrains[name] = newTerrain
		}
	}

	return terrains
}


enum MapSection {
	Metadata,
	TerrainCodes,
	TileList,
	ItemList,
}

function parseMap(text: string): GameMap {
	let lines: string[] = text.split("\n")
	let currSection: MapSection
	let metadata = new Dictionary<string>()
	let terrainCodes = new Dictionary<Terrain>()
	let tiles: Terrain[][] = []


	for (let line of lines) {
		if ((line.startsWith("#")) || line.trim() == "") {
			//comment or blank line
			continue

		} else if (line.startsWith("%")) {
			let sectionName = line.substring(1).trim().toLowerCase()
			if (sectionName === "metadata")
				currSection = MapSection.Metadata
			else if (sectionName === "terrain_codes")
				currSection = MapSection.TerrainCodes
			else if (sectionName === "tile_list")
				currSection = MapSection.TileList
			else if (sectionName === "item_list")
				currSection = MapSection.ItemList
			else
				console.log(`!! Invalid section name: ${sectionName}`)
			
		} else {
			switch (currSection) {
				case null:
					console.log("!! Invalid data before section start:")
					console.log(line)
					break

				case MapSection.Metadata:
					if (!line.includes(":")) {
						console.log("!! Invalid metadata:")
						console.log(line)
					} else {
						let tokens = line.split(":")
						metadata[tokens[0]] = tokens[1]
					}
					break

				case MapSection.TerrainCodes:
					if (!line.includes(":")) {
						console.log("!! Invalid terrain code:")
						console.log(line)
					} else {
						let tokens = line.split(":")
						let tCode = tokens[0]
						let tName = tokens[1]
						if (!(tName in terrainDefs)) {
							console.log(`!! Unknown terrain: [${tName}]`)
							console.log(line)
						} else {
							terrainCodes[tCode] = terrainDefs[tName]
						}
					}
					break

				case MapSection.TileList:
					let tokens = line.split(",")
					let tileRow: Terrain[] = []
					let rowOk = true

					for (let t of tokens) {
						if (!(t in terrainCodes)) {
							console.log(`!! Unknown terrain code: [${t}]`)
							rowOk = false
							break
						} else {
							tileRow.push(terrainCodes[t])
						}
					}

					if (rowOk) {
						tiles.push(tileRow)
					}

					break

				case MapSection.ItemList:
					//TODO: MapSection.ItemList
					break

				default:
					//do nothing
			}
		}
	}
	
	let mandatoryMetadata: string[] = ["name", "width", "height"]
	for (let mm of mandatoryMetadata) {
		if (!(mm in metadata)) {
			console.log(`!! Missing mandatory metadata [${mm}]`)
			return null
		}
	}

	let mapName = metadata["name"]
	let w = +metadata["width"]
	let h = +metadata["height"]

	if (tiles.length != h) {
		console.log("!! Inconsistent map dimensions")
		return null
	}

	for (let tileRow of tiles) {
		if (tileRow.length != w) {
			console.log("!! Inconsistent map dimensions")
			return null
		}
	}

	let map = new GameMap(mapName, w, h, transpose<Terrain>(tiles))
	//let map = new GameMap(mapName, w, h, tiles)
	return map
}

function transpose<T>(orig: T[][]) {
	let res: T[][] = []

	for (let x = 0; x < orig[0].length; x++) {
		res.push([])
		for (let y = 0; y < orig.length; y++) {
			res[x].push(orig[y][x])
		}
	}

	return res
}