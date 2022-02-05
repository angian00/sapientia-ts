import { Terrain, TerrainAspect } from "../game/terrain"
import { Actor, Item, Site } from "../game/entities"
import { GameMap } from "../game/map"
import { Engine } from "../game/engine"
import { Dictionary } from "../util"
import { Stats } from "../components/stats"
import { Inventory } from "../components/inventory"
import { Equipment, EquipmentType } from "../components/equipment"
import { PlayerAI, EnemyAI } from "../components/ai"
import { Equippable } from "../components/equippable"
import { Combinable } from "../components/combinable"


const dataDir = "./data"

export var terrainDefs: Dictionary<Terrain>
export var mapDefs: Dictionary<GameMap>
export var actorDefs: Dictionary<Actor>
export var itemDefs: Dictionary<Item>

enum DataType {
	TerrainDef,
	Map,
	Actor,
	Item,
}

export async function loadAllData(): Promise<any> {
	terrainDefs = await loadData("terrains.txt", DataType.TerrainDef)
	mapDefs = new Dictionary<GameMap>()
	actorDefs = new Dictionary<Actor>()
	itemDefs = new Dictionary<Item>()

	const actorFiles = ["monsters.json"]
	const itemFiles = ["items.json"]
	let defPromises: Promise<void>[] = []

	for (let f of actorFiles)
		defPromises.push(loadData(f, DataType.Actor))
	for (let f of itemFiles)
		defPromises.push(loadData(f, DataType.Item))

	await Promise.all(defPromises)

	const mapFiles = [ "test_map_world.txt", "test_map_milano.txt" ]
	let mapPromises: Promise<void>[] = []

	for (let f of mapFiles)
		mapPromises.push(loadData(f, DataType.Map))
	
	return Promise.all(mapPromises)
}


export async function loadData(filename: string, dataType: DataType): Promise<any> {
	console.log(`loadData(${filename})`)

	let parseFunction: { (rawText: string): any }
	switch (dataType) {
		case DataType.TerrainDef:
			parseFunction = parseTerrainDef
			break
		case DataType.Map:
			parseFunction = parseMapDef
			break
		case DataType.Actor:
			parseFunction = parseActorDef
			break
		case DataType.Item:
			parseFunction = parseItemDef
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

			//TODO: validate fields better

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
	SiteList,
	ActorList,
	ItemList,
}

function parseMapDef(text: string): void {
	let lines: string[] = text.split("\n")
	let tokens: string[]
	let currSection: MapSection
	let terrainCodes = new Dictionary<Terrain>()
	let metadata: Dictionary<string>
	let tiles: Terrain[][]
	let sites: Site[]
	let actors: Actor[]


	for (let line of lines) {
		if ((line.startsWith("#")) || line.trim() == "") {
			//comment or blank line
			continue

		} else if (line.trim().toLowerCase() == "%%map") {
			//end old map, start new map
			if (metadata) {
				let map = makeMap(metadata, tiles, sites, actors)
				if (map)
					mapDefs[map.name] = map
			}

			metadata = new Dictionary<string>()
			tiles = []
			sites = []
			actors = []

		} else if (line.startsWith("%")) {
			let sectionName = line.substring(1).trim().toLowerCase()
			if (sectionName === "metadata")
				currSection = MapSection.Metadata
			else if (sectionName === "terrain_codes")
				currSection = MapSection.TerrainCodes
			else if (sectionName === "tile_list")
				currSection = MapSection.TileList
			else if (sectionName === "site_list")
				currSection = MapSection.SiteList
			else if (sectionName === "actor_list")
				currSection = MapSection.ActorList
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
					tokens = line.split("|")
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

				case MapSection.SiteList:
					//name | label | pos_x | pos_y | [char] | [map]
					tokens = line.split("|")
					if (tokens.length != 7) {
						console.log(`!! Malformed site record: [${line}]`)
					} else {
						let name  = tokens[0]
						let xPos  = +tokens[1]
						let yPos  = +tokens[2]
						let char  = tokens[3]
						let color = tokens[4]
						let darkColor = tokens[5]
						let mapName = tokens[6]

						if (char == "")
							char = null
						if (color == "")
							color = null
						if (darkColor == "")
							darkColor = null
						
						let site = new Site(name, char, color, darkColor, mapName)
						site.x = xPos
						site.y = yPos
						sites.push(site)
					}

					break

				case MapSection.ActorList:
					//name | pos_x | pos_y
					tokens = line.split("|")
					if (tokens.length != 3) {
						console.log(`!! Malformed actor record: [${line}]`)
					} else {
						let name = tokens[0]
						let xPos = +tokens[1]
						let yPos = +tokens[2]

						let newActor = actorDefs[name].clone()
						newActor.x = xPos
						newActor.y = yPos
						actors.push(newActor)
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

	let map = makeMap(metadata, tiles, sites, actors)
	if (map)
		mapDefs[map.name] = map
}


function parseActorDef(text: string): void {
	let engine: Engine = null
	var dataObj = JSON.parse(text)

	for (let dataItem of dataObj) {
		//TODO: add validation
		let actor = new Actor(engine, dataItem.name, dataItem.char, dataItem.color)
		actor.stats = new Stats(engine, actor, +dataItem.stats.hp, +dataItem.stats.baseDef, +dataItem.stats.baseAtt)

		if (dataItem.inventorySize) {
			actor.inventory = new Inventory(engine, actor, +dataItem.inventorySize)
			actor.equipment = new Equipment(engine, actor)
		}

		if (dataItem.ai == "PlayerAI")
			actor.ai = new PlayerAI(engine, actor)
		else if (dataItem.ai == "EnemyAI")
			actor.ai = new EnemyAI(engine, actor)

		actorDefs[actor.name] = actor
	}
}


function parseItemDef(text: string): void {
	let engine: Engine = null
	var dataObj = JSON.parse(text)

	for (let dataItem of dataObj) {
		//TODO: add validation
		let item = new Item(dataItem.name, dataItem.char, dataItem.color)

		//TODO: consumable

		if (dataItem.equippable) {
			item.equippable = new Equippable(engine, item, 
				dataItem.equippable.equipmentType, 
				+dataItem.equippable.bonusAtt, 
				+dataItem.equippable.bonusDef)
		}

		if (dataItem.combinable) {
			item.combinable = new Combinable(engine, item)
		}

		itemDefs[item.name] = item
	}
}


function makeMap(metadata: Dictionary<string>, tiles: Terrain[][], sites: Site[], actors: Actor[]): GameMap {

	let mandatoryMetadata: string[] = ["name", "width", "height"]
	for (let mm of mandatoryMetadata) {
		if (!(mm in metadata)) {
			console.log(`!! Missing mandatory metadata [${mm}]`)
			return null
		}
	}

	let mapName = metadata["name"]
	let mapLabel = metadata["label"]
	if (!mapLabel)
		mapLabel = mapName
	let w = +metadata["width"]
	let h = +metadata["height"]

	if (tiles.length != h) {
		console.log(`!! Inconsistent map dimensions; found h: ${tiles.length}, expected: ${h}`)
		return null
	}

	for (let tileRow of tiles) {
		if (tileRow.length != w) {
			console.log(`!! Inconsistent map dimensions; found w: ${tileRow.length}, expected: ${w}`)
			return null
		}
	}

	let map = new GameMap(mapName, mapLabel, w, h, transpose<Terrain>(tiles))

	for (let site of sites) {
		site.parent = map
		map.entities.add(site)
	}

	for (let actor of actors) {
		map.place(actor, actor.x, actor.y)
	}

	if ("startingX" in metadata && "startingY" in metadata)
		map.startingPos = [+metadata["startingX"], +metadata["startingY"]]

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



