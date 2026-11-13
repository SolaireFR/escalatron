// Vérification de la logique d'entraînement : node scripts/check-training.ts (Node 24, types effacés à la volée)
import assert from 'node:assert/strict';
import { adaptSession, addDays, isSession, available, DURATIONS, EQUIPMENT, EX, EXERCISES, fatigueFor, planWeek, recommendMinutes, SESSIONS, WARMUP, weekDates, ZONES, type DayLog, type SessionKind, type Zone } from '../src/lib/training.ts';

const MONDAY = '2026-11-09';
const week = weekDates('2026-11-12');
assert.deepEqual([week[0], week[6]], [MONDAY, '2026-11-15'], 'semaine du lundi au dimanche');

// Chaque séance type tient en 15-45 min échauffement compris, et chaque exercice existe
for (const kind of Object.keys(SESSIONS) as SessionKind[]) {
	const s = adaptSession(kind, {});
	assert.ok(s.minutes >= 15 && s.minutes <= 45, `${kind} : ${s.minutes} min`);
}
for (const e of EXERCISES) assert.ok(e.anim.keys.length >= 2, `${e.id} : au moins 2 poses`);

// Séances types : exercices connus ; préhension / excentrique = alternative sans ce tag dans le slot, ou exercice optionnel
for (const [kind, s] of Object.entries(SESSIONS)) {
	for (const id of [...s.exercises, ...s.optional]) assert.ok(EX[id], `${kind} : exercice inconnu ${id}`);
	for (const id of s.exercises.filter((x) => EX[x].tags.includes('grip') || EX[x].tags.includes('eccentric'))) {
		const alt = EXERCISES.some((x) => x.slot === EX[id].slot && x.tags.length === 0);
		assert.ok(alt || s.optional.includes(id), `${kind} : ${id} sans alternative ni optionnel`);
	}
}

// Semaine type : bloc limite lundi, voie mercredi, bloc limite vendredi → 2 repos, 2 renfos, pas de poussée jeudi
const logs: Record<string, DayLog> = {
	'2026-11-09': { climb: { type: 'bloc', hard: true } },
	'2026-11-11': { climb: { type: 'voie', hard: false } },
	'2026-11-13': { climb: { type: 'bloc', hard: true } }
};
const plan = planWeek(week, logs, MONDAY).days;
const kinds = plan.map((d) => d.kind);
assert.equal(kinds.filter((k) => k === 'repos').length, 2, `2 repos : ${kinds}`);
assert.equal(kinds.filter((k) => k === 'poussee' || k === 'jambes').length, 2, `2 renfos : ${kinds}`);
assert.notEqual(kinds[3], 'poussee', 'jeudi = veille de bloc limite');
assert.equal(plan[3].kind, 'repos', 'repos de préférence la veille du bloc limite');

// Semaine sans grimpe : 2 repos, 2 renfos (routine conseillée : 2 par semaine), le reste en séance légère
const empty = planWeek(week, {}, MONDAY).days.map((d) => d.kind);
assert.equal(empty.filter((k) => k === 'repos').length, 2);
assert.equal(empty.filter((k) => k === 'poussee' || k === 'jambes').length, 2);
assert.equal(empty.filter((k) => k === 'prevention').length, 3);

// Jours passés sans rien noté = repos ; 7 jours de grimpe = alerte
assert.equal(planWeek(week, {}, '2026-11-12').days[0].kind, 'repos');
const allClimb = Object.fromEntries(week.map((d) => [d, { climb: { type: 'voie', hard: false } }])) as Record<string, DayLog>;
assert.equal(planWeek(week, allClimb, MONDAY).warnings.length, 1);

// Adaptation
assert.equal(adaptSession('poussee', { fatigue: 5 }).kind, 'repos');
assert.equal(adaptSession('jambes', { fatigue: 4 }).kind, 'prevention');
const beforeHard = adaptSession('poussee', { next: { type: 'bloc', hard: true } });
assert.equal(beforeHard.kind, 'jambes', 'pas de haut du corps la veille d’un bloc limite');
const ids = beforeHard.items.map((it) => it.ex.id);
assert.ok(!ids.includes('nordic') && !ids.includes('fentes-sautees'), `ni excentrique ni pliométrie : ${ids}`);
assert.ok(ids.includes('pont-fessier'), 'nordic remplacé par le pont fessier');
const afterClimb = adaptSession('poussee', { prev: { type: 'voie', hard: false } });
assert.ok(afterClimb.items.every((it) => !it.ex.tags.includes('grip')), 'aucune préhension autour de la grimpe (Frenchies retirées)');
assert.ok(adaptSession('poussee', {}, { minutes: 45 }).items.some((it) => it.ex.id === 'frenchies'), 'Frenchies loin de la grimpe');
const afterBloc = adaptSession('poussee', { prev: { type: 'bloc', hard: false } });
assert.equal(afterBloc.items.find((it) => it.ex.id === 'pompes')?.sets, EX.pompes.dose.sets - 1, 'bloc hier : poussée -1 série');
const tired = adaptSession('poussee', { fatigue: 3 });
assert.equal(tired.items.find((it) => it.ex.id === 'pompes')?.sets, EX.pompes.dose.sets - 1, 'fatigue 3 : -1 série');

// Durée : la séance tient dans la durée visée, garde l'essentiel, s'allonge seulement sans fatigue ni grimpe intense
for (const kind of Object.keys(SESSIONS) as SessionKind[]) {
	for (const minutes of DURATIONS) assert.ok(adaptSession(kind, {}, { minutes }).minutes <= minutes, `${kind} en ${minutes} min`);
}
const short = adaptSession('poussee', {}, { minutes: 20 }).items.map((it) => it.ex.id);
assert.ok(['rotation-externe', 'pompes', 'mountain-climbers', 'extensions-doigts'].every((id) => short.includes(id)), `20 min : ${short}`);
assert.ok(adaptSession('poussee', {}, { minutes: 45 }).minutes > adaptSession('poussee', {}, { minutes: 30 }).minutes, '45 min plus long que 30');
assert.equal(adaptSession('poussee', { fatigue: 3 }, { minutes: 45 }).items.find((it) => it.ex.id === 'pompes')?.sets, EX.pompes.dose.sets - 1, 'fatigue 3 : pas de rallonge');
assert.equal(recommendMinutes('poussee', {}).minutes, 30, 'séance hors-mur : 20 à 30 min');
assert.equal(recommendMinutes('poussee', { next: { type: 'voie', hard: false } }).minutes, 20, 'grimpe demain : séance courte');
assert.equal(recommendMinutes('prevention', {}).minutes, 20);

// Fatigue notée en fin de journée / de séance : pleine le lendemain, -1 par jour de récupération ensuite
assert.equal(fatigueFor('2026-11-12', { '2026-11-11': { fatigue: 4 } }), 4, 'fatigue de la veille');
assert.equal(fatigueFor('2026-11-13', { '2026-11-11': { fatigue: 4 } }), 3, 'un jour de récupération');
assert.equal(fatigueFor('2026-11-12', { '2026-11-12': { fatigue: 2 }, '2026-11-11': { fatigue: 5 } }), 2, 'la plus récente gagne');
assert.equal(fatigueFor('2026-11-15', { '2026-11-11': { fatigue: 5 } }), undefined, 'au-delà de 3 jours : oubliée');

// Sans aucun matériel : séances complètes, aucun exercice qui en demande, aucun doublon
const none = Object.keys(EQUIPMENT);
for (const kind of Object.keys(SESSIONS) as SessionKind[]) {
	const main = adaptSession(kind, {}, { missing: none }).items.filter((it) => it.ex.category !== 'echauffement');
	assert.ok(main.length >= 4, `${kind} sans matériel : ${main.length} exercices`);
	assert.ok(main.every((it) => available(it.ex, none)), `${kind} : matériel requis`);
	assert.equal(new Set(main.map((it) => it.ex.id)).size, main.length, `${kind} : doublon`);
}
assert.ok(EXERCISES.every((e) => !e.needs || e.needs in EQUIPMENT), 'matériel inconnu');
for (const eq of Object.values(EQUIPMENT)) assert.ok(EX[eq.demo], `démo manquante : ${eq.demo}`);

// Semaine et séance raccordées : le type affiché dans la semaine est celui de la séance du jour, quels que soient la
// fatigue notée, la grimpe du lendemain ou le type choisi
const mixed: Record<string, DayLog> = {
	'2026-11-09': { climb: { type: 'bloc', hard: true }, fatigue: 5 },
	'2026-11-12': { climb: { type: 'voie', hard: true }, fatigue: 4 },
	'2026-11-13': { kind: 'poussee' },
	'2026-11-14': { climb: { type: 'bloc', hard: false }, fatigue: 2 }
};
for (const today of week) {
	for (const day of planWeek(week, mixed, today).days.filter((d) => !d.done && isSession(d.kind))) {
		const ctx = { prev: mixed[addDays(day.date, -1)]?.climb, next: mixed[addDays(day.date, 1)]?.climb, fatigue: fatigueFor(day.date, mixed) };
		const force = Boolean(mixed[day.date]?.kind);
		assert.equal(adaptSession(day.kind as SessionKind, ctx, { force }).kind, day.kind, `${day.date} (aujourd'hui ${today}) : semaine ≠ séance`);
	}
}
const tired5 = planWeek(week, mixed, MONDAY).days;
assert.equal(tired5[1].kind, 'repos', 'fatigue 5 la veille : repos aussi dans la semaine');
assert.equal(tired5[2].kind, 'prevention', 'fatigue 5 il y a 2 jours (= 4) : séance légère aussi dans la semaine');
assert.equal(tired5[4].kind, 'poussee', 'type choisi respecté malgré la fatigue 4/5 de la veille');

// Séance voulue malgré un repos conseillé : faite, allégée, avec avertissement
const forced = adaptSession('poussee', { fatigue: 5 }, { force: true });
assert.equal(forced.kind, 'poussee', 'séance demandée malgré la fatigue 5');
assert.ok(forced.minutes <= 20 && forced.items.length > WARMUP.length, `séance allégée : ${forced.minutes} min`);
assert.ok(forced.restAdvised && forced.notes.some((n) => n.includes('repos conseillé')), 'avertissement de fatigue');
assert.ok(!adaptSession('poussee', { fatigue: 2 }, { force: true }).restAdvised, 'pas d’avertissement sans fatigue');
assert.equal(adaptSession('poussee', { fatigue: 5, next: { type: 'bloc', hard: true } }, { force: true }).kind, 'jambes', 'veille de bloc limite : jamais de poussée');

// Douleurs du jour : aucun exercice (échauffement compris) ne sollicite une zone douloureuse, séance toujours utile
for (const zone of Object.keys(ZONES)) {
	for (const kind of Object.keys(SESSIONS) as SessionKind[]) {
		const s = adaptSession(kind, {}, { pains: [zone] });
		assert.ok(s.items.every((it) => !it.ex.loads?.includes(zone as Zone)), `${kind}, douleur ${zone} : zone sollicitée`);
		assert.ok(s.items.filter((it) => it.ex.category !== 'echauffement').length >= 3, `${kind}, douleur ${zone} : séance vide`);
		assert.ok(s.notes.some((n) => n.includes('consulte')), `${kind}, douleur ${zone} : note manquante`);
	}
}
const sorePoignets = adaptSession('poussee', {}, { pains: ['poignets'] }).items.map((it) => it.ex.id);
assert.ok(!sorePoignets.includes('pompes') && sorePoignets.includes('rotation-externe'), `poignets : ${sorePoignets}`);

// Type de séance choisi par l'utilisateur : repris par le planning
assert.equal(planWeek(week, { '2026-11-10': { kind: 'prevention' } }, MONDAY).days[1].kind, 'prevention');

console.log('check-training : OK');
