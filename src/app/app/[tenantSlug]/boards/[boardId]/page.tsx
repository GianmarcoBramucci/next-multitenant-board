import { requireAuth } from '@/lib/auth';
import { requireTenantBySlug } from '@/lib/tenant';
import { boardService } from '@/core/services/boardService';
import { todoService } from '@/core/services/todoService';
import KanbanBoard from '@/components/KanbanBoard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function BoardPage({
  params,
}: {
  params: Promise<{ tenantSlug: string; boardId: string }>;
}) {
  try {
    const { tenantSlug, boardId } = await params;
    const user = await requireAuth();
    const tenant = await requireTenantBySlug(tenantSlug);

    // Fetch board con null check
    const board = await boardService.getBoardById(user.id, tenant.id, boardId);

    // Se il board non esiste o non appartiene al tenant
    if (!board) {
      notFound();
    }

    // Fetch todos
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
  } catch (error) {
    // Se l'errore è già un redirect/notFound, rilancia
    if (error instanceof Error && (
      error.message.includes('NEXT_REDIRECT') ||
      error.message.includes('NEXT_NOT_FOUND')
    )) {
      throw error;
    }

    // Altrimenti, log e rilancia per error boundary
    console.error('Error in BoardPage:', error);
    throw new Error('Impossibile caricare il board. Riprova più tardi.');
  }
}
