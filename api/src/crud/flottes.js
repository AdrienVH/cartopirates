const { Sequelize, DataTypes, QueryTypes } = require('sequelize')

// DATABASE

const sequelize = new Sequelize('cartopirates', 'cartopirates', 'cartopirates', { host: 'db', port: 5432, dialect: 'postgres' })

// MODEL

const Flotte = sequelize.define('Flotte', {
	id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
	nom: { type: DataTypes.STRING, allowNull: false }
}, {
	timestamps: false,
	tableName: 'flottes'
})

// QUERIES

async function getFlotte (nom) {
	const flotte = await Flotte.findOne({ where: { nom } })
	return flotte
}

// COMMANDS

async function creerFlotte (nom) {
	// On vérifie qu'une flotte ne porte pas déjà ce nom
	const flotteExistante = await getFlotte(nom)
	if (flotteExistante) {
		return null
	} else {
		const sql = "INSERT INTO flottes VALUES (DEFAULT, :nom);"
		const flotte = await sequelize.query(sql, { replacements: { nom }, type: QueryTypes.INSERT }).then(() => { return getFlotte(nom) })
		return flotte
	}
}

async function supprimerFlotte (nom) {
	const deleted = await Flotte.destroy({ where: { nom } })
	return deleted
}

// EXPORTS

module.exports = { getFlotte, creerFlotte, supprimerFlotte }
