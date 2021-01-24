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
}
