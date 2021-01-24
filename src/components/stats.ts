import { Engine } from "../game/engine"
import { Actor, RenderOrder } from "../game/entities"
import * as colors from "../ui/colors"

export class Stats {
	game: Engine
	parent: Actor

	maxHp: number
	private _hp: number
	baseDef: number
	baseAtt: number

	constructor(game: Engine, parent: Actor, hp: number, baseDef: number, baseAtt: number) {
		this.game = game
		this.parent = parent

		this.maxHp = hp
		this._hp = hp
		this.baseDef = baseDef
		this.baseAtt = baseAtt
	}
	
	get hp(): number {
		return this._hp
	}

	set hp(newVal: number) {
		this._hp = Math.max(0, Math.min(newVal, this.maxHp))
		if (this._hp == 0 && this.parent.ai)
			this.die()
	}

	get def(): number {
		return this.baseDef + this.bonusDef
	}

	get att(): number {
		return this.baseAtt + this.bonusAtt
	}

	get bonusDef(): number {
		//if this.parent.equipment:
		//return this.parent.equipment.bonusDef

		return 0
	}

	get bonusAtt(): number {
		//if this.parent.equipment:
		//return this.parent.equipment.bonusAtt

		return 0
	}

	die(): void {
		let deathMessage: string
		let deathMessageClass: string

		if (this.game.player == this.parent) {
			deathMessage = "\u271F you died"
			deathMessageClass = "player-death"
		} else {
			deathMessage = `\u271F ${this.parent.name} is dead`
			deathMessageClass = "enemy-death"
		}

		this.parent.name = `remains of ${this.parent.name}`
		this.parent.char = "%"
		this.parent.color = colors.playerDeath
		this.parent.isBlocking = false
		this.parent.renderOrder = RenderOrder.Corpse
		this.parent.stats = null
		this.parent.ai = null

		this.game.messageLog.addMessage(deathMessage, deathMessageClass)

		//this.game.player.level.add_xp(this.parent.level.xp_given)
	}
}
