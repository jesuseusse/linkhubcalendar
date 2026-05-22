'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { UserSummaryDto, SendCampaignDto } from '@/dtos/user.dto';
import { COMPOSER_LABELS } from './superAdmin.const';

const HTML_SIZE_WARN_CHARS = 500_000;

interface Props {
  recipientUsers: UserSummaryDto[];
  recipientUsersHasMore: boolean;
  recipientUsersLoading: boolean;
  onLoadRecipientUsers: () => void;
  onLoadMoreRecipientUsers: () => void;
  onSend: (data: SendCampaignDto) => Promise<void>;
  sending: boolean;
  sendError: string | null;
  sendSuccess: string | null;
}

function parseCustomEmails(raw: string): string[] {
  return [...new Set(
    raw
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.includes('@'))
  )];
}

export function CampaignComposer({
  recipientUsers,
  recipientUsersHasMore,
  recipientUsersLoading,
  onLoadRecipientUsers,
  onLoadMoreRecipientUsers,
  onSend,
  sending,
  sendError,
  sendSuccess,
}: Props) {
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'custom'>('users');
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [customEmailsRaw, setCustomEmailsRaw] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const usersLoaded = useRef(false);

  useEffect(() => {
    if (!usersLoaded.current) {
      usersLoaded.current = true;
      onLoadRecipientUsers();
    }
  }, [onLoadRecipientUsers]);

  // Debounced iframe preview
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setPreviewHtml(htmlBody), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [htmlBody]);

  const toggleEmail = useCallback((email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      recipientUsers.forEach((u) => next.add(u.email));
      return next;
    });
  }, [recipientUsers]);

  const buildRecipients = (): string[] => {
    const fromUsers = [...selectedEmails];
    const fromCustom = parseCustomEmails(customEmailsRaw);
    return [...new Set([...fromUsers, ...fromCustom])];
  };

  const handleSend = async () => {
    setLocalError(null);
    if (!subject.trim()) {
      setLocalError(COMPOSER_LABELS.errorNoSubject);
      return;
    }
    if (!htmlBody.trim()) {
      setLocalError(COMPOSER_LABELS.errorNoHtml);
      return;
    }
    const recipientEmails = buildRecipients();
    if (recipientEmails.length === 0) {
      setLocalError(COMPOSER_LABELS.errorNoRecipients);
      return;
    }
    await onSend({ subject, htmlBody, recipientEmails });
  };

  const totalRecipients = buildRecipients().length;

  return (
    <div className='border border-border rounded p-4 bg-surface space-y-4'>
      <h3 className='text-sm font-semibold text-foreground uppercase tracking-wider'>
        {COMPOSER_LABELS.title}
      </h3>

      {/* Subject */}
      <div>
        <label className='block text-xs font-medium text-muted-foreground mb-1'>
          {COMPOSER_LABELS.subject}
        </label>
        <input
          type='text'
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={COMPOSER_LABELS.subjectPlaceholder}
          className='w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary'
        />
      </div>

      {/* Recipients */}
      <div>
        <div className='flex gap-2 mb-2'>
          <button
            onClick={() => setActiveTab('users')}
            className={`text-xs px-3 py-1 rounded border transition-colors ${
              activeTab === 'users'
                ? 'border-primary text-foreground bg-muted'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {COMPOSER_LABELS.recipientsTabUsers}
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`text-xs px-3 py-1 rounded border transition-colors ${
              activeTab === 'custom'
                ? 'border-primary text-foreground bg-muted'
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {COMPOSER_LABELS.recipientsTabCustom}
          </button>
        </div>

        {activeTab === 'users' && (
          <div className='border border-border rounded divide-y divide-border max-h-48 overflow-y-auto'>
            {recipientUsersLoading && recipientUsers.length === 0 && (
              <p className='text-xs text-muted-foreground p-3'>Cargando usuarios...</p>
            )}
            {recipientUsers.map((u) => (
              <label key={u.id} className='flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/40'>
                <input
                  type='checkbox'
                  checked={selectedEmails.has(u.email)}
                  onChange={() => toggleEmail(u.email)}
                  className='accent-primary'
                />
                <span className='text-xs text-foreground'>{u.email}</span>
                {u.plan && (
                  <span className='ml-auto text-xs text-muted-foreground'>{u.plan}</span>
                )}
              </label>
            ))}
            {recipientUsersHasMore && (
              <button
                onClick={onLoadMoreRecipientUsers}
                disabled={recipientUsersLoading}
                className='w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors disabled:opacity-50'
              >
                {recipientUsersLoading ? 'Cargando...' : COMPOSER_LABELS.loadMoreUsers}
              </button>
            )}
          </div>
        )}

        {activeTab === 'users' && recipientUsers.length > 0 && (
          <button
            onClick={selectAllVisible}
            className='text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors'
          >
            {COMPOSER_LABELS.selectAll}
          </button>
        )}

        {activeTab === 'custom' && (
          <textarea
            value={customEmailsRaw}
            onChange={(e) => setCustomEmailsRaw(e.target.value)}
            placeholder={COMPOSER_LABELS.customPlaceholder}
            rows={4}
            className='w-full border border-border rounded px-3 py-2 text-xs bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y'
          />
        )}

        {totalRecipients > 0 && (
          <p className='text-xs text-muted-foreground mt-1'>
            {COMPOSER_LABELS.selectedCount(totalRecipients)}
          </p>
        )}
      </div>

      {/* HTML editor + preview */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='flex flex-col gap-1'>
          <label className='text-xs font-medium text-muted-foreground'>
            {COMPOSER_LABELS.htmlEditor}
          </label>
          <textarea
            value={htmlBody}
            onChange={(e) => setHtmlBody(e.target.value)}
            rows={12}
            className='w-full border border-border rounded px-3 py-2 text-xs bg-background text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-y'
          />
          {htmlBody.length > HTML_SIZE_WARN_CHARS && (
            <p className='text-xs text-error'>{COMPOSER_LABELS.htmlSizeWarning}</p>
          )}
        </div>
        <div className='flex flex-col gap-1'>
          <span className='text-xs font-medium text-muted-foreground'>
            {COMPOSER_LABELS.previewTitle}
          </span>
          <iframe
            srcDoc={previewHtml}
            sandbox='allow-same-origin'
            className='w-full h-64 md:h-full border border-border rounded bg-white'
            title='Vista previa del correo'
          />
        </div>
      </div>

      {/* Errors / success */}
      {(localError || sendError) && (
        <p className='text-sm text-error'>{localError ?? sendError}</p>
      )}
      {sendSuccess && <p className='text-sm text-green-700'>{sendSuccess}</p>}

      {/* Actions */}
      <div className='flex justify-end'>
        <button
          onClick={handleSend}
          disabled={sending}
          className='px-4 py-2 bg-primary text-primary-foreground text-sm rounded hover:opacity-90 transition-opacity disabled:opacity-50'
        >
          {sending ? COMPOSER_LABELS.sending : COMPOSER_LABELS.send}
        </button>
      </div>
    </div>
  );
}
