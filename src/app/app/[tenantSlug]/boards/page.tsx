import { requireAuth } from '@/lib/auth';
import { requireTenantBySlug, getUserRole } from '@/lib/tenant';
import { boardService } from '@/core/services/boardService';
import BoardsList from '@/components/BoardsList';

export default async function BoardsPage({
  params,
}: {
  params: Promise<{ tenantSlug: string }>;
}) {
  const { tenantSlug } = await params;
  const user = await requireAuth();
  const tenant = await requireTenantBySlug(tenantSlug);
  const boards = await boardService.getBoardsForTenant(user.id, tenant.id);
  const userRole = await getUserRole(user.id, tenant.id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Boards</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your project boards and tasks
        </p>
      </div>

      <BoardsList
        initialBoards={boards}
        tenantSlug={tenantSlug}
        currentUserId={user.id}
        userRole={userRole}
      />
    </div>
  );
}
