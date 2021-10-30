class Button {
	constructor(type, data) {
		this.context = data.context
		this.type = type
		this.processStreamDeckData(data)
	}

	processStreamDeckData(data) {
		if (this.type == 'scene') {
			console.log("Processing Streamdeck Payload", data)
			this.program = false
			this.preview = false
			this.source_program = false
			this.source_preview = false
			if (data.payload.settings.scene) this.scene = data.payload.settings.scene
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
			this.program = false
			this.preview = true
			console.log("setPreview", this)
			this.setOnline()
		}
	}

	setProgram() {
		if (this.type == 'scene' && !this.program) {
			this.program = true
			this.preview = false
			console.log("setProgram", this)
			this.setOnline()
		}
	}

	setSourcePreview() {
		if (this.type == 'scene' && !this.source_preview) {
			this.source_program = false
			this.source_preview = true
			console.log("setSourcePreview", this)
			this.setOnline()
		}
	}

	setSourceProgram() {
		if (this.type == 'scene' && !this.source_program) {
			this.source_program = true
			this.source_preview = false
			console.log("setSourceProgram", this)
			this.setOnline()
		}
	}

	setOffAir() {
		if (this.type == 'scene') {
			this.program = false
			this.preview = false
			this.source_program = false
			this.source_preview = false
			console.log("Setting OFF AIR", this)
			this.setOffline()
		}
	}

	setOnline() {
		console.log("setOnline", this)
		switch (this.type) {
			case 'scene':
				if (this.program) {
					ctx.fillStyle = red
				} else if (this.preview) {
					ctx.fillStyle = green
				} else {
					ctx.fillStyle = grey
				}
				ctx.fillRect(rectangle_x, rectangle_y, rectangle_width, rectangle_height)
				if (this.source_program) {
					ctx.fillStyle = red
				} else if (this.source_preview) {
					ctx.fillStyle = green
				} else {
					ctx.fillStyle = grey
				}
				ctx.fillRect(rectangle_x, src_rectangle_y, rectangle_width, rectangle_height)
				StreamDeck.setImage(this.context, canvas.toDataURL(), StreamDeck.BOTH)
				break
			default:
				console.log("Setting blackimage for main", this)
				this.setOffline()
				break
		}
	}

	setOffline() {
		console.log("Setting Off Line", this)
		ctx.fillStyle = black
		ctx.fillRect(rectangle_x, rectangle_y, rectangle_width, rectangle_height)
		ctx.fillRect(rectangle_x, src_rectangle_y, rectangle_width, rectangle_height)
		StreamDeck.setImage(this.context, canvas.toDataURL(), StreamDeck.BOTH)
	}

	_setCameraPreset() {
		// Camera Preset actions here.
		console.log('Setting Camera Preset:', 'hhh', 'hhhh')

		// http://[Camera IP]/cgi-bin/ptzctrl.cgi?ptzcmd&poscall&[Position Number]

	}

}
