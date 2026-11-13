<!-- Semaine : l'utilisateur note ses séances d'escalade au fil de l'eau, le planning (renfo, repos) se recalcule.
     Une ligne par jour (date + type) ; détail et choix dans la fenêtre du jour. -->
<script lang="ts">
	import Button from '@solairefr/gosvelte-front/ui/button.svelte';
	import Modal from '@solairefr/gosvelte-front/ui/modal.svelte';
	import { i18n, t } from '@solairefr/gosvelte-front/i18n/i18n.svelte.js';
	import FatiguePicker from '$lib/fatigue-picker.svelte';
	import { addDays, climbLabel, isoDate, isSession, KIND_LABEL, planWeek, toDate, weekDates, type Climb, type DayLog, type DayPlan } from '$lib/training';
	import { store, updateDay } from '$lib/week.svelte';

	const today = isoDate(new Date());
	let offset = $state(0);
	let editing = $state<string | null>(null);
	/** 2e étape de la fenêtre du jour : fatigue ressentie (journée passée ou aujourd'hui) */
	let askFatigue = $state(false);
	const dates = $derived(weekDates(addDays(today, offset * 7)));
	const plan = $derived(planWeek(dates, store.days, today));
	const proposed = (d: DayPlan) => isSession(d.kind) && !d.done;
	const todayPlan = $derived(plan.days.find((d) => d.date === today && proposed(d)));
	const shortDay = $derived(new Intl.DateTimeFormat(i18n.locale, { weekday: 'short', day: 'numeric' }));
	const longDay = $derived(new Intl.DateTimeFormat(i18n.locale, { weekday: 'long', day: 'numeric', month: 'long' }));
	const range = $derived(new Intl.DateTimeFormat(i18n.locale, { day: 'numeric', month: 'short' }).formatRange(toDate(dates[0]), toDate(dates[6])));

	const CLIMBS: Climb[] = [
		{ type: 'bloc', hard: false },
		{ type: 'bloc', hard: true },
		{ type: 'voie', hard: false },
		{ type: 'voie', hard: true }
	];

	/** Choix du jour : escalade, repos imposé ou automatique (séance faite et type choisi effacés) ; journée renseignée
	 * (escalade ou repos, passée ou aujourd'hui) → fatigue demandée */
	function choose(date: string, patch: Pick<DayLog, 'climb' | 'rest'>) {
		updateDay(date, { climb: patch.climb, rest: patch.rest, done: undefined, kind: undefined });
		if ((patch.climb || patch.rest) && date <= today) askFatigue = true;
		else close();
	}

	function close() {
		editing = null;
		askFatigue = false;
	}

	const sameClimb = (a?: Climb, b?: Climb) => a?.type === b?.type && a?.hard === b?.hard;
	const label = (d: DayPlan) => (d.climb ? climbLabel(d.climb) : KIND_LABEL[d.kind]);
</script>

<div class="container">
	<h1 class="sr-only">{t('week.title')}</h1>
	<nav class="weeknav">
		<Button icon="chevron" title={t('week.prev')} variant="ghost" onclick={() => (offset -= 1)} />
		<button type="button" class="range" onclick={() => (offset = 0)} title={t('week.current')}>{range}</button>
		<Button icon="chevron" title={t('week.next')} variant="ghost" onclick={() => (offset += 1)} />
	</nav>

	{#if todayPlan && offset === 0}
		<Button href="/seance" label="{t('week.todaySession')} · {KIND_LABEL[todayPlan.kind]}" icon="clock" variant="primary" />
	{/if}
	{#each plan.warnings as warning (warning)}<p class="warning">{warning}</p>{/each}

	<ol class="days">
		{#each plan.days as day (day.date)}
			<li>
				<button type="button" class="day kind-{day.kind}" class:today={day.date === today} onclick={() => (editing = day.date)}>
					<span class="date">{shortDay.format(toDate(day.date))}</span>
					<strong>{label(day)}</strong>
					{#if day.done && day.kind !== 'repos'}<span class="check" title={t('week.done')}>✓</span>{/if}
				</button>
			</li>
		{/each}
	</ol>

	{#if !plan.days.some((d) => d.climb)}<p class="muted">{t('week.empty')}</p>{/if}
</div>

{#if editing}
	{@const date = editing}
	{@const log = store.days[date] ?? {}}
	{@const day = plan.days.find((d) => d.date === date)}
	{@const title = longDay.format(toDate(date))}
	<Modal title={title.charAt(0).toUpperCase() + title.slice(1)} onclose={close}>
		{#if askFatigue}
			<FatiguePicker label={t('fatigue.afterDay')} value={log.fatigue} onpick={(n) => (updateDay(date, { fatigue: n }), close())} onskip={close} />
		{:else}
			{#if day}<p class="muted">{label(day)} · {day.reason}</p>{/if}
			<p>{t('week.question')}</p>
			<div class="choices">
				{#each CLIMBS as climb (climbLabel(climb))}
					<Button label={climbLabel(climb)} variant={sameClimb(log.climb, climb) ? 'primary' : 'secondary'} onclick={() => choose(date, { climb })} />
				{/each}
				<Button label={t('week.rest')} variant={log.rest ? 'primary' : 'secondary'} onclick={() => choose(date, { rest: true })} />
				<Button label={t('week.auto')} variant={!log.climb && !log.rest ? 'primary' : 'secondary'} onclick={() => choose(date, {})} />
			</div>
			{#if day && proposed(day)}
				<p class="session-link">
					<Button href="/seance?d={date}" label={t('week.openSession')} icon="clock" variant="primary" />
				</p>
			{/if}
		{/if}
	</Modal>
{/if}

<style>
	.weeknav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-4);
	}

	/* Chevron du moteur orienté vers la droite : retourné pour « semaine précédente » */
	.weeknav > :global(:first-child) :global(svg) {
		transform: rotate(180deg);
	}

	.range {
		border: 0;
		background: none;
		color: var(--text);
		font: inherit;
		font-size: var(--font-size-lg);
		font-weight: 600;
		cursor: pointer;
	}

	.muted {
		color: var(--muted);
	}

	.warning {
		color: var(--warning);
	}

	.days {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: var(--space-4) 0;
		padding: 0;
		list-style: none;
	}

	.day {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-4) var(--space-3);
		border: 1px solid var(--border);
		border-left: 6px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--bg);
		color: var(--text);
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.day.today {
		box-shadow: 0 0 0 2px var(--primary);
	}

	.kind-grimpe {
		border-left-color: var(--primary);
	}

	.kind-poussee,
	.kind-jambes {
		border-left-color: var(--info);
	}

	.kind-prevention {
		border-left-color: var(--success);
	}

	.kind-repos strong {
		color: var(--muted);
		font-weight: 400;
	}

	.date {
		min-width: 4.5em;
		color: var(--muted);
		text-transform: capitalize;
	}

	strong {
		flex: 1;
	}

	.check {
		color: var(--success);
		font-weight: 700;
	}

	.choices {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
	}

	.session-link {
		margin-top: var(--space-4);
	}
</style>
