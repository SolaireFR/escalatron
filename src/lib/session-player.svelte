<!-- Séance guidée : un exercice à la fois (stickman), séries, chrono de gainage et minuteur de repos intégré.
     Écran maintenu allumé ; bip + vibration en fin de minuteur. -->
<script lang="ts">
	import Button from '@solairefr/gosvelte-front/ui/button.svelte';
	import { t } from '@solairefr/gosvelte-front/i18n/i18n.svelte.js';
	import Countdown from '$lib/countdown.svelte';
	import Stickman from '$lib/stickman.svelte';
	import { formatTarget, type SessionItem } from '$lib/training';

	let { items, onfinish, onquit }: { items: SessionItem[]; onfinish: () => void; onquit: () => void } = $props();

	let index = $state(0);
	let set = $state(1);
	let phase = $state<'work' | 'hold' | 'rest'>('work');
	const item = $derived(items[index]);
	const last = $derived(index === items.length - 1 && set >= item.sets);
	const upcoming = $derived(set < item.sets ? item : items[index + 1]);
	let audio: AudioContext | undefined;

	$effect(() => {
		let lock: WakeLockSentinel | undefined;
		navigator.wakeLock
			?.request('screen')
			.then((l) => (lock = l))
			.catch((err: unknown) => console.warn('Écran non maintenu allumé :', err));
		return () => void lock?.release().catch((err: unknown) => console.warn('Libération du wake lock :', err));
	});

	function beep() {
		navigator.vibrate?.([200, 100, 200]);
		if (!audio) return;
		const osc = audio.createOscillator();
		osc.frequency.value = 880;
		osc.connect(audio.destination);
		osc.start();
		osc.stop(audio.currentTime + 0.3);
	}

	/** Série terminée : repos (s'il y en a) puis série ou exercice suivant */
	function setDone() {
		audio ??= new AudioContext(); // créé sur un geste de l'utilisateur : autorisé à sonner ensuite
		if (last) return onfinish();
		if (item.ex.dose.rest > 0) phase = 'rest';
		else advance();
	}

	function advance() {
		phase = 'work';
		if (set < item.sets) set += 1;
		else skipExercise();
	}

	function skipExercise() {
		if (index === items.length - 1) return onfinish();
		phase = 'work';
		index += 1;
		set = 1;
	}
</script>

<section class="player">
	<p class="progress">
		{t('player.exercise', { n: index + 1, total: items.length })}
		<progress max={items.length} value={index}></progress>
	</p>

	{#if phase === 'rest'}
		<Countdown seconds={item.ex.dose.rest} label={t('player.rest')} skipLabel={t('player.skipRest')} onend={() => (beep(), advance())} />
		<p class="next">{t('player.next', { name: upcoming.ex.name })}</p>
		{#key upcoming}<Stickman anim={upcoming.ex.anim} name={upcoming.ex.name} size={200} />{/key}
	{:else}
		<h2>{item.ex.name}</h2>
		{#key item}<Stickman anim={item.ex.anim} name={item.ex.name} size={360} />{/key}
		<p class="set">{t('player.set', { n: set, total: item.sets })} · {formatTarget(item.ex.dose)}</p>
		<p class="cues">{item.ex.cues}</p>
		{#if phase === 'hold' && item.ex.dose.hold}
			<Countdown seconds={item.ex.dose.hold[1]} label={t('player.hold')} skipLabel={t('player.endHold')} onend={() => (beep(), setDone())} />
		{:else if item.ex.dose.hold}
			<Button label={t('player.startHold')} icon="clock" variant="primary" onclick={() => ((audio ??= new AudioContext()), (phase = 'hold'))} />
		{:else}
			<Button label={t('player.setDone')} variant="primary" onclick={setDone} />
		{/if}
	{/if}

	<div class="footer">
		<Button label={t('player.skip')} variant="ghost" size="sm" onclick={skipExercise} />
		<Button label={t('player.quit')} variant="ghost" size="sm" onclick={onquit} />
	</div>
</section>

<style>
	.player {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-3);
		text-align: center;
	}

	.progress {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	progress {
		flex: 1;
		accent-color: var(--primary);
	}

	h2 {
		margin: 0;
		font-size: var(--font-size-xl);
	}

	.set {
		margin: 0;
		font-weight: 600;
		font-size: var(--font-size-lg);
	}

	.cues,
	.next {
		margin: 0;
		color: var(--muted);
	}

	.footer {
		display: flex;
		justify-content: space-between;
		margin-top: var(--space-4);
	}
</style>
