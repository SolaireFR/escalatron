// Renfo au poids du corps pour grimpeur : catalogue d'exercices (avec l'animation du stickman), séances types,
// planification de la semaine et adaptation de la séance du jour. Module pur, sans dépendance :
// vérifié par `node scripts/check-training.ts`.

export type Vec = [number, number];
export type Category = 'echauffement' | 'poussee' | 'gainage' | 'prevention' | 'jambes' | 'tirage';
/** grip : préhension (avant-bras) ; heavyUpper : poussée lourde ; eccentric, plyo : risque de courbatures */
export type Tag = 'grip' | 'heavyUpper' | 'eccentric' | 'plyo';
/** Zones de douleur / inconfort du jour : les exercices qui les sollicitent sont écartés */
export type Zone = 'doigts' | 'poignets' | 'coudes' | 'epaules' | 'dos' | 'genoux' | 'chevilles';
/** poussee : « Routine conseillée » (haut du corps lourd + gainage + jambes) ; jambes : « Jambes & gainage » */
export type SessionKind = 'poussee' | 'jambes' | 'prevention';
export type DayKind = SessionKind | 'grimpe' | 'repos';
export type ClimbType = 'bloc' | 'voie';

/** hard : bloc limite ou projet en voie */
export interface Climb {
	type: ClimbType;
	hard: boolean;
}

/** Ce que l'utilisateur a noté pour un jour (clé : date AAAA-MM-JJ) */
export interface DayLog {
	climb?: Climb;
	rest?: boolean;
	done?: SessionKind;
	/** Fatigue ressentie en fin de journée ou de séance : 1 = très frais … 5 = épuisé */
	fatigue?: number;
	/** Durée visée de la séance (défaut : recommandée) */
	minutes?: number;
	/** Type de séance choisi (défaut : celui du planning) */
	kind?: SessionKind;
	/** Douleurs / inconforts du jour */
	pains?: Zone[];
}

/**
 * reps / hold : fourchettes [min, max] (répétitions, secondes) ; rest : secondes entre les séries ;
 * unit : unité affichée à la place de « rép. » ; tempo : secondes par répétition pour l'estimation (défaut 2,5)
 */
export interface Dose {
	sets: number;
	reps?: Vec;
	hold?: Vec;
	perSide?: boolean;
	rest: number;
	unit?: string;
	tempo?: number;
}

// ############################ ANIMATION (stickman) ############################
// Repère : viewBox 160 × 120, sol à y = 110, personnage tourné vers la droite (vue de côté). Angles en degrés
// (0 = droite, 90 = haut). Mains et pieds = cibles : coudes et genoux résolus par cinématique inverse.

/** hands / feet : [côté éloigné, côté proche] (vue de face ou de dessus : [gauche, droite] de l'écran) */
export interface Pose {
	hip: Vec;
	torso: number;
	head?: number;
	hands: [Vec, Vec];
	feet: [Vec, Vec];
	/** Valeur libre interpolée (rayon de l'élastique des doigts) */
	fx?: number;
}

export type Anchor = Vec | 'handL' | 'handR' | 'footL' | 'footR';
export type Prop =
	| { kind: 'line'; a: Anchor; b: Anchor; band?: boolean }
	| { kind: 'box'; x: number; y: number; w: number; h: number }
	| { kind: 'circle'; at: Anchor; r: number | 'fx' };

export interface Anim {
	/** Poses parcourues en boucle (deux poses identiques de suite = maintien) */
	keys: Pose[];
	/** Secondes par transition (défaut 1.5) */
	dur?: number;
	linear?: boolean;
	/** above : vue de dessus d'une personne debout (tête et épaules seulement) */
	view?: 'side' | 'front' | 'above';
	ground?: boolean;
	props?: Prop[];
	/** Sens de flexion [bras g., bras d., jambe g., jambe d.] : 1 ou -1 */
	bends?: [number, number, number, number];
	/** Points vers lesquels pointent coudes / genoux (prioritaires sur bends) */
	poles?: (Vec | undefined)[];
}

export type Equipment = 'barre' | 'elastique' | 'paralleles' | 'roue' | 'banc' | 'poids';

/** Matériel configurable : demo = exercice montré sur la vignette ; none = raison affichée quand il manque */
export const EQUIPMENT: Record<Equipment, { label: string; demo: string; none: string }> = {
	barre: { label: 'Barre de traction', demo: 'frenchies', none: 'pas de barre de traction' },
	elastique: { label: 'Élastiques', demo: 'rotation-externe', none: 'pas d’élastique' },
	banc: { label: 'Chaise ou banc', demo: 'dips-chaise', none: 'pas de chaise ni de banc' },
	poids: { label: 'Haltères ou kettlebell', demo: 'goblet-squat', none: 'pas d’haltère' },
	paralleles: { label: 'Parallèles ou anneaux', demo: 'dips', none: 'pas de parallèles ni d’anneaux' },
	roue: { label: 'Roue abdominale', demo: 'ab-wheel', none: 'pas de roue abdominale' }
};

export const ZONES: Record<Zone, string> = {
	doigts: 'Doigts',
	poignets: 'Poignets',
	coudes: 'Coudes',
	epaules: 'Épaules',
	dos: 'Bas du dos',
	genoux: 'Genoux',
	chevilles: 'Chevilles'
};

export interface Exercise {
	id: string;
	name: string;
	category: Category;
	/** Exercices interchangeables (variantes, remplacements automatiques) ; ordre du catalogue = ordre de remplacement */
	slot: string;
	muscles: string[];
	/** Articulations sollicitées : exercice écarté si l'une d'elles est douloureuse ce jour-là */
	loads?: Zone[];
	why: string;
	cues: string;
	/** Matériel en clair (fiche) ; needs : matériel indispensable (exercice écarté s'il manque) */
	equipment?: string;
	needs?: Equipment;
	tags: Tag[];
	dose: Dose;
	anim: Anim;
}

const P = (hip: Vec, torso: number, hands: [Vec, Vec], feet: [Vec, Vec], extra?: Partial<Pose>): Pose => ({
	hip,
	torso,
	hands,
	feet,
	...extra
});

const STAND_FEET: [Vec, Vec] = [[77, 110], [83, 110]];
const FRONT_FEET: [Vec, Vec] = [[72, 110], [88, 110]];
const PLANK_FEET: [Vec, Vec] = [[32, 110], [32, 110]];
const LYING_FEET: [Vec, Vec] = [[77, 114], [83, 114]];
const NO_FEET: [Vec, Vec] = [[80, 60], [80, 60]];
const PUSHUP_UP = P([71.6, 90.8], 25.9, [[101, 110], [103, 110]], PLANK_FEET);
/** Tapis vu de dessus (personne allongée, vue de face sans sol) */
const MAT: Prop = { kind: 'box', x: 30, y: 12, w: 100, h: 106 };

// Cercle des mains autour de l'épaule (80, 34), rayon 33, 8 étapes vers l'avant
const ARM_CIRCLE = Array.from({ length: 8 }, (_, i) => {
	const r = ((-90 + 45 * i) * Math.PI) / 180;
	const hand = (dx: number): Vec => [80 + dx + 33 * Math.cos(r), 34 - 33 * Math.sin(r)];
	return P([80, 66], 90, [hand(-2), hand(0)], STAND_FEET);
});

// Frenchies : suspendu à la barre (y = 10), épaules à 3 hauteurs (bras fléchis au maximum, 90°, presque tendus)
const hang = (shoulderY: number, foot: Vec): Pose =>
	P([78 + (shoulderY - 24) * 0.12, shoulderY + 32], 92, [[78, 10], [80, 10]], [[foot[0] - 2, foot[1]], foot]);
const FRENCH = [hang(24, [72, 92]), hang(34, [74, 102]), hang(41, [76, 108])];

// ############################ CATALOGUE ############################

export const CATEGORIES: Record<Category, { label: string; why: string }> = {
	echauffement: { label: 'Échauffement articulaire', why: '5 minutes pour lubrifier épaules, hanches et omoplates.' },
	poussee: { label: 'Antagonistes : pousser', why: 'L’escalade tire : pousser rééquilibre la posture et protège coudes et épaules.' },
	gainage: { label: 'Centre du corps', why: 'Transférer la force des bras jusqu’aux pieds et garder le bassin près du mur.' },
	prevention: { label: 'Prévention', why: 'Coiffe des rotateurs et extenseurs : l’épaule et le coude du grimpeur.' },
	jambes: { label: 'Jambes, le vrai moteur', why: 'La propulsion doit venir des jambes : appuis sur un pied, poussée, équilibre.' },
	tirage: { label: 'Tirage spécifique', why: 'Endurance de verrouillage : la qualité statique plutôt que le volume.' }
};

export const TAG_LABEL: Record<Tag, string> = {
	grip: 'Préhension',
	heavyUpper: 'Poussée lourde',
	eccentric: 'Excentrique',
	plyo: 'Pliométrie'
};

export const EXERCISES: Exercise[] = [
	// --- Échauffement ---
	{
		id: 'cercles-bras',
		name: 'Cercles de bras',
		category: 'echauffement',
		slot: 'echauffement-epaules',
		muscles: ['Coiffe des rotateurs', 'Deltoïdes'],
		why: 'Lubrifie l’articulation de l’épaule et réveille la coiffe des rotateurs avant toute poussée.',
		cues: 'Grands cercles lents bras tendus : 10 vers l’avant, 10 vers l’arrière.',
		tags: [],
		dose: { sets: 1, reps: [20, 20], rest: 0 },
		anim: { keys: ARM_CIRCLE, dur: 0.5, linear: true }
	},
	{
		id: 'balanciers-jambes',
		name: 'Balanciers de jambes',
		category: 'echauffement',
		slot: 'echauffement-hanches',
		muscles: ['Hanches', 'Ischio-jambiers', 'Fléchisseurs de hanche'],
		why: 'Mobilise la hanche en amplitude : pieds hauts, crochets de talon.',
		cues: 'Une main au mur si besoin, balancier avant-arrière contrôlé, buste stable.',
		tags: [],
		dose: { sets: 1, reps: [10, 10], perSide: true, rest: 0 },
		anim: {
			dur: 1.2,
			keys: [
				P([80, 66], 95, [[76, 64], [84, 64]], [[80, 110], [107.6, 98.9]]),
				P([80, 66], 85, [[76, 64], [84, 64]], [[80, 110], [52.3, 98.9]])
			]
		}
	},
	{
		id: 'squats-air',
		name: 'Squats lents',
		category: 'echauffement',
		slot: 'echauffement-jambes',
		muscles: ['Quadriceps', 'Fessiers', 'Chevilles'],
		loads: ['genoux'],
		why: 'Monte la température des jambes et mobilise chevilles et hanches.',
		cues: 'Descente en 3 secondes, talons au sol, buste fier.',
		tags: [],
		dose: { sets: 1, reps: [10, 10], rest: 0 },
		anim: {
			dur: 1.8,
			keys: [P([80, 66], 90, [[78, 66], [82, 66]], STAND_FEET), P([70, 92], 55, [[118, 62], [120, 64]], [[78, 110], [82, 110]])]
		}
	},
	{
		id: 'pompes-scapulaires',
		name: 'Pompes scapulaires',
		category: 'echauffement',
		slot: 'echauffement-omoplates',
		muscles: ['Dentelé antérieur', 'Trapèzes'],
		loads: ['poignets', 'epaules'],
		why: 'Active le dentelé antérieur, stabilisateur de l’omoplate souvent oublié chez le grimpeur.',
		cues: 'Bras tendus : rapproche puis écarte les omoplates sans plier les coudes.',
		tags: [],
		dose: { sets: 1, reps: [10, 10], rest: 0 },
		anim: { dur: 1, keys: [PUSHUP_UP, { ...PUSHUP_UP, torso: 21 }] }
	},

	// --- Antagonistes : pousser ---
	{
		id: 'pompes',
		name: 'Pompes',
		category: 'poussee',
		slot: 'pompes',
		muscles: ['Pectoraux', 'Triceps', 'Deltoïdes antérieurs', 'Dentelé antérieur'],
		loads: ['poignets', 'epaules'],
		why: 'L’escalade tire, il faut apprendre à pousser : les triceps sont des stabilisateurs indispensables pour les compressions et les rétablissements.',
		cues: 'Corps gainé de la tête aux talons, coudes à 45°, poitrine au ras du sol.',
		tags: ['heavyUpper'],
		dose: { sets: 3, reps: [8, 15], rest: 60 },
		anim: { dur: 1.6, keys: [PUSHUP_UP, P([75.4, 102.4], 9.9, [[101, 110], [103, 110]], PLANK_FEET)] }
	},
	{
		id: 'pompes-genoux',
		name: 'Pompes sur les genoux',
		category: 'poussee',
		slot: 'pompes',
		muscles: ['Pectoraux', 'Triceps', 'Deltoïdes antérieurs'],
		loads: ['poignets', 'epaules'],
		why: 'Version accessible des pompes : même travail antagoniste, charge réduite pour garder 2-3 répétitions en réserve.',
		cues: 'Genoux au sol, ligne droite genoux-épaules, poitrine au ras du sol.',
		tags: ['heavyUpper'],
		dose: { sets: 3, reps: [8, 15], rest: 60 },
		anim: {
			dur: 1.6,
			keys: [
				P([73.8, 97.1], 35.9, [[101, 110], [103, 110]], [[38, 100], [38, 100]]),
				P([77.4, 105.1], 12.9, [[101, 110], [103, 110]], [[38, 100], [38, 100]])
			]
		}
	},
	{
		id: 'pompes-declinees',
		name: 'Pompes déclinées',
		category: 'poussee',
		slot: 'pompes',
		needs: 'banc',
		equipment: 'Chaise ou banc',
		muscles: ['Pectoraux (haut)', 'Deltoïdes antérieurs', 'Triceps'],
		loads: ['poignets', 'epaules'],
		why: 'Déplace la charge vers le haut des pectoraux et l’épaule : transition vers la poussée verticale.',
		cues: 'Pieds sur la chaise, bassin aligné, descente contrôlée en 2 secondes.',
		tags: ['heavyUpper'],
		dose: { sets: 3, reps: [6, 10], rest: 90 },
		anim: {
			dur: 1.6,
			props: [{ kind: 'box', x: 6, y: 92, w: 36, h: 18 }],
			keys: [
				P([70.1, 83.3], 11.5, [[101, 110], [103, 110]], [[27, 92], [27, 92]]),
				P([70.9, 95.5], -4.5, [[101, 110], [103, 110]], [[27, 92], [27, 92]])
			]
		}
	},
	{
		id: 'pompes-diamant',
		name: 'Pompes diamant',
		category: 'poussee',
		slot: 'pompes',
		muscles: ['Triceps', 'Pectoraux'],
		loads: ['poignets', 'coudes', 'epaules'],
		why: 'Cible le triceps, antagoniste du biceps très sollicité en blocage : protège le coude.',
		cues: 'Mains jointes sous le sternum (losange pouces-index), coudes le long du corps.',
		tags: ['heavyUpper'],
		dose: { sets: 3, reps: [6, 10], rest: 90 },
		anim: {
			dur: 1.6,
			keys: [P([71.6, 90.8], 25.9, [[95, 110], [97, 110]], PLANK_FEET), P([75.4, 102.4], 9.9, [[95, 110], [97, 110]], PLANK_FEET)]
		}
	},
	{
		id: 'pompes-archer',
		name: 'Pompes archer',
		category: 'poussee',
		slot: 'pompes',
		muscles: ['Pectoraux', 'Triceps', 'Stabilisateurs de l’épaule'],
		loads: ['poignets', 'epaules', 'coudes'],
		why: 'Surcharge unilatérale sans matériel, stabilité de l’épaule en position large.',
		cues: 'Vue de dessus : mains très écartées, descends sur un bras, l’autre reste tendu.',
		tags: ['heavyUpper'],
		dose: { sets: 3, reps: [4, 6], perSide: true, rest: 120 },
		anim: {
			dur: 1.6,
			view: 'front',
			ground: false,
			bends: [1, -1, -1, 1],
			props: [MAT],
			keys: [
				P([80, 72], 90, [[50, 44], [110, 44]], LYING_FEET),
				P([80, 72], 118, [[50, 44], [110, 44]], LYING_FEET),
				P([80, 72], 90, [[50, 44], [110, 44]], LYING_FEET),
				P([80, 72], 62, [[50, 44], [110, 44]], LYING_FEET)
			]
		}
	},
	{
		id: 'dips',
		name: 'Dips',
		category: 'poussee',
		slot: 'dips',
		needs: 'paralleles',
		equipment: 'Barres parallèles ou anneaux',
		muscles: ['Triceps', 'Pectoraux (bas)', 'Deltoïdes antérieurs'],
		loads: ['epaules', 'coudes'],
		why: 'Renforce les triceps et l’abaissement des épaules : indispensable pour les rétablissements.',
		cues: 'Épaules basses, buste légèrement penché, descendre jusqu’à 90° au coude, sans douleur.',
		tags: ['heavyUpper'],
		dose: { sets: 3, reps: [6, 10], rest: 90 },
		anim: {
			dur: 1.6,
			props: [
				{ kind: 'line', a: [68, 62], b: [98, 62] },
				{ kind: 'line', a: [96, 62], b: [96, 110] }
			],
			keys: [
				P([76.4, 60.5], 80, [[80, 62], [82, 62]], [[62, 96], [64, 96]]),
				P([74.5, 74], 65, [[80, 62], [82, 62]], [[56, 104], [58, 104]])
			]
		}
	},
	{
		id: 'dips-chaise',
		name: 'Dips sur chaise',
		category: 'poussee',
		slot: 'dips',
		needs: 'banc',
		equipment: 'Chaise stable ou banc',
		muscles: ['Triceps', 'Deltoïdes antérieurs'],
		loads: ['epaules', 'coudes', 'poignets'],
		why: 'Triceps sans matériel spécifique : la poussée des rétablissements, avec une simple chaise.',
		cues: 'Mains au bord de la chaise derrière toi, épaules basses, descends jusqu’à 90° au coude, pas plus.',
		tags: ['heavyUpper'],
		dose: { sets: 3, reps: [8, 12], rest: 60 },
		anim: {
			dur: 1.6,
			props: [{ kind: 'box', x: 28, y: 84, w: 32, h: 26 }],
			keys: [
				P([72, 82], 98, [[56, 84], [58, 84]], [[98, 110], [100, 110]]),
				P([74, 100], 95, [[56, 84], [58, 84]], [[98, 110], [100, 110]])
			]
		}
	},
	{
		id: 'pike-pushups',
		name: 'Pompes piquées',
		category: 'poussee',
		slot: 'vertical',
		muscles: ['Deltoïdes antérieurs', 'Triceps', 'Trapèzes supérieurs'],
		loads: ['poignets', 'epaules'],
		why: 'Poussée au-dessus de la tête : équilibre le tirage vertical et stabilise l’omoplate bras en l’air.',
		cues: 'Bassin haut en V inversé, la tête descend devant les mains.',
		tags: ['heavyUpper'],
		dose: { sets: 3, reps: [6, 10], rest: 90 },
		anim: {
			dur: 1.6,
			keys: [P([76, 68], -20, [[106, 110], [108, 110]], [[64, 110], [64, 110]]), P([78, 70], -45, [[106, 110], [108, 110]], [[64, 110], [64, 110]])]
		}
	},
	{
		id: 'developpe-epaules',
		name: 'Développé épaules',
		category: 'poussee',
		slot: 'vertical',
		needs: 'poids',
		equipment: 'Haltères ou kettlebell',
		muscles: ['Deltoïdes', 'Triceps', 'Dentelé antérieur'],
		loads: ['epaules'],
		why: 'Poussée verticale chargée : renforce l’épaule bras en l’air, à l’opposé du tirage.',
		cues: 'Debout gainé, pousse les haltères au-dessus de la tête sans cambrer, descente lente.',
		tags: ['heavyUpper'],
		dose: { sets: 3, reps: [8, 12], rest: 60 },
		anim: {
			dur: 1.6,
			view: 'front',
			poles: [[56, 52], [104, 52]],
			props: [
				{ kind: 'circle', at: 'handL', r: 4 },
				{ kind: 'circle', at: 'handR', r: 4 }
			],
			keys: [P([80, 68], 90, [[62, 32], [98, 32]], FRONT_FEET), P([80, 68], 90, [[66, 3], [94, 3]], FRONT_FEET)]
		}
	},

	// --- Centre du corps ---
	{
		id: 'superman',
		name: 'Superman',
		category: 'gainage',
		slot: 'lombaires',
		muscles: ['Lombaires', 'Fessiers', 'Trapèzes inférieurs'],
		loads: ['dos'],
		why: 'Renforce les lombaires, essentiel pour garder le bassin près du mur, surtout en dévers.',
		cues: 'À plat ventre, soulève bras et jambes en même temps, maintiens 5 secondes, redescends.',
		tags: [],
		dose: { sets: 3, reps: [5, 10], unit: ' maintiens de 5 s', tempo: 6, rest: 30 },
		anim: {
			dur: 1.2,
			keys: [
				P([78, 107], 2, [[142, 106], [143, 106]], [[34, 108], [34, 108]], { head: 15 }),
				P([78, 107], 12, [[139, 90], [140, 90]], [[35, 96], [35, 96]], { head: 20 }),
				P([78, 107], 12, [[139, 90], [140, 90]], [[35, 96], [35, 96]], { head: 20 })
			]
		}
	},
	{
		id: 'bird-dog',
		name: 'Bird dog',
		category: 'gainage',
		slot: 'lombaires',
		muscles: ['Lombaires', 'Fessiers', 'Obliques'],
		loads: ['poignets'],
		why: 'Gainage du dos tout en douceur, bras et jambe opposés : la dissociation des membres sur la paroi.',
		cues: 'À quatre pattes, tends le bras et la jambe opposés, tiens 2 s sans bouger le bassin.',
		tags: [],
		dose: { sets: 3, reps: [6, 10], perSide: true, tempo: 4, rest: 30 },
		anim: {
			dur: 1.6,
			keys: [
				P([60, 88], 20, [[90, 110], [90, 110]], [[38, 110], [38, 110]]),
				P([60, 88], 20, [[90, 110], [124, 72]], [[16, 86], [38, 110]]),
				P([60, 88], 20, [[90, 110], [90, 110]], [[38, 110], [38, 110]]),
				P([60, 88], 20, [[124, 72], [90, 110]], [[38, 110], [16, 86]])
			]
		}
	},
	{
		id: 'mountain-climbers',
		name: 'Mountain climbers lents',
		category: 'gainage',
		slot: 'gainage-dynamique',
		muscles: ['Transverse', 'Fléchisseurs de hanche', 'Obliques'],
		loads: ['poignets', 'epaules'],
		why: 'Ramener un genou sous le corps sans laisser tomber le bassin simule les transferts de poids sur la paroi.',
		cues: 'Position de pompe, ramène lentement un genou vers le coude, bassin immobile.',
		tags: [],
		dose: { sets: 3, reps: [10, 10], perSide: true, rest: 30 },
		anim: {
			dur: 1.2,
			keys: [PUSHUP_UP, { ...PUSHUP_UP, feet: [[32, 110], [78, 104]] }, PUSHUP_UP, { ...PUSHUP_UP, feet: [[78, 104], [32, 110]] }]
		}
	},
	{
		id: 'dead-bug',
		name: 'Dead bug',
		category: 'gainage',
		slot: 'gainage-dynamique',
		muscles: ['Transverse', 'Grand droit', 'Obliques'],
		why: 'Anti-extension sans charge pour le dos : bras et jambe opposés, comme sur un grand mouvement.',
		cues: 'Sur le dos, bas du dos plaqué, tends lentement le bras et la jambe opposés sans décoller les lombaires.',
		tags: [],
		dose: { sets: 3, reps: [6, 10], perSide: true, rest: 30 },
		anim: {
			dur: 1.6,
			bends: [-1, -1, -1, -1],
			keys: [
				P([70, 106], 0, [[101, 73], [102, 73]], [[48, 84], [48, 84]], { head: 12 }),
				P([70, 106], 0, [[101, 73], [134, 98]], [[27, 100], [48, 84]], { head: 12 }),
				P([70, 106], 0, [[101, 73], [102, 73]], [[48, 84], [48, 84]], { head: 12 }),
				P([70, 106], 0, [[134, 98], [102, 73]], [[48, 84], [27, 100]], { head: 12 })
			]
		}
	},
	{
		id: 'planche-laterale',
		name: 'Planche latérale',
		category: 'gainage',
		slot: 'anti-rotation',
		muscles: ['Obliques', 'Carré des lombes', 'Moyen fessier'],
		loads: ['epaules'],
		why: 'Les obliques maintiennent la tension du corps dans les torsions et les grands mouvements latéraux.',
		cues: 'Sur l’avant-bras, de côté, coude sous l’épaule, corps aligné, bassin haut.',
		tags: [],
		dose: { sets: 3, hold: [20, 30], perSide: true, rest: 30 },
		anim: {
			dur: 2.2,
			keys: [
				P([65.7, 99.5], 13.8, [[112, 110], [98, 58]], [[23, 110], [23, 110]]),
				P([65.7, 97.5], 15, [[112, 110], [98, 56]], [[23, 110], [23, 110]])
			]
		}
	},
	{
		id: 'hollow',
		name: 'Hollow body',
		category: 'gainage',
		slot: 'gainage-statique',
		muscles: ['Grand droit', 'Transverse', 'Fléchisseurs de hanche'],
		loads: ['dos'],
		why: 'Gainage anti-extension : verrouille le bassin pour garder les pieds sur les prises en dévers.',
		cues: 'Bas du dos plaqué au sol, bras et jambes tendus, respiration courte.',
		tags: [],
		dose: { sets: 3, hold: [20, 30], rest: 45 },
		anim: {
			dur: 2.2,
			keys: [
				P([80, 106], 15, [[141, 92], [143, 92]], [[38, 96], [38, 96]], { head: 25 }),
				P([80, 106], 18, [[141, 89], [143, 89]], [[38, 93], [38, 93]], { head: 28 })
			]
		}
	},
	{
		id: 'planche-rkc',
		name: 'Planche RKC',
		category: 'gainage',
		slot: 'gainage-statique',
		muscles: ['Transverse', 'Grand droit', 'Fessiers', 'Dentelé antérieur'],
		loads: ['epaules'],
		why: 'Planche en tension maximale : apprend à générer la tension globale utile en dévers.',
		cues: 'Coudes tirés vers les pieds, fessiers et cuisses serrés, bassin en rétroversion.',
		tags: [],
		dose: { sets: 3, hold: [10, 20], rest: 45 },
		anim: {
			dur: 2.2,
			keys: [
				P([65.7, 99.5], 13.8, [[110, 110], [112, 110]], [[23, 110], [23, 110]]),
				P([65.7, 98.3], 14.5, [[110, 110], [112, 110]], [[23, 110], [23, 110]])
			]
		}
	},
	{
		id: 'l-sit',
		name: 'L-sit',
		category: 'gainage',
		slot: 'gainage-statique',
		equipment: 'Sol, parallettes ou deux chaises',
		muscles: ['Fléchisseurs de hanche', 'Grand droit', 'Triceps', 'Abaisseurs de l’épaule'],
		loads: ['poignets', 'epaules'],
		why: 'Compression et abaissement des épaules : transfert direct sur la remontée de pieds en dévers.',
		cues: 'Bras tendus, épaules basses, jambes tendues (genoux pliés en progression).',
		tags: [],
		dose: { sets: 4, hold: [10, 15], rest: 60 },
		anim: {
			dur: 2,
			props: [
				{ kind: 'line', a: [70, 98], b: [88, 98] },
				{ kind: 'line', a: [71, 98], b: [71, 110] },
				{ kind: 'line', a: [87, 98], b: [87, 110] }
			],
			keys: [P([74, 96], 85, [[77, 98], [79, 98]], [[116, 94], [118, 94]]), P([74, 95], 86, [[77, 98], [79, 98]], [[116, 91], [118, 91]])]
		}
	},
	{
		id: 'releves-suspendus',
		name: 'Relevés de jambes suspendus',
		category: 'gainage',
		slot: 'gainage-dynamique',
		needs: 'barre',
		equipment: 'Barre de traction',
		muscles: ['Grand droit', 'Fléchisseurs de hanche', 'Obliques'],
		loads: ['doigts', 'epaules'],
		why: 'Chaîne antérieure complète en suspension : ramener les pieds sous le corps en dévers.',
		cues: 'Sans élan, jambes montées jusqu’à l’horizontale, descente lente.',
		tags: ['grip'],
		dose: { sets: 3, reps: [6, 10], rest: 90 },
		anim: {
			dur: 1.8,
			props: [{ kind: 'line', a: [55, 4], b: [105, 4] }],
			keys: [P([80, 68], 90, [[78, 4], [80, 4]], [[78, 106], [80, 106]]), P([78, 68], 98, [[78, 4], [80, 4]], [[120, 64], [122, 66]])]
		}
	},
	{
		id: 'releves-sol',
		name: 'Relevés de jambes au sol',
		category: 'gainage',
		slot: 'gainage-dynamique',
		muscles: ['Grand droit (bas)', 'Fléchisseurs de hanche'],
		loads: ['dos'],
		why: 'Même chaîne antérieure sans charger les avant-bras : la version des jours autour de la grimpe.',
		cues: 'Bas du dos plaqué, descente lente sans toucher le sol.',
		tags: [],
		dose: { sets: 3, reps: [8, 12], rest: 45 },
		anim: {
			dur: 2,
			keys: [
				P([70, 106], 180, [[71, 107], [71, 107]], [[112, 102], [113, 102]], { head: 170 }),
				P([70, 106], 180, [[71, 107], [71, 107]], [[71, 63], [72, 63]], { head: 170 })
			]
		}
	},
	{
		id: 'ab-wheel',
		name: 'Roue abdominale',
		category: 'gainage',
		slot: 'gainage-dynamique',
		needs: 'roue',
		equipment: 'Roue abdominale',
		muscles: ['Grand droit', 'Transverse', 'Grand dorsal (isométrique)'],
		loads: ['dos', 'epaules'],
		why: 'Anti-extension dynamique : la tension pieds-mains d’un grand mouvement en dévers.',
		cues: 'À genoux, bassin en rétroversion ; avance seulement tant que le dos reste neutre.',
		tags: [],
		dose: { sets: 3, reps: [6, 10], rest: 90 },
		anim: {
			dur: 2,
			props: [{ kind: 'circle', at: 'handR', r: 10 }],
			keys: [P([60, 88], 45, [[86, 100], [88, 100]], [[28, 108], [28, 108]]), P([68, 100], 8, [[128, 100], [130, 100]], [[28, 108], [28, 108]])]
		}
	},
	{
		id: 'pallof',
		name: 'Pallof press',
		category: 'gainage',
		slot: 'anti-rotation',
		needs: 'elastique',
		equipment: 'Élastique',
		muscles: ['Obliques', 'Transverse'],
		why: 'Anti-rotation : empêche le corps de pivoter (« porte qui s’ouvre ») sur les jetés et les prises latérales.',
		cues: 'De profil à l’ancrage, pousse les mains devant le sternum sans laisser le buste tourner.',
		tags: [],
		dose: { sets: 3, reps: [10, 12], perSide: true, rest: 30 },
		anim: {
			dur: 1.6,
			props: [
				{ kind: 'line', a: [18, 30], b: [18, 110] },
				{ kind: 'line', a: [18, 46], b: 'handR', band: true }
			],
			keys: [P([80, 68], 90, [[88, 46], [90, 46]], [[74, 110], [86, 110]]), P([80, 68], 90, [[111, 42], [113, 42]], [[74, 110], [86, 110]])]
		}
	},
	{
		id: 'shoulder-taps',
		name: 'Planche shoulder taps',
		category: 'gainage',
		slot: 'anti-rotation',
		muscles: ['Obliques', 'Transverse', 'Dentelé antérieur'],
		loads: ['poignets', 'epaules'],
		why: 'Anti-rotation sans matériel : le bassin ne doit pas tourner quand une main quitte le sol.',
		cues: 'Position de pompe pieds écartés, touche l’épaule opposée sans balancer le bassin.',
		tags: [],
		dose: { sets: 3, reps: [8, 12], perSide: true, rest: 30 },
		anim: {
			dur: 1,
			keys: [PUSHUP_UP, { ...PUSHUP_UP, hands: [[101, 110], [96, 88]] }, PUSHUP_UP, { ...PUSHUP_UP, hands: [[96, 88], [103, 110]] }]
		}
	},

	// --- Prévention ---
	{
		id: 'rotation-externe',
		name: 'Rotation externe à l’élastique',
		category: 'prevention',
		slot: 'rotation-externe',
		needs: 'elastique',
		equipment: 'Élastique fixé à hauteur de coude',
		muscles: ['Infra-épineux', 'Petit rond'],
		why: 'L’exercice le plus rentable pour stabiliser l’épaule et éviter les blessures : les rotateurs externes sont en retard chez le grimpeur.',
		cues: 'Élastique à hauteur de coude, coude collé au corps à 90°, tourne l’avant-bras vers l’extérieur.',
		tags: [],
		dose: { sets: 3, reps: [15, 15], perSide: true, rest: 30 },
		anim: {
			dur: 1.6,
			view: 'front',
			poles: [[60, 56], [100, 56]],
			props: [
				{ kind: 'line', a: [18, 40], b: [18, 110] },
				{ kind: 'line', a: [18, 56], b: 'handR', band: true }
			],
			keys: [P([80, 68], 90, [[68, 68], [84, 58]], FRONT_FEET), P([80, 68], 90, [[68, 68], [110, 54]], FRONT_FEET)]
		}
	},
	{
		id: 'rotation-externe-haltere',
		name: 'Rotation externe allongé (haltère)',
		category: 'prevention',
		slot: 'rotation-externe',
		needs: 'poids',
		equipment: 'Haltère léger',
		muscles: ['Infra-épineux', 'Petit rond'],
		why: 'Même renfort de la coiffe des rotateurs avec un poids léger, allongé sur le côté.',
		cues: 'Sur le côté, coude collé à la hanche à 90°, monte l’haltère vers le plafond sans décoller le coude.',
		tags: [],
		dose: { sets: 3, reps: [12, 15], perSide: true, rest: 30 },
		anim: {
			dur: 1.6,
			bends: [-1, -1, -1, -1],
			poles: [undefined, [84, 100]],
			props: [{ kind: 'circle', at: 'handR', r: 3.5 }],
			keys: [
				P([70, 100], 0, [[118, 104], [86, 108]], [[30, 104], [30, 104]], { head: 10 }),
				P([70, 100], 0, [[118, 104], [87, 82]], [[30, 104], [30, 104]], { head: 10 })
			]
		}
	},
	{
		id: 'rotation-externe-iso',
		name: 'Rotation externe isométrique',
		category: 'prevention',
		slot: 'rotation-externe',
		equipment: 'Cadre de porte',
		muscles: ['Infra-épineux', 'Petit rond'],
		why: 'Rotation externe sans matériel : le dos de la main pousse contre un cadre de porte, l’épaule se stabilise.',
		cues: 'Coude collé au corps à 90°, pousse le dos de la main contre le cadre 10 s, sans bouger.',
		tags: [],
		dose: { sets: 2, reps: [5, 5], unit: ' poussées de 10 s', tempo: 12, perSide: true, rest: 30 },
		anim: {
			dur: 2,
			view: 'front',
			poles: [[60, 56], [100, 56]],
			props: [{ kind: 'line', a: [116, 14], b: [116, 110] }],
			keys: [P([80, 68], 90, [[68, 68], [112, 54]], FRONT_FEET), P([80, 68], 90, [[68, 68], [113, 53]], FRONT_FEET)]
		}
	},
	{
		id: 'band-pull-apart',
		name: 'Écartés à l’élastique',
		category: 'prevention',
		slot: 'epaules',
		needs: 'elastique',
		equipment: 'Élastique',
		muscles: ['Deltoïdes postérieurs', 'Rhomboïdes', 'Trapèzes moyens'],
		why: 'Renforce les rétracteurs de l’omoplate pour contrer les épaules enroulées vers l’avant.',
		cues: 'Vue de dessus : bras tendus à hauteur d’épaules, écarte jusqu’à la poitrine, 1 s de pause.',
		tags: [],
		dose: { sets: 3, reps: [15, 20], rest: 30 },
		anim: {
			dur: 1,
			view: 'above',
			props: [{ kind: 'line', a: 'handL', b: 'handR', band: true }],
			keys: [
				P([80, 60], 90, [[74, 92], [86, 92]], NO_FEET),
				P([80, 60], 90, [[48.9, 85.4], [111.1, 85.4]], NO_FEET),
				P([80, 60], 90, [[37, 62], [123, 62]], NO_FEET),
				P([80, 60], 90, [[48.9, 85.4], [111.1, 85.4]], NO_FEET)
			]
		}
	},
	{
		id: 'face-pull',
		name: 'Face pull à l’élastique',
		category: 'prevention',
		slot: 'epaules',
		needs: 'elastique',
		equipment: 'Élastique ancré à hauteur du visage',
		muscles: ['Deltoïdes postérieurs', 'Rotateurs externes', 'Trapèzes moyens'],
		why: 'Rétraction + rotation externe : prévention de l’épaule du grimpeur (conflit sous-acromial).',
		cues: 'Vue de dessus : tire vers le front, coudes hauts, finis pouces vers l’arrière.',
		tags: [],
		dose: { sets: 3, reps: [12, 15], rest: 30 },
		anim: {
			dur: 1.6,
			view: 'above',
			props: [
				{ kind: 'line', a: [80, 118], b: 'handL', band: true },
				{ kind: 'line', a: [80, 118], b: 'handR', band: true }
			],
			keys: [P([80, 60], 90, [[76, 93], [84, 93]], NO_FEET), P([80, 60], 90, [[64, 66], [96, 66]], NO_FEET)]
		}
	},
	{
		id: 'oiseau',
		name: 'Oiseau (haltères)',
		category: 'prevention',
		slot: 'epaules',
		needs: 'poids',
		equipment: 'Haltères légers',
		muscles: ['Deltoïdes postérieurs', 'Rhomboïdes', 'Trapèzes moyens'],
		loads: ['dos'],
		why: 'Rétraction de l’omoplate chargée : redresse les épaules enroulées du grimpeur.',
		cues: 'Vue de dessus : buste penché dos plat, écarte les bras jusqu’à l’horizontale, descente lente.',
		tags: [],
		dose: { sets: 3, reps: [12, 15], rest: 45 },
		anim: {
			dur: 1.4,
			view: 'above',
			props: [
				{ kind: 'circle', at: 'handL', r: 4 },
				{ kind: 'circle', at: 'handR', r: 4 }
			],
			keys: [P([80, 60], 90, [[74, 86], [86, 86]], NO_FEET), P([80, 60], 90, [[37, 62], [123, 62]], NO_FEET)]
		}
	},
	{
		id: 'ytw',
		name: 'Y-T-W allongé',
		category: 'prevention',
		slot: 'epaules',
		muscles: ['Trapèzes inférieurs et moyens', 'Deltoïdes postérieurs', 'Rotateurs externes'],
		why: 'Rétraction et abaissement de l’omoplate sans matériel : protège l’épaule du grimpeur.',
		cues: 'Vue de dessus : à plat ventre, pouces vers le ciel, bras en Y, en T puis en W, 2 s par position.',
		tags: [],
		dose: { sets: 3, reps: [6, 8], tempo: 6, rest: 30 },
		anim: {
			dur: 1.4,
			view: 'front',
			ground: false,
			props: [MAT],
			poles: [[50, 52], [110, 52]],
			keys: [
				P([80, 72], 90, [[56, 10], [104, 10]], LYING_FEET),
				P([80, 72], 90, [[37, 42], [123, 42]], LYING_FEET),
				P([80, 72], 90, [[58, 28], [102, 28]], LYING_FEET),
				P([80, 72], 90, [[37, 42], [123, 42]], LYING_FEET)
			]
		}
	},
	{
		id: 'extensions-doigts',
		name: 'Extensions des doigts',
		category: 'prevention',
		slot: 'doigts',
		needs: 'elastique',
		equipment: 'Élastique autour des doigts',
		muscles: ['Extenseurs des doigts', 'Extenseurs du poignet'],
		why: 'Compense la préhension toujours sollicitée en salle : prévient les lésions des poulies et les tendinites du coude.',
		cues: 'Élastique autour des doigts, ouvre la main en grand, retour lent.',
		tags: [],
		dose: { sets: 3, reps: [15, 15], perSide: true, rest: 30 },
		anim: {
			dur: 1,
			props: [{ kind: 'circle', at: 'handR', r: 'fx' }],
			keys: [P([80, 66], 90, [[94, 54], [96, 54]], STAND_FEET, { fx: 2 }), P([80, 66], 90, [[94, 53], [96, 53]], STAND_FEET, { fx: 6 })]
		}
	},
	{
		id: 'extensions-doigts-main',
		name: 'Extensions des doigts contre la main',
		category: 'prevention',
		slot: 'doigts',
		muscles: ['Extenseurs des doigts', 'Extenseurs du poignet'],
		why: 'Même travail des extenseurs sans élastique : la main opposée fait la résistance.',
		cues: 'Doigts d’une main posés sur ceux de l’autre, ouvre contre la résistance, 2 s par répétition.',
		tags: [],
		dose: { sets: 3, reps: [12, 15], perSide: true, rest: 30 },
		anim: {
			dur: 1.2,
			props: [{ kind: 'circle', at: 'handR', r: 'fx' }],
			keys: [P([80, 66], 90, [[95, 50], [96, 54]], STAND_FEET, { fx: 2 }), P([80, 66], 90, [[95, 48], [96, 54]], STAND_FEET, { fx: 4 })]
		}
	},
	{
		id: 'extensions-poignet',
		name: 'Extensions du poignet (haltère)',
		category: 'prevention',
		slot: 'doigts',
		needs: 'poids',
		equipment: 'Haltère léger',
		muscles: ['Extenseurs du poignet', 'Extenseurs des doigts'],
		loads: ['poignets'],
		why: 'Renforce les extenseurs du poignet : la prévention de référence de l’épicondylite (« tennis elbow »).',
		cues: 'Avant-bras posé sur la cuisse, paume vers le bas, relève le poignet, descente en 3 s.',
		tags: [],
		dose: { sets: 3, reps: [12, 15], perSide: true, rest: 30 },
		anim: {
			dur: 1.2,
			props: [{ kind: 'circle', at: 'handR', r: 3.5 }],
			keys: [P([80, 66], 90, [[94, 54], [96, 57]], STAND_FEET), P([80, 66], 90, [[94, 54], [96, 51]], STAND_FEET)]
		}
	},

	// --- Jambes ---
	{
		id: 'pistol',
		name: 'Pistol squat assisté',
		category: 'jambes',
		slot: 'jambes-force',
		muscles: ['Quadriceps', 'Fessiers', 'Stabilisateurs de cheville'],
		loads: ['genoux', 'chevilles'],
		why: 'L’escalade exige souvent de se lever sur un seul pied : équilibre et force d’appui sur une jambe.',
		cues: 'Tiens un cadre de porte, descends sur une jambe stable (jusqu’à une chaise au début), remonte sans élan.',
		tags: [],
		dose: { sets: 3, reps: [6, 10], perSide: true, rest: 60 },
		anim: {
			dur: 2,
			props: [{ kind: 'box', x: 50, y: 96, w: 24, h: 14 }],
			keys: [P([80, 66], 90, [[110, 38], [112, 36]], [[80, 110], [110, 96]]), P([72, 94], 60, [[118, 66], [120, 64]], [[80, 110], [115, 92]])]
		}
	},
	{
		id: 'squats-bulgares',
		name: 'Squats bulgares',
		category: 'jambes',
		slot: 'jambes-force',
		needs: 'banc',
		equipment: 'Chaise ou banc',
		muscles: ['Quadriceps', 'Fessiers', 'Adducteurs'],
		loads: ['genoux'],
		why: 'Force sur une jambe pour pousser sur un pied haut, sans prise de masse (volume modéré).',
		cues: 'Pied arrière sur la chaise, genou avant dans l’axe du pied, descente verticale.',
		tags: [],
		dose: { sets: 3, reps: [8, 10], perSide: true, rest: 60 },
		anim: {
			dur: 1.8,
			props: [{ kind: 'box', x: 26, y: 92, w: 26, h: 18 }],
			keys: [P([80, 69], 80, [[84, 70], [86, 70]], [[42, 92], [94, 110]]), P([78, 88], 75, [[84, 88], [86, 88]], [[42, 92], [94, 110]])]
		}
	},
	{
		id: 'fentes-avant',
		name: 'Fentes avant',
		category: 'jambes',
		slot: 'jambes-force',
		muscles: ['Fessiers', 'Quadriceps'],
		loads: ['genoux'],
		why: 'Puissance des fessiers et des quadriceps : les mouvements dynamiques et la propulsion.',
		cues: 'Grand pas en avant, genou arrière vers le sol jusqu’à 90°, pousse dans le talon avant pour revenir.',
		tags: [],
		dose: { sets: 3, reps: [10, 10], perSide: true, rest: 60 },
		anim: {
			dur: 1.6,
			keys: [P([80, 66], 90, [[78, 66], [82, 66]], [[79, 110], [82, 110]]), P([101, 86], 88, [[101, 86], [103, 86]], [[79, 110], [123, 110]])]
		}
	},
	{
		id: 'fentes-arriere',
		name: 'Fentes arrière',
		category: 'jambes',
		slot: 'jambes-force',
		muscles: ['Quadriceps', 'Fessiers', 'Adducteurs'],
		loads: ['genoux'],
		why: 'Force sur une jambe sans matériel ; reculer plutôt qu’avancer ménage le genou avant.',
		cues: 'Recule une jambe, genou arrière près du sol, pousse dans le talon avant pour remonter.',
		tags: [],
		dose: { sets: 3, reps: [8, 10], perSide: true, rest: 60 },
		anim: {
			dur: 1.6,
			keys: [P([80, 66], 90, [[78, 66], [82, 66]], [[79, 110], [82, 110]]), P([62, 86], 88, [[62, 86], [64, 86]], [[40, 110], [82, 110]])]
		}
	},
	{
		id: 'step-up',
		name: 'Montées sur chaise',
		category: 'jambes',
		slot: 'jambes-force',
		needs: 'banc',
		equipment: 'Chaise stable, banc ou marche',
		muscles: ['Quadriceps', 'Fessiers'],
		loads: ['genoux'],
		why: 'Pousser sur un pied haut et se rétablir dessus, exactement comme sur une grande marche.',
		cues: 'Pied entier sur la chaise, pousse sur cette jambe seulement, monte le genou opposé, redescends lentement.',
		tags: [],
		dose: { sets: 3, reps: [8, 10], perSide: true, rest: 60 },
		anim: {
			dur: 1.6,
			props: [{ kind: 'box', x: 86, y: 98, w: 30, h: 12 }],
			keys: [P([74, 72], 85, [[78, 72], [80, 72]], [[72, 110], [94, 98]]), P([94, 54], 90, [[94, 86], [96, 86]], [[88, 92], [94, 98]])]
		}
	},
	{
		id: 'goblet-squat',
		name: 'Goblet squat',
		category: 'jambes',
		slot: 'jambes-force',
		needs: 'poids',
		equipment: 'Haltère ou kettlebell',
		muscles: ['Quadriceps', 'Fessiers', 'Adducteurs'],
		loads: ['genoux', 'dos'],
		why: 'Force des jambes chargée, buste droit : la poussée sur les pieds sans prise de masse (volume modéré).',
		cues: 'Poids contre la poitrine, descends talons au sol, coudes entre les genoux, remonte en poussant le sol.',
		tags: [],
		dose: { sets: 3, reps: [8, 12], rest: 60 },
		anim: {
			dur: 1.8,
			props: [{ kind: 'circle', at: 'handR', r: 5 }],
			keys: [P([80, 66], 90, [[88, 48], [90, 48]], STAND_FEET), P([70, 92], 55, [[96, 78], [98, 78]], [[78, 110], [82, 110]])]
		}
	},
	{
		id: 'wall-sit',
		name: 'Chaise au mur',
		category: 'jambes',
		slot: 'jambes-force',
		equipment: 'Un mur',
		muscles: ['Quadriceps', 'Fessiers'],
		loads: ['genoux'],
		why: 'Endurance isométrique des cuisses, sans impact : tenir sur les jambes pour reposer les bras.',
		cues: 'Dos plaqué au mur, cuisses à l’horizontale, genoux au-dessus des chevilles.',
		tags: [],
		dose: { sets: 3, hold: [30, 45], rest: 45 },
		anim: {
			dur: 2,
			props: [{ kind: 'line', a: [50, 10], b: [50, 110] }],
			keys: [P([56, 88], 90, [[70, 84], [72, 86]], [[78, 110], [78, 110]]), P([56, 89], 90, [[70, 85], [72, 87]], [[78, 110], [78, 110]])]
		}
	},
	{
		id: 'fentes-sautees',
		name: 'Fentes sautées',
		category: 'jambes',
		slot: 'explosif',
		muscles: ['Quadriceps', 'Fessiers', 'Mollets'],
		loads: ['genoux', 'chevilles'],
		why: 'Explosivité des jambes pour les jetés et les mouvements dynamiques, en petit volume.',
		cues: 'Réception souple et silencieuse, buste droit, change de jambe en l’air.',
		tags: ['plyo'],
		dose: { sets: 3, reps: [6, 8], perSide: true, rest: 60 },
		anim: {
			dur: 0.9,
			keys: [
				P([78, 86], 88, [[88, 76], [70, 80]], [[56, 110], [98, 110]]),
				P([80, 62], 90, [[84, 62], [76, 62]], [[74, 104], [86, 104]]),
				P([78, 86], 88, [[70, 80], [88, 76]], [[98, 110], [56, 110]]),
				P([80, 62], 90, [[76, 62], [84, 62]], [[86, 104], [74, 104]])
			]
		}
	},
	{
		id: 'nordic',
		name: 'Nordic curls',
		category: 'jambes',
		slot: 'ischios',
		equipment: 'Pieds calés sous un meuble lourd',
		muscles: ['Ischio-jambiers'],
		loads: ['genoux'],
		why: 'Excentrique des ischios : protège le genou et renforce les crochets de talon.',
		cues: 'Gainé des genoux aux épaules, descente la plus lente possible, mains prêtes à amortir.',
		tags: ['eccentric'],
		dose: { sets: 3, reps: [3, 5], rest: 90 },
		anim: {
			dur: 2.5,
			props: [{ kind: 'box', x: 28, y: 101, w: 18, h: 6 }],
			keys: [P([60, 88], 90, [[72, 62], [74, 62]], [[38, 110], [38, 110]]), P([76.9, 95.9], 40, [[118, 92], [120, 92]], [[38, 110], [38, 110]])]
		}
	},
	{
		id: 'pont-fessier',
		name: 'Pont fessier',
		category: 'jambes',
		slot: 'ischios',
		muscles: ['Fessiers', 'Ischio-jambiers'],
		why: 'Chaîne postérieure sans courbatures : hanches près du mur, crochets de talon.',
		cues: 'Pousse dans les talons, serre les fessiers 2 s en haut sans cambrer ; sur une jambe si trop facile.',
		tags: [],
		dose: { sets: 3, reps: [10, 12], rest: 45 },
		anim: {
			dur: 1.8,
			keys: [
				P([72, 106], 180, [[73, 106.5], [73.5, 106.5]], [[100, 110], [100, 110]], { head: 175 }),
				P([66, 86], 217.6, [[73, 106.5], [73.5, 106.5]], [[100, 110], [100, 110]], { head: 172 })
			]
		}
	},
	{
		id: 'mollets',
		name: 'Montées sur pointes',
		category: 'jambes',
		slot: 'mollets',
		muscles: ['Mollets', 'Stabilisateurs de cheville'],
		loads: ['chevilles'],
		why: 'Tenir sur la pointe de pied sur les petites prises : force et stabilité de la cheville.',
		cues: 'Monte sur la pointe des pieds, tiens 1 s en haut, redescends lentement (sur une marche pour plus d’amplitude).',
		tags: [],
		dose: { sets: 3, reps: [15, 20], rest: 30 },
		anim: {
			dur: 1.2,
			props: [
				{ kind: 'line', a: 'footL', b: [89, 110] },
				{ kind: 'line', a: 'footR', b: [92, 110] }
			],
			keys: [P([80, 66], 90, [[78, 66], [82, 66]], [[79, 110], [82, 110]]), P([80, 58], 90, [[78, 58], [82, 58]], [[79, 102], [82, 102]])]
		}
	},

	// --- Tirage spécifique ---
	{
		id: 'frenchies',
		name: 'Frenchies',
		category: 'tirage',
		slot: 'verrouillage',
		needs: 'barre',
		equipment: 'Barre de traction',
		muscles: ['Grand dorsal', 'Biceps', 'Fléchisseurs des doigts'],
		loads: ['doigts', 'coudes', 'epaules'],
		why: 'Calque l’effort du grimpeur qui se verrouille d’un bras pour chercher la prise suivante : endurance de blocage.',
		cues: 'Monte au-dessus de la barre, bloque 5 s ; redescends à 90°, bloque 5 s ; presque en bas, bloque 5 s. Qualité, pas volume.',
		tags: ['grip'],
		dose: { sets: 3, reps: [1, 1], unit: ' cycle (3 × 5 s)', tempo: 20, rest: 90 },
		anim: {
			dur: 1,
			props: [{ kind: 'line', a: [58, 10], b: [102, 10] }],
			keys: [FRENCH[0], FRENCH[0], FRENCH[1], FRENCH[1], FRENCH[2], FRENCH[2]]
		}
	}
];

export const EX: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

// ############################ SÉANCES TYPES ############################

export const WARMUP = ['cercles-bras', 'balanciers-jambes', 'squats-air', 'pompes-scapulaires'];

/** exercises : ordre de la séance ; optional : retirés dans cet ordre si la durée visée est trop courte */
/**
 * exercises : ordre de la séance ; optional : retirés dans cet ordre si la durée visée est trop courte.
 * poussee = routine conseillée (4 piliers : antagonistes, centre du corps, jambes, tirage spécifique), 2 fois par semaine.
 */
export const SESSIONS: Record<SessionKind, { title: string; goal: string; exercises: string[]; optional: string[] }> = {
	poussee: {
		title: 'Routine conseillée',
		goal: 'Les 4 piliers hors-mur : antagonistes, centre du corps, jambes et verrouillage, en 20 à 30 minutes.',
		exercises: ['rotation-externe', 'pompes', 'mountain-climbers', 'superman', 'fentes-avant', 'extensions-doigts', 'frenchies'],
		optional: ['frenchies', 'superman', 'fentes-avant']
	},
	jambes: {
		title: 'Jambes & gainage',
		goal: 'Le vrai moteur : appuis sur un pied, propulsion, gainage latéral, et les triceps des rétablissements.',
		exercises: ['pistol', 'squats-bulgares', 'fentes-sautees', 'nordic', 'planche-laterale', 'dips', 'face-pull'],
		optional: ['fentes-sautees', 'squats-bulgares', 'face-pull']
	},
	prevention: {
		title: 'Prévention & mobilité',
		goal: 'Séance légère : épaules, doigts, dos. Aucune fatigue pour la grimpe.',
		exercises: ['rotation-externe', 'face-pull', 'extensions-doigts', 'superman', 'planche-laterale', 'pont-fessier'],
		optional: ['pont-fessier', 'planche-laterale']
	}
};

export const KIND_LABEL: Record<DayKind, string> = {
	grimpe: 'Escalade',
	repos: 'Repos',
	poussee: 'Routine conseillée',
	jambes: 'Jambes & gainage',
	prevention: 'Prévention & mobilité'
};

/** Durées proposées (minutes, échauffement compris) : 20 à 30 conseillées, 45 au maximum */
export const DURATIONS = [20, 30, 40, 45];

/** Séances de renfo (routine, jambes) par semaine ; au-delà, séances légères de prévention */
export const MAX_STRENGTH_PER_WEEK = 2;

export const RULES = [
	'Renfo uniquement les jours sans escalade : 2 séances par semaine, 20 à 30 min échauffement compris.',
	'Sans chercher l’épuisement : garde de l’énergie pour la récupération.',
	'1 à 2 jours de repos complet (ni grimpe, ni renfo) garantis chaque semaine.',
	'Jamais de haut du corps lourd la veille d’un bloc limite ou d’un projet en voie.',
	'Pas de préhension (suspension) la veille ou le lendemain d’une séance de grimpe.',
	'Pas d’excentrique ni de pliométrie la veille d’une séance intense : zéro courbature.',
	'RPE 7-8 : garde 2 à 3 répétitions en réserve, jamais d’échec musculaire.'
];

export const isSession = (k: DayKind): k is SessionKind => k === 'poussee' || k === 'jambes' || k === 'prevention';

export function climbLabel(c: Climb): string {
	if (c.type === 'bloc') return c.hard ? 'Bloc limite' : 'Bloc';
	return c.hard ? 'Voie projet' : 'Voie';
}

// ############################ DATES (heure locale) ############################

export const isoDate = (d: Date) =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function toDate(iso: string): Date {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
	const d = toDate(iso);
	d.setDate(d.getDate() + n);
	return isoDate(d);
}

/** Les 7 dates (lundi → dimanche) de la semaine contenant iso */
export function weekDates(iso: string): string[] {
	const monday = addDays(iso, -((toDate(iso).getDay() + 6) % 7));
	return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

// ############################ PLANIFICATION DE LA SEMAINE ############################

export interface DayPlan {
	date: string;
	kind: DayKind;
	climb?: Climb;
	/** Jour passé ou séance faite */
	done: boolean;
	reason: string;
}

export interface WeekPlan {
	days: DayPlan[];
	warnings: string[];
}

type Draft = Omit<DayPlan, 'kind'> & { kind?: DayKind };

const isStrength = (k?: DayKind) => k === 'poussee' || k === 'jambes';
const count = (days: Draft[], kind: DayKind) => days.filter((d) => d.kind === kind).length;

/**
 * Planning de la semaine : jours notés (grimpe, repos imposé, séance faite), jours passés sans rien = repos, puis pour
 * les jours libres à venir : jours de repos (1 à 2 au total) et type de séance de renfo (3 au maximum).
 */
export function planWeek(dates: string[], logs: Record<string, DayLog>, today: string): WeekPlan {
	const days = dates.map((date) => fixedDay(date, logs[date], date < today));
	adjustDays(days, logs, false); // forte fatigue d'abord : un repos imposé par la fatigue compte dans les 1 à 2 repos
	assignRests(days, logs);
	assignSessions(days, logs);
	adjustDays(days, logs, true);
	const warnings = count(days, 'repos') ? [] : ['Aucun jour de repos complet cette semaine : tes tendons en ont besoin pour récupérer.'];
	return { days: days as DayPlan[], warnings };
}

function fixedDay(date: string, log: DayLog | undefined, past: boolean): Draft {
	if (log?.climb) return { date, kind: 'grimpe', climb: log.climb, done: past, reason: climbLabel(log.climb) };
	if (log?.rest) return { date, kind: 'repos', done: past, reason: 'Repos choisi' };
	if (log?.done) return { date, kind: log.done, done: true, reason: 'Séance faite' };
	if (past) return { date, kind: 'repos', done: true, reason: 'Aucune activité notée' };
	if (log?.kind) return { date, kind: log.kind, done: false, reason: 'Type de séance choisi' };
	return { date, done: false, reason: '' };
}

/** Repos manquants (objectif : 2, ou 1 s'il reste moins de 3 jours sans grimpe) placés sur les meilleurs jours libres */
function assignRests(days: Draft[], logs: Record<string, DayLog>): void {
	const free = days.filter((d) => d.kind !== 'grimpe').length;
	const target = free >= 3 ? 2 : Math.min(free, 1);
	const missing = Math.max(0, target - count(days, 'repos'));
	days
		.filter((d) => !d.kind)
		.map((d) => ({ d, ...restScore(d.date, logs) }))
		.sort((a, b) => b.score - a.score || b.d.date.localeCompare(a.d.date))
		.slice(0, missing)
		.forEach(({ d, reason }) => Object.assign(d, { kind: 'repos', reason }));
}

/** Intérêt d'un jour pour le repos : veille de grimpe intense > lendemain de grimpe intense > entre deux grimpes */
function restScore(date: string, logs: Record<string, DayLog>): { score: number; reason: string } {
	const prev = logs[addDays(date, -1)]?.climb;
	const next = logs[addDays(date, 1)]?.climb;
	if (next?.hard) return { score: 4 + (prev ? 1 : 0), reason: `Veille de ${climbLabel(next).toLowerCase()} : arrive frais` };
	if (prev?.hard) return { score: 3 + (next ? 1 : 0), reason: `Récupération après ${climbLabel(prev).toLowerCase()}` };
	if (prev && next) return { score: 2, reason: 'Entre deux séances de grimpe' };
	if (prev || next) return { score: 1, reason: 'Récupération autour de la grimpe' };
	return { score: 0, reason: 'Repos hebdomadaire (1 à 2 jours garantis)' };
}

/**
 * Mêmes ajustements que la séance du jour (adjustKind) sur les jours à venir encore modifiables (libres ou séance pas
 * encore faite). withNext = false : seule une forte fatigue fixe un jour libre, avant la répartition repos / séances.
 */
function adjustDays(days: Draft[], logs: Record<string, DayLog>, withNext: boolean): void {
	for (const d of days) {
		if (d.done || (d.kind && !isSession(d.kind))) continue;
		const ctx: Context = { fatigue: fatigueFor(d.date, logs), next: withNext ? logs[addDays(d.date, 1)]?.climb : undefined };
		if (!d.kind && (ctx.fatigue ?? 0) < 4) continue;
		const adjusted = adjustKind(d.kind && isSession(d.kind) ? d.kind : 'poussee', ctx, Boolean(logs[d.date]?.kind));
		if (adjusted.kind !== d.kind) Object.assign(d, { kind: adjusted.kind, reason: adjusted.note ?? d.reason });
	}
}

/** Jours restants : alternance poussée / jambes, jambes la veille d'une grimpe intense, au-delà de 3 : séance légère */
function assignSessions(days: Draft[], logs: Record<string, DayLog>): void {
	days.forEach((d, i) => {
		if (d.kind) return;
		const next = logs[addDays(d.date, 1)]?.climb;
		const prevKind = days[i - 1]?.kind;
		if (days.filter((x) => isStrength(x.kind)).length >= MAX_STRENGTH_PER_WEEK) {
			Object.assign(d, { kind: 'prevention', reason: `${MAX_STRENGTH_PER_WEEK} séances de renfo déjà dans la semaine : séance légère` });
			return;
		}
		let kind: SessionKind = count(days, 'poussee') <= count(days, 'jambes') ? 'poussee' : 'jambes';
		if (prevKind === kind) kind = kind === 'poussee' ? 'jambes' : 'poussee';
		let reason = 'Équilibre poussée / jambes de la semaine';
		if (next?.hard && kind === 'poussee') {
			kind = prevKind === 'jambes' ? 'prevention' : 'jambes';
			reason = `Veille de ${climbLabel(next).toLowerCase()} : pas de haut du corps lourd`;
		}
		Object.assign(d, { kind, reason });
	});
}

// ############################ ADAPTATION DE LA SÉANCE DU JOUR ############################

/**
 * Fatigue à prendre en compte pour la séance d'un jour : dernière fatigue notée (le jour même après une activité, sinon
 * les 3 jours précédents), diminuée d'un point par jour de récupération écoulé depuis.
 * ponytail: récupération linéaire d'un point par jour, à affiner si les retours le demandent
 */
export function fatigueFor(date: string, logs: Record<string, DayLog>): number | undefined {
	for (let back = 0; back <= 3; back++) {
		const fatigue = logs[addDays(date, -back)]?.fatigue;
		if (fatigue) return Math.max(1, fatigue - Math.max(0, back - 1));
	}
	return undefined;
}

export interface Context {
	prev?: Climb;
	next?: Climb;
	fatigue?: number;
}

/** base : exercice de la séance type (clé des variantes choisies), ex : exercice réellement fait */
export interface SessionItem {
	base: string;
	ex: Exercise;
	sets: number;
}

export interface Session {
	kind: DayKind;
	items: SessionItem[];
	notes: string[];
	/** Durée estimée (minutes) */
	minutes: number;
	/** Durée visée et durée recommandée pour ce jour */
	target: number;
	recommended: { minutes: number; reason: string };
	/** Séance faite à la demande de l'utilisateur alors que le repos était conseillé (fatigue 4 ou 5) */
	restAdvised: boolean;
}

/** Choix de l'utilisateur : variantes (par exercice de la séance type), durée visée (défaut : recommandée), matériel
 * absent, douleurs du jour, séance voulue malgré un repos conseillé (force, cf. adjustKind) */
export interface Options {
	prefs?: Record<string, string>;
	minutes?: number;
	missing?: readonly string[];
	pains?: readonly string[];
	force?: boolean;
}

const AVOID_REASON: Record<Tag, string> = {
	grip: 'grimpe la veille ou le lendemain, avant-bras préservés',
	eccentric: 'veille de grimpe intense, pas d’excentrique (courbatures)',
	plyo: 'veille de grimpe intense, pas de pliométrie (courbatures)',
	heavyUpper: 'veille de grimpe intense'
};

/** Exercice faisable avec le matériel disponible */
export const available = (e: Exercise, missing: readonly string[]) => !e.needs || !missing.includes(e.needs);

/**
 * Type de séance réellement fait ce jour-là : repos si fatigue 5, prévention si fatigue 4, jambes au lieu de poussée la
 * veille d'une grimpe intense. Règles communes au planning (planWeek) et à la séance (adaptSession) : les deux écrans
 * affichent toujours la même chose. force : séance voulue par l'utilisateur (demandée ou type choisi), la fatigue ne
 * change plus le type (elle allège seulement le volume, cf. adjustVolume).
 */
export function adjustKind(kind: SessionKind, ctx: Context, force = false): { kind: DayKind; note?: string } {
	const fatigue = ctx.fatigue ?? 2;
	if (!force && fatigue >= 5) return { kind: 'repos', note: 'Fatigue 5/5 : repos complet, la grimpe passe avant' };
	if (!force && fatigue === 4 && kind !== 'prevention') return { kind: 'prevention', note: 'Fatigue 4/5 : séance légère, aucune charge lourde' };
	const warning = force && fatigue >= 4 ? `Fatigue ${fatigue}/5 : repos conseillé, séance allégée à ta demande` : undefined;
	if (ctx.next?.hard && kind === 'poussee') {
		const note = `Veille de ${climbLabel(ctx.next).toLowerCase()} : pas de haut du corps lourd`;
		return { kind: 'jambes', note: warning ? `${warning}. ${note}` : note };
	}
	return { kind, note: warning };
}

/** Séance du jour : type ajusté (adjustKind), exercices remplacés (tags interdits, matériel absent), volume ajusté au
 * contexte puis à la durée visée */
export function adaptSession(requested: SessionKind, ctx: Context, options: Options = {}): Session {
	const { prefs = {}, minutes, missing = [], pains = [], force = false } = options;
	const fatigue = ctx.fatigue ?? 2;
	const adjusted = adjustKind(requested, ctx, force);
	const notes = adjusted.note ? [`${adjusted.note}.`] : [];
	if (!isSession(adjusted.kind)) {
		return { kind: adjusted.kind, items: [], notes, minutes: 0, target: 0, recommended: { minutes: 0, reason: '' }, restAdvised: true };
	}
	const kind = adjusted.kind;
	if (pains.length) notes.push(painNote(pains));
	const blocker = blockerFor(avoidedTags(ctx), missing, pains);
	const taken = new Set<string>();
	const items = SESSIONS[kind].exercises.flatMap((id) => pick(id, prefs, blocker, taken, notes));
	adjustVolume(items, ctx, fatigue, notes);
	const warm = WARMUP.filter((id) => !hurts(EX[id], pains)).map((id): SessionItem => ({ base: id, ex: EX[id], sets: 1 }));
	const recommended = recommendMinutes(kind, ctx);
	const target = Math.min(45, minutes ?? recommended.minutes);
	fitDuration(items, target * 60 - totalSeconds(warm), target, SESSIONS[kind].optional, fatigue < 3 && !ctx.next?.hard, notes);
	const all = [...warm, ...items];
	const restAdvised = force && fatigue >= 4;
	return { kind, items: all, notes, minutes: Math.round(totalSeconds(all) / 60), target, recommended, restAdvised };
}

/** Tags interdits ce jour-là : préhension autour de la grimpe, courbatures la veille d'une séance intense */
function avoidedTags(ctx: Context): Set<Tag> {
	const avoid = new Set<Tag>();
	if (ctx.prev || ctx.next) avoid.add('grip');
	if (ctx.next?.hard) avoid.add('eccentric').add('plyo');
	return avoid;
}

/** Première zone douloureuse sollicitée par l'exercice, undefined sinon */
const hurts = (e: Exercise, pains: readonly string[]) => e.loads?.find((z) => pains.includes(z));

function painNote(pains: readonly string[]): string {
	const zones = pains.map((z) => (ZONES[z as Zone] ?? z).toLowerCase()).join(', ');
	return `Douleur ou inconfort (${zones}) : exercices qui sollicitent ces zones écartés. Douleur vive ou qui persiste : arrête et consulte.`;
}

/** Durée conseillée : courte avant la grimpe ou en cas de fatigue, 20 min pour une séance légère */
export function recommendMinutes(kind: DayKind, ctx: Context): { minutes: number; reason: string } {
	if (kind === 'prevention') return { minutes: 20, reason: 'Séance légère : 20 minutes suffisent.' };
	if ((ctx.fatigue ?? 2) >= 4) return { minutes: 20, reason: 'Grosse fatigue : 20 minutes au maximum.' };
	if (ctx.next) return { minutes: 20, reason: `${climbLabel(ctx.next)} demain : séance courte pour arriver frais.` };
	if ((ctx.fatigue ?? 2) >= 3) return { minutes: 20, reason: 'Un peu de fatigue : séance courte.' };
	return { minutes: 30, reason: 'Une bonne séance hors-mur dure 20 à 30 minutes, sans chercher l’épuisement.' };
}

const totalSeconds = (items: SessionItem[]) => items.reduce((s, it) => s + itemSeconds(it), 0);
const setSeconds = (it: SessionItem) => itemSeconds({ ...it, sets: 1 });

/**
 * Séance tenue dans le budget (secondes hors échauffement) : trop longue → séries réduites jusqu'à 2 (les plus longues
 * d'abord), puis exercices optionnels retirés ; trop courte (si grow) → une série de plus sur les exercices non ajustés.
 */
function fitDuration(items: SessionItem[], budget: number, minutes: number, optional: string[], grow: boolean, notes: string[]): void {
	const dropped: string[] = [];
	while (totalSeconds(items) > budget) {
		const longest = items.filter((it) => it.sets > 2).sort((a, b) => setSeconds(b) - setSeconds(a))[0];
		if (longest) {
			longest.sets -= 1;
			continue;
		}
		const id = optional.find((o) => items.some((it) => it.base === o));
		if (!id) break;
		dropped.push(items.splice(items.findIndex((it) => it.base === id), 1)[0].ex.name);
	}
	for (const it of grow ? items : []) {
		if (it.sets === it.ex.dose.sets && totalSeconds(items) + setSeconds(it) <= budget) it.sets += 1;
	}
	if (dropped.length) notes.push(`Séance de ${minutes} min : ${dropped.join(', ')} retiré${dropped.length > 1 ? 's' : ''}.`);
}

/** Raison d'écarter un exercice aujourd'hui (matériel absent, zone douloureuse, tag interdit), null s'il est faisable */
function blockerFor(avoid: Set<Tag>, missing: readonly string[], pains: readonly string[]) {
	return (e: Exercise): string | null => {
		if (e.needs && !available(e, missing)) return EQUIPMENT[e.needs].none;
		const zone = hurts(e, pains);
		if (zone) return `douleur (${ZONES[zone].toLowerCase()})`;
		const tag = e.tags.find((t) => avoid.has(t));
		return tag ? AVOID_REASON[tag] : null;
	};
}

/** Exercice choisi (variante de l'utilisateur), remplacé par un autre du même slot s'il est écarté ou déjà dans la
 * séance (taken), retiré si aucun ne convient */
function pick(id: string, prefs: Record<string, string>, blocker: (e: Exercise) => string | null, taken: Set<string>, notes: string[]): SessionItem[] {
	const pref = EX[prefs[id]];
	const chosen = pref?.slot === EX[id].slot ? pref : EX[id];
	const reason = blocker(chosen) ?? (taken.has(chosen.id) ? 'déjà dans la séance' : null);
	const ex = reason ? EXERCISES.find((e) => e.slot === chosen.slot && !blocker(e) && !taken.has(e.id)) : chosen;
	if (reason) notes.push(ex ? `${chosen.name} → ${ex.name} : ${reason}.` : `${chosen.name} retiré : ${reason}.`);
	if (!ex) return [];
	taken.add(ex.id);
	return [{ base: id, ex, sets: ex.dose.sets }];
}

function adjustVolume(items: SessionItem[], ctx: Context, fatigue: number, notes: string[]): void {
	const push = items.filter((it) => it.ex.tags.includes('heavyUpper'));
	const fingers = items.filter((it) => it.ex.slot === 'doigts');
	if (ctx.prev?.type === 'bloc' && push.length) {
		push.forEach((it) => (it.sets = Math.max(2, it.sets - 1)));
		notes.push('Bloc hier : une série de poussée en moins (tendons des épaules et des coudes).');
	} else if (ctx.next?.type === 'bloc' && push.length) {
		push.forEach((it) => (it.sets = Math.max(2, it.sets - 1)));
		notes.push('Bloc demain : haut du corps allégé d’une série pour rester explosif.');
	}
	if (ctx.prev?.type === 'voie' && fingers.length) {
		fingers.forEach((it) => (it.sets += 1));
		notes.push('Voie hier : une série d’extensions des doigts en plus pour décongestionner les avant-bras.');
	}
	if (ctx.next?.type === 'voie' && !ctx.next.hard) notes.push('Voie demain : volume normal, aucune préhension.');
	if (fatigue >= 3) {
		items.forEach((it) => (it.sets = Math.max(1, it.sets - 1)));
		notes.push(`Fatigue ${fatigue}/5 : une série de moins partout, vise RPE 7.`);
	}
}

const avg = (v: Vec) => (v[0] + v[1]) / 2;

/** Durée estimée : travail (tempo par répétition, 2,5 s par défaut, ou temps de maintien) + repos, par série */
export function itemSeconds(it: SessionItem): number {
	const d = it.ex.dose;
	const work = (d.hold ? avg(d.hold) : avg(d.reps ?? [10, 10]) * (d.tempo ?? 2.5)) * (d.perSide ? 2 : 1);
	return it.sets * (work + d.rest);
}

/** Objectif d'une série : « 6-10 rép. par côté », « 20-30 s », « 5-10 maintiens de 5 s » */
export function formatTarget(d: Dose): string {
	const range = (v: Vec, unit: string) => (v[0] === v[1] ? `${v[0]}${unit}` : `${v[0]}-${v[1]}${unit}`);
	return (d.hold ? range(d.hold, ' s') : range(d.reps ?? [10, 10], d.unit ?? ' rép.')) + (d.perSide ? ' par côté' : '');
}

export function formatDose(d: Dose, sets = d.sets): string {
	const min = Math.floor(d.rest / 60);
	const rest = d.rest ? ` · repos ${min ? `${min} min${d.rest % 60 ? ` ${d.rest % 60}` : ''}` : `${d.rest} s`}` : '';
	return `${sets} × ${formatTarget(d)}${rest}`;
}
