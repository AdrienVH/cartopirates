const { Sequelize, DataTypes, QueryTypes, Op } = require('sequelize')

// DATABASE

const sequelize = new Sequelize('cartopirates', 'cartopirates', 'cartopirates', { host: 'db', port: 5432, dialect: 'postgres' })

// MODEL

const Trajet = sequelize.define('Trajet', {
	id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
	idBateau: { type: DataTypes.INTEGER, allowNull: false, field: 'id_bateau' },
	date: { type: DataTypes.DATE },
	geom: { type: DataTypes.GEOMETRY }
}, {
	timestamps: false,
	tableName: 'trajets'
})

// QUERIES

async function getTrajets () {
	// FIX ME #18 : Se passer du cast en integer car ROW_NUMBER devrait retourner un integer
	const sql = `
	SELECT id, id_bateau, date, geom, (ROW_NUMBER () OVER (PARTITION BY id_bateau ORDER BY id ASC))::integer AS ordre
	FROM trajets
	WHERE geom IS NOT NULL;
	`
	const trajets = await sequelize.query(sql, { type: QueryTypes.SELECT })
	return trajets
}

async function getTrajetsBateau (idBateau) {
	// FIX ME #18 : Se passer du cast en integer car ROW_NUMBER devrait retourner un integer
	const sql = `
	SELECT id, id_bateau, date, geom, (ROW_NUMBER () OVER (PARTITION BY id_bateau ORDER BY id ASC))::integer AS ordre
	FROM trajets
	WHERE id_bateau = :idBateau AND geom IS NOT NULL;
	`
	const trajets = await sequelize.query(sql, { replacements: { idBateau }, type: QueryTypes.SELECT })
	return trajets
}

// COMMANDS

async function supprimerTrajets (idBateau) {
	const deleted = await Trajet.destroy({ where: { idBateau } })
	return deleted
}

// EXPORTS

module.exports = { getTrajets, getTrajetsBateau, supprimerTrajets }
