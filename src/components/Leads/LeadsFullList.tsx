'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LeadDto, LeadStatus } from '@/dtos/user.dto';
import type { LeadOrder } from '@/domain/interfaces/ILeadRepository';

// ── Helpers ────────────────────────────────────────────────────────────────

const DRAFT_KEYS = {
	wa: 'linkhub_wa_draft',
	email: 'linkhub_email_draft'
};

function loadDraft(type: 'wa' | 'email') {
	try {
		return localStorage.getItem(DRAFT_KEYS[type]) ?? '';
	} catch {
		return '';
	}
}

function saveDraft(type: 'wa' | 'email', text: string) {
	try {
		localStorage.setItem(DRAFT_KEYS[type], text);
	} catch {
		// ignore
	}
}

function phoneDigits(phone: string) {
	return phone.replace(/[^\d+]/g, '');
}

const STATUS_LABELS: Record<LeadStatus, string> = {
	attended: 'Atendido',
	canceled: 'Cancelado',
	contacted: 'Contactado'
};

const STATUS_STYLES: Record<LeadStatus, string> = {
	attended: 'bg-success-light text-success border-success',
	canceled: 'bg-error-light text-error border-error/30',
	contacted: 'bg-muted text-muted-foreground border-border'
};

// ── WhatsApp modal ─────────────────────────────────────────────────────────

function WaModal({ lead, onClose }: { lead: LeadDto; onClose: () => void }) {
	const [msg, setMsg] = useState(() => loadDraft('wa'));

	const handleChange = (v: string) => {
		setMsg(v);
		saveDraft('wa', v);
	};

	const handleSend = () => {
		const url = `https://wa.me/${phoneDigits(lead.phone)}?text=${encodeURIComponent(msg)}`;
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 px-4'>
			<div className='bg-background border border-border p-6 w-full max-w-md space-y-4'>
				<div className='flex items-center justify-between'>
					<h3 className='text-sm font-semibold text-foreground'>
						WhatsApp — {lead.name}
					</h3>
					<button
						type='button'
						onClick={onClose}
						className='text-muted-foreground hover:text-foreground text-lg leading-none'
					>
						×
					</button>
				</div>
				<p className='text-xs text-muted-foreground'>{lead.phone}</p>
				<textarea
					value={msg}
					onChange={e => handleChange(e.target.value)}
					rows={5}
					placeholder='Escribe tu mensaje…'
					className='w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground resize-none'
				/>
				<button
					type='button'
					onClick={handleSend}
					className='w-full py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
				>
					Enviar por WhatsApp
				</button>
			</div>
		</div>
	);
}

// ── Email modal ─────────────────────────────────────────────────────────────

function EmailModal({ lead, onClose }: { lead: LeadDto; onClose: () => void }) {
	const [msg, setMsg] = useState(() => loadDraft('email'));

	const handleChange = (v: string) => {
		setMsg(v);
		saveDraft('email', v);
	};

	return (
		<div className='fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 px-4'>
			<div className='bg-background border border-border p-6 w-full max-w-md space-y-4'>
				<div className='flex items-center justify-between'>
					<h3 className='text-sm font-semibold text-foreground'>
						Correo — {lead.name}
					</h3>
					<button
						type='button'
						onClick={onClose}
						className='text-muted-foreground hover:text-foreground text-lg leading-none'
					>
						×
					</button>
				</div>
				<p className='text-xs text-muted-foreground'>{lead.email}</p>
				<textarea
					value={msg}
					onChange={e => handleChange(e.target.value)}
					rows={5}
					placeholder='Escribe tu mensaje…'
					className='w-full px-3 py-2 text-sm border border-border focus:outline-none focus:border-foreground resize-none'
				/>
				<a
					type='button'
					href={`mailto:${lead.email}?body=${encodeURIComponent(msg)}`}
					className='w-full p-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
				>
					Enviar correo
				</a>
			</div>
		</div>
	);
}

// ── Lead card ───────────────────────────────────────────────────────────────

function LeadCard({
	lead,
	onStatusChange
}: {
	lead: LeadDto;
	onStatusChange: (leadId: string, status: LeadStatus | null) => void;
}) {
	const [waOpen, setWaOpen] = useState(false);
	const [emailOpen, setEmailOpen] = useState(false);

	const toggleStatus = (s: LeadStatus) => {
		onStatusChange(lead.id, lead.status === s ? null : s);
	};

	return (
		<>
			{waOpen && <WaModal lead={lead} onClose={() => setWaOpen(false)} />}
			{emailOpen && (
				<EmailModal lead={lead} onClose={() => setEmailOpen(false)} />
			)}

			<div className='border border-border p-4 space-y-2'>
				{/* Row 1: date + name */}
				<div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1'>
					<span className='text-xs text-muted-foreground shrink-0'>
						{format(new Date(lead.createdAt), 'd MMM yy', { locale: es })}
					</span>
					<span className='text-sm font-medium text-foreground flex-1 min-w-0 truncate'>
						{lead.name}
					</span>
				</div>

				{/* Row 2: email */}
				<button
					type='button'
					onClick={() => setEmailOpen(true)}
					className='block text-xs text-muted-foreground hover:text-foreground underline text-left break-all'
				>
					{lead.email}
				</button>

				{/* Row 3: phone */}
				{lead.phone && (
					<button
						type='button'
						onClick={() => setWaOpen(true)}
						className='block text-xs text-muted-foreground hover:text-foreground underline text-left'
					>
						{lead.phone}
					</button>
				)}

				{/* Row 4: message */}
				<p className='text-sm text-foreground wrap-break-word'>
					{lead.message}
				</p>

				{/* Row 5: status toggles */}
				<div className='flex flex-wrap gap-2 pt-1'>
					{(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => (
						<button
							key={s}
							type='button'
							onClick={() => toggleStatus(s)}
							className={`px-2 py-0.5 text-xs border rounded-full transition-colors ${
								lead.status === s
									? STATUS_STYLES[s]
									: 'border-border text-muted-foreground hover:border-foreground'
							}`}
						>
							{STATUS_LABELS[s]}
						</button>
					))}
				</div>
			</div>
		</>
	);
}

// ── Main component ──────────────────────────────────────────────────────────

const ORDER_OPTIONS: { value: LeadOrder; label: string }[] = [
	{ value: 'recent', label: 'Recientes primero' },
	{ value: 'older', label: 'Más antiguos' },
	{ value: 'today', label: 'Hoy' }
];

const STATUS_OPTIONS: { value: LeadStatus | 'all'; label: string }[] = [
	{ value: 'all', label: 'Todos' },
	{ value: 'attended', label: 'Atendido' },
	{ value: 'canceled', label: 'Cancelado' },
	{ value: 'contacted', label: 'Contactado' }
];

interface Props {
	leads: LeadDto[];
	loading: boolean;
	hasMore: boolean;
	order: LeadOrder;
	statusFilter: LeadStatus | undefined;
	onOrderChange: (o: LeadOrder) => void;
	onStatusFilterChange: (s: LeadStatus | undefined) => void;
	onLoadMore: () => void;
	onStatusChange: (leadId: string, status: LeadStatus | null) => void;
}

export function LeadsFullList({
	leads,
	loading,
	hasMore,
	order,
	statusFilter,
	onOrderChange,
	onStatusFilterChange,
	onLoadMore,
	onStatusChange
}: Props) {
	return (
		<div className='space-y-4'>
			{/* Filters */}
			<div className='flex flex-col sm:flex-row gap-4'>
				<fieldset>
					<legend className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
						Ordenar
					</legend>
					<div className='flex flex-wrap gap-3'>
						{ORDER_OPTIONS.map(opt => (
							<label
								key={opt.value}
								className='flex items-center gap-1.5 cursor-pointer'
							>
								<input
									type='radio'
									name='order'
									value={opt.value}
									checked={order === opt.value}
									onChange={() => onOrderChange(opt.value)}
									className='accent-primary'
								/>
								<span className='text-sm text-foreground'>{opt.label}</span>
							</label>
						))}
					</div>
				</fieldset>

				<fieldset>
					<legend className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2'>
						Estado
					</legend>
					<div className='flex flex-wrap gap-3'>
						{STATUS_OPTIONS.map(opt => (
							<label
								key={opt.value}
								className='flex items-center gap-1.5 cursor-pointer'
							>
								<input
									type='radio'
									name='statusFilter'
									value={opt.value}
									checked={(statusFilter ?? 'all') === opt.value}
									onChange={() =>
										onStatusFilterChange(
											opt.value === 'all'
												? undefined
												: (opt.value as LeadStatus)
										)
									}
									className='accent-primary'
								/>
								<span className='text-sm text-foreground'>{opt.label}</span>
							</label>
						))}
					</div>
				</fieldset>
			</div>

			{/* List */}
			{leads.length === 0 && !loading ? (
				<div className='text-center py-12'>
					<p className='text-sm text-muted-foreground'>No hay contactos</p>
				</div>
			) : (
				<div className='space-y-3'>
					{leads.map(lead => (
						<LeadCard
							key={lead.id}
							lead={lead}
							onStatusChange={onStatusChange}
						/>
					))}
				</div>
			)}

			{loading && (
				<p className='text-sm text-muted-foreground text-center py-4'>
					Cargando...
				</p>
			)}

			{hasMore && !loading && (
				<div className='flex justify-center pt-2'>
					<button
						type='button'
						onClick={onLoadMore}
						className='px-6 py-2 text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors'
					>
						Cargar más
					</button>
				</div>
			)}
		</div>
	);
}
