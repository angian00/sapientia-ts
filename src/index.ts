
import { Engine } from "./game/engine"
import { loadAllData } from "./loaders/map_loader"


async function gameLoop() {
	let engine = new Engine()
	
	while (true) {
		await engine.processTurn();
	}
}


//DEBUG
loadAllData()
//
window.setTimeout(gameLoop, 500)
