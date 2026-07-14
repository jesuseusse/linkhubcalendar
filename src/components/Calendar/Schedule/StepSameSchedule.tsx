'use client';

import { ScheduleDraft, saveDraft } from './scheduleTypes';

interface Props {
	draft: ScheduleDraft;
	onChange: (draft: ScheduleDraft) => void;
	onYes: () => void;
	onNo: () => void;
	onBack: () => void;
}

export function StepSameSchedule({ draft, onChange, onYes, onNo, onBack }: Props) {
	const choose = (same: boolean) => {
		const updated = { ...draft, sameForAllDays: same };
		saveDraft(updated);
		onChange(updated);
		if (same) onYes();
		else onNo();
	};

	return (
		<div className='space-y-6'>
			<div>
				<h2 className='text-base font-semibold text-foreground mb-1'>
					¿Todos los días tienen el mismo horario?
				</h2>
				<p className='text-sm text-muted-foreground'>
					Puedes configurar el mismo horario para todos tus días o personalizarlo por día.
				</p>
			</div>
			<div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
				<button
					type='button'
					onClick={() => choose(true)}
					className='p-4 text-left border border-border hover:border-foreground transition-colors bg-surface'
				>
					<p className='text-sm font-semibold text-foreground mb-1'>
						Sí, mismo horario
					</p>
					<p className='text-xs text-muted-foreground'>
						Todos mis días tienen el mismo horario de atención.
					</p>
				</button>
				<button
					type='button'
					onClick={() => choose(false)}
					className='p-4 text-left border border-border hover:border-foreground transition-colors bg-surface'
				>
					<p className='text-sm font-semibold text-foreground mb-1'>
						No, varía por día
					</p>
					<p className='text-xs text-muted-foreground'>
						Cada día tiene su propio horario de atención.
					</p>
				</button>
			</div>
			<button
				type='button'
				onClick={onBack}
				className='text-xs text-muted-foreground hover:text-foreground transition-colors'
			>
				← Regresar
			</button>
		</div>
	);
}
