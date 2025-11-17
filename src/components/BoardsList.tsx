'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { BoardSummary } from '@/types/dto/board';
import { useTenantSSE } from '@/hooks/useTenantSSE';
import ConfirmDialog from '@/components/ConfirmDialog';

interface BoardsListProps {
  initialBoards: BoardSummary[];
  tenantSlug: string;
  currentUserId: string;
  userRole: string;
}

export default function BoardsList({ initialBoards, tenantSlug, currentUserId, userRole }: BoardsListProps) {
  const { data: session } = useSession();
  const [boards, setBoards] = useState(initialBoards);
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [editingBoard, setEditingBoard] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });
  const [boardToDelete, setBoardToDelete] = useState<BoardSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Check if user can modify a board (creator or owner)
  const canModifyBoard = useCallback((board: BoardSummary) => {
    return board.createdBy.id === currentUserId || userRole === 'owner';
  }, [currentUserId, userRole]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      const response = await fetch(`/api/${tenantSlug}/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create board');
        setIsCreating(false);
        return;
      }

      // Add new board to state immediately (optimistic update)
      const newBoard: BoardSummary = {
        id: data.board.id,
        name: data.board.name,
        description: data.board.description,
        createdAt: data.board.createdAt,
        updatedAt: data.board.updatedAt,
        createdBy: {
          id: currentUserId,
          displayName: session?.user?.name || 'You',
        },
        todosCount: 0,
      };
      setBoards(prev => [...prev, newBoard]);

      setFormData({ name: '', description: '' });
      setShowForm(false);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = async (boardId: string, e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await fetch(`/api/${tenantSlug}/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || 'Failed to update board');
        return;
      }

      setEditingBoard(null);
    } catch (err) {
      alert('An error occurred');
    }
  };

  const openDeleteDialog = (board: BoardSummary, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBoardToDelete(board);
    setDeleteError('');
  };

  const closeDeleteDialog = () => {
    if (isDeleting) {
      return;
    }
    setBoardToDelete(null);
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    if (!boardToDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const response = await fetch(`/api/${tenantSlug}/boards/${boardToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        let data: { error?: string } | null = null;
        try {
          data = await response.json();
        } catch {
          // ignore JSON parse errors
        }
        setDeleteError(data?.error || 'Failed to delete board');
        return;
      }

      setBoards((prev) => prev.filter((board) => board.id !== boardToDelete.id));
      setBoardToDelete(null);
    } catch (err) {
      setDeleteError('An error occurred. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const startEditing = (board: BoardSummary, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingBoard(board.id);
    setEditFormData({ name: board.name, description: board.description || '' });
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingBoard(null);
  };

  // SSE handlers for real-time board updates from other users
  const handleBoardCreated = useCallback((board: BoardSummary) => {
    setBoards((prev) => {
      const exists = prev.some((existing) => existing.id === board.id);
      if (exists) {
        return prev.map((existing) => (existing.id === board.id ? board : existing));
      }
      return [...prev, board];
    });
  }, []);

  const handleBoardUpdated = useCallback((data: { boardId: string; name?: string; description?: string | null }) => {
    console.log('[BoardsList] Board updated via SSE:', data.boardId);
    setBoards(prev => prev.map(board =>
      board.id === data.boardId
        ? { ...board, name: data.name || board.name, description: data.description !== undefined ? data.description : board.description }
        : board
    ));
  }, []);

  const handleBoardDeleted = useCallback((boardId: string) => {
    console.log('[BoardsList] Board deleted via SSE:', boardId);
    setBoards(prev => prev.filter(board => board.id !== boardId));
    setEditingBoard((current) => (current === boardId ? null : current));
    setBoardToDelete((current) => {
      if (current?.id === boardId) {
        setDeleteError('');
        return null;
      }
      return current;
    });
  }, []);

  // Connect to tenant-level SSE for board list updates
  useTenantSSE({
    tenantSlug,
    onBoardCreated: handleBoardCreated,
    onBoardUpdated: handleBoardUpdated,
    onBoardDeleted: handleBoardDeleted,
  });

  return (
    <>
      <div>
      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showForm ? 'Cancel' : 'Create Board'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Board</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Board Name
              </label>
              <input
                type="text"
                id="name"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isCreating}
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (optional)
              </label>
              <textarea
                id="description"
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isCreating}
              />
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Board'}
            </button>
          </form>
        </div>
      )}

      {boards.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No boards</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new board.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <div
              key={board.id}
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex flex-col hover:border-gray-400"
            >
              {editingBoard === board.id ? (
                <form onSubmit={(e) => handleEdit(board.id, e)} className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      rows={2}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <Link
                    href={`/app/${tenantSlug}/boards/${board.id}`}
                    className="flex-1"
                  >
                    <h3 className="text-lg font-medium text-gray-900">{board.name}</h3>
                    {board.description && (
                      <p className="mt-2 text-sm text-gray-500 line-clamp-2">{board.description}</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      Created by {board.createdBy.displayName}
                    </p>
                  </Link>
                  {canModifyBoard(board) && (
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={(e) => startEditing(board, e)}
                        className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => openDeleteDialog(board, e)}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
      <ConfirmDialog
        isOpen={!!boardToDelete}
        title="Delete board"
        message={
          boardToDelete ? (
            <div>
              <p>
                Deleting <span className="font-semibold">"{boardToDelete.name}"</span> will also remove all of its tasks. This action cannot be undone.
              </p>
              {deleteError && (
                <p className="mt-2 text-sm text-red-600">{deleteError}</p>
              )}
            </div>
          ) : (
            'Are you sure you want to delete this board?'
          )
        }
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        onConfirm={handleDeleteConfirm}
        onCancel={closeDeleteDialog}
        disableConfirm={isDeleting}
        disableCancel={isDeleting}
      />
    </>
  );
}
