'use client';

import { useState } from 'react';
import { TodoStatus } from '@/core/domain/models';
import { fetchPost } from '@/lib/fetch-wrapper';
import { useToast } from './Toast';

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
        className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-md border-2 border-dashed border-gray-300"
      >
        + Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-3 space-y-2">
      <input
        type="text"
        placeholder="Task title"
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        disabled={isCreating}
      />
      <textarea
        placeholder="Description (optional)"
        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isCreating}
      />
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={isCreating || !title.trim()}
          className="flex-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Adding...' : 'Add'}
        </button>
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setTitle('');
            setDescription('');
          }}
          disabled={isCreating}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
