import { Engine } from "../game/engine"
import { Actor, RenderOrder } from "../game/entities"

export class Stats {
	engine: Engine
	parent: Actor

	maxHp: number
	private _hp: number
	baseDef: number
	baseAtt: number

	constructor(engine: Engine, parent: Actor, hp: number, baseDef: number, baseAtt: number) {
		this.engine = engine
		this.parent = parent

		this.maxHp = hp
		this._hp = hp
		this.baseDef = baseDef
		this.baseAtt = baseAtt
	}
	
	clone(newParent: Actor): Stats {
		let newStats = new Stats(this.engine, newParent, this.maxHp, this.baseDef, this.baseAtt)
		newStats.hp = this.hp

		return newStats
	}

	get hp(): number {
		return this._hp
	}

	set hp(newVal: number) {
		this._hp = Math.max(0, Math.min(newVal, this.maxHp))
		if (this._hp == 0 && this.parent.ai)
			this.parent.die()
	}

	get def(): number {
		return this.baseDef + this.bonusDef
	}

	get att(): number {
		return this.baseAtt + this.bonusAtt
	}

	get bonusAtt(): number {
		if (this.parent.equipment)
			return this.parent.equipment.bonusAtt

		return 0
	}

	get bonusDef(): number {
		if (this.parent.equipment)
			return this.parent.equipment.bonusDef

		return 0
	}

	heal(amount: number): number {
		if (this.hp == this.maxHp)
			return 0

		let newHpValue = this.hp + amount
		if (newHpValue > this.maxHp)
			newHpValue = this.maxHp

		let amountRecovered = newHpValue - this.hp

		this.hp = newHpValue

		return amountRecovered
	}

	takeDamage(amount: number): void {
		this.hp -= amount
	}

	toObject(): any {
		return {
			maxHp: this.maxHp,
			hp: this._hp,
			baseDef: this.baseDef,
			baseAtt: this.baseAtt,
		}
	}

	static fromObject(obj: any): Stats {
		let newStats = new Stats(null, null, +obj.maxHp, +obj.baseDef, +obj.baseAtt)
		newStats.hp = +obj.hp

		return newStats
	}

}
