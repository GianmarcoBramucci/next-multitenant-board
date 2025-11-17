'use client';

import { useState } from 'react';
import { TodoStatus } from '@/core/domain/models';
import { fetchPost } from '@/lib/fetch-wrapper';
import { useToast } from './Toast';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface CreateTodoFormProps {
  boardId: string;
  tenantSlug: string;
  status: TodoStatus;
}

export default function CreateTodoForm({
  boardId,
  tenantSlug,
  status,
}: CreateTodoFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsCreating(true);

    try {
      await fetchPost(
        `/api/${tenantSlug}/boards/${boardId}/todos`,
        {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
        }
      );

      // Success
      setTitle('');
      setDescription('');
      setShowForm(false);
    } catch (error: any) {
      showToast(error.message || 'Errore nella creazione del task', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full text-left px-4 py-3 text-sm font-medium rounded-xl border-2 border-dashed transition-all duration-200 group"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--primary)';
          e.currentTarget.style.color = 'var(--primary)';
          e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Task
        </div>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-4 space-y-3 border"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-md)'
      }}
    >
      <Input
        type="text"
        placeholder="Task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        disabled={isCreating}
        fullWidth
        className="text-sm"
      />
      <textarea
        placeholder="Add description (optional)"
        className="w-full px-3 py-2 text-sm rounded-lg resize-none"
        style={{
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          backgroundColor: 'var(--surface)'
        }}
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isCreating}
      />
      <div className="flex gap-2">
        <Button
          type="submit"
          isLoading={isCreating}
          disabled={!title.trim()}
          size="sm"
          className="flex-1"
        >
          {isCreating ? 'Adding...' : 'Add Task'}
        </Button>
        <Button
          type="button"
          onClick={() => {
            setShowForm(false);
            setTitle('');
            setDescription('');
          }}
          disabled={isCreating}
          variant="ghost"
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
