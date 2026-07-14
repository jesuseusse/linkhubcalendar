'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ScheduleDraft, WeeklySchedule, loadDraft, saveDraft, clearDraft, buildEmptyDraft } from './scheduleTypes';
import { StepDaySelector } from './StepDaySelector';
import { StepSameSchedule } from './StepSameSchedule';
import { StepDefaultSchedule } from './StepDefaultSchedule';
import { StepPerDaySchedule } from './StepPerDaySchedule';
import { StepPreview } from './StepPreview';

interface Props {
	onSave: (schedule: WeeklySchedule) => Promise<void>;
}

const STEP_TITLES = ['Días', 'Horario', 'Configuración', 'Vista previa'];

export function ScheduleStepper({ onSave }: Props) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const stepParam = parseInt(searchParams.get('step') ?? '1', 10);
	const [step, setStep] = useState(stepParam);
	const [draft, setDraft] = useState<ScheduleDraft>(buildEmptyDraft);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setDraft(loadDraft());
	}, []);

	const goTo = (s: number) => {
		setStep(s);
		router.replace(`?step=${s}`);
	};

	const handleSave = async (schedule: WeeklySchedule) => {
		setSaving(true);
		try {
			await onSave(schedule);
			clearDraft();
			router.replace(pathname);
		} finally {
			setSaving(false);
		}
	};

	// 5 logical steps; sameForAllDays=true skips step 4
	const totalIndicatorSteps = 4;
	const indicatorStep =
		step <= 2 ? step : step === 3 ? 3 : step === 4 ? 3 : 4;

	return (
		<div className='space-y-6'>
			{/* Step indicator */}
			<div className='flex gap-1'>
				{Array.from({ length: totalIndicatorSteps }, (_, i) => i + 1).map((s) => (
					<div
						key={s}
						className={`h-1 flex-1 transition-colors ${
							s <= indicatorStep ? 'bg-primary' : 'bg-border'
						}`}
					/>
				))}
			</div>

			{step === 1 && (
				<StepDaySelector
					draft={draft}
					onChange={setDraft}
					onNext={() => goTo(2)}
				/>
			)}
			{step === 2 && (
				<StepSameSchedule
					draft={draft}
					onChange={setDraft}
					onYes={() => goTo(3)}
					onNo={() => goTo(4)}
					onBack={() => goTo(1)}
				/>
			)}
			{step === 3 && (
				<StepDefaultSchedule
					draft={draft}
					onChange={setDraft}
					onNext={() => goTo(5)}
					onBack={() => goTo(2)}
				/>
			)}
			{step === 4 && (
				<StepPerDaySchedule
					draft={draft}
					onChange={setDraft}
					onNext={() => goTo(5)}
					onBack={() => goTo(2)}
				/>
			)}
			{step === 5 && (
				<StepPreview
					draft={draft}
					onBack={() => goTo(draft.sameForAllDays ? 3 : 4)}
					onSave={handleSave}
					saving={saving}
				/>
			)}
		</div>
	);
}
