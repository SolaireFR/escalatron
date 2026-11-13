// Point d'entrée Go : sert le front embarqué (version web). L'app mobile est 100 % hors-ligne : aucune route métier,
// toutes les données restent dans le téléphone (localStorage). Le moteur exige une base et un provider d'auth.
package main

import (
	gosvelte "github.com/SolaireFR/gosvelte/gosvelte-core"
	"github.com/SolaireFR/gosvelte/gosvelte-core/config"

	_ "github.com/SolaireFR/gosvelte/gosvelte-core/auth/basic"
	_ "github.com/SolaireFR/gosvelte/gosvelte-core/database/sqlite"
)

var env struct {
	PUBLIC_PROJECT_NAME string `description:"Nom du projet (public)" required:"true"`
}

func init() {
	config.Register(&env)
}

func main() {
	gosvelte.Start()
}
