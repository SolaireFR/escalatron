<!-- Fatigue ressentie de 1 à 5 (fin de séance, journée renseignée), ou « Passer » -->
<script lang="ts">
	import Button from '@solairefr/gosvelte-front/ui/button.svelte';
	import { t } from '@solairefr/gosvelte-front/i18n/i18n.svelte.js';

	let { label, value, onpick, onskip }: { label: string; value?: number; onpick: (n: number) => void; onskip: () => void } = $props();
	const LEVELS = ['fatigue.levels.f1', 'fatigue.levels.f2', 'fatigue.levels.f3', 'fatigue.levels.f4', 'fatigue.levels.f5'] as const;
</script>

<fieldset>
	<legend>{label}</legend>
	<div class="levels">
		{#each LEVELS as key, i (key)}
			<button type="button" aria-pressed={value === i + 1} onclick={() => onpick(i + 1)}>
				<strong>{i + 1}</strong>
				<small>{t(key)}</small>
			</button>
		{/each}
	</div>
	<Button label={t('fatigue.skip')} variant="ghost" size="sm" onclick={onskip} />
</fieldset>

<style>
	fieldset {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		width: 100%;
		margin: 0;
		padding: 0;
		border: 0;
	}

	legend {
		margin-bottom: var(--space-3);
		font-weight: 600;
		text-align: center;
	}

	.levels {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: var(--space-1);
		width: 100%;
	}

	button {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-3) var(--space-1);
		border: 1px solid var(--input-border);
		border-radius: var(--radius);
		background: var(--bg);
		color: var(--text);
		font: inherit;
		cursor: pointer;
	}

	button[aria-pressed='true'] {
		border-color: var(--primary);
		background: var(--primary);
		color: var(--on-primary);
	}

	small {
		font-size: var(--font-size-xs);
		text-align: center;
	}
</style>
