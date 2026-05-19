'use client';

import { useState } from 'react';
import { InputPhone } from '@/components/Common/InputPhone';
import { ImageCropUpload } from '@/components/Common/ImageCropUpload';
import { FORM_LABELS, ACTION_LABELS, MESSAGES } from './support.const';

export interface SuggestionFormData {
  title: string;
  description: string;
  whatsappPhone: string;
  screenshotFile: File | null;
}

interface Props {
  onSubmit: (data: SuggestionFormData) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

/**
 * Step 2 of the support wizard for `suggestion` type tickets.
 * Collects title, description, optional screenshot, and optional WhatsApp contact.
 */
export function SuggestionForm({ onSubmit, onBack, loading }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !description.trim()) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }
    try {
      await onSubmit({ title, description, whatsappPhone, screenshotFile });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar la sugerencia.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      {/* Title */}
      <div>
        <label className='block text-sm font-medium text-foreground mb-1'>
          {FORM_LABELS.title} <span className='text-error'>*</span>
        </label>
        <input
          type='text'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={FORM_LABELS.titlePlaceholder}
          className='w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-foreground bg-background text-foreground'
          maxLength={120}
        />
        <p className='text-xs text-muted-foreground mt-1'>{FORM_LABELS.titleHelp}</p>
      </div>

      {/* Description */}
      <div>
        <label className='block text-sm font-medium text-foreground mb-1'>
          {FORM_LABELS.description} <span className='text-error'>*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={FORM_LABELS.descriptionPlaceholderSuggestion}
          rows={4}
          className='w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-foreground bg-background text-foreground resize-none'
          maxLength={2000}
        />
        <p className='text-xs text-muted-foreground mt-1'>{FORM_LABELS.descriptionHelp}</p>
      </div>

      {/* Screenshot */}
      <div>
        <label className='block text-sm font-medium text-foreground mb-1'>
          {FORM_LABELS.screenshot}
        </label>
        <ImageCropUpload
          onUpload={async (file) => setScreenshotFile(file)}
          label={FORM_LABELS.screenshotHelp}
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label className='block text-sm font-medium text-foreground mb-1'>
          {FORM_LABELS.whatsappPhone}
        </label>
        <InputPhone value={whatsappPhone} onChange={setWhatsappPhone} />
        <p className='text-xs text-muted-foreground mt-1'>{FORM_LABELS.whatsappPhoneHelp}</p>
      </div>

      {error && (
        <p className='text-sm text-error bg-error-light px-3 py-2 rounded'>{error}</p>
      )}

      <div className='flex gap-3 justify-end pt-2'>
        <button
          type='button'
          onClick={onBack}
          disabled={loading}
          className='px-4 py-2 text-sm text-foreground border border-border rounded hover:bg-muted transition-colors'
        >
          {ACTION_LABELS.back}
        </button>
        <button
          type='submit'
          disabled={loading}
          className='px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-50'
        >
          {loading ? MESSAGES.sending : ACTION_LABELS.sendSuggestion}
        </button>
      </div>
    </form>
  );
}
