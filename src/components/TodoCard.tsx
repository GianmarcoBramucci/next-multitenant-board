'use client';

import { useState } from 'react';
import { TodoItem } from '@/types/dto/todo';
import { TodoStatus } from '@/core/domain/models';

interface TodoCardProps {
  todo: TodoItem;
  boardId: string;
  tenantSlug: string;
}

const STATUS_OPTIONS: { value: TodoStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

export default function TodoCard({ todo, boardId, tenantSlug }: TodoCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = async (newStatus: TodoStatus) => {
    if (newStatus === todo.status || isUpdating) return;

    setIsUpdating(true);

    try {
      const response = await fetch(
        `/api/${tenantSlug}/boards/${boardId}/todos/${todo.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        console.error('Failed to update todo status');
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/${tenantSlug}/boards/${boardId}/todos/${todo.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        console.error('Failed to delete todo');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 flex-1">{todo.title}</h4>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-gray-400 hover:text-red-600 ml-2 disabled:opacity-50"
          title="Delete task"
        >
          ×
        </button>
      </div>

      {todo.description && (
        <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">
          {todo.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs">
        <select
          value={todo.status}
          onChange={(e) => handleStatusChange(e.target.value as TodoStatus)}
          disabled={isUpdating}
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {todo.assignee && (
          <span className="text-gray-500" title={`Assigned to ${todo.assignee.displayName}`}>
            👤 {todo.assignee.displayName}
          </span>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-400">
        Created by {todo.createdBy.displayName}
      </div>
    </div>
  );
}
