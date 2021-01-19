import * as ROT from "rot-js"


const map_width = 60
const map_height = 36


let fgColor: string = "rgb(240, 214, 195)"
let bgColor: string = "rgb(35, 20, 10)"


let display: ROT.Display;


function init() {
	display = new ROT.Display({
		width: map_width,
		height: map_height,
		fontFamily: "menlo",
		fontSize: 20,
		forceSquareRatio: true,
		fg: fgColor,
		bg: bgColor,
	});


	let map = new ROT.Map.Cellular(map_width, map_height);
	map.randomize(0.5);

	const n_gens = 5;
	for (let i=0; i < n_gens-1; i++) {
		map.create();
	}
	map.create(display.DEBUG);

	document.getElementById("gameMap").appendChild(display.getContainer());
}


setTimeout(init, 1000);
