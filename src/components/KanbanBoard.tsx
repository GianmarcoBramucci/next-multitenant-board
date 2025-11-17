'use client';

import { useState, useCallback } from 'react';
import { TodoItem } from '@/types/dto/todo';
import { TodoStatus } from '@/core/domain/models';
import { useBoardSSE } from '@/hooks/useBoardSSE';
import TodoCard from './TodoCard';
import CreateTodoForm from './CreateTodoForm';

interface KanbanBoardProps {
  boardId: string;
  tenantSlug: string;
  initialTodos: TodoItem[];
}

const COLUMNS: { status: TodoStatus; title: string; icon: string; gradient: string }[] = [
  { status: 'TODO', title: 'To Do', icon: '📋', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { status: 'IN_PROGRESS', title: 'In Progress', icon: '⚡', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { status: 'DONE', title: 'Done', icon: '✓', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
];

export default function KanbanBoard({
  boardId,
  tenantSlug,
  initialTodos,
}: KanbanBoardProps) {
  const [todos, setTodos] = useState<TodoItem[]>(initialTodos);

  // SSE event handlers with duplicate check
  const handleTodoCreated = useCallback((todo: TodoItem) => {
    console.log('[Kanban] Todo created:', todo.id);
    setTodos((prev) => {
      // Check for duplicates before adding
      if (prev.some((t) => t.id === todo.id)) {
        console.log('[Kanban] Todo already exists, skipping:', todo.id);
        return prev;
      }
      return [...prev, todo];
    });
  }, []);

  const handleTodoUpdated = useCallback((todo: TodoItem) => {
    console.log('[Kanban] Todo updated:', todo.id);
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? todo : t))
    );
  }, []);

  const handleTodoDeleted = useCallback((todoId: string) => {
    console.log('[Kanban] Todo deleted:', todoId);
    setTodos((prev) => prev.filter((t) => t.id !== todoId));
  }, []);

  const handleTodoStatusChanged = useCallback((todo: TodoItem) => {
    console.log('[Kanban] Todo status changed:', todo.id, todo.status);
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? todo : t))
    );
  }, []);

  // Initialize SSE connection
  const { connectionStatus } = useBoardSSE({
    boardId,
    onTodoCreated: handleTodoCreated,
    onTodoUpdated: handleTodoUpdated,
    onTodoDeleted: handleTodoDeleted,
    onTodoStatusChanged: handleTodoStatusChanged,
  });

  const getTodosByStatus = (status: TodoStatus) =>
    todos
      .filter((todo) => todo.status === status)
      .sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-6">
      {/* Connection Status Banner */}
      {connectionStatus === 'connected' && (
        <div
          className="px-4 py-2 rounded-lg flex items-center gap-2 animate-fade-in"
          style={{ backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7' }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--success)' }}></div>
          <span className="text-sm font-medium" style={{ color: '#065f46' }}>
            Real-time sync active
          </span>
        </div>
      )}

      {(connectionStatus === 'connecting' || connectionStatus === 'error') && (
        <div
          className="px-4 py-3 rounded-lg flex items-center gap-3"
          style={{
            backgroundColor: connectionStatus === 'connecting' ? '#fef3c7' : '#fee2e2',
            border: connectionStatus === 'connecting' ? '1px solid #fbbf24' : '1px solid #fca5a5'
          }}
        >
          <div className="flex-shrink-0">
            {connectionStatus === 'connecting' ? (
              <svg className="w-5 h-5 animate-spin" style={{ color: '#d97706' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" style={{ color: '#dc2626' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: connectionStatus === 'connecting' ? '#92400e' : '#991b1b' }}>
              {connectionStatus === 'connecting' ? 'Connecting...' : 'Connection lost'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {connectionStatus === 'connecting'
                ? 'Establishing real-time connection'
                : 'Attempting to reconnect...'}
            </p>
          </div>
        </div>
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {COLUMNS.map((column) => (
          <div key={column.status} className="flex flex-col">
            {/* Column Header */}
            <div
              className="rounded-t-2xl px-5 py-4 relative overflow-hidden"
              style={{ background: column.gradient }}
            >
              <div className="relative z-10 flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{column.icon}</span>
                  <h3 className="font-bold text-lg">{column.title}</h3>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white bg-opacity-20 backdrop-blur-sm">
                  <span className="text-sm font-bold">
                    {getTodosByStatus(column.status).length}
                  </span>
                </div>
              </div>
              {/* Decorative blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl"></div>
            </div>

            {/* Column Body */}
            <div
              className="rounded-b-2xl p-4 flex-1 space-y-3 min-h-[600px]"
              style={{ backgroundColor: 'var(--background)' }}
            >
              <CreateTodoForm
                boardId={boardId}
                tenantSlug={tenantSlug}
                status={column.status}
              />

              {getTodosByStatus(column.status).map((todo) => (
                <TodoCard
                  key={todo.id}
                  todo={todo}
                  boardId={boardId}
                  tenantSlug={tenantSlug}
                />
              ))}

              {getTodosByStatus(column.status).length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: 'var(--surface-hover)' }}
                  >
                    <svg className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>No tasks yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)', opacity: 0.7 }}>
                    Add your first task above
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
