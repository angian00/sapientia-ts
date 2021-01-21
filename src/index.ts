
import { Game } from "./game"


async function gameLoop() {
	let g = new Game()
	
	while (true) {
		await g.processTurn();
	}
}


window.setTimeout(gameLoop, 500)
