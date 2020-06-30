// Button types:
// scene
// transition

class Button {
	constructor(type, data) {
		this.context = data.context
		this.type = type
		this.processStreamDeckData(data)
	}

	processStreamDeckData(data) {
		if (this.type == 'scene' && data.payload.settings.scene) {
			this.scene = data.payload.settings.scene
			this.program = false
			this.preview = false
			this._updateTitle()
		}
		if (this.type == 'transition') {
			this.transition = data.payload.settings.transition
			this.duration = parseInt(data.payload.settings.duration) ? parseInt(data.payload.settings.duration) : 100
			this._updateTitle()
			StreamDeck.setImage(this.context, blackImg, StreamDeck.HARDWARE)
		}
	}

	keyDown() {
		switch (this.type) {
			case 'scene':
				this._setScene()
				break
			case 'transition':
				this._transition()
				break
		}
	}

	_setScene() {
		if (obsScenes.includes(this.scene)) {
			obs.send(studioMode ? 'SetPreviewScene' : 'SetCurrentScene', {
				'scene-name': this.scene
			})
		} else {
			StreamDeck.sendAlert(this.context)
		}
	}

	_transition() {
		if (!studioMode) {
			StreamDeck.sendAlert(this.context)
			return
		}

		if (obsTransitions.includes(this.transition)) {
			var msg = {
				'with-transition': {
					name: this.transition,
					duration: this.duration
				}
			}
			console.log(msg)
			obs.send('TransitionToProgram', msg)
		} else {
			StreamDeck.sendAlert(this.context)
		}
	}

	_updateTitle() {
		StreamDeck.setTitle(this.context, this[this.type], StreamDeck.BOTH)
	}

	setPreview() {
		if (this.type == 'scene' && !this.preview) {
			this.preview = true
			this.program = false
			StreamDeck.setImage(this.context, previewImg, StreamDeck.HARDWARE)
		}
	}

	setProgram() {
		if (this.type == 'scene' && !this.program) {
			this.program = true
			this.preview = false
			StreamDeck.setImage(this.context, programImg, StreamDeck.HARDWARE)
		}
	}

	setOffAir() {
		if (this.type == 'scene' && (this.program || this.preview)) {
			this.program = false
			this.preview = false
			StreamDeck.setImage(this.context, readyImg, StreamDeck.HARDWARE)
		}
	}
}
