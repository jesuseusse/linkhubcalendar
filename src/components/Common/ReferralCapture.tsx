'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralCapture() {
	const searchParams = useSearchParams();

	useEffect(() => {
		const code = searchParams.get('r');
		if (code) {
			localStorage.setItem('referral_code', code);
		}
	}, [searchParams]);

	return null;
}
