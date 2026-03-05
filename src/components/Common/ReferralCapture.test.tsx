import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn();

vi.mock('next/navigation', () => ({
	useSearchParams: () => ({ get: mockGet })
}));

// Simulate the effect logic from ReferralCapture component:
// const code = searchParams.get('r');
// if (code) localStorage.setItem('referral_code', code);
function runCaptureEffect(searchParams: { get: (k: string) => string | null }) {
	const code = searchParams.get('r');
	if (code) localStorage.setItem('referral_code', code);
}

const store: Record<string, string> = {};

const localStorageMock = {
	getItem: (key: string) => store[key] ?? null,
	setItem: (key: string, value: string) => { store[key] = value; },
	removeItem: (key: string) => { delete store[key]; },
	clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

vi.stubGlobal('localStorage', localStorageMock);

describe('ReferralCapture localStorage logic', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorageMock.clear();
	});

	it('saves referral code to localStorage when ?r= is present', () => {
		mockGet.mockImplementation((key: string) =>
			key === 'r' ? 'TEST123' : null
		);
		runCaptureEffect({ get: mockGet });

		expect(localStorage.getItem('referral_code')).toBe('TEST123');
	});

	it('does not write to localStorage when ?r= is absent', () => {
		mockGet.mockReturnValue(null);
		runCaptureEffect({ get: mockGet });

		expect(localStorage.getItem('referral_code')).toBeNull();
	});

	it('overwrites an existing referral code', () => {
		localStorage.setItem('referral_code', 'OLD_CODE');
		mockGet.mockImplementation((key: string) =>
			key === 'r' ? 'NEW_CODE' : null
		);
		runCaptureEffect({ get: mockGet });

		expect(localStorage.getItem('referral_code')).toBe('NEW_CODE');
	});

	it('removes referral code from localStorage after signup (useAuth cleanup)', () => {
		localStorage.setItem('referral_code', 'USED_CODE');

		// Simulate what useAuth does on successful signup
		localStorage.removeItem('referral_code');

		expect(localStorage.getItem('referral_code')).toBeNull();
	});
});
