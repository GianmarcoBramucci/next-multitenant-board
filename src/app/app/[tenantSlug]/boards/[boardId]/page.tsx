import { requireAuth } from '@/lib/auth';
import { requireTenantBySlug } from '@/lib/tenant';
import { boardService } from '@/core/services/boardService';
import { todoService } from '@/core/services/todoService';
import KanbanBoard from '@/components/KanbanBoard';
import Link from 'next/link';

export default async function BoardPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; boardId: string }>;
}) {
  const { tenantSlug, boardId } = await params;
  const user = await requireAuth();
  const tenant = await requireTenantBySlug(tenantSlug);
  const board = await boardService.getBoardById(user.id, tenant.id, boardId);
  const todos = await todoService.getTodosByBoardId(user.id, tenant.id, boardId);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href={`/app/${tenantSlug}/boards`}
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to boards
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{board.name}</h1>
          {board.description && (
            <p className="mt-2 text-sm text-gray-600">{board.description}</p>
          )}
        </div>
      </div>

      <KanbanBoard
        boardId={boardId}
        tenantSlug={tenantSlug}
        initialTodos={todos}
      />
    </div>
  );
}
