<!-- Stickman animé qui reproduit un exercice : poses interpolées en douceur, coudes et genoux par cinématique inverse.
     Clic = pause / lecture ; « réduire les animations » du système = pause au départ.
     decorative : simple illustration (dans un autre bouton), couleurs héritées du parent (--stickman-* pour les accessoires). -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { t } from '@solairefr/gosvelte-front/i18n/i18n.svelte.js';
	import { poseAt, solve, type Anchor, type Anim, type Vec } from '$lib/training';

	let { anim, name, size = 240, decorative = false }: { anim: Anim; name: string; size?: number; decorative?: boolean } = $props();

	const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
	let playing = $state(!reduced);
	let time = $state(0);

	$effect(() => {
		if (!playing) return;
		const start = performance.now() - untrack(() => time) * 1000;
		let frame = requestAnimationFrame(function loop(now) {
			time = (now - start) / 1000;
			frame = requestAnimationFrame(loop);
		});
		return () => cancelAnimationFrame(frame);
	});

	const view = $derived(anim.view ?? 'side');
	const body = $derived(solve(anim, poseAt(anim, time)));

	const path = (pts: Vec[]) => 'M' + pts.map((q) => `${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' L');
	const ANCHORS = { handL: () => body.arms[0][2], handR: () => body.arms[1][2], footL: () => body.legs[0][2], footR: () => body.legs[1][2] };
	const anchor = (a: Anchor): Vec => (typeof a === 'string' ? ANCHORS[a]() : a);
	const under = $derived((anim.props ?? []).filter((p) => !(p.kind === 'line' && p.band)));
	const bands = $derived((anim.props ?? []).filter((p) => p.kind === 'line' && p.band));
</script>

{#if decorative}
	<div class="stickman decorative" style:max-width="{size}px">{@render figure()}</div>
{:else}
	<button
		type="button"
		class="stickman"
		style:max-width="{size}px"
		onclick={() => (playing = !playing)}
		aria-label={playing ? t('stickman.pause', { name }) : t('stickman.play', { name })}
		aria-pressed={playing}
	>
		{@render figure()}
		{#if !playing}<span class="paused" aria-hidden="true">▶</span>{/if}
	</button>
{/if}

{#snippet figure()}
	<svg viewBox="0 0 160 120" aria-hidden="true">
		{#if anim.ground !== false && view !== 'above'}<line class="ground" x1="0" y1="111" x2="160" y2="111" />{/if}
		{#each under as prop, i (i)}
			{#if prop.kind === 'box'}
				<rect class="box" x={prop.x} y={prop.y} width={prop.w} height={prop.h} rx="2" />
			{:else if prop.kind === 'circle'}
				{@const c = anchor(prop.at)}
				<circle class="prop" cx={c[0]} cy={c[1]} r={prop.r === 'fx' ? body.fx : prop.r} />
			{:else}
				{@const [a, b] = [anchor(prop.a), anchor(prop.b)]}
				<line class="prop" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
			{/if}
		{/each}
		<g class="limb" class:far={view === 'side'}>
			{#if view !== 'above'}<path d={path(body.legs[0])} />{/if}
			<path d={path(body.arms[0])} />
		</g>
		<g class="limb">
			{#if view !== 'above'}<path d={path([body.hip, body.shoulder])} />{/if}
			{#if view !== 'side'}<path d={path(body.shoulders)} />{/if}
			{#if view === 'front'}<path d={path(body.hips)} />{/if}
			{#if view !== 'above'}<path d={path(body.legs[1])} />{/if}
			<path d={path(body.arms[1])} />
		</g>
		<circle class="head" cx={body.head[0]} cy={body.head[1]} r={view === 'above' ? 8 : 7} />
		{#each bands as prop, i (i)}
			{#if prop.kind === 'line'}
				{@const [a, b] = [anchor(prop.a), anchor(prop.b)]}
				<line class="band" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
			{/if}
		{/each}
	</svg>
{/snippet}

<style>
	.stickman {
		position: relative;
		display: block;
		width: 100%;
		margin: 0 auto;
		padding: 0;
		border: 0;
		border-radius: var(--radius-lg);
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
	}

	.decorative {
		background: transparent;
		color: inherit;
		cursor: inherit;
	}

	svg {
		display: block;
		width: 100%;
		height: auto;
	}

	.limb path {
		fill: none;
		stroke: currentColor;
		stroke-width: 4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.far {
		opacity: 0.4;
	}

	.head {
		fill: currentColor;
	}

	.ground {
		stroke: var(--stickman-prop, var(--input-border));
		stroke-width: 1.5;
	}

	.prop {
		fill: none;
		stroke: var(--stickman-prop, var(--muted));
		stroke-width: 3;
		stroke-linecap: round;
	}

	.box {
		fill: var(--stickman-box, var(--border));
		stroke: var(--stickman-prop, var(--muted));
		stroke-width: 1.5;
	}

	.band {
		stroke: var(--stickman-band, var(--primary));
		stroke-width: 1.5;
		stroke-linecap: round;
	}

	.paused {
		position: absolute;
		top: var(--space-2);
		right: var(--space-3);
		color: var(--muted);
		font-size: var(--font-size-lg);
	}
</style>
