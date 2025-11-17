// Todo API routes - PATCH and DELETE a specific todo

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requireTenantBySlug } from '@/lib/tenant';
import { todoService } from '@/core/services/todoService';
import { UpdateTodoSchema } from '@/lib/validation/todoSchemas';
import {
  ok,
  noContent,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  internalServerError,
} from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ tenantSlug: string; boardId: string; todoId: string }>;
  }
) {
  try {
    const { tenantSlug, boardId, todoId } = await params;
    const user = await requireAuth();

    if (!user || !user.id) {
      return unauthorized();
    }

    const tenant = await requireTenantBySlug(tenantSlug);
    const body = await request.json();

    // Validate input
    const validation = UpdateTodoSchema.safeParse(body);

    if (!validation.success) {
      return badRequest('Invalid input', validation.error.errors);
    }

    const todo = await todoService.updateTodo(
      user.id,
      tenant.id,
      boardId,
      todoId,
      validation.data
    );

    return ok({ todo });
  } catch (error) {
    console.error('[Update Todo Error]', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return unauthorized();
      }
      if (error.message.includes('not a member')) {
        return forbidden('You are not a member of this organization');
      }
      if (error.message === 'Todo not found') {
        return notFound('Todo not found');
      }
    }

    return internalServerError('Failed to update todo');
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ tenantSlug: string; boardId: string; todoId: string }>;
  }
) {
  try {
    const { tenantSlug, boardId, todoId } = await params;
    const user = await requireAuth();

    if (!user || !user.id) {
      return unauthorized();
    }

    const tenant = await requireTenantBySlug(tenantSlug);
    await todoService.deleteTodo(user.id, tenant.id, boardId, todoId);

    return noContent();
  } catch (error) {
    console.error('[Delete Todo Error]', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return unauthorized();
      }
      if (error.message.includes('not a member')) {
        return forbidden('You are not a member of this organization');
      }
      if (error.message === 'Todo not found') {
        return notFound('Todo not found');
      }
    }

    return internalServerError('Failed to delete todo');
  }
}
