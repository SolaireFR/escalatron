# Escalatron

App mobile 100 % hors-ligne (gosvelte + Capacitor) : renfo au poids du corps qui complète l'escalade sans gêner la
récupération. Tu notes tes séances de grimpe au fil de la semaine ; le planning (renfo, repos) et la séance du jour
s'adaptent. Un stickman animé montre chaque exercice. Les données restent dans le téléphone (localStorage).

| Fichier | Rôle |
| --- | --- |
| `src/lib/training.ts` | catalogue d'exercices (dosage, muscles, pourquoi, animation), séances types, `planWeek`, `adaptSession` |
| `src/lib/week.svelte.ts` | jours notés, variantes choisies, matériel absent (localStorage) |
| `src/lib/fatigue-picker.svelte` | fatigue 1-5, demandée en fin de séance et quand une journée est renseignée |
| `src/lib/stickman.svelte` | stickman : poses interpolées, cinématique inverse des bras et des jambes |
| `src/lib/session-player.svelte`, `countdown.svelte` | séance guidée, minuteur de repos / gainage |
| `src/lib/session-settings.svelte` | réglages d'une séance : fatigue, durée (recommandée), type, variantes, adaptations |
| `src/routes/` | `/` semaine, `/seance?d=AAAA-MM-JJ` séance du jour, `/exercices` catalogue |
| `scripts/check-training.ts` | vérification des règles : `node scripts/check-training.ts` |

## Lancer

```sh
gosvelte dev                      # http://localhost:4444
node scripts/check-training.ts    # règles d'entraînement
gosvelte check
```

## App Android

```sh
gosvelte mobile                   # build du front + copie dans android/
gosvelte mobile open android      # Android Studio → Run
```

Contournement (moteur gosvelte actuel) : Capacitor 8 exige un `package.json` dans `.gosvelte/`, d'où la CLI est
lancée. Après un clone (`.gosvelte/` n'est pas versionné) :

```sh
echo '{ "private": true, "type": "module" }' > .gosvelte/package.json
```
