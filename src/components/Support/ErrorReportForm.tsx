'use client';

import { useState } from 'react';
import { InputPhone } from '@/components/Common/InputPhone';
import { ImageCropUpload } from '@/components/Common/ImageCropUpload';
import { DeviceType } from '@/dtos/user.dto';
import {
  DEVICE_TYPE_OPTIONS,
  FORM_LABELS,
  ACTION_LABELS,
  MESSAGES,
} from './support.const';

export interface ErrorReportFormData {
  title: string;
  description: string;
  deviceType: DeviceType | '';
  deviceOther: string;
  whatsappPhone: string;
  screenshotFile: File | null;
}

interface Props {
  onSubmit: (data: ErrorReportFormData) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

/**
 * Step 2 of the support wizard for `error` type tickets.
 * Collects title, description, device type, optional screenshot, and optional WhatsApp contact.
 */
export function ErrorReportForm({ onSubmit, onBack, loading }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deviceType, setDeviceType] = useState<DeviceType | ''>('');
  const [deviceOther, setDeviceOther] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !description.trim() || !deviceType) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }
    if (deviceType === 'other' && !deviceOther.trim()) {
      setError('Por favor especifica el dispositivo.');
      return;
    }
    try {
      await onSubmit({ title, description, deviceType, deviceOther, whatsappPhone, screenshotFile });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el reporte.');
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
          placeholder={FORM_LABELS.descriptionPlaceholderError}
          rows={4}
          className='w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-foreground bg-background text-foreground resize-none'
          maxLength={2000}
        />
        <p className='text-xs text-muted-foreground mt-1'>{FORM_LABELS.descriptionHelp}</p>
      </div>

      {/* Device type */}
      <div>
        <label className='block text-sm font-medium text-foreground mb-1'>
          {FORM_LABELS.deviceType} <span className='text-error'>*</span>
        </label>
        <select
          value={deviceType}
          onChange={(e) => setDeviceType(e.target.value as DeviceType | '')}
          className='w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-foreground bg-background text-foreground'
        >
          <option value=''>Selecciona un dispositivo</option>
          {DEVICE_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className='text-xs text-muted-foreground mt-1'>{FORM_LABELS.deviceTypeHelp}</p>
      </div>

      {/* Other device specification */}
      {deviceType === 'other' && (
        <div>
          <label className='block text-sm font-medium text-foreground mb-1'>
            {FORM_LABELS.deviceOther} <span className='text-error'>*</span>
          </label>
          <input
            type='text'
            value={deviceOther}
            onChange={(e) => setDeviceOther(e.target.value)}
            placeholder={FORM_LABELS.deviceOtherPlaceholder}
            className='w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-foreground bg-background text-foreground'
            maxLength={100}
          />
        </div>
      )}

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
          {loading ? MESSAGES.sending : ACTION_LABELS.sendReport}
        </button>
      </div>
    </form>
  );
}
