var _currentPlugin
var obsTransitions
var currentTransition
var currentDuration

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info, action) {
	data = JSON.parse(action)
	currentTransition = data.payload.settings.transition
	currentDuration = data.payload.settings.duration ? data.payload.settings.duration : 100
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
		var data = JSON.parse(e.data)
		switch(data.event) {
			case 'sendToPropertyInspector':
				if (data.payload.settings) updateSettingsUI(data)
				obsTransitions = data.payload.transitions
				if (obsTransitions) updateTransitionUI()
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
	var settings = {
		host: document.getElementById('host').value,
		port: document.getElementById('port').value
	}
	if (document.getElementById('password').value != 'password') settings.password = document.getElementById('password').value
	StreamDeck.setGlobalSettings(_currentPlugin.context, settings)
	StreamDeck.sendToPlugin(_currentPlugin.context, _currentPlugin.action, {updateGlobalSettings: true})
}

function updateTransitionUI() {
	document.getElementById('transitions').innerText = ''
	createTransition('')
	obsTransitions.forEach((transition) => {
		createTransition(transition)
	})
	document.getElementById('transitions').value = currentTransition
	document.getElementById('duration').value = currentDuration
}

function createTransition(transition) {
	var option = document.createElement('option')
	option.innerText = transition
	document.getElementById('transitions').appendChild(option)
}

function updateSettings() {
	StreamDeck.setSettings(_currentPlugin.context, {
		transition: document.getElementById('transitions').value,
		duration: document.getElementById('duration').value
	})
}

document.getElementById('host').onchange = updateGlobalSettings
document.getElementById('port').onchange = updateGlobalSettings
document.getElementById('password').onchange = updateGlobalSettings
document.getElementById('transitions').onchange = updateSettings
document.getElementById('duration').onchange = updateSettings
