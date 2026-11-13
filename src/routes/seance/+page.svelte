<!-- Séance d'un jour (?d=AAAA-MM-JJ, défaut : aujourd'hui) : l'essentiel seulement (type, durée, Démarrer), le reste
     dans les réglages. Jour sans séance prévue (faite, grimpe, repos) : rien n'est proposé sans « Préparer une séance ». -->
<script lang="ts">
	import { page } from '$app/state';
	import Button from '@solairefr/gosvelte-front/ui/button.svelte';
	import { i18n, t } from '@solairefr/gosvelte-front/i18n/i18n.svelte.js';
	import FatiguePicker from '$lib/fatigue-picker.svelte';
	import SessionPlayer from '$lib/session-player.svelte';
	import SessionSettings from '$lib/session-settings.svelte';
	import { adaptSession, addDays, fatigueFor, isoDate, isSession, planWeek, SESSIONS, toDate, weekDates, type SessionKind } from '$lib/training';
	import { store, updateDay } from '$lib/week.svelte';

	const today = isoDate(new Date());
	const param = $derived(page.url.searchParams.get('d') ?? '');
	const date = $derived(/^\d{4}-\d{2}-\d{2}$/.test(param) ? param : today);
	const day = $derived(planWeek(weekDates(date), store.days, today).days.find((d) => d.date === date));
	const log = $derived(store.days[date] ?? {});
	let requestedFor = $state<string | null>(null);
	/** Séance terminée ce jour : fatigue demandée avant de revenir à l'écran du jour */
	let finishedFor = $state<string | null>(null);
	let running = $state(false);
	let settingsOpen = $state(false);

	// Séance prévue par le planning et pas encore faite ; sinon seulement sur demande (séance légère par défaut).
	// Séance voulue (demandée ou type choisi) : faite même si le repos est conseillé (force), allégée selon la fatigue.
	const planned = $derived(day && isSession(day.kind) && !day.done ? day.kind : null);
	const suggested = $derived<SessionKind>(planned ?? 'prevention');
	const requested = $derived(requestedFor === date);
	const kind = $derived(planned || requested ? (log.kind ?? suggested) : null);
	const session = $derived(
		kind
			? adaptSession(
					kind,
					{ prev: store.days[addDays(date, -1)]?.climb, next: store.days[addDays(date, 1)]?.climb, fatigue: fatigueFor(date, store.days) },
					{ prefs: store.prefs, minutes: log.minutes, missing: store.missing, pains: log.pains, force: requested || Boolean(log.kind) }
				)
			: null
	);

	/** Séance demandée : type enregistré pour le jour (la semaine l'affiche aussi), séance proposée même en repos conseillé */
	function prepare() {
		requestedFor = date;
		if (!log.kind) updateDay(date, { kind: suggested });
	}
	const idleTitle = $derived(
		day?.done && isSession(day.kind) ? t('session.doneToday') : day?.kind === 'grimpe' ? t('session.climbDay') : t('session.restDay')
	);
	const longDay = $derived(new Intl.DateTimeFormat(i18n.locale, { weekday: 'long', day: 'numeric', month: 'long' }));

	function finish() {
		if (session && isSession(session.kind)) updateDay(date, { done: session.kind });
		running = false;
		requestedFor = null;
		finishedFor = date;
	}
</script>

<div class="container">
	{#if running && session}
		<SessionPlayer items={session.items} onfinish={finish} onquit={() => (running = false)} />
	{:else}
		<p class="date">{longDay.format(toDate(date))}</p>
		<div class="hero">
			{#if finishedFor === date}
				<h1>{t('session.finished')}</h1>
				<FatiguePicker
					label={t('fatigue.afterSession')}
					value={log.fatigue}
					onpick={(n) => ((finishedFor = null), updateDay(date, { fatigue: n }))}
					onskip={() => (finishedFor = null)}
				/>
			{:else if !session}
				<h1>{idleTitle}</h1>
				{#if day && !day.done}<p class="muted">{day.reason}</p>{/if}
				<Button label={t('session.prepare')} icon="plus" variant="secondary" onclick={prepare} />
			{:else}
				<h1>{isSession(session.kind) ? SESSIONS[session.kind].title : t('session.restAdvice')}</h1>
				{#if session.items.length}
					<p class="duration">{t('session.duration', { minutes: session.minutes })}</p>
					{#if session.restAdvised}<p class="warning">{t('session.restAdvised')}</p>{/if}
					<Button label={t('session.start')} icon="clock" variant="primary" onclick={() => (running = true)} />
				{:else}
					<p class="muted">{session.notes[0]}</p>
					<Button label={t('session.prepare')} icon="plus" variant="secondary" onclick={prepare} />
				{/if}
				<Button label={t('session.settings')} icon="settings" variant="ghost" onclick={() => (settingsOpen = true)} />
			{/if}
		</div>
	{/if}
</div>

{#if settingsOpen && session && kind}
	<SessionSettings {date} {session} {kind} {suggested} onclose={() => (settingsOpen = false)} />
{/if}

<style>
	.date {
		margin: 0;
		color: var(--muted);
	}

	.date::first-letter {
		text-transform: uppercase;
	}

	.hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		margin-top: 18vh;
		text-align: center;
	}

	.hero :global(.btn) {
		width: min(100%, 320px);
		justify-content: center;
	}

	h1 {
		margin: 0;
		font-size: var(--font-size-xl);
	}

	.duration {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-lg);
	}

	.muted {
		margin: 0;
		color: var(--muted);
	}

	.warning {
		margin: 0;
		color: var(--warning);
	}
</style>
