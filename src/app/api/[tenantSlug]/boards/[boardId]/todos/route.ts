// Todos API routes - GET all todos for a board, POST new todo

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requireTenantBySlug } from '@/lib/tenant';
import { todoService } from '@/core/services/todoService';
import { CreateTodoSchema } from '@/lib/validation/todoSchemas';
import {
  ok,
  created,
  unauthorized,
  forbidden,
  badRequest,
  internalServerError,
} from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; boardId: string }> }
) {
  try {
    const { tenantSlug, boardId } = await params;
    const user = await requireAuth();

    if (!user || !user.id) {
      return unauthorized();
    }

    const tenant = await requireTenantBySlug(tenantSlug);
    const todos = await todoService.getTodosByBoardId(
      user.id,
      tenant.id,
      boardId
    );

    return ok({ todos });
  } catch (error) {
    console.error('[Get Todos Error]', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return unauthorized();
      }
      if (error.message.includes('not a member')) {
        return forbidden('You are not a member of this organization');
      }
      if (error.message === 'Board not found') {
        return badRequest('Board not found');
      }
    }

    return internalServerError('Failed to fetch todos');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string; boardId: string }> }
) {
  try {
    const { tenantSlug, boardId } = await params;
    const user = await requireAuth();

    if (!user || !user.id) {
      return unauthorized();
    }

    const tenant = await requireTenantBySlug(tenantSlug);
    const body = await request.json();

    // Validate input
    const validation = CreateTodoSchema.safeParse(body);

    if (!validation.success) {
      return badRequest('Invalid input', validation.error.errors);
    }

    const todo = await todoService.createTodo(
      user.id,
      tenant.id,
      boardId,
      validation.data
    );

    return created({ todo });
  } catch (error) {
    console.error('[Create Todo Error]', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return unauthorized();
      }
      if (error.message.includes('not a member')) {
        return forbidden('You are not a member of this organization');
      }
      if (error.message === 'Board not found') {
        return badRequest('Board not found');
      }
    }

    return internalServerError('Failed to create todo');
  }
}
