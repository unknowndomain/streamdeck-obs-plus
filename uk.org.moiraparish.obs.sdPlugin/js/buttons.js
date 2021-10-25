class Button {
	constructor(type, data) {
		this.context = data.context
		this.type = type
		this.processStreamDeckData(data)
	}

	processStreamDeckData(data) {
		if (this.type == 'scene' ) {
			if (data.payload.settings.scene) {
				this.scene = data.payload.settings.scene
				this.program = false
				this.preview = false
			}
			if (data.payload.settings.source) this.source = data.payload.settings.source
			if (data.payload.settings.preset) this.preset = data.payload.settings.preset
			if (data.payload.settings.ipaddress) this.ipaddress = data.payload.settings.ipaddress
			console.log('Processed this data:', data)
			this._updateTitle()
		}
	}

	keyDown() {
		switch (this.type) {
			case 'scene':
				// Test to see if in preview or if we are live.
				// Preview Actions
				this._setScene()
				this._setCameraPreset()
				// Live Actions

				// Already Live
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
	_setCameraPreset () {
		// Camera Preset actions here.
		console.log('Setting Camera Preset:','hhh','hhhh')
		
		// http://[Camera IP]/cgi-bin/ptzctrl.cgi?ptzcmd&poscall&[Position Number]
		
		}
		
}
