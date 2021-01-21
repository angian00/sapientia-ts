import { Actor } from "./entities"
import { Stats } from "./stats"

export enum MonsterTypes {
	Orc
}

export function makeMonster(type: MonsterTypes): Actor {
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

	let monster = new Actor(name, char, color)
	monster.stats = new Stats(hp, baseDef, baseAtt)

	return monster
}
