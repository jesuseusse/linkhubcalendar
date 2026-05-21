'use client';

import { useState } from 'react';
import { EMAIL_EXPORT_LABELS } from './superAdmin.const';

const PAGE_SIZE = 1000;

interface Props {
  emails: string[];
  onClose: () => void;
}

export function EmailExportModal({ emails, onClose }: Props) {
  const [page, setPage] = useState(0);
  const [copied, setCopied] = useState(false);

  const totalPages = Math.max(1, Math.ceil(emails.length / PAGE_SIZE));
  const pageEmails = emails.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageText = pageEmails.join(', ');

  async function handleCopy() {
    await navigator.clipboard.writeText(pageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40'
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className='relative bg-surface border border-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl'>
        {/* Header */}
        <div className='flex items-center justify-between gap-3 px-5 py-4 border-b border-border'>
          <h3 className='text-sm font-semibold text-foreground uppercase tracking-wider'>
            {EMAIL_EXPORT_LABELS.title}
          </h3>
          <button
            onClick={onClose}
            aria-label={EMAIL_EXPORT_LABELS.close}
            className='text-muted-foreground hover:text-foreground transition-colors'
          >
            <span className='material-icons text-[20px]'>close</span>
          </button>
        </div>

        {/* Body */}
        <div className='flex-1 overflow-y-auto px-5 py-4 space-y-3'>
          <p className='text-xs text-muted-foreground'>{EMAIL_EXPORT_LABELS.hint}</p>
          <textarea
            readOnly
            value={pageText}
            className='w-full h-48 text-xs font-mono bg-muted border border-border rounded p-3 resize-none text-foreground'
          />
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between gap-3 px-5 py-4 border-t border-border'>
          <div className='flex items-center gap-2'>
            {totalPages > 1 && (
              <>
                <button
                  type='button'
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className='text-xs px-3 py-1.5 border border-border rounded text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
                >
                  {EMAIL_EXPORT_LABELS.prev}
                </button>
                <span className='text-xs text-muted-foreground'>
                  {EMAIL_EXPORT_LABELS.page(page + 1, totalPages)}
                </span>
                <button
                  type='button'
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className='text-xs px-3 py-1.5 border border-border rounded text-muted-foreground hover:text-foreground hover:border-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
                >
                  {EMAIL_EXPORT_LABELS.next}
                </button>
              </>
            )}
          </div>
          <button
            type='button'
            onClick={handleCopy}
            className='flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded transition-colors'
          >
            <span className='material-icons text-[16px]'>
              {copied ? 'check' : 'content_copy'}
            </span>
            {copied ? EMAIL_EXPORT_LABELS.copied : EMAIL_EXPORT_LABELS.copy}
          </button>
        </div>
      </div>
    </div>
  );
}
