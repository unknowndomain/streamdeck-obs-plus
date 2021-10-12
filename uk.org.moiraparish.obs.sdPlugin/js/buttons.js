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
	}

	keyDown() {
		switch (this.type) {
			case 'scene':
				this._setScene()
				break
		}
	}

	_setScene() {
		if (OBS.scenes.includes(this.scene)) {
			obs.send(OBS.studioMode ? 'SetPreviewScene' : 'SetCurrentScene', {
				'scene-name': this.scene
			})
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
			this.setOnline()
		}
	}

	setProgram() {
		if (this.type == 'scene' && !this.program) {
			this.program = true
			this.preview = false
			this.setOnline()
		}
	}

	setOffAir() {
		if (this.type == 'scene') {
			this.program = false
			this.preview = false
			this.setOnline()
		}
	}

	setOnline() {
		switch (this.type) {
			case 'scene':
				if (this.program) {
					StreamDeck.setImage(this.context, programImg, StreamDeck.BOTH)
				} else if (this.preview) {
					StreamDeck.setImage(this.context, previewImg, StreamDeck.BOTH)
				} else {
					StreamDeck.setImage(this.context, readyImg, StreamDeck.BOTH)
				}
				break
			default:
				StreamDeck.setImage(this.context, blackImg, StreamDeck.BOTH)
				break
		}
	}

	setOffline() {
		StreamDeck.setImage(this.context, blackImg, StreamDeck.BOTH)
	}
}
