const { getBateaux, getBateauxFlotte, getBateau, getBateauxByLonLat, creerBateau, deplacerBateau, rentrerBateau, supprimerBateau } = require('./crud/bateaux')
const { getPorts, getPort, getPortsByLonLat, creerPort, supprimerPort, getTournee, getTourneeFixe } = require('./crud/ports')
const { getRoutes } = require('./crud/routes')
const { getTrajets, getTrajetsBateau, supprimerTrajets } = require('./crud/trajets')
const { getFlotte, creerFlotte, supprimerFlotte } = require('./crud/flottes')
const express = require('express')
const cors = require('cors')
const SSE = require('express-sse')
const swaggerUi = require('swagger-ui-express')
const swaggerJSDoc = require('swagger-jsdoc')

const api = express()

const swaggerJSDocOptions = {
	definition: {
		info: {
			title: 'API de CartoPirates',
			description: `Documentation des services de l'API`,
			version: '1.0.0'
		},
		servers: [
			{ url: "http://localhost:9001", description: "Environnement de développement" },
			{ url: "https://cartopirates.fr/api", description: "Environnement de production" }
		]
	},
	apis: ['./src/api.js'],
}
swaggerJSDocOptions.definition.basePath = process.env.ENV_NAME == 'prod' ? '/api' : ''
const swaggerSpec = swaggerJSDoc(swaggerJSDocOptions)

api.use(express.json())
api.use(cors())
api.use('/documentation', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
api.listen(8080, () => { console.log(`L'API REST est démarrée`) })

// SSE

const sse = new SSE()
api.get('/stream', sse.init)

// LIMITES

const X_MIN = -5.345692512
const X_MAX = 36.21615644
const Y_MIN = 30.264715887
const Y_MAX = 45.792425848

/**
 * @swagger
 *
 * tags:
 *  name: Bateaux
 */

/**
 * @swagger
 *
 * /bateaux:
 *   get:
 *     description: Récupère la liste des bateaux
 *     tags: [Bateaux]
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: La liste des bateaux a bien été récupérée
 */
api.get('/bateaux', async (req, res) => {
	const bateaux = await getBateaux()
	res.status(200).json(bateaux)
})

/**
 * @swagger
 *
 * /bateau/{idBateau}:
 *   get:
 *     description: Récupère un bateau
 *     tags: [Bateaux]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idBateau
 *         description: Identifiant du bateau
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Le bateau a bien été récupéré
 *       404:
 *         description: Aucun bateau ne porte l'identifiant {idBateau}
 */
api.get('/bateau/:idBateau', async (req, res) => {
	const idBateau = parseInt(req.params.idBateau)
	const bateau = await getBateau(idBateau)
	if (bateau) {
		res.status(200).json(bateau)
	} else {
		res.status(404).json({ code: 404, erreurs: [`Aucun bateau ne porte l'identifiant ${idBateau}`] })
	}
})

/**
 * @swagger
 *
 * /bateau:
 *   post:
 *     description: Crée un bateau
 *     tags: [Bateaux]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: nomFlotte
 *         description: Nom de la flotte pour laquelle le bateau doit être créé
 *         in: query
 *         required: true
 *         type: string
 *       - name: nomBateau
 *         description: Nom du bateau à créer
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       201:
 *         description: Le bateau a bien été créé
 *       400:
 *         description: Aucune flotte ne porte le nom {nomFlotte}
 *       500:
 *         description: Une erreur est survenue
 */
api.post('/bateau', async (req, res) => {
	try {
		const nomFlotte = req.query.nomFlotte
		const nomBateau = req.query.nomBateau
		const bateau = await creerBateau(nomFlotte, nomBateau)
		if (bateau) {
			res.status(201).json(bateau)
			sse.send({ type: 'creerBateau', content: { bateau } })
		} else {
			res.status(400).json({ code: 400, erreurs: [`Aucune flotte ne porte le nom ${nomFlotte}`] })
		}
	} catch (err) {
		const erreurs = err.errors ? err.errors.map(err => err.message) : ['Erreur inconnue']
		res.status(500).json({ code: 500, erreurs })
	}
})

/**
 * @swagger
 *
 * /bateau/{idBateau}/deplacer:
 *   put:
 *     description: Modifie la localisation d'un bateau
 *     tags: [Bateaux]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idBateau
 *         description: Identifiant du bateau
 *         in: path
 *         required: true
 *         type: integer
 *       - name: longitude
 *         description: Longitude de la nouvelle position du bateau
 *         in: query
 *         required: true
 *         type: number
 *       - name: latitude
 *         description: Latitude de la nouvelle position du bateau
 *         in: query
 *         required: true
 *         type: number
 *     responses:
 *       201:
 *         description: La localisation du bateau a bien été modifiée
 *       400:
 *         description: Un bateau ne peut pas être placé en dehors de la Mer Méditerranée
 */
api.put('/bateau/:idBateau/deplacer', async (req, res) => {
	const idBateau = parseInt(req.params.idBateau)
	const longitude = parseFloat(req.query.longitude)
	const latitude = parseFloat(req.query.latitude)
	if (longitude >= X_MIN && longitude <= X_MAX && latitude >= Y_MIN && latitude <= Y_MAX) {
		const content = await deplacerBateau(idBateau, longitude, latitude)
		res.status(201).json(content.bateau)
		sse.send({ type: 'deplacerBateau', content })
	} else {
		res.status(400).json({ code: 400, erreurs: [`Un bateau ne peut pas être placé en dehors de la Mer Méditerranée`] })
	}
})

/**
 * @swagger
 *
 * /bateau/{idBateau}/rentrer:
 *   put:
 *     description: Retire la localisation d'un bateau
 *     tags: [Bateaux]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idBateau
 *         description: Identifiant du bateau
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       201:
 *         description: La localisation du bateau a bien été retirée
 */
 api.put('/bateau/:idBateau/rentrer', async (req, res) => {
	const idBateau = parseInt(req.params.idBateau)
	await rentrerBateau(idBateau)
	await supprimerTrajets(idBateau)
	res.status(201).json('Le bateau a bien été retiré')
	sse.send({ type: 'rentrerBateau', content: { idBateau } })
})

/**
 * @swagger
 *
 * /bateau/{idBateau}:
 *   delete:
 *     description: Supprime un bateau
 *     tags: [Bateaux]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idBateau
 *         description: Identifiant du bateau
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Le bateau {idBateau} a bien été supprimé
 *       404:
 *         description: Aucun bateau n'a été supprimé
 */
api.delete('/bateau/:idBateau', async (req, res) => {
	const idBateau = parseInt(req.params.idBateau)
	const deleted = await supprimerBateau(idBateau)
	if (deleted == 1) {
		res.status(200).json(`Le bateau ${idBateau} a bien été supprimé`)
		sse.send({ type: 'supprimerBateau', content: { idBateau } })
	} else {
		res.status(404).json(`Aucun bateau n'a été supprimé`)
	}
})

/**
 * @swagger
 *
 * /bateaux/{nombre}/proches:
 *   get:
 *     description: Récupère les bateaux les plus proches de coordonnées
 *     tags: [Bateaux]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: nombre
 *         description: Nombre de bateaux à récupérer
 *         in: path
 *         required: true
 *         type: integer
 *       - name: longitude
 *         description: Longitude
 *         in: query
 *         required: true
 *         type: number
 *       - name: latitude
 *         description: Latitude
 *         in: query
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: Les {nombre} bateaux les plus proches ont bien été récupérés
 *       400:
 *         description: Votre recherche ne peut pas se situer en dehors de la Mer Méditerranée
 */
api.get('/bateaux/:nombre/proches', async (req, res) => {
	const nombre = parseInt(req.params.nombre)
	const longitude = parseFloat(req.query.longitude)
	const latitude = parseFloat(req.query.latitude)
	if (longitude < X_MIN || longitude > X_MAX || latitude < Y_MIN || latitude > Y_MAX) {
		res.status(400).json({ code: 400, erreurs: [`Votre recherche ne peut pas se situer en dehors de la Mer Méditerranée`] })
	} else if (isNaN(nombre) || nombre <= 0) {
		res.status(400).json({ code: 400, erreurs: [`Le nombre de bateau recherchés doit être supérieur ou égal à 1`] })
	} else {
		const bateaux = await getBateauxByLonLat(longitude, latitude, nombre)
		res.status(200).json(bateaux)
	}
})

 /**
 * @swagger
 *
 * tags:
 *  name: Ports
 */

/**
 * @swagger
 *
 * /ports:
 *   get:
 *     description: Récupère la liste des ports
 *     tags: [Ports]
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: La liste des ports a bien été récupérée
 */
api.get('/ports', async (req, res) => {
	const ports = await getPorts()
	res.status(200).json(ports)
})

/**
 * @swagger
 *
 * /port/{idPort}:
 *   get:
 *     description: Récupère un port
 *     tags: [Ports]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idPort
 *         description: Identifiant du port
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Le port a bien été récupéré
 *       404:
 *         description: Aucun port ne porte l'identifiant {idPort}
 */
api.get('/port/:idPort', async (req, res) => {
	const idPort = parseInt(req.params.idPort)
	const port = await getPort(idPort)
	if (port) {
		res.status(200).json(port)
	} else {
		res.status(404).json({ code: 404, erreurs: [`Aucun port ne porte l'identifiant ${idPort}`] })
	}
})

/**
 * @swagger
 *
 * /port:
 *   post:
 *     description: Crée un port
 *     tags: [Ports]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: nomPort
 *         description: Nom du port à créer
 *         in: query
 *         required: true
 *         type: string
 *       - name: longitude
 *         description: Longitude
 *         in: query
 *         required: true
 *         type: number
 *       - name: latitude
 *         description: Latitude
 *         in: query
 *         required: true
 *         type: number
 *     responses:
 *       201:
 *         description: Le port a bien été créé
 *       400:
 *         description: Un port ne peut pas être placé en dehors de la Mer Méditerranée
 *       500:
 *         description: Une erreur est survenue
 */
api.post('/port', async (req, res) => {
	try {
		const nomPort = req.query.nomPort
		const latitude = parseFloat(req.query.latitude)
		const longitude = parseFloat(req.query.longitude)
		if (longitude >= X_MIN && longitude <= X_MAX && latitude >= Y_MIN && latitude <= Y_MAX) {
			const port = await creerPort(nomPort, longitude, latitude)
			res.status(201).json(port)
			sse.send({ type: 'creerPort', content: { port } })
		} else {
			res.status(400).json({ code: 400, erreurs: [`Un port ne peut pas être placé en dehors de la Mer Méditerranée`] })
		}
	} catch (err) {
		const erreurs = err.errors ? err.errors.map(err => err.message) : ['Erreur inconnue']
		res.status(500).json({ code: 500, erreurs })
	}
})

/**
 * @swagger
 *
 * /port/{idPort}:
 *   delete:
 *     description: Supprime un port
 *     tags: [Ports]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idPort
 *         description: Identifiant du port
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Le port a bien été supprimé
 *       404:
 *         description: Aucun port n'a été supprimé
 */
api.delete('/port/:idPort', async (req, res) => {
	const idPort = parseInt(req.params.idPort)
	const deleted = await supprimerPort(idPort)
	if (deleted == 1) {
		res.status(200).json(`Le port ${idPort} a bien été supprimé`)
		sse.send({ type: 'supprimerPort', content: { idPort } })
	} else {
		res.status(404).json(`Aucun port n'a été supprimé`)
	}
})

/**
 * @swagger
 *
 * /ports/{nombre}/proches:
 *   get:
 *     description: Récupère les ports les plus proches de coordonnées
 *     tags: [Ports]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: nombre
 *         description: Nombre de ports à récupérer
 *         in: path
 *         required: true
 *         type: integer
 *       - name: longitude
 *         description: Longitude
 *         in: query
 *         required: true
 *         type: number
 *       - name: latitude
 *         description: Latitude
 *         in: query
 *         required: true
 *         type: number
 *     responses:
 *       200:
 *         description: Les {nombre} ports les plus proches ont bien été récupérés
 *       400:
 *         description: Votre recherche ne peut pas se situer en dehors de la Mer Méditerranée
 */
api.get('/ports/:nombre/proches', async (req, res) => {
	const nombre = parseInt(req.params.nombre)
	const longitude = parseFloat(req.query.longitude)
	const latitude = parseFloat(req.query.latitude)
	if (longitude < X_MIN || longitude > X_MAX || latitude < Y_MIN || latitude > Y_MAX) {
		res.status(400).json({ code: 400, erreurs: [`Votre recherche ne peut pas se situer en dehors de la Mer Méditerranée`] })
	} else if (isNaN(nombre) || nombre <= 0) {
		res.status(400).json({ code: 400, erreurs: [`Le nombre de ports recherchés doit être supérieur ou égal à 1`] })
	} else {
		const ports = await getPortsByLonLat(longitude, latitude, nombre)
		res.status(200).json(ports)
	}
})

/**
 * @swagger
 *
 * /tournee/{idPortDepart}/{idPortArrivee}:
 *   get:
 *     description: Calcule une tournée (ordre à optimiser)
 *     tags: [Ports]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idPortDepart
 *         description: Identifiant du port de départ
 *         in: path
 *         required: true
 *         type: integer
 *       - name: idPortArrivee
 *         description: Identifiant du port d'arrivée
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: La tournée a bien été calculée
 */
api.get('/tournee/:idPortDepart/:idPortArrivee', async (req, res) => {
	const idPortDepart = parseInt(req.params.idPortDepart)
	const idPortArrivee = parseInt(req.params.idPortArrivee)
	const ports = await getTournee(idPortDepart, idPortArrivee, false)
	res.status(200).json(ports)
})

/**
 * @swagger
 *
 * /tournee/{idsPorts}:
 *   get:
 *     description: Calcule une tournée (ordre fixe)
 *     tags: [Ports]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idsPorts
 *         description: Identifiants des ports
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: La tournée a bien été calculée
 */
api.get('/tournee/:idsPorts', async (req, res) => {
	const idsPorts = req.params.idsPorts
	const ports = await getTourneeFixe(idsPorts)
	res.status(200).json(ports)
})

/**
 * @swagger
 *
 * tags:
 *  name: Routes
 */

/**
 * @swagger
 *
 * /routes:
 *   get:
 *     description: Récupère la liste des routes
 *     tags: [Routes]
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: La liste des routes a bien été récupérée
 */
api.get('/routes', async (req, res) => {
	const routes = await getRoutes()
	res.status(200).json(routes)
})

/**
 * @swagger
 *
 * tags:
 *  name: Trajets
 */

/**
 * @swagger
 *
 * /trajets:
 *   get:
 *     description: Récupère la liste des trajets
 *     tags: [Trajets]
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: La liste des trajets a bien été récupérée
 */
 api.get('/trajets', async (req, res) => {
	const trajets = await getTrajets()
	res.status(200).json(trajets)
})

/**
 * @swagger
 *
 * /trajets/bateau/{idBateau}:
 *   get:
 *     description: Récupère les trajets d'un bateau
 *     tags: [Trajets]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idBateau
 *         description: Identifiant du bateau
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Les trajets du bateau ont bien été récupérés
 */
 api.get('/trajets/bateau/:idBateau', async (req, res) => {
	const idBateau = parseInt(req.params.idBateau)
	const trajets = await getTrajetsBateau(idBateau)
	if (trajets) {
		res.status(200).json(trajets)
	} else {
		res.status(404).json(trajets)
	}
})

/**
 * @swagger
 *
 * /trajets/bateau/{idBateau}:
 *   delete:
 *     description: Supprime les trajets d'un bateau
 *     tags: [Trajets]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idBateau
 *         description: Identifiant du bateau
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: Les trajets du bateau ont bien été supprimés
 *       404:
 *         description: Aucun trajet n'a été supprimé
 *       500:
 *         description: Une erreur est survenue
 */
 api.delete('/trajets/bateau/:idBateau', async (req, res) => {
	const idBateau = parseInt(req.params.idBateau)
	const deleted = await supprimerTrajets(idBateau)
	if (deleted == 0) {
		res.status(404).json({ code: 404, erreurs: [`Aucun trajet n'a été supprimé`] })
	} else if (deleted >= 1) {
		res.status(200).json(`Les trajets (${deleted}) du bateau ${idBateau} ont bien été supprimés`)
		sse.send({ type: 'supprimerTrajets', content: { idBateau } })
	} else {
		res.status(500).json({ code: 404, erreurs: [`Une erreur est survenue`] })
	}
})

/**
 * @swagger
 *
 * tags:
 *  name: Flottes
 */

/**
 * @swagger
 *
 * /flotte/{nomFlotte}:
 *   get:
 *     description: Récupère une flotte
 *     tags: [Flottes]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: nomFlotte
 *         description: Nom de la flotte
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: La flotte a bien été récupérée
 *       404:
 *         description: Aucune flotte ne porte le nom {nomFlotte}
 */
 api.get('/flotte/:nomFlotte', async (req, res) => {
	const nomFlotte = req.params.nomFlotte
	const flotte = await getFlotte(nomFlotte)
	if (flotte) {
		res.status(200).json(flotte)
	} else {
		res.status(404).json({ code: 404, erreurs: [`Aucune flotte ne porte le nom ${nomFlotte}`] })
	}
})

/**
 * @swagger
 *
 * /flotte/{nomFlotte}/bateaux:
 *   get:
 *     description: Récupère les bateaux d'une flotte
 *     tags: [Flottes]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: nomFlotte
 *         description: Nom de la flotte
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: Les bateaux de la flotte ont bien été récupérés
 *       404:
 *         description: Aucune flotte ne porte le nom {nomFlotte}
 */
 api.get('/flotte/:nomFlotte/bateaux', async (req, res) => {
	const nomFlotte = req.params.nomFlotte
	const flotte = await getFlotte(nomFlotte)
	if (flotte) {
		const bateaux = await getBateauxFlotte(nomFlotte)
		res.status(200).json(bateaux)
	} else {
		res.status(404).json({ code: 404, erreurs: [`Aucune flotte ne porte le nom ${nomFlotte}`] })
	}
})

/**
 * @swagger
 *
 * /flotte:
 *   post:
 *     description: Crée une flotte
 *     tags: [Flottes]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: nomFlotte
 *         description: Nom de la flotte à créer
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       201:
 *         description: La flotte a bien été créée
 *       400:
 *         description: Une flotte porte déjà le nom {nomFlotte}
 *       500:
 *         description: Une erreur est survenue
 */
api.post('/flotte', async (req, res) => {
	try {
		const nomFlotte = req.query.nomFlotte
		const flotte = await creerFlotte(nomFlotte)
		if (flotte) {
			res.status(201).json(flotte)
		} else {
			res.status(400).json({ code: 400, erreurs: [`Une flotte porte déjà le nom ${nomFlotte}`] })
		}
	} catch (err) {
		const erreurs = err.errors ? err.errors.map(err => err.message) : ['Erreur inconnue']
		res.status(500).json({ code: 500, erreurs })
	}
})

/**
 * @swagger
 *
 * /flotte/{nomFlotte}:
 *   delete:
 *     description: Supprime une flotte
 *     tags: [Flottes]
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: nomFlotte
 *         description: Nom de la flotte
 *         in: path
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: La flotte a bien été supprimée
 *       404:
 *         description: Aucune flotte n'a été supprimée
 */
 api.delete('/flotte/:nomFlotte', async (req, res) => {
	const nomFlotte = req.params.nomFlotte
	const flotte = await getFlotte(nomFlotte)
	if (flotte) {
		const bateaux = await getBateauxFlotte(nomFlotte)
		const idsBateaux = bateaux.map(b => b.id)
		const deleted = await supprimerFlotte(nomFlotte)
		if (deleted == 1) {
			res.status(200).json("La flotte a bien été supprimée")
			sse.send({ type: 'supprimerFlotte', content: { nomFlotte, idsBateaux } })
		} else {
			res.status(404).json({ code: 404, erreurs: [`Aucune flotte n'a été supprimée`] })
		}
	} else {
		res.status(404).json({ code: 404, erreurs: [`Aucune flotte ne porte le nom ${nomFlotte}`] })
	}
})