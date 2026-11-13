// Textes de l'interface (seule langue proposée : français, langue de référence des clés de t()).
// Le contenu d'entraînement (exercices, règles, adaptations) est dans src/lib/training.ts.
import type { Dictionary } from '@solairefr/gosvelte-front/i18n/i18n.svelte.js';

const fr = {
	nav: { week: 'Semaine', session: 'Séance du jour', exercises: 'Exercices' },
	week: {
		title: 'Ma semaine',
		description: 'Planning de la semaine : escalade, renfo et repos.',
		empty: 'Touche un jour pour noter ta grimpe.',
		prev: 'Semaine précédente',
		next: 'Semaine suivante',
		current: 'Revenir à cette semaine',
		question: 'Escalade faite ou prévue ?',
		rest: 'Repos imposé',
		auto: 'Automatique',
		openSession: 'Ouvrir la séance',
		todaySession: 'Séance du jour',
		done: 'Fait'
	},
	session: {
		title: 'Séance',
		description: 'Séance de renfo adaptée à ta grimpe et à ta fatigue.',
		doneToday: 'Séance faite ✓',
		climbDay: 'Jour d’escalade',
		restDay: 'Repos complet',
		restAdvice: 'Repos conseillé',
		restAdvised: 'Repos conseillé : séance allégée, écoute ton corps.',
		prepare: 'Préparer une séance',
		start: 'Démarrer',
		settings: 'Réglages',
		duration: '≈ {minutes} min',
		finished: 'Séance terminée, bravo !'
	},
	fatigue: {
		afterSession: 'Fatigue ressentie après la séance ?',
		afterDay: 'Fatigue ressentie après cette journée ?',
		skip: 'Passer',
		levels: { f1: 'Très frais', f2: 'Frais', f3: 'Fatigué', f4: 'Très fatigué', f5: 'Épuisé' }
	},
	settings: {
		title: 'Réglages de la séance',
		duration: 'Durée',
		minutes: '{n} min',
		recommended: 'Recommandé : {n} min',
		kind: 'Type de séance',
		pains: 'Douleurs ou inconforts du jour',
		painsHint: 'Les exercices qui sollicitent ces zones sont remplacés ou retirés.',
		exercises: 'Exercices',
		variant: 'Autre variante',
		adaptations: 'Adaptations du jour',
		rules: 'Règles',
		rpe: 'RPE 7-8 : garde 2 à 3 répétitions en réserve, jamais d’échec musculaire.'
	},
	player: {
		exercise: 'Exercice {n}/{total}',
		set: 'Série {n}/{total}',
		setDone: 'Série faite',
		startHold: 'Lancer le chrono',
		hold: 'Tiens la position',
		endHold: 'Fini',
		rest: 'Repos',
		plus: '+15 s',
		skipRest: 'Passer',
		next: 'Ensuite : {name}',
		skip: 'Passer l’exercice',
		quit: 'Quitter'
	},
	exercises: {
		title: 'Exercices',
		description: 'Catalogue des exercices au poids du corps, animés, avec le pourquoi de chacun.',
		myEquipment: 'Mon matériel',
		muscles: 'Muscles',
		loads: 'Articulations sollicitées',
		why: 'Pourquoi',
		how: 'Exécution',
		equipment: 'Matériel'
	},
	stickman: { play: 'Animer : {name}', pause: 'Mettre en pause : {name}' }
} satisfies Dictionary;

export default fr;

// Clés du projet typées dans t() (gosvelte-front)
declare module '@solairefr/gosvelte-front/i18n/i18n.svelte.js' {
	interface Register {
		dictionary: typeof fr;
	}
}
