import os
import requests

class CartoPirates(object):

  def __init__(self, idBateau):
    self.monBateau = idBateau
    self.setApiUrl()

  def setApiUrl(self):
    dir = os.path.dirname(os.path.realpath(__file__))
    isDev = os.path.exists("{}/dev".format(dir))
    if isDev:
      self.url = "http://localhost:9001"
    else:
      self.url = "https://cartopirates.fr/api"

  def listerTousLesPorts(self):
    url = self.url + "/ports"
    response = requests.get(url)
    return response.json()

  def deplacerMonBateauVersCoords(self, coords):
    url = self.url + '/bateau/' + str(self.monBateau) + '/deplacer'
    params = { "longitude": coords[0], "latitude": coords[1] }
    requests.put(url, params=params)

  def recupererCoordsPort(self, idPort):
    url = self.url + "/port/" + str(idPort)
    response = requests.get(url)
    return response.json()["geom"]["coordinates"]

  def recupererCoordsMonBateau(self):
    url = self.url + "/bateau/" +  str(self.monBateau)
    response = requests.get(url)
    return response.json()["geom"]["coordinates"]

  def trouverPortsProchesCoords(self, coords, nombre):
    url = self.url + "/ports/" + str(nombre) + "/proches"
    params = { "longitude": coords[0], "latitude": coords[1] }
    response = requests.get(url, params=params)
    return response.json()

  def trouverBateauxProchesCoords(self, coords, nombre):
    url = self.url + "/bateaux/" + str(nombre) + "/proches"
    params = { "longitude": coords[0], "latitude": coords[1] }
    response = requests.get(url, params=params)
    return response.json()

  def rentrerMonBateau(self):
    url = self.url + '/bateau/' + str(self.monBateau) + '/rentrer'
    requests.put(url)