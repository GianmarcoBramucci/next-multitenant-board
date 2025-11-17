'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { BoardSummary } from '@/types/dto/board';
import { useTenantSSE } from '@/hooks/useTenantSSE';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

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
    if (isDeleting) return;
    setBoardToDelete(null);
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    if (!boardToDelete || isDeleting) return;

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
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Boards
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Manage your workspace boards and tasks
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? 'outline' : 'primary'}
          >
            {showForm ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Board
              </>
            )}
          </Button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div
            className="rounded-2xl p-6 border animate-slide-in"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Create New Board
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="rounded-lg p-4" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--error)' }}>{error}</p>
                </div>
              )}

              <Input
                label="Board Name"
                type="text"
                placeholder="Marketing Campaign 2024"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isCreating}
                required
                fullWidth
              />

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Description (optional)
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm rounded-lg resize-none"
                  style={{
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--surface)'
                  }}
                  placeholder="Track all tasks for our Q1 marketing campaign..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isCreating}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" isLoading={isCreating} fullWidth>
                  {isCreating ? 'Creating...' : 'Create Board'}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowForm(false)}
                  variant="ghost"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl border-2 border-dashed"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface-hover)' }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              <svg className="w-10 h-10" style={{ color: 'var(--text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              No boards yet
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Get started by creating your first board
            </p>
            <Button onClick={() => setShowForm(true)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Board
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <div
                key={board.id}
                className="group rounded-2xl p-6 border transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                {editingBoard === board.id ? (
                  <form onSubmit={(e) => handleEdit(board.id, e)} className="space-y-4">
                    <Input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      required
                      fullWidth
                      autoFocus
                    />
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg resize-none"
                      style={{
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--surface)'
                      }}
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" fullWidth>Save</Button>
                      <Button type="button" onClick={cancelEditing} variant="ghost" size="sm">Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <Link href={`/app/${tenantSlug}/boards/${board.id}`} className="block flex-1">
                      {/* Board Icon & Name */}
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          }}
                        >
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1 truncate" style={{ color: 'var(--text-primary)' }}>
                            {board.name}
                          </h3>
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>{board.todosCount || 0} tasks</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {board.description && (
                        <p className="text-sm mb-4 line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {board.description}
                        </p>
                      )}

                      {/* Creator Info */}
                      <div className="flex items-center gap-2 pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium"
                          style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white'
                          }}
                        >
                          {board.createdBy.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {board.createdBy.displayName}
                        </span>
                      </div>
                    </Link>

                    {/* Action Buttons */}
                    {canModifyBoard(board) && (
                      <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                        <button
                          onClick={(e) => startEditing(board, e)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200"
                          style={{
                            backgroundColor: 'var(--surface-hover)',
                            color: 'var(--text-secondary)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--border)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
                          }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={(e) => openDeleteDialog(board, e)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200"
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#991b1b'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fecaca';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#fee2e2';
                          }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

      {/* Delete Confirmation Dialog */}
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
