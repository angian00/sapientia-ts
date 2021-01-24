
import { Engine } from "./game/engine"


async function gameLoop() {
	let g = new Engine()
	
	while (true) {
		await g.processTurn();
	}
}


window.setTimeout(gameLoop, 500)
