const keyInactive = 0
const keyPreviewPrimed = 1
const keyPreviewNotPrimed = 2
const keySourcePreview = 3
const keySourceLive = 4
const keyLiveOutputPrimed = 5
const keyLiveOutputNotPrimed = 6

let lower_bar = ""
let main_box = ""
class Button {
	constructor(type, data) {
		this.context = data.context
		this.type = type
		this.processStreamDeckData(data)
	}

	processStreamDeckData(data) {
		if (this.type == 'scene') {
			console.log("Processing Streamdeck Payload ......", data.payload.state, data, OBS)
			if (data.payload.settings.scene) this.scene = data.payload.settings.scene
			if (data.payload.settings.source) this.source = data.payload.settings.source
			if (data.payload.settings.preset) this.preset = data.payload.settings.preset
			if (data.payload.settings.ipaddress) this.ipaddress = data.payload.settings.ipaddress
			if (data.payload.settings.lastpreset) this.lastpreset = data.payload.settings.lastpreset
			// if (data.payload.state) this.state = data.payload.state
			this.state = keyInactive
			console.log ("Payload Processing ........:", this.scene, "source", this.source, "state", this.state)
			this._updateTitle()
		}
	}

	keyDown() {
		switch (this.type) {
			case 'scene':
				console.log("Key down here Scene:", this.scene, "source", this.source, "state", this.state, this)
				switch (this.state) {
					case keyInactive:
						this._PreviewPrimed()
						break
					case keyPreviewPrimed:
						this._LiveOutput()
						break
					case keyPreviewNotPrimed:
						this._PreviewPrimed()
						break
					case keySourcePreview: 
						this._PreviewPrimed()
						break
					case keySourceLive:
						StreamDeck.sendAlert(this.context)
						break
					case keyLiveOutputPrimed:
						StreamDeck.sendAlert(this.context)
						break
					case keyLiveOutputNotPrimed:
						StreamDeck.sendAlert(this.context)
						break
				}
		}
	}

	_PreviewPrimed() {
		if (OBS.scenes.includes(this.scene)) {
			obs.send(OBS.studioMode ? 'SetPreviewScene' : 'SetCurrentScene', {
				'scene-name': this.scene
			})
		} else {
			StreamDeck.sendAlert(this.context)
		}
	}

	_LiveOutput() {
		console.log("Starting Scene transition to program")
		obs.send('TransitionToProgram')
		_setState(keySourceLive)
	}

	_setScene() {
	}

	_updateTitle() {
		StreamDeck.setTitle(this.context, this[this.type], StreamDeck.BOTH)
	}

	setPreview() {
		// Add detection here for primed/no primed
		if (this.type == 'scene' ) {
			console.log("setPreview", this)
			this._setState(keyPreviewPrimed)
			this.setOnline()
		}
	}

	setProgram() {
		if (this.type == 'scene' ) {
			console.log("setProgram", this)
			this._setState(keyLiveOutputPrimed)
			this.setOnline()
		}
	}

	setSourcePreview() {
		if (this.type == 'scene') {
			console.log("setSourcePreview", this)
			this._setState(keySourcePreview)
			this.state = keySourcePreview
			this.setOnline()
		}
	}

	setSourceProgram() {
		if (this.type == 'scene') {
			console.log("setSourceProgram", this)
			this._setState(keySourceLive)
			this.setOnline()
		}
	}

	setOffAir() {
		if (this.type == 'scene') {
			console.log("Setting OFF AIR", this)
			this._setState(keyInactive)
			this.setOffline()
		}
	}

	_setState(newstate) {
		StreamDeck.setState(this.context, newstate)
		this.state = newstate
	}

	setOnline() {
		console.log("setOnline Scene:", this.scene, "source", this.source, "state", this.state, this)

		switch (this.type) {
			case 'scene':
				main_box = ""
				lower_bar = ""
				switch (this.state) {
					case keyInactive:
						main_box = grey
						lower_bar = grey
						break
					case keyPreviewPrimed:
						main_box = green
						break
					case keyPreviewNotPrimed:
						main_box = green
						break
					case keySourcePreview:
						lower_bar = green
						break
					case keySourceLive:
						lower_bar = red
						break
					case keyLiveOutputPrimed:
						main_box = red
						break
					case keyLiveOutputNotPrimed:
						main_box = red
						break
				}
				console.log("***** SetOnline Scene:", this.scene, "source", this.source, "state", this.state, "main:", main_box, "lower", lower_bar)

				ctx.clearRect(0, 0, rectangle_width, rectangle_height);
				if (main_box != "") {
					console.log("FILLING MAIN BOX")
					ctx.strokeStyle = main_box
					ctx.lineWidth = rectangle_line_width;
					ctx.rect(rectangle_x, rectangle_y, rectangle_width, rectangle_height)
					ctx.stroke()
				}
				if (lower_bar != "") {
					console.log("FILLING LOWER BAR")
					ctx.fillStyle = lower_bar
					ctx.lineWidth = rectangle_line_width;
					ctx.fillRect(rectangle_x, src_rectangle_y, rectangle_width, rectangle_line_width / 2)
				}
				StreamDeck.setImage(this.context, canvas.toDataURL(), StreamDeck.BOTH)
				break
			default:
				console.log("Setting blackimage for main", this)
				this.setOffline()
				break
		}
	}

	setOffline() {
		console.log("Setting Off Line Scene:", this.scene, "source", this.source, "state", this.state, this)
		// ctx.clearRect(0, 0, max_rect_width, max_rect_width);
		ctx.strokeStyle = black
		ctx.lineWidth = rectangle_line_width
		ctx.rect(rectangle_x, rectangle_y, rectangle_width, rectangle_height)
		ctx.stroke()
		ctx.fillStyle = black
		ctx.fillRect(rectangle_x, src_rectangle_y, rectangle_width, rectangle_line_width / 2)
		StreamDeck.setImage(this.context, canvas.toDataURL(), StreamDeck.BOTH)
	}

	_setCameraPreset() {
		// Camera Preset actions here.
		console.log('Setting Camera Preset:', 'hhh', 'hhhh')

		// http://[Camera IP]/cgi-bin/ptzctrl.cgi?ptzcmd&poscall&[Position Number]

	}

}
