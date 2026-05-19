'use client';

import { useState } from 'react';
import { TicketCommentDto, TicketStatus } from '@/dtos/user.dto';
import { ACTION_LABELS, MESSAGES } from './support.const';

interface Props {
  comments: TicketCommentDto[];
  ticketStatus: TicketStatus;
  onAddComment: (content: string) => Promise<void>;
}

/**
 * Displays the comment thread for a ticket and, when the ticket is `open`,
 * shows a textarea to add a new comment.
 */
export function CommentSection({ comments, ticketStatus, onAddComment }: Props) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canComment = ticketStatus === 'open';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setLoading(true);
    try {
      await onAddComment(content.trim());
      setContent('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el comentario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mt-6'>
      <h4 className='text-sm font-semibold text-foreground mb-3'>Comentarios</h4>

      {comments.length === 0 && (
        <p className='text-xs text-muted-foreground mb-4'>
          Aún no hay comentarios en este ticket.
        </p>
      )}

      {comments.length > 0 && (
        <div className='flex flex-col gap-3 mb-4'>
          {comments.map((comment) => (
            <div key={comment.id} className='bg-muted rounded-lg px-4 py-3'>
              <div className='flex items-center justify-between mb-1'>
                <span className='text-xs font-medium text-foreground'>{comment.userName}</span>
                <span className='text-xs text-muted-foreground'>
                  {new Date(comment.createdAt).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <p className='text-sm text-foreground whitespace-pre-wrap'>{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      {canComment ? (
        <form onSubmit={handleSubmit} className='flex flex-col gap-2'>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={MESSAGES.commentPlaceholder}
            rows={3}
            className='w-full px-3 py-2 text-sm border border-border rounded focus:outline-none focus:border-foreground bg-background text-foreground resize-none'
            maxLength={1000}
          />
          {error && (
            <p className='text-xs text-error'>{error}</p>
          )}
          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={loading || !content.trim()}
              className='px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity disabled:opacity-50'
            >
              {loading ? MESSAGES.sending : ACTION_LABELS.sendComment}
            </button>
          </div>
        </form>
      ) : (
        <p className='text-xs text-muted-foreground italic'>{MESSAGES.commentsDisabled}</p>
      )}
    </div>
  );
}
