// Données de l'utilisateur, uniquement dans le téléphone (localStorage) : jours notés, variantes choisies, matériel absent.
import type { DayLog } from '$lib/training';

const KEY = 'escalatron';

interface Saved {
	days: Record<string, DayLog>;
	/** Variante choisie, par exercice de la séance type */
	prefs: Record<string, string>;
	/** Matériel non disponible (absent = disponible, y compris le matériel ajouté plus tard) */
	missing: string[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function load(): Saved {
	try {
		const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
		if (isRecord(raw)) {
			return {
				days: isRecord(raw.days) ? (raw.days as Record<string, DayLog>) : {},
				prefs: isRecord(raw.prefs) ? (raw.prefs as Record<string, string>) : {},
				missing: Array.isArray(raw.missing) ? raw.missing.filter((m): m is string => typeof m === 'string') : []
			};
		}
	} catch (err) {
		console.error('Données locales illisibles, repartir de zéro :', err);
	}
	return { days: {}, prefs: {}, missing: [] };
}

export const store: Saved = $state(load());

export function persist(): void {
	try {
		localStorage.setItem(KEY, JSON.stringify(store));
	} catch (err) {
		console.error('Sauvegarde locale impossible (stockage plein ou désactivé) :', err);
	}
}

/** Modifie un jour ; champ à undefined = effacé */
export function updateDay(date: string, patch: Partial<DayLog>): void {
	const day: DayLog = { ...store.days[date], ...patch };
	for (const key of Object.keys(day) as (keyof DayLog)[]) if (day[key] === undefined) delete day[key];
	store.days[date] = day;
	persist();
}

/** Matériel disponible ↔ non disponible */
export function toggleEquipment(id: string): void {
	store.missing = store.missing.includes(id) ? store.missing.filter((m) => m !== id) : [...store.missing, id];
	persist();
}
