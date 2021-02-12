
import { Engine } from "./game/engine"
import { loadAllData } from "./loaders/map_loader"
import { SavedGamesManager } from "./loaders/game_persistence"


let savedGames = new SavedGamesManager()
let engine: Engine

async function startGame() {
	await loadAllData()
	engine = new Engine()

	savedGames.getGameList( (gameList) => {
		let gameName
		if (gameList.length > 0) {
			//TODO: dialog to choose saved game
			console.log("games found")
			console.log(gameList)
			gameName = gameList[0]
		}
		
		if (gameName) {
			savedGames.loadGame(gameName, engine, gameLoop)
		} else {
			engine.newGame()
			gameLoop()
		}
	})
}

async function gameLoop() {
	engine.gameView.renderMap(engine.currMap)
	engine.gameView.renderMapInfo()
	engine.gameView.renderStats(engine.player.stats)
	engine.gameView.renderMessages(engine.messageLog)

	while (true) {
		await engine.processTurn()
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
