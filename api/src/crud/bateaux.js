const { Sequelize, DataTypes, QueryTypes } = require('sequelize')
const { getTrajetsBateau } = require('./trajets')
const { getFlotte } = require('./flottes')

// DATABASE

const sequelize = new Sequelize('cartopirates', 'cartopirates', 'cartopirates', { host: 'db', port: 5432, dialect: 'postgres' })

// MODEL

const Bateau = sequelize.define('Bateau', {
	id: { type: DataTypes.INTEGER, allowNull:false, primaryKey: true },
	nom: { type: DataTypes.STRING, allowNull: false },
	nearestNode: { type: DataTypes.INTEGER, allowNull: true, field: 'nearest_node' },
	geom: { type: DataTypes.GEOMETRY }
}, {
	timestamps: false,
	tableName: 'bateaux'
})

// QUERIES

async function getBateaux () {
	const bateaux = await Bateau.findAll()
	return bateaux.map(function(bateau){ return bateau.toJSON() })
}

async function getBateauxFlotte (nomFlotte) {
	const bateaux = await Bateau.findAll({ where: {'nom_flotte': nomFlotte }})
	return bateaux
}

async function getBateau (id) {
	const bateau = await Bateau.findByPk(id)
	return bateau
}

async function getBateauxByLonLat (lon, lat, limit) {
	let routingQuery = buildRoutingQuery(lon, lat)
	let sql = `
	WITH routes AS (${routingQuery})
	SELECT bateaux.id, bateaux.nom, bateaux.geom, ROUND(routes.distance::numeric, 2) AS distance
	FROM routes
	LEFT JOIN bateaux ON routes.bateau_node = bateaux.nearest_node
	WHERE bateaux.geom IS NOT NULL AND bateaux.nearest_node IS NOT NULL
	ORDER BY routes.distance ASC
	LIMIT :limit;
	`
	const bateaux = await sequelize.query(sql, { replacements: { limit }, type: QueryTypes.SELECT })
	return bateaux
}

function buildRoutingQuery (lon, lat) {
	const nearestNodeFromXY = `SELECT id FROM routes_vertices_pgr ORDER BY ST_Distance(ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), the_geom) ASC LIMIT 1`
	const nodesFromBateaux = `SELECT array_agg(nearest_node) FROM bateaux WHERE nearest_node IS NOT NULL`
	const query = `
	SELECT end_vid AS bateau_node, MAX(agg_cost) AS distance
	FROM pgr_dijkstra(
		'SELECT ogc_fid AS id, source, target, distance AS cost FROM routes',
		(${nearestNodeFromXY}),
		(${nodesFromBateaux}),
		FALSE
	)
	GROUP BY end_vid
	`
	return query
}

// COMMANDS

async function creerBateau (nomFlotte, nomBateau) {
	// On vérifie l'existence de la flotte
	const flotte = await getFlotte(nomFlotte)
	if (flotte) {
	// On crée la bateau
		const bateauSql = "INSERT INTO bateaux VALUES (DEFAULT, :nomBateau, :nomFlotte, NULL) RETURNING id;"
		const bateau = await sequelize.query(bateauSql, { replacements: { nomBateau, nomFlotte }, type: QueryTypes.INSERT }).then((r) => { return getBateau(r[0][0].id) })
		return bateau
	} else {
		return null
	}
}

async function deplacerBateau (idBateau, lon, lat) {
	// On récupère l'ancienne position du bateau
	const oldBateau = await Bateau.findByPk(idBateau)
	const oldNearestNode = oldBateau.nearestNode
	// On recherche le node le plus proche de la nouvelle position du bateau
	const nearestNodeSql = `SELECT v.id FROM routes_vertices_pgr AS v ORDER BY v.the_geom <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326) ASC LIMIT 1`
	const nearestNode = await sequelize.query(nearestNodeSql, { replacements: { lon, lat }, type: QueryTypes.SELECT }).then((nodes) => { return nodes[0].id })
	// On met à jour la position et le nearest_node du bateau
	const bateauSql = "UPDATE bateaux SET geom = ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), nearest_node = :nearestNode WHERE id = :idBateau"
	const bateau = await sequelize.query(bateauSql, { replacements: { idBateau, lon, lat, nearestNode }, type: QueryTypes.UPDATE }).then(() => { return getBateau(idBateau) })
	// On crée le trajet qui relie l'ancienne position et le bateau
	let trajetGeom = 'NULL'
	if (oldNearestNode) {
		trajetGeom = `
		(
		SELECT ST_ChaikinSmoothing(ST_LineMerge(ST_Union(wkb_geometry)), 5, true)
		FROM pgr_dijkstra('SELECT ogc_fid AS id, source, target, distance AS cost FROM routes', ${oldNearestNode}, ${nearestNode}, FALSE) AS pgr
		LEFT JOIN routes AS r ON pgr.edge = r.ogc_fid
		)
		`
	}
	const trajetSql = `INSERT INTO trajets VALUES (DEFAULT, ${idBateau}, CURRENT_TIMESTAMP, ${trajetGeom});`
	const trajets = await sequelize.query(trajetSql, { type: QueryTypes.INSERT }).then(() => { return getTrajetsBateau(idBateau) })
	// On retourne le bateau et tous ses trajets
	return { bateau, trajets }
}

async function rentrerBateau (idBateau) {
	let updateSql = "UPDATE bateaux SET geom = NULL, nearest_node = NULL WHERE id = :idBateau"
	const bateau = await sequelize.query(updateSql, { replacements: { idBateau }, type: QueryTypes.UPDATE }).then(() => {return Bateau.findByPk(idBateau)})
	return bateau
}

async function supprimerBateau (id) {
	const deleted = await Bateau.destroy({ where: { id } })
	return deleted
}

// EXPORTS

module.exports = { getBateaux, getBateauxFlotte, getBateau, creerBateau, getBateauxByLonLat, deplacerBateau, rentrerBateau, supprimerBateau }
