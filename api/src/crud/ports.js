const { Sequelize, DataTypes, QueryTypes } = require('sequelize')

// DATABASE

const sequelize = new Sequelize('cartopirates', 'cartopirates', 'cartopirates', { host: 'db', port: 5432, dialect: 'postgres' })

// MODEL

const Port = sequelize.define('Port', {
	id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
	nom: { type: DataTypes.STRING, allowNull: false },
	nearestNode: { type: DataTypes.INTEGER, allowNull: false, field: 'nearest_node' },
	geom: { type: DataTypes.GEOMETRY },
}, {
	timestamps: false,
	tableName: 'ports'
})

// QUERIES

async function getPorts () {
	const ports = await Port.findAll()
	return ports.map(function(port){ return port.toJSON() })
}

async function getPort (id) {
	const port = await Port.findByPk(id)
	return port
}

async function getPortsByLonLat(lon, lat, limit) {
	const routingQuery = buildRoutingQuery(lon, lat)
	const sql = `
	WITH routes AS (${routingQuery})
	SELECT ports.id, ports.nom, ports.geom, ROUND(routes.distance::numeric, 2) AS distance
	FROM routes
	LEFT JOIN ports ON routes.port_node = ports.nearest_node
	ORDER BY routes.distance ASC
	LIMIT :limit;
	`
	const ports = await sequelize.query(sql, { replacements: { limit }, type: QueryTypes.SELECT })
	return ports
}

function buildRoutingQuery(lon, lat) {
	const nearestNodeFromXY = `SELECT id FROM routes_vertices_pgr ORDER BY ST_Distance(ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326), the_geom) ASC LIMIT 1`
	const nodesFromPorts = `SELECT array_agg(nearest_node) FROM ports`
	const query = `
	SELECT end_vid AS port_node, MAX(agg_cost) AS distance
	FROM pgr_dijkstra(
		'SELECT ogc_fid AS id, source, target, distance AS cost FROM routes',
		(${nearestNodeFromXY}),
		(${nodesFromPorts}),
		FALSE
	)
	GROUP BY end_vid
	`
	return query
}

async function getTournee(idPortDepart, idPortArrivee, retourDepart) {
	const nodesQuery = buildTspQuery(idPortDepart, idPortArrivee)
	const sql = buildViaVerticesQuery(nodesQuery)
	const trajets = await sequelize.query(sql, { type: QueryTypes.SELECT })
	if (retourDepart) {
		return preparerReponseTournee(trajets, [idPortDepart])
	} else {
		trajets.pop()
		return preparerReponseTournee(trajets, [idPortArrivee])
	}
}

async function getTourneeFixe(idsPorts) {
	const nodesQuery = `
	WITH ordre_fixe AS (SELECT ROW_NUMBER() OVER () AS seq, id AS id_port FROM (SELECT UNNEST(ARRAY[${idsPorts}])) AS t(id))
	SELECT ports.nearest_node AS port_node FROM ordre_fixe LEFT JOIN ports ON ports.id = ordre_fixe.id_port ORDER BY ordre_fixe.seq ASC
	`
	const sql = buildViaVerticesQuery(nodesQuery)
	const trajets = await sequelize.query(sql, { type: QueryTypes.SELECT })
	return preparerReponseTournee(trajets, idsPorts.split(',').pop())
}

function buildTspQuery(idPortDepart, idPortArrivee) {
	const nearestNodeFromPortDepart = `SELECT nearest_node FROM ports WHERE id = ${idPortDepart}`
	const nearestNodeFromPortArrivee = `SELECT nearest_node FROM ports WHERE id = ${idPortArrivee}`
	const nodesFromPorts = `SELECT ARRAY_AGG(nearest_node) FROM ports`
	const sql = `
	SELECT seq, node AS port_node
	FROM pgr_TSP(
		$TSP$
			SELECT * FROM pgr_dijkstraCostMatrix('SELECT ogc_fid AS id, source, target, distance AS cost FROM routes', (${nodesFromPorts}), FALSE)
		$TSP$,
		(${nearestNodeFromPortDepart}),
		(${nearestNodeFromPortArrivee}),
		randomize := false
	)
	`
	return sql
}

function buildViaVerticesQuery (nodesQuery) {
	const sql = `
	WITH nodes AS (${nodesQuery})
	SELECT id1 AS route_id, ROUND(SUM(cost)::numeric, 2) AS distance, ST_ChaikinSmoothing(ST_LineMerge(ST_Union(wkb_geometry)), 5, true) AS geom, ARRAY_REMOVE(ARRAY_AGG(p.id), NULL) AS id_port_orig
	FROM pgr_trspViaVertices(
		'SELECT ogc_fid AS id, source::INTEGER, target::INTEGER, distance::FLOAT AS cost FROM routes',
		(SELECT ARRAY_AGG(port_node) FROM nodes),
		FALSE,
		FALSE
	) AS pgr
	LEFT JOIN ports AS p ON pgr.id2 = p.nearest_node
	LEFT JOIN routes AS r ON pgr.id3 = r.ogc_fid
	GROUP BY route_id
	ORDER BY route_id ASC
	`
	return sql
}

function preparerReponseTournee (trajets, idPortArrivee) {
	for (const i in trajets) {
		const nextIndex = parseInt(i) + 1
		trajets[i].id_port_dest = trajets[nextIndex] ? trajets[nextIndex].id_port_orig : idPortArrivee
	}
	return trajets
}

// COMMANDS

async function creerPort(nom, lon, lat) {
	// On recherche le node le plus proche de la position du port
	const nearestNodeSql = `SELECT v.id FROM routes_vertices_pgr AS v ORDER BY v.the_geom <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326) ASC LIMIT 1`
	const nearestNode = await sequelize.query(nearestNodeSql, { replacements: { lon, lat }, type: QueryTypes.SELECT }).then((nodes) => { return nodes[0].id })
	// On crée le port
	const sql = `INSERT INTO ports VALUES (DEFAULT, :nom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), ${nearestNode}) RETURNING id;`
	const port = await sequelize.query(sql, { replacements: { nom, lon, lat, nearestNode }, type: QueryTypes.INSERT }).then((r) => {return Port.findByPk(r[0][0].id)})
	return port
}

async function supprimerPort(id) {
	const deleted = await Port.destroy({ where: { id } })
	return deleted
}

// EXPORTS

module.exports = { getPorts, getPort, creerPort, getPortsByLonLat, supprimerPort, getTournee, getTourneeFixe }
