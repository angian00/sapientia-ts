import { Engine } from "./engine"
import { GameMap } from "./map"


export class GameWorld {
	engine: Engine
	mapStack: { map: GameMap, pos?: [number, number]}[] =[]

	constructor(engine: Engine) {
		this.engine = engine
	}

	get currMap(): GameMap {
		if (!this.mapStack.length)
			return null

		return this.mapStack[this.mapStack.length-1].map
	}

	pushMap(newMap: GameMap): void {
		if (this.mapStack.length) {
			this.mapStack[this.mapStack.length-1]["pos"] = [this.engine.player.x, this.engine.player.y]
			this.engine.currMap.removePlayer()
		}

		this.mapStack.push({ "map": newMap, "pos": null })

		this.engine.deactivateActors()
		this.engine.currMap = newMap
		this.engine.exploredMaps.add(newMap.name)

		if (newMap.startingPos)
			newMap.place(this.engine.player, newMap.startingPos[0], newMap.startingPos[1])
		else
			newMap.placeRandom(this.engine.player)

		this.engine.activateActors()
	}

	popMap(): void {
		this.engine.currMap.removePlayer()
		this.engine.deactivateActors()

		this.mapStack.pop()
		if (!this.currMap)
			throw {
				message: "Inconsistency in GameWorld",
				expected: "this.currMap is valid",
				actual: "this.currMap is null",
			}

		let currPos = this.mapStack[this.mapStack.length-1]["pos"]
		this.currMap.place(this.engine.player, currPos[0], currPos[1])
		this.engine.currMap = this.currMap
		this.engine.activateActors()
	}
}
