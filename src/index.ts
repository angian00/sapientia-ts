
import { Engine } from "./game/engine"
import { gameView, savedGamesView } from "./ui/views"
import { SavedGamesInputHandler } from "./ui/input_handlers"
import { SavedGamesManager } from "./loaders/game_persistence"


let engine: Engine

async function startGame() {
	engine = new Engine()
	let savedGames = new SavedGamesManager()
	let gameList = await savedGames.getGameList()

	if (gameList.length > 0) {
		let savedGamesMapping = savedGamesView.render(gameList)
		let loadGameInputHandler = new SavedGamesInputHandler(engine, savedGamesMapping)
		engine.setInputHandler(loadGameInputHandler)

		document.getElementById("dialogContainer").style.display = "block"
		document.getElementById("savedGamesDialog").style.display = "block"

	} else {
		engine.newGame()
		engine.startGameLoop()
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
	window.setTimeout(startGame, 500)
}
