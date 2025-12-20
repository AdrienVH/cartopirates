class CartoPirates {
    
    constructor(idBateau) {
        this.monBateau = idBateau
        this.init = false
        this.setApiUrl()
    }

    setApiUrl() {
        const isDev = true // FIX ME
        if (isDev) {
            this.url = 'http://localhost:9001'
        } else {
            this.url = 'https://cartopirates.fr/api'
        }
    }

    async listerTousLesPorts() {
        const url = this.url + '/ports'
        const response = await fetch(url)
        return await response.json()
    }

    async deplacerMonBateauVersCoords(coords) {
        const params = new URLSearchParams({ longitude: coords[0], latitude: coords[1] })
        const url = this.url + '/bateau/' + this.monBateau + '/deplacer?' + params
        return fetch(url, { method: 'PUT'})
    }

    async recupererCoordsPort(idPort) {
        const url = this.url + '/port/' + idPort
        const response = await fetch(url)
        return await response.json()
    }

    async recupererCoordsMonBateau() {
        const url = this.url + '/bateau/' + this.monBateau
        const response = await fetch(url)
        return await response.json()
    }

    async trouverPortsProchesCoords(coords, nombre) {
        const params = new URLSearchParams({ longitude: coords[0], latitude: coords[1] })
        const url = this.url + '/ports/' + nombre + '/proches?' + params
        const response = await fetch(url)
        return await response.json()
    }

    async trouverBateauxProchesCoords(coords, nombre) {
        const params = new URLSearchParams({ longitude: coords[0], latitude: coords[1] })
        const url = this.url + '/bateaux/' + nombre + '/proches?' + params
        const response = await fetch(url)
        return await response.json()
    }

    async rentrerMonBateau() {
        const url = this.url + '/bateau/' + this.monBateau + '/rentrer'
        return fetch(url, { method: 'PUT'})
    }
}