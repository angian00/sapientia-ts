
import { Engine } from "./game/engine"
import { loadAllData } from "./loaders/map_loader"



async function gameLoop() {
	await loadAllData()
	let engine = new Engine()
	
	while (true) {
		await engine.processTurn();
	}
}


window.setTimeout(gameLoop, 500)
