<!-- Catalogue : matériel disponible en haut (vignette colorée = disponible, blanche = absent : ses exercices ne sont
     plus proposés, ni ici ni dans les séances), puis les exercices faisables par catégorie -->
<script lang="ts">
	import { t } from '@solairefr/gosvelte-front/i18n/i18n.svelte.js';
	import ExerciseCard from '$lib/exercise-card.svelte';
	import Stickman from '$lib/stickman.svelte';
	import { available, CATEGORIES, EQUIPMENT, EX, EXERCISES, type Category, type Equipment } from '$lib/training';
	import { store, toggleEquipment } from '$lib/week.svelte';

	const categories = Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][];
	const equipment = Object.entries(EQUIPMENT) as [Equipment, (typeof EQUIPMENT)[Equipment]][];
</script>

<div class="container">
	<h1>{t('exercises.title')}</h1>

	<section>
		<h2>{t('exercises.myEquipment')}</h2>
		<div class="tiles">
			{#each equipment as [id, eq] (id)}
				<button type="button" class="tile" aria-pressed={!store.missing.includes(id)} onclick={() => toggleEquipment(id)}>
					<Stickman anim={EX[eq.demo].anim} name={eq.label} decorative />
					<span>{eq.label}</span>
				</button>
			{/each}
		</div>
	</section>

	{#each categories as [category, info] (category)}
		<section>
			<h2>{info.label}</h2>
			<div class="list">
				{#each EXERCISES.filter((e) => e.category === category && available(e, store.missing)) as ex (ex.id)}<ExerciseCard {ex} />{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	h2 {
		margin: var(--space-5) 0 var(--space-2);
		color: var(--muted);
		font-size: var(--font-size);
		text-transform: uppercase;
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
		gap: var(--space-2);
	}

	.tile {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		padding: var(--space-2);
		border: 1px solid var(--input-border);
		border-radius: var(--radius-lg);
		background: var(--bg);
		color: var(--text);
		font: inherit;
		font-size: var(--font-size-sm);
		cursor: pointer;
	}

	.tile[aria-pressed='true'] {
		--stickman-band: var(--on-primary);
		--stickman-prop: var(--on-primary);
		--stickman-box: var(--primary-hover);
		border-color: var(--primary);
		background: var(--primary);
		color: var(--on-primary);
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
</style>
