<!-- Stickman animé qui reproduit un exercice : poses interpolées en douceur, coudes et genoux par cinématique inverse.
     Clic = pause / lecture ; « réduire les animations » du système = pause au départ.
     decorative : simple illustration (dans un autre bouton), couleurs héritées du parent (--stickman-* pour les accessoires). -->
<script lang="ts">
	import { untrack } from 'svelte';
	import { t } from '@solairefr/gosvelte-front/i18n/i18n.svelte.js';
	import type { Anchor, Anim, Pose, Vec } from '$lib/training';

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

	const LEN = { torso: 32, head: 13, upper: 18, fore: 16, thigh: 22, shin: 22 };
	const view = $derived(anim.view ?? 'side');
	const body = $derived(solve(poseAt(time)));

	const mix = (a: number, b: number, f: number) => a + (b - a) * f;
	const mixV = (a: Vec, b: Vec, f: number): Vec => [mix(a[0], b[0], f), mix(a[1], b[1], f)];
	const dist = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1]);

	function poseAt(seconds: number): Pose {
		const pos = seconds / (anim.dur ?? 1.5);
		const [a, b] = [anim.keys[Math.floor(pos) % anim.keys.length], anim.keys[(Math.floor(pos) + 1) % anim.keys.length]];
		const f = anim.linear ? pos % 1 : (1 - Math.cos(Math.PI * (pos % 1))) / 2;
		return {
			hip: mixV(a.hip, b.hip, f),
			torso: mix(a.torso, b.torso, f),
			head: mix(a.head ?? a.torso, b.head ?? b.torso, f),
			hands: [mixV(a.hands[0], b.hands[0], f), mixV(a.hands[1], b.hands[1], f)],
			feet: [mixV(a.feet[0], b.feet[0], f), mixV(a.feet[1], b.feet[1], f)],
			fx: mix(a.fx ?? 0, b.fx ?? 0, f)
		};
	}

	/** Point à len de o dans la direction deg (0 = droite, 90 = haut) */
	function along(o: Vec, len: number, deg: number): Vec {
		const r = (deg * Math.PI) / 180;
		return [o[0] + len * Math.cos(r), o[1] - len * Math.sin(r)];
	}

	/** Membre à deux segments de root vers target : [racine, articulation, extrémité] */
	function limb(root: Vec, target: Vec, a: number, b: number, bend: number, pole?: Vec): Vec[] {
		const d = Math.max(Math.abs(a - b) + 0.01, Math.min(dist(root, target), a + b - 0.01));
		const base = Math.atan2(root[1] - target[1], target[0] - root[0]);
		const alpha = Math.acos((a * a + d * d - b * b) / (2 * a * d));
		const [j1, j2] = [base + alpha, base - alpha].map((r): Vec => [root[0] + a * Math.cos(r), root[1] - a * Math.sin(r)]);
		const joint = pole ? (dist(j1, pole) < dist(j2, pole) ? j1 : j2) : bend > 0 ? j1 : j2;
		const toward = (Math.atan2(joint[1] - target[1], target[0] - joint[0]) * 180) / Math.PI;
		return [root, joint, along(joint, b, toward)];
	}

	function solve(p: Pose) {
		const shoulder = view === 'above' ? p.hip : along(p.hip, LEN.torso, p.torso);
		const r = (p.torso * Math.PI) / 180;
		const [ws, wh] = view === 'side' ? [0, 0] : [10, 6];
		const side = (o: Vec, k: number): Vec => [o[0] + Math.sin(r) * k, o[1] + Math.cos(r) * k];
		const shoulders = [side(shoulder, -ws), side(shoulder, ws)];
		const hips = [side(p.hip, -wh), side(p.hip, wh)];
		const bends = anim.bends ?? (view === 'side' ? [-1, -1, 1, 1] : [-1, 1, -1, 1]);
		return {
			hip: p.hip,
			shoulder,
			shoulders,
			hips,
			head: view === 'above' ? shoulder : along(shoulder, LEN.head, p.head ?? p.torso),
			arms: [0, 1].map((i) => limb(shoulders[i], p.hands[i], LEN.upper, LEN.fore, bends[i], anim.poles?.[i])),
			legs: [0, 1].map((i) => limb(hips[i], p.feet[i], LEN.thigh, LEN.shin, bends[2 + i], anim.poles?.[2 + i])),
			fx: p.fx ?? 0
		};
	}

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
