import { Game } from "./game"
import { Actor } from "./entities"
import { Stats } from "./stats"
import { EnemyAI } from "./ai"

export enum MonsterTypes {
	Orc
}

export function makeMonster(type: MonsterTypes, game: Game): Actor {
	let char: string
	let color: string
	let name: string

	let hp
	let baseDef
	let baseAtt

	switch (type) {
		case MonsterTypes.Orc:
			char = "o"
			color = "#408040"
			name = "orc"

			hp = 10
			baseDef = 0
			baseAtt = 3
	}

	let monster = new Actor(game, name, char, color)

	monster.stats = new Stats(hp, baseDef, baseAtt)
	monster.stats.parent = monster
	monster.stats.game = game

	monster.ai = new EnemyAI()
	monster.ai.parent = monster
	monster.ai.game = game

	return monster
}
