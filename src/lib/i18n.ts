import { writable } from 'svelte/store';

// Store only — no translations dictionary yet. The floating EN/KM toggle
// needs to exist and persist a choice before any content actually reads
// from it; wiring up real Khmer strings is a separate pass (see
// white-knight-svelte/src/lib/i18n.ts for the shape a `t` derived store +
// translations object should take once that happens).
export type Locale = 'en' | 'km';

export const LOCALES: { code: Locale; label: string; short: string }[] = [
	{ code: 'en', label: 'English', short: 'EN' },
	{ code: 'km', label: 'ខ្មែរ', short: 'KM' },
];

function getInitialLocale(): Locale {
	if (typeof localStorage !== 'undefined') {
		const saved = localStorage.getItem('lbr-locale');
		if (saved === 'en' || saved === 'km') return saved;
	}
	return 'en';
}

export const currentLocale = writable<Locale>(getInitialLocale());

export function setLocale(locale: Locale) {
	currentLocale.set(locale);
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('lbr-locale', locale);
	}
}
