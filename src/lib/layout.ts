// Layout (@solairefr/gosvelte-front/layout/app-layout.svelte) : app hors-ligne, ni compte ni notifications.
import type { LayoutConfig } from '@solairefr/gosvelte-front/layout/layout.js';
import { t } from '@solairefr/gosvelte-front/i18n/i18n.svelte.js';
import { PUBLIC_PROJECT_NAME } from '$generated/env';

export function layout(): LayoutConfig {
	return {
		topbar: { title: PUBLIC_PROJECT_NAME, logo: '/logo.svg' },
		menu: {
			items: [
				{ label: t('nav.week'), href: '/', icon: 'home' },
				{ label: t('nav.session'), href: '/seance', icon: 'clock' },
				{ label: t('nav.exercises'), href: '/exercices', icon: 'grid' }
			]
		}
	};
}
