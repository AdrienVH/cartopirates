const isProd = window.location.hostname == 'cartopirates.fr' ? true : false

const API_BASE_URL = isProd ? 'https://cartopirates.fr/api' : 'http://localhost:9001'

if (isProd) {
	$('#ribbon').remove()
} else {
	$('#ribbon').show()
}

let focusBateau = false
let idBateau = null
const url = new URLSearchParams(window.location.search)
if (url.get('bateau') && !isNaN(parseInt(url.get('bateau')))) {
	focusBateau = true
	idBateau = parseInt(url.get('bateau'))
}

// MAP

const mapbox = new ol.layer.Tile({
	source: new ol.source.XYZ({
		tileSize: [256, 256],
		url: 'https://api.mapbox.com/styles/v1/adrienvh/cki3g3bme2w2w19qyrxm4wry5/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYWRyaWVudmgiLCJhIjoiU2lDV0N5cyJ9.2pFJAwvwZ9eBKKPiOrNWEw'
	}),
	name: "mapbox"
})

/***** PORTS */

function getPortsStyle(f){
	return new ol.style.Style({
		image: new ol.style.RegularShape({
			fill: new ol.style.Fill({color: "#405a82"}),
			points: 4,
			radius: 12
		}),
		text: new ol.style.Text({
			offsetY: 1,
			text: f.getId().toString(),
			font: 'bold 9px sans-serif',
			fill: new ol.style.Fill({color: 'white'})
		})
	})
}

const portsSource = new ol.source.Vector({projection : 'EPSG:3857'})
const ports = new ol.layer.Vector({
	source: portsSource,
	style: getPortsStyle,
	name: "ports"
})

/***** BATEAUX */

function getBateauxStyle(f){
	return new ol.style.Style({
		image: new ol.style.Icon({
			src: f.getId() == 0 ? 'bateau.png' : 'bateau.png',
			opacity: focusBateau && f.getId() != idBateau ? 0.5 : 1
		}),
		text: new ol.style.Text({
			textAlign: 'left',
			offsetX: 20,
			offsetY: 6,
			text: focusBateau && f.getId() != idBateau ? "" : f.get("nom"),
			font: "bold 30px 'Ms Madi'",
			fill: new ol.style.Fill({ color: 'dimgrey' }),
			stroke: new ol.style.Stroke({ color: 'white', width: 3 }),
		})
	})
}

const bateauxSource = new ol.source.Vector({projection : 'EPSG:3857'})
const bateaux = new ol.layer.Vector({
	source: bateauxSource,
	style: getBateauxStyle,
	name: "bateaux"
})

/***** TRAJETS */

function getTrajetsStyle(f){
	let opacity = f.get('ordre') / f.get('ordreMax')
	const orange = `rgba(255, 165, 0, ${opacity})`
	const gris = '#aaaaaa'
	return new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: focusBateau && f.get('idBateau') != idBateau ? gris : orange,
			width: focusBateau && f.get('idBateau') != idBateau ? 1 : 3
		})
	})
}

const trajetsSource = new ol.source.Vector({projection : 'EPSG:3857'})
const trajets = new ol.layer.Vector({
	source: trajetsSource,
	style: getTrajetsStyle,
	name: "trajets"
})

/***** ROUTES */

function getRoutesStyle(){
	return new ol.style.Style({
		stroke: new ol.style.Stroke({ color: '#aaaaaa', width: 1 })
	})
}

const routesSource = new ol.source.Vector({projection : 'EPSG:3857'})
const routes = new ol.layer.Vector({
	source: routesSource,
	style: getRoutesStyle,
	name: "routes"
})

/***** TOURNEES */

function getTourneesStyle(){
	return new ol.style.Style({
		stroke: new ol.style.Stroke({ color: '#e0225b', width: 2 })
	})
}

const tourneesSource = new ol.source.Vector({projection : 'EPSG:3857'})
const tournees = new ol.layer.Vector({
	source: tourneesSource,
	style: getTourneesStyle,
	name: "tournees"
})

/***** MAP */

const map = new ol.Map({
	layers: [mapbox, routes, tournees, trajets, ports, bateaux],
	target: 'map',
	view: new ol.View({
		center: ol.proj.transform([6.0, 40.0], 'EPSG:4326', 'EPSG:3857'),
		minZoom: 5,
		maxZoom: 9
	}),
	controls : ol.control.defaults({
		attribution : false,
		zoom : false
	}).extend([])
})

map.on('singleclick', function (evt) {
	const xy = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326').map(c => c.toFixed(6)).join(",")
	$('#xy').html(xy)
	$('#xy').show()
	const elm = document.getElementById("xy")
	const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(elm)
    selection.removeAllRanges()
    selection.addRange(range)
	document.execCommand("Copy")
	selection.removeAllRanges()
	$('#xy').hide()
})

/************ GET PORTS */

function getPorts(){
	const request = $.ajax({ url: API_BASE_URL + "/ports", method: "GET" })
	request.done(function(records) {
		for(const port of records){
			addPortToMap(port)
		}
		map.getView().fit(portsSource.getExtent(), { padding: [100, 100, 100, 100] })
	})
	request.fail(function(jqXHR, textStatus) {
		console.log("FAIL", jqXHR, textStatus)
	})
}

function addPortToMap(record) {
	const feature = new ol.Feature({ })
	feature.setId(record.id)
	feature.set("nom", record.nom)
	feature.setGeometry(new ol.geom.Point(ol.proj.transform(record.geom.coordinates, 'EPSG:4326','EPSG:3857')))
	portsSource.addFeature(feature)
	// Ajout aux listes déroulantes
	$('#choixPorts select').append(`<option value="${record.id}">${record.id}. ${record.nom}</option>`)
}

getPorts()

/************ GET BATEAUX */

function getBateaux(){
	const request = $.ajax({ url: API_BASE_URL + "/bateaux", method: "GET" })
	request.done(function(bateaux) {
		bateaux.forEach(bateau => addBateauToMap(bateau))
	})
	request.fail(function(jqXHR, textStatus) {
		console.log("FAIL", jqXHR, textStatus)
	})
}

function addBateauToMap(record) {
	const feature = new ol.Feature({ })
	feature.setId(record.id)
	feature.set("nom", record.nom)
	if (record.geom) {
		feature.setGeometry(new ol.geom.Point(ol.proj.transform(record.geom.coordinates, 'EPSG:4326','EPSG:3857')))
	}
	bateauxSource.addFeature(feature)
}

function moveBateau(bateau) {
	const feature = bateauxSource.getFeatureById(bateau.id)
	feature.setGeometry(new ol.geom.Point(ol.proj.transform(bateau.geom.coordinates, 'EPSG:4326','EPSG:3857')))
}

getBateaux()

/************ GET TRAJETS */

function getTrajets(){
	const request = $.ajax({ url: API_BASE_URL + "/trajets", method: "GET" })
	request.done(function(trajets) {
		const ordreMax = Math.max.apply(null, trajets.map(t => t.ordre))
		trajets.forEach(trajet => addTrajetToMap(trajet, ordreMax))
	})
	request.fail(function(jqXHR, textStatus) {
		console.log("FAIL", jqXHR, textStatus)
	})
}

function addTrajetToMap(trajet, ordreMax) {
	const feature = new ol.Feature({ })
	feature.set("idBateau", trajet.id_bateau)
	feature.set("ordre", trajet.ordre)
	feature.set("ordreMax", ordreMax)
	feature.setGeometry(trajet.geom ? new ol.format.GeoJSON().readGeometry(trajet.geom, { featureProjection: "EPSG:3857" }) : null)
	trajetsSource.addFeature(feature)
}

function retirerTrajets(idBateau) {
	trajetsSource.getFeatures().filter(f => f.get('idBateau') == idBateau).forEach(f => trajetsSource.removeFeature(f))
}

function remplacerTrajets(idBateau, trajets) {
	// On supprime les anciens trajets
	retirerTrajets(idBateau)
	// On ajoute les nouveaux trajets
	const ordreMax = Math.max.apply(null, trajets.map(t => t.ordre))
	trajets.forEach(trajet => addTrajetToMap(trajet, ordreMax))
}

getTrajets()

/************ GET ROUTES */

function getRoutes(){
	const request = $.ajax({ url: API_BASE_URL + "/routes", method: "GET" })
	request.done(function(routes) {
		addRoutesToMap(routes)
	})
	request.fail(function(jqXHR, textStatus) {
		console.log("FAIL", jqXHR, textStatus)
	})
}

function addRoutesToMap(routes) {
	console.log(routes.length)
	for (const route of routes) {
		const feature = new ol.Feature({ })
		feature.setGeometry(new ol.format.GeoJSON().readGeometry(route.geom, { featureProjection: "EPSG:3857" }))
		routesSource.addFeature(feature)
	}
}

/************ GET TOURNEE */

function getTournee(idPortDepart, idPortArrivee){
	const start = new Date().getTime()
	const request = $.ajax({ url: API_BASE_URL + "/tournee/" + idPortDepart + "/" + idPortArrivee, method: "GET" })
	request.done(function(routes) {
		addTourneeToMap(routes, start, false)
	})
	request.fail(function(jqXHR, textStatus) {
		console.log("FAIL", jqXHR, textStatus)
	})
}

function getTourneeFixe(idsPorts){
	const start = new Date().getTime()
	const request = $.ajax({ url: API_BASE_URL + "/tournee/" + idsPorts, method: "GET" })
	request.done(function(routes) {
		addTourneeToMap(routes, start, true)
	})
	request.fail(function(jqXHR, textStatus) {
		console.log("FAIL", jqXHR, textStatus)
	})
}

function addTourneeToMap(routes, start, ajustement) {
	const somme = Math.round(routes.map(r => parseFloat(r.distance)).reduce((acc, cur) => acc + cur, 0) / 1000)
	// Feuille de Route
	const oldSomme = parseInt($("#tournee").data("somme"))
	$("#tournee").data("somme", somme)
	$("#tournee ul li").remove()
	$("#tournee ul.depart").append(`<li data-port="${routes[0].id_port_orig[0]}">${routes[0].id_port_orig[0]}. ${getNomPort(routes[0].id_port_orig[0])}</li>`)
	for (const i in routes) {
		let liste = "#tournee ul.sortable"
		if (i == routes.length - 1) {
			liste = "#tournee ul.arrivee"
		}
		const distance = Math.round(routes[i].distance / 1000)
		const li = $(`<li data-port="${routes[i].id_port_dest[0]}">${routes[i].id_port_dest[0]}. ${getNomPort(routes[i].id_port_dest[0])} <span>${distance} kms</span></li>`).appendTo(liste)
		// TODO survol
	}
	// Features
	tourneesSource.clear()
	for (const route of routes) {
		const feature = new ol.Feature({ })
		feature.set("route_id", route.route_id)
		feature.set("distance", route.distance)
		feature.set("id_port_orig", route.id_port_orig[0])
		feature.set("id_port_dest", route.id_port_dest[0])
		feature.setGeometry(new ol.format.GeoJSON().readGeometry(route.geom, { featureProjection: "EPSG:3857" }))
		tourneesSource.addFeature(feature)
	}
	// Toaster
	const message = []
	if (ajustement) {
		message.push(`Tournée réajustée à la main`)
		message.push(`Distance totale : ${oldSomme} -> ${somme} kms`)
		const difference = somme - oldSomme
		const tauxVariation = Math.round(difference / oldSomme * 100)
		message.push(`Différence : +${difference} kms, soit +${tauxVariation} %`)
	} else {
		message.push(`Tournée optimisée entre les ports ${routes[0].id_port_orig[0]} et ${routes[routes.length - 1].id_port_dest[0]}`)
		message.push(`Distance totale : ${somme} kms`)
	}
	message.push(`Optimisation calculée et affichée en ${new Date().getTime() - start} ms`)
	toaster(message.join('<br />'), 10000)
}

function getNomPort(idPort) {
	return portsSource.getFeatureById(idPort).get("nom")
}

/************ EVENT LISTENERS */

$("#choixPorts select").on('change', function() {
	const portDepart = $("#portDepart").val()
	const portArrivee = $("#portArrivee").val()
	if (portDepart != "" && portArrivee != "") {
		console.info(`Calcul d'itinéraire entre les ports ${portDepart} et ${portArrivee}`)
		getTournee(portDepart, portArrivee)
	} else {
		console.info("Pas de calcul d'itinéraire")
	}
})

$("#tournee ul.sortable").sortable({
	axis: "y",
	update: function() {
		const idsPorts = []
		$("#tournee ul li").each(function() { idsPorts.push($(this).data("port")) })
		getTourneeFixe(idsPorts.join(','))
    }
})

/************ SSE */

const eventSource = new EventSource(API_BASE_URL + '/stream')

eventSource.onopen = () => {
	console.log("CONNECTED")
}

eventSource.onerror = () => {
	switch (eventSource.readyState) {
		case EventSource.OPENED:
			console.log("OPENED")
			break
		case EventSource.CONNECTING:
			console.log("CONNECTING")
			break
		case EventSource.CLOSED:
			console.log("CLOSED")
			break
		default:
			console.log("UNKNOWN EVENT")
	}
}

eventSource.onmessage = event => {
	const data = JSON.parse(event.data)
	console.log("EVENT " + data.type, data.content)
	const content = data.content
	switch (data.type) {
		case 'deplacerBateau':
			// Actions
			moveBateau(content.bateau)
			remplacerTrajets(content.bateau.id, content.trajets)
			// Toaster
			toaster(`Le bateau n°${content.bateau.id} s'est déplacé vers ${content.bateau.geom.coordinates.join(', ')}`, 5000)
			break
		case 'rentrerBateau':
			// Actions
			bateauxSource.getFeatureById(content.idBateau).setGeometry(null)
			retirerTrajets(content.idBateau)
			// Toaster
			toaster(`Le bateau n°${content.idBateau} et ses trajets ont été retirés de la carte`, 5000)
			break
		case 'creerPort':
			addPortToMap(content.port)
			// Toaster
			toaster(`Le port n°${content.port.id} a été ajouté à la carte`, 5000)
			break
		case 'creerBateau':
			addBateauToMap(content.bateau)
			// Toaster
			toaster(`Le bateau n°${content.bateau.id} a été ajouté à la carte`, 5000)
			break
		case 'supprimerBateau':
			// Actions
			bateauxSource.removeFeature(bateauxSource.getFeatureById(content.idBateau))
			// Toaster
			toaster(`Le bateau n°${content.idBateau} a été retiré de la carte`, 5000)
			break
		case 'supprimerPort':
			// Actions
			portsSource.removeFeature(portsSource.getFeatureById(content.idPort))
			// Toaster
			toaster(`Le port n°${content.idPort} a été retiré de la carte`, 5000)
			break
		case 'supprimerTrajets':
			// Actions
			retirerTrajets(content.idBateau)
			// Toaster
			toaster(`Les trajets du bateau n°${content.idBateau} ont été retirés de la carte`, 5000)
			break
		case 'supprimerFlotte':
			if (content.idsBateaux.length > 0) {
				// Actions
				content.idsBateaux.forEach(idBateau => {
					bateauxSource.removeFeature(bateauxSource.getFeatureById(idBateau))
					retirerTrajets(idBateau)
				})
				// Toaster
				toaster(`Les ${content.idsBateaux.length} bateaux (et leurs trajets) de la flotte ${content.nomFlotte} ont été retirés de la carte`, 5000)
			}
			break
		default:
			console.log("UNHANDLED EVENT")
			break
	}
}

function toaster (texte, duree) {
	const message = $(`<div class="message"><p>${texte}</p></div>`).appendTo('#stream')
	const div = $(`<div class="bar"></div>`).appendTo(message)
	message.fadeIn(function() {
		div.animate({ width: '100%' }, duree, 'linear', function() { message.fadeOut() })
	})
}

//eventSource.close()
