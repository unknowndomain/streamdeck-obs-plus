const keyInactive = 0
const keyPreviewPrimed = 1
const keyPreviewNotPrimed = 2
const keySourcePreview = 3
const keySourceLive = 4
const keyLiveOutput = 5

let lower_bar = ""
let main_box = ""
let circle_col = ""
class Button {
	constructor(type, data) {
		this.context = data.context
		this.type = type
		this.state = keyInactive
		this.primed = false
		this.primed_send = false
		this.processStreamDeckData(data)
	}

	processStreamDeckData(data) {
		if (this.type == 'scene') {
			console.log("Processing Streamdeck Payload ......", data.payload.state, data, OBS)
			if (data.payload.settings.scene) this.scene = data.payload.settings.scene
			if (data.payload.settings.source) this.source = data.payload.settings.source
			if (data.payload.settings.buttonimage) {
//				button_str = data.payload.settings.buttonimage
				this.buttonimage = decodeURIComponent(data.payload.settings.buttonimage.replace(/^C:\\fakepath\\/, ''))
				console.log("Picked up new button Image", this.buttonimage)
			}
			if (data.payload.settings.buttonimagecontents) {
				this.buttonimagecontents = data.payload.settings.buttonimagecontents
			}
			if (data.payload.settings.preset) this.preset = data.payload.settings.preset
			if (data.payload.settings.ipaddress) this.ipaddress = data.payload.settings.ipaddress
			if (data.payload.settings.lastpreset) this.lastpreset = data.payload.settings.lastpreset
			console.log ("Payload Processing ........:", this.scene, "source", this.source, "state", this.state)
			switch (this.state) {
				case keyInactive:
					this.setOffline()
					break;
				default:
					this.setOnline()
					break;
			}
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
					case keyLiveOutput:
						StreamDeck.sendAlert(this.context)
						break
				}
		}
	}

	_PreviewPrimed() {
		if (OBS.scenes.includes(this.scene)) {
			if (this.scene != OBS.preview) {
				console.log("Setting Scene to: ", this.scene)
				obs.send(OBS.studioMode ? 'SetPreviewScene' : 'SetCurrentScene', {
					'scene-name': this.scene
				})
			} else {
				console.log("Scene already set no changing")
			}
			clearPrimeButtons()
			this.primed = true
			this.primed_send = true
			this._setState(keyPreviewPrimed)
			this._setCameraPreset()
		} else {
			StreamDeck.sendAlert(this.context)
		}
	}

	_LiveOutput() {
		console.log("Starting Scene transition to program")
		obs.send('TransitionToProgram')
		this._setState(keySourceLive)
	}

	_updateTitle() {
		StreamDeck.setTitle(this.context, this[this.type], StreamDeck.BOTH)
	}

	setPreview() {
		// Add detection here for primed/no primed
		if (this.type == 'scene' ) {
			console.log("setPreview", this)
			if (this.primed) {
				this._setState(keyPreviewPrimed)
			} else {
				this._setState(keyPreviewNotPrimed)
			}
			
			this.setOnline()
		}
	}

	setProgram() {
		if (this.type == 'scene' ) {
			console.log("setProgram", this)
			this._setState(keyLiveOutput)
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
		console.log("setOnline Scene:", this.scene, "type", this.type, "source", this.source, "state", this.state, this)

		switch (this.type) {
			case 'scene':
				main_box = ""
				lower_bar = ""
				circle_col = ""
				switch (this.state) {
					case keyInactive:
						break
					case keyPreviewPrimed:
						main_box = green
						circle_col = green
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
					case keyLiveOutput:
						main_box = red
						if (this.primed) circle_col = red
						break
				}
				console.log("***** SetOnline Scene:", this.scene, 
							"source", this.source, 
							"state", this.state, 
							"image", this.buttonimage,
							"main:", main_box, 
							"lower", lower_bar, 
							"Circle:", circle_col)

				ctx.clearRect(0, 0, max_rect_width, max_rect_width);
				if (this.buttonimagecontents) {
					console.log("Loading Button image and drawing it.")
					var btnimg = new Image();
					btnimg.src = this.buttonimagecontents
					ctx.drawImage(btnimg,0,0)
				}
				ctx.beginPath()
				if (circle_col != "") {
					ctx.beginPath();
					ctx.fillStyle = circle_col;
					//ctx.strokeStyle = circle_col
					ctx.beginPath();
					ctx.arc(primed_x, primed_y, primed_radius, 0, 2 * Math.PI);
					ctx.fill();
				}
				if (main_box != "") {
					ctx.beginPath();
					ctx.strokeStyle = main_box
					ctx.lineWidth = rectangle_line_width;
					ctx.rect(rectangle_x, rectangle_y, rectangle_width, rectangle_height)
					ctx.stroke()
				}
				if (lower_bar != "") {
					ctx.beginPath();
					ctx.strokeStyle = lower_bar
					ctx.lineWidth = rectangle_line_width*2;
					ctx.moveTo(0, src_rectangle_y)
					ctx.lineTo(rectangle_width+rectangle_line_width, src_rectangle_y)
					ctx.stroke()
				}
				console.log("Sending image to streamdeck")
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
		ctx.clearRect(0, 0, max_rect_width, max_rect_width);
		if (this.buttonimagecontents) {
			console.log("Loading Button image and drawing it.")
			var btnimg = new Image();
			btnimg.src = this.buttonimagecontents
			ctx.drawImage(btnimg,0,0)
		}
		StreamDeck.setImage(this.context, canvas.toDataURL(), StreamDeck.BOTH)
	}

	_setCameraPreset() {
		// Camera Preset actions here.
		console.log('Setting Camera Preset:', this.ipaddress, this.preset)

		let camera_ptz_cmd = "http://" + this.ipaddress + "/cgi-bin/ptzctrl.cgi?ptzcmd&poscall&" + this.preset
		console.log("Camera PTZ Command:", camera_ptz_cmd)

		let Http = new XMLHttpRequest();
		Http.open("GET", camera_ptz_cmd);
		Http.send();
		
		// http://[Camera IP]/cgi-bin/ptzctrl.cgi?ptzcmd&poscall&[Position Number]
	}

}
