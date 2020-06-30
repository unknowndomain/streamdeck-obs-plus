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
			this.setOnline()
		}
		if (this.type == 'projector') {
			this.monitor = parseInt(data.payload.settings.monitor) ? parseInt(data.payload.settings.monitor) : 0
			StreamDeck.setTitle(this.context, 'Multiview', StreamDeck.BOTH)
			this.setOnline()
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
			case 'projector':
				this._projector()
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

	_transition() {
		if (!OBS.studioMode) {
			StreamDeck.sendAlert(this.context)
			return
		}

		if (OBS.transitions.includes(this.transition)) {
			const msg = {
				'with-transition': {
					name: this.transition,
					duration: this.duration
				}
			}
			obs.send('TransitionToProgram', msg)
		} else {
			StreamDeck.sendAlert(this.context)
		}
	}

	_projector() {
		obs.send('OpenProjector', {
			type: 'multiview',
			monitor: this.monitor
		})
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
			case 'transition':
			case 'projector':
				StreamDeck.setImage(this.context, blueImg, StreamDeck.BOTH)
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
