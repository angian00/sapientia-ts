import { Dictionary } from "../util"
import { ItemType } from "../game/entity_factory"


let herbData = new Dictionary<Dictionary<any>>()
let herbNames: string[] = []

let combinations = new Dictionary<Dictionary<any>>()


function loadHerbs(): void {
	/*
	let herbFile = util.get_data_dir() + "/herbs.json"
	with open(herb_file) as f:
		json_data = json.load(f)

	for hd in json_data:
		herb_data[hd["englishName"]] = hd
		*/
}

function loadCombinations(): void {
	/*
	comb_file = util.get_data_dir() + "/ingredient_combinations.txt"
	with open(comb_file) as f:
		for line in f.readlines():
			if line[0] == "#" or line.strip() == "":
				#skip comments and empty lines
				continue

			tokens = line.strip().split("|")
			ingr1 = tokens[0]
			ingr2 = tokens[1]
			prod = tokens[2]

			if ingr1 not in combinations:
				combinations[ingr1] = {}
			combinations[ingr1][ingr2] = prod

			if ingr2 not in combinations:
				combinations[ingr2] = {}
			combinations[ingr2][ingr1] = prod
*/
}


function genHerb(): string {
/*
	herb_names = list(herb_data.keys())
	herb_freqs: List[float] = []

	for h_name in herb_names:
		herb_freqs.append(herb_data[h_name]["frequency"])

	return random.choices(herb_names, herb_freqs)[0]
*/
	return null
}

export function getCombination(ingr1: string, ingr2: string): ItemType {
/*
	if ingr1 not in combinations:
		return None
	
	if ingr2 not in combinations[ingr1]:
		return None
	
	return combinations[ingr1][ingr2]
*/
	if ((ingr1 == "henbane" && ingr2 == "nightshade") ||
		(ingr1 == "nightshade" && ingr2 == "henbane") )
		return ItemType.PotionPoison
	else	
		return null
}
	

loadHerbs()
loadCombinations()
