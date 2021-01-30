import { Engine } from "../game/engine"
import { Item } from "../game/entities"
import { EquipmentType } from "./equipment"


export class Equippable {
	engine: Engine
	parent: Item
	equipmentType: EquipmentType
	bonusAtt: number
	bonusDef: number

	constructor(engine: Engine, parent: Item, equipmentType: EquipmentType, bonusAtt: number = 0, bonusDef: number = 0) {
		this.engine = engine
		this.parent = parent
		this.equipmentType = equipmentType
		this.bonusAtt = bonusAtt
		this.bonusDef = bonusDef
	}
}
