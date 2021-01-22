import { Game } from "./game"
import { Actor } from "./entities"
import { Stats } from "./stats"
import { PlayerAI, EnemyAI } from "./ai"


export enum ActorTypes {
	Player,
	Orc
}

export function makeActor(game: Game, actorType: ActorTypes): Actor {
	let char: string
	let color: string
	let name: string

	let hp
	let baseDef
	let baseAtt

	switch (actorType) {
		case ActorTypes.Player:
			char = "@"
			color = "blue"
			name = "player"

			hp = 30
			baseDef = 2
			baseAtt = 5

			break

		case ActorTypes.Orc:
			char = "o"
			color = "#408040"
			name = "orc"

			hp = 10
			baseDef = 0
			baseAtt = 3

			break
	}

	let actor = new Actor(game, name, char, color)
	actor.stats = new Stats(game, actor, hp, baseDef, baseAtt)

	if (actorType === ActorTypes.Player)
		actor.ai = new PlayerAI(game, actor)
	else
		actor.ai = new EnemyAI(game, actor)

	return actor
}
