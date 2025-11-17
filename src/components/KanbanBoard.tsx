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

const COLUMNS: { status: TodoStatus; title: string; color: string }[] = [
  { status: 'TODO', title: 'To Do', color: 'bg-gray-100' },
  { status: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100' },
  { status: 'DONE', title: 'Done', color: 'bg-green-100' },
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
    <>
      {/* Connection Status Banner */}
      {(connectionStatus === 'connecting' || connectionStatus === 'error') && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg flex items-center gap-2 ${
            connectionStatus === 'connecting'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          <span className="text-lg">
            {connectionStatus === 'connecting' ? '🔄' : '⚠️'}
          </span>
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              connectionStatus === 'connecting' ? 'text-yellow-800' : 'text-red-800'
            }`}>
              {connectionStatus === 'connecting'
                ? 'Connessione in corso...'
                : 'Connessione persa - Riconnessione in corso...'}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              {connectionStatus === 'connecting'
                ? 'Stabilendo connessione real-time'
                : 'Gli aggiornamenti potrebbero non essere visualizzati in tempo reale'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {COLUMNS.map((column) => (
        <div key={column.status} className="flex flex-col">
          <div className={`${column.color} rounded-t-lg px-4 py-3 border-b-2 border-gray-300`}>
            <h3 className="font-semibold text-gray-900 flex items-center justify-between">
              {column.title}
              <span className="text-sm font-normal text-gray-600">
                {getTodosByStatus(column.status).length}
              </span>
            </h3>
          </div>

          <div className="bg-gray-50 rounded-b-lg p-4 flex-1 space-y-3 min-h-[500px]">
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
              <p className="text-center text-sm text-gray-400 py-8">
                No tasks
              </p>
            )}
          </div>
        </div>
      ))}
      </div>
    </>
  );
}
