<!-- Minuteur (repos ou gainage) : anneau de progression, +15 s, passer. Basé sur l'heure réelle : juste même si l'app
     passe en arrière-plan. -->
<script lang="ts">
	import { untrack } from 'svelte';
	import Button from '@solairefr/gosvelte-front/ui/button.svelte';
	import { t } from '@solairefr/gosvelte-front/i18n/i18n.svelte.js';

	let { seconds, label, skipLabel, onend }: { seconds: number; label: string; skipLabel: string; onend: () => void } = $props();

	const startedAt = Date.now();
	let total = $state(untrack(() => seconds));
	let now = $state(startedAt);
	let ended = false;
	const left = $derived(Math.max(0, Math.ceil(total - (now - startedAt) / 1000)));
	const CIRCUMFERENCE = 2 * Math.PI * 54;

	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 200);
		return () => clearInterval(id);
	});

	$effect(() => {
		if (left === 0) finish();
	});

	function finish() {
		if (ended) return;
		ended = true;
		onend();
	}

	const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
</script>

<div class="countdown" role="timer" aria-label={label}>
	<p class="label">{label}</p>
	<svg viewBox="0 0 120 120" aria-hidden="true">
		<circle class="track" cx="60" cy="60" r="54" />
		<circle class="bar" cx="60" cy="60" r="54" stroke-dasharray={CIRCUMFERENCE} stroke-dashoffset={CIRCUMFERENCE * (1 - left / total)} />
		<text x="60" y="60">{clock(left)}</text>
	</svg>
	<div class="actions">
		<Button label={t('player.plus')} variant="secondary" onclick={() => (total += 15)} />
		<Button label={skipLabel} variant="primary" onclick={finish} />
	</div>
</div>

<style>
	.countdown {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}

	.label {
		margin: 0;
		color: var(--muted);
		font-size: var(--font-size-lg);
	}

	svg {
		width: min(60vw, 220px);
	}

	circle {
		fill: none;
		stroke-width: 8;
	}

	.track {
		stroke: var(--border);
	}

	.bar {
		stroke: var(--primary);
		stroke-linecap: round;
		transform: rotate(-90deg);
		transform-origin: center;
		transition: stroke-dashoffset 0.2s linear;
	}

	text {
		fill: var(--text);
		font-size: 28px;
		font-weight: 700;
		text-anchor: middle;
		dominant-baseline: central;
		font-variant-numeric: tabular-nums;
	}

	.actions {
		display: flex;
		gap: var(--space-3);
	}
</style>
