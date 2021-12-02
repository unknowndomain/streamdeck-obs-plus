let _currentPlugin
let obsScenes
let obsSources
let currentScene
let currentSource
let currentPreset
let currentIpAddress
let currentButtonImage

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info, action) {
	data = JSON.parse(action)
	console.log("Payload from streamdeck", data.payload)
	currentScene = data.payload.settings.scene
	currentSource = data.payload.settings.source
	_currentPlugin = {
		action: data.action,
		context: uuid
	}
	StreamDeck.debug = true
	StreamDeck._ws = new WebSocket("ws://localhost:" + port)
	StreamDeck._ws.onopen = () => {
		StreamDeck._openHandler(registerEvent, uuid)
		StreamDeck.getGlobalSettings(_currentPlugin.context)
	}
	StreamDeck._ws.onmessage = (e) => {
		const data = JSON.parse(e.data)
		switch(data.event) {
			case 'sendToPropertyInspector':
				console.log("And its the PROPERTY INSPECTOR", data)
				if (data.payload.settings) updateSettingsUI(data)
				if (data.payload.scenes) {
					obsScenes = data.payload.scenes
					updateSceneUI()
				}
				if (data.payload.sources) {
					obsSources = data.payload.sources
					updateSourceUI()
				}
				if (data.payload.preset) {
					currentPreset = data.payload.preset
					updateCameraSettingsPreset()
				}
				if (data.payload.ipaddress) {
					currentIpAddress = data.payload.ipaddress
					updateCameraSettingsIpAddress()
				}
				if (data.payload.buttonimage) {
					console.log("Got something on buttonimage", currentButtonImage)
					currentButtonImage = data.payload.buttonimage
					updateButtonImage()
				}
				
				break
			case 'didReceiveGlobalSettings':
				updateSettingsUI(data)
				break
			default:
				console.log(data)
				break
		}
	}
}

function updateSettingsUI(data) {
	if (data.payload.settings && Object.keys(data.payload.settings).length > 0) {
		document.getElementById('host').value = data.payload.settings.host
		document.getElementById('port').value = data.payload.settings.port
		document.getElementById('password').value = data.payload.settings.password ? 'password' : ''
	}
}

function updateGlobalSettings() {
	console.log("Doing updateGlobalSettings")
	let settings = {
		host: document.getElementById('host').value,
		port: document.getElementById('port').value
	}
	if (document.getElementById('password').value != 'password') settings.password = document.getElementById('password').value
	StreamDeck.setGlobalSettings(_currentPlugin.context, settings)
	StreamDeck.sendToPlugin(_currentPlugin.context, _currentPlugin.action, {updateGlobalSettings: true})
}

function updateSceneUI() {
	console.log("Doing updateSceneUI")
	document.getElementById('scenes').innerText = ''
	createScene('')
	obsScenes.forEach((scene) => {
		createScene(scene)
	})
	document.getElementById('scenes').value = currentScene
}

function createScene(scene) {
	const option = document.createElement('option')
	option.innerText = scene
	document.getElementById('scenes').appendChild(option)
}

function updateSourceUI() {
	console.log("Doing updateSourceUI")
	document.getElementById('sources').innerText = ''
	createSource('')
	obsSources.forEach((source) => {
		createSource(source)
	})
	document.getElementById('sources').value = currentSource
}

function createSource(source) {
	const option = document.createElement('option')
	option.innerText = source
	document.getElementById('sources').appendChild(option)
}

function updateScenes() {
	// Special handler here to pick up a new set of sources for this scene.
	updateSettings()
}

function updateSettings() {
	console.log("Starting updateSettings")
	currentScene = document.getElementById('scenes').value
	currentSource = document.getElementById('sources').value
	currentPreset = document.getElementById('preset').value
	currentIpAddress = document.getElementById('ipaddress').value
	currentButtonImage = decodeURIComponent(document.getElementById('buttonimage').value.replace(/^C:\\fakepath\\/, ''))
	StreamDeck.setSettings(_currentPlugin.context, {
		scene: currentScene,
		source: currentSource,
		buttonimage: currentButtonImage,
		ipaddress: currentIpAddress,
		preset: currentPreset
	})
	console.log("Finished updateSettings", currentButtonImage)
}

function updateCameraSettingsIpAddress() {
	console.log("Doing updateCameraSettingsIpAddress")
	document.getElementById('ipaddress').value = currentIpAddress
}

function updateButtonImage () {
	console.log("updateButtonImage", currentButtonImage)
	document.getElementById('buttonimage').value = currentButtonImage
	document.querySelector('.sdpi-file-info[for="buttonimage"]').textContent = currentButtonImage
}

function updateCameraSettingsPreset() {
	console.log("Doing updateCameraSettingsPreset")
	document.getElementById('preset').value = currentPreset
}

document.getElementById('host').onchange = updateGlobalSettings
document.getElementById('port').onchange = updateGlobalSettings
document.getElementById('password').onchange = updateGlobalSettings
document.getElementById('scenes').onchange = updateScenes
document.getElementById('sources').onchange = updateSettings
document.getElementById('preset').onchange = updateSettings
document.getElementById('ipaddress').onchange = updateSettings
document.getElementById('buttonimage').onchange = updateSettings

