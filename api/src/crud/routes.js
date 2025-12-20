const { Sequelize, DataTypes, QueryTypes, Op } = require('sequelize')

// DATABASE

const sequelize = new Sequelize('cartopirates', 'cartopirates', 'cartopirates', { host: 'db', port: 5432, dialect: 'postgres' })

// MODEL

const Route = sequelize.define('Route', {
	id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, field: 'ogc_fid' },
	geom: { type: DataTypes.GEOMETRY, field: 'wkb_geometry' },
	distance: { type: DataTypes.INTEGER }
}, {
	timestamps: false,
	tableName: 'routes'
})

// QUERIES

async function getRoutes () {
	const routes = await Route.findAll()
	return routes
}

// EXPORTS

module.exports = { getRoutes }
