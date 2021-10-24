let _currentPlugin
let obsScenes
let obsSources
let currentScene
let currentSource
let currentPreset
let currentIpAddress

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info, action) {
	data = JSON.parse(action)
	currentScene = data.payload.settings.scene
	currentSource = data.payload.settings.source
	currentPreset = data.payload.settings.preset
	currentIpAddress = data.payload.settings.ipaddress
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
				if (data.payload.settings) updateSettingsUI(data)
				if (data.payload.scenes) {
					obsScenes = data.payload.scenes
					updateSceneUI()
				}
				if (data.payload.sources) {
					obsSources = data.payload.sources
					updateSourceUI()
				}
				if(data.payload.preset) {
					updateCameraSettingsPreset()
				}
				if(data.payload.ipaddress) {
					updateCameraSettingsIpAddress()
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
	let settings = {
		host: document.getElementById('host').value,
		port: document.getElementById('port').value
	}
	if (document.getElementById('password').value != 'password') settings.password = document.getElementById('password').value
	StreamDeck.setGlobalSettings(_currentPlugin.context, settings)
	StreamDeck.sendToPlugin(_currentPlugin.context, _currentPlugin.action, {updateGlobalSettings: true})
}

function updateSceneUI() {
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

function updateSettings() {
	StreamDeck.setSettings(_currentPlugin.context, {
		scene: document.getElementById('scenes').value,
		source: document.getElementById('sources').value,
		ipaddress: document.getElementById('ipaddress').value,
		preset: document.getElementById('preset').value
	})
	currentScene = document.getElementById('scenes').value
	currentSource = document.getElementById('sources').value
	currentPreset = document.getElementById('preset').value
	currentIpAddress = document.getElementById('ipaddress').value
}

function updateCameraSettingsIpAddress() {
	document.getElementById('ipaddress').value = currentIpAddress
}

function updateCameraSettingsPreset() {
	document.getElementById('preset').value = currentPreset
}

document.getElementById('host').onchange = updateGlobalSettings
document.getElementById('port').onchange = updateGlobalSettings
document.getElementById('password').onchange = updateGlobalSettings
document.getElementById('scenes').onchange = updateSettings
document.getElementById('sources').onchange = updateSettings
document.getElementById('preset').onchange = updateSettings
document.getElementById('ipaddress').onchange = updateSettings

