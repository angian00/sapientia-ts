import * as colors from "../ui/colors"

export class Message {
	plainText: string
	cssClass: string
	count: number

	constructor(text: string, cssClass: string) {
		this.plainText = text
		this.cssClass = cssClass
		this.count = 1
	}

	/** The full text of this message, including the count if necessary */
	get fullText(): string {
		if (this.count > 1)
			return `${this.plainText} (x${this.count})`

		return this.plainText
	}

	clone(): Message {
		let newInstance = new Message(this.plainText, this.cssClass) 
		newInstance.count = this.count

		return newInstance
	}

	static fromObject(obj: any): Message {
		let newInstance = new Message(obj["plainText"], obj["cssClass"])
		newInstance.count = +obj["count"]

		return newInstance
	}

}


export class MessageLog {
	messages: Message[] = []

	/** If `stack` is true then the message can stack with a previous message of the same text. */
	addMessage(text: string, cssClass?: string, stack=true): void {
		if (stack && this.messages.length && text == this.messages[this.messages.length-1].plainText)
			this.messages[this.messages.length-1].count += 1
		else
			this.messages.push(new Message(text, cssClass))
	}

	clone(): MessageLog {
		let newInstance = new MessageLog()
		for (let m of this.messages)
			newInstance.messages.push(m.clone())

		return newInstance
	}

	static fromObject(obj: any): MessageLog {
		let newInstance = new MessageLog()
		for (let mObj of obj.messages)
			newInstance.messages.push(Message.fromObject(mObj))

		return newInstance		
	}
}
