# Pour commencer...

## Vous êtes enseignant(e) ?

Rendez-vous sur [cartopirates.fr/api/documentation/](https://cartopirates.fr/api/documentation/).

Créez une flotte pour votre groupe à l'aide du service `POST /flotte`, en indiquant le nom de votre flotte.

Vérifiez la création de votre flotte à l'aide du service `GET /flotte/{nom}`, en indiquant le nom de votre flotte.

Créez votre bateau à l'aide du service `POST /bateaux`, en indiquant le nom de votre flotte et le nom de votre bateau.

**Notez bien l'identifiant de votre bateau !**

Enfin, communiquez le nom de la flotte à vos étudiants, afin qu'ils puissent créer leur propre bateau.

Et, si vraiment le coeur vous en dit, vous pouvez [me payer un thé](https://www.buymeacoffee.com/adrienvh) :)

## Vous êtes étudiant(e) ?

Récupérez, auprès de votre enseignant(e), le nom de la flotte créée pour votre groupe.

Rendez-vous sur [cartopirates.fr/api/documentation/](https://cartopirates.fr/api/documentation/).

Vérifiez l'existence de cette flotte à l'aide du service `GET /flotte/{nom}`.

Enfin, créez votre bateau à l'aide du service `POST /bateaux`, en indiquant le nom de votre flotte et le nom de votre bateau.

**Notez bien l'identifiant de votre bateau !**

# Pour continuer...

Maintenant que vous avez créé votre bateau, il vous est possible de le faire interagir avec [la carte](https://cartopirates.fr/), toujours via l'API. La consommation des différents services offerts par l'API peut se faire de plusieurs manières différentes :

## En utilisant un client existant

Vous pouvez continuer à utiliser les services de l'API depuis sa documentation (qui fait office de client) :
[cartopirates.fr/api/documentation/](https://cartopirates.fr/api/documentation/)

Mais vous pouvez aussi utiliser n'importe quel client capable de faire des appels à une API, comme [Postman](https://www.postman.com/) ou cURL (sur Linux) :

```curl -s https://cartopirates.fr/api/bateaux | jq```

```curl -s https://cartopirates.fr/api/ports | jq```

## En construisant votre propre client

### Grâce au langage Python

Vous pouvez consulter un exemple d'implémentation en Python : [usages/python](./python)

### Grâce au langage Javascript

Vous pouvez consulter un exemple d'implémentation en Javascript : [usages/javascript](./javascript)