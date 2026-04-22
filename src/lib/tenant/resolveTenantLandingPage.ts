import dynamic from 'next/dynamic';

// English: Dictionary of hardcoded landings
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const LANDING_COMPONENTS: Record<string, any> = {
	default: dynamic(() => import('@/components/LandingPage/default')),
	'unterapeuta.com': dynamic(
		() => import('@/components/LandingPage/UnterapeutaCom')
	),
	'unamujerbonita.com': dynamic(
		() => import('@/components/LandingPage/UnaMujerBonitaCom')
	),
	'unabarberia.com': dynamic(
		() => import('@/components/LandingPage/UnaBarberiaCom')
	)
};
