export class BlockingQueue<T> {
	private _promises: Promise<T>[];
	private _resolvers: ((t: T) => void)[];

	constructor() {
		this._resolvers = [];
		this._promises = [];
	}

	private _add() {
		this._promises.push(new Promise(resolve => {
			this._resolvers.push(resolve);
		}));
	}

	enqueue(t: T) {
		if (!this._resolvers.length)
			this._add();

		const resolve = this._resolvers.shift()!;
		resolve(t);
	}

	dequeue() {
		if (!this._promises.length)
			this._add();

		const promise = this._promises.shift()!;
		return promise;
	}

	isEmpty() {
		return !this._promises.length;
	}

	isBlocked() {
		return !!this._resolvers.length;
	}

	get length() {
		return this._promises.length - this._resolvers.length;
	}
}


export function removeFromList<T>(items: T[], toRemove: T) {
	return items.filter(x => (x !== toRemove))
}



export class Dictionary<T> {
	[key: string]: T;
}

export class TypedDictionary<TK, TV> {
	private values = new Dictionary<TV>()

	getValue(k: TK): TV {
		return <TV>this.values[k.toString()]
	}

	setValue(k: TK, v: TV): void {
		this.values[k.toString()] = v
	}

	deleteValue(k: TK): void {
		delete this.values[k.toString()]
	}
}



export function getRandomInt(min: number=0, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}