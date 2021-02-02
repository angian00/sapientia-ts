
import { Engine } from "./game/engine"
import { loadAllData } from "./loaders/map_loader"



async function gameLoop() {
	await loadAllData()
	let engine = new Engine()
	
	while (true) {
		await engine.processTurn();
	}
}


function isMobileBrowser(): boolean {
	return ('ontouchstart' in document.documentElement)
}

const minXRes = 1600
const minYRes = 800

function isResolutionKO(): boolean {
	let xRes = window.screen.width * window.devicePixelRatio
	let yRes = window.screen.height * window.devicePixelRatio

	return (xRes < minXRes || yRes < minYRes) 
}

if (isMobileBrowser()) {
	alert("This game can be played only on desktop computers")
} else if (isResolutionKO()) {
	alert(`This game can be played only on resolution ${minXRes}x${minYRes} or higher`)
} else {
	//ok, let's play
	window.setTimeout(gameLoop, 500)
}
