'use client';

import { useState } from 'react';
import { TodoItem } from '@/types/dto/todo';
import { TodoStatus } from '@/core/domain/models';
import { fetchPatch, fetchDelete } from '@/lib/fetch-wrapper';
import { useToast } from './Toast';
import { Select } from './ui/Select';
import ConfirmDialog from '@/components/ConfirmDialog';

interface TodoCardProps {
  todo: TodoItem;
  boardId: string;
  tenantSlug: string;
}

const STATUS_OPTIONS = [
  { value: 'TODO', label: '📋 To Do' },
  { value: 'IN_PROGRESS', label: '⚡ In Progress' },
  { value: 'DONE', label: '✓ Done' },
];

export default function TodoCard({ todo, boardId, tenantSlug }: TodoCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { showToast } = useToast();

  const handleStatusChange = async (newStatus: TodoStatus) => {
    if (newStatus === todo.status || isUpdating) return;

    setIsUpdating(true);

    try {
      await fetchPatch(
        `/api/${tenantSlug}/boards/${boardId}/todos/${todo.id}`,
        { status: newStatus }
      );
    } catch (error: any) {
      showToast(error.message || 'Errore nell\'aggiornamento del task', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      await fetchDelete(`/api/${tenantSlug}/boards/${boardId}/todos/${todo.id}`);
      setIsDeleteDialogOpen(false);
      // Success - SSE will update UI automatically
    } catch (error: any) {
      showToast(error.message || 'Errore nell\'eliminazione del task', 'error');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className="group rounded-xl p-4 transition-all duration-200 hover:scale-[1.02] cursor-pointer border"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        {/* Header with Title and Delete */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4
            className="font-semibold flex-1 leading-snug"
            style={{ color: 'var(--text-primary)', fontSize: '0.9375rem' }}
          >
            {todo.title}
          </h4>
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50 disabled:opacity-50"
            title="Delete task"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--error)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-tertiary)';
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* Description */}
        {todo.description && (
          <p
            className="text-sm mb-4 whitespace-pre-wrap leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            {todo.description}
          </p>
        )}

        {/* Status Badge & Dropdown */}
        <div className="mb-3">
          <Select
            value={todo.status}
            onChange={(e) => handleStatusChange(e.target.value as TodoStatus)}
            disabled={isUpdating}
            options={STATUS_OPTIONS}
            className="text-xs font-medium py-1.5"
          />
        </div>

        {/* Footer: Assignee & Creator */}
        <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          {todo.assignee ? (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white'
                }}
                title={`Assigned to ${todo.assignee.displayName}`}
              >
                {todo.assignee.displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                {todo.assignee.displayName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--surface-hover)',
                  color: 'var(--text-tertiary)'
                }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Unassigned
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5" title={`Created by ${todo.createdBy.displayName}`}>
            <svg className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {todo.createdBy.displayName}
            </span>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Elimina task"
        message={
          <p>
            Stai per eliminare{' '}
            <span className="font-semibold">&quot;{todo.title}&quot;</span>. Questa azione è
            irreversibile.
          </p>
        }
        confirmLabel={isDeleting ? 'Eliminazione...' : 'Elimina'}
        cancelLabel="Annulla"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        disableConfirm={isDeleting}
        disableCancel={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(false);
          }
        }}
      />
    </>
  );
}
