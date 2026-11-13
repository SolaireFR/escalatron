<!-- Exercice repliable : dosage en résumé ; stickman animé, muscles, pourquoi et consignes une fois ouvert -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { t } from '@solairefr/gosvelte-front/i18n/i18n.svelte.js';
	import Stickman from '$lib/stickman.svelte';
	import { formatDose, TAG_LABEL, ZONES, type Exercise } from '$lib/training';

	let { ex, sets, children }: { ex: Exercise; sets?: number; children?: Snippet } = $props();
	let open = $state(false);
</script>

<details class="card" bind:open>
	<summary>
		<span class="name">{ex.name}</span>
		<span class="dose">{formatDose(ex.dose, sets)}</span>
	</summary>
	{#if open}
		<div class="body">
			<Stickman anim={ex.anim} name={ex.name} />
			<dl>
				<dt>{t('exercises.muscles')}</dt>
				<dd>{ex.muscles.join(', ')}</dd>
				<dt>{t('exercises.why')}</dt>
				<dd>{ex.why}</dd>
				<dt>{t('exercises.how')}</dt>
				<dd>{ex.cues}</dd>
				{#if ex.loads?.length}
					<dt>{t('exercises.loads')}</dt>
					<dd>{ex.loads.map((z) => ZONES[z]).join(', ')}</dd>
				{/if}
				{#if ex.equipment}
					<dt>{t('exercises.equipment')}</dt>
					<dd>{ex.equipment}</dd>
				{/if}
			</dl>
			{#if ex.tags.length}<p class="tags">{ex.tags.map((tag) => TAG_LABEL[tag]).join(' · ')}</p>{/if}
			{@render children?.()}
		</div>
	{/if}
</details>

<style>
	.card {
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--bg);
	}

	summary {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-3) var(--space-4);
		cursor: pointer;
	}

	.name {
		font-weight: 600;
	}

	.dose {
		color: var(--muted);
		font-size: var(--font-size-sm);
	}

	.body {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: 0 var(--space-4) var(--space-4);
	}

	dl {
		margin: 0;
	}

	dt {
		margin-top: var(--space-2);
		color: var(--muted);
		font-size: var(--font-size-xs);
		text-transform: uppercase;
	}

	dd {
		margin: 0;
	}

	.tags {
		margin: 0;
		color: var(--warning);
		font-size: var(--font-size-sm);
	}
</style>
