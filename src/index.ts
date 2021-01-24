
import { Engine } from "./game/engine"


async function gameLoop() {
	let engine = new Engine()
	
	while (true) {
		await engine.processTurn();
	}
}


window.setTimeout(gameLoop, 500)
