<!-- Réglages d'une séance : durée (avec recommandation), type, douleurs du jour, exercices et variantes, adaptations, règles.
     Chaque choix est enregistré pour le jour et recalcule la séance aussitôt. -->
<script lang="ts">
	import Button from '@solairefr/gosvelte-front/ui/button.svelte';
	import Modal from '@solairefr/gosvelte-front/ui/modal.svelte';
	import { t } from '@solairefr/gosvelte-front/i18n/i18n.svelte.js';
	import ExerciseCard from '$lib/exercise-card.svelte';
	import { available, DURATIONS, EXERCISES, KIND_LABEL, RULES, ZONES, type Session, type SessionItem, type SessionKind, type Zone } from '$lib/training';
	import { persist, store, updateDay } from '$lib/week.svelte';

	interface Props {
		date: string;
		session: Session;
		/** Type demandé pour ce jour, et type suggéré par le planning */
		kind: SessionKind;
		suggested: SessionKind;
		onclose: () => void;
	}

	let { date, session, kind, suggested, onclose }: Props = $props();
	const KINDS: SessionKind[] = ['poussee', 'jambes', 'prevention'];
	const main = $derived(session.items.filter((it) => it.ex.category !== 'echauffement'));
	/** Variantes faisables avec le matériel disponible */
	const mates = (item: SessionItem) => EXERCISES.filter((e) => e.slot === item.ex.slot && available(e, store.missing));

	/** Variante suivante du même slot, mémorisée pour les prochaines séances */
	function nextVariant(item: SessionItem) {
		const list = mates(item);
		store.prefs[item.base] = list[(list.indexOf(item.ex) + 1) % list.length].id;
		persist();
	}

	const zones = Object.entries(ZONES) as [Zone, string][];
	const pains = $derived(store.days[date]?.pains ?? []);

	/** Douleur du jour ajoutée / retirée : les exercices qui sollicitent la zone sont écartés aussitôt */
	function togglePain(zone: Zone) {
		const next = pains.includes(zone) ? pains.filter((z) => z !== zone) : [...pains, zone];
		updateDay(date, { pains: next.length ? next : undefined });
	}
</script>

<Modal title={t('settings.title')} {onclose}>
	<div class="settings">
		{#if session.items.length}
			<section>
				<h3>{t('settings.duration')}</h3>
				<div class="chips">
					{#each DURATIONS as n (n)}
						<button type="button" aria-pressed={session.target === n} onclick={() => updateDay(date, { minutes: n })}>
							{t('settings.minutes', { n })}{#if n === session.recommended.minutes}<span aria-hidden="true">&nbsp;★</span>{/if}
						</button>
					{/each}
				</div>
				<p class="hint">{t('settings.recommended', { n: session.recommended.minutes })}. {session.recommended.reason}</p>
			</section>
		{/if}

		<section>
			<h3>{t('settings.kind')}</h3>
			<div class="chips">
				{#each KINDS as k (k)}
					<button type="button" aria-pressed={kind === k} onclick={() => updateDay(date, { kind: k })}>
						{KIND_LABEL[k]}{#if k === suggested}<span aria-hidden="true">&nbsp;★</span>{/if}
					</button>
				{/each}
			</div>
		</section>

		<section>
			<h3>{t('settings.pains')}</h3>
			<div class="chips">
				{#each zones as [zone, label] (zone)}
					<button type="button" aria-pressed={pains.includes(zone)} onclick={() => togglePain(zone)}>{label}</button>
				{/each}
			</div>
			<p class="hint">{t('settings.painsHint')}</p>
		</section>

		{#if session.notes.length}
			<section>
				<h3>{t('settings.adaptations')}</h3>
				<ul class="notes">
					{#each session.notes as note (note)}<li>{note}</li>{/each}
				</ul>
			</section>
		{/if}

		{#if main.length}
			<section>
				<h3>{t('settings.exercises')}</h3>
				<div class="list">
					{#each main as item (item.base)}
						<ExerciseCard ex={item.ex} sets={item.sets}>
							{#if mates(item).length > 1}
								<Button label={t('settings.variant')} icon="refresh" variant="secondary" size="sm" onclick={() => nextVariant(item)} />
							{/if}
						</ExerciseCard>
					{/each}
				</div>
			</section>
		{/if}

		<details>
			<summary>{t('settings.rules')}</summary>
			<ul class="notes">
				{#each RULES as rule (rule)}<li>{rule}</li>{/each}
			</ul>
		</details>
	</div>
</Modal>

<style>
	.settings {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	h3 {
		margin: 0 0 var(--space-2);
		font-size: var(--font-size);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.chips button {
		display: inline-flex;
		align-items: center;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--input-border);
		border-radius: var(--radius);
		background: var(--bg);
		color: var(--text);
		font: inherit;
		cursor: pointer;
	}

	.chips button[aria-pressed='true'] {
		border-color: var(--primary);
		background: var(--primary);
		color: var(--on-primary);
	}

	.hint {
		margin: var(--space-2) 0 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.notes {
		margin: 0;
		padding-left: var(--space-4);
		color: var(--muted);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	summary {
		font-weight: 600;
		cursor: pointer;
	}
</style>
