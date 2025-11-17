// Board API routes - GET, PATCH, DELETE a specific board

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requireTenantBySlug } from '@/lib/tenant';
import { boardService } from '@/core/services/boardService';
import { UpdateBoardSchema } from '@/lib/validation/boardSchemas';
import {
  ok,
  noContent,
  unauthorized,
  forbidden,
  notFound,
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
    const board = await boardService.getBoardById(user.id, tenant.id, boardId);

    return ok({ board });
  } catch (error) {
    console.error('[Get Board Error]', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return unauthorized();
      }
      if (error.message.includes('not a member')) {
        return forbidden('You are not a member of this organization');
      }
      if (error.message === 'Board not found') {
        return notFound('Board not found');
      }
    }

    return internalServerError('Failed to fetch board');
  }
}

export async function PATCH(
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
    const validation = UpdateBoardSchema.safeParse(body);

    if (!validation.success) {
      return badRequest('Invalid input', validation.error.errors);
    }

    const board = await boardService.updateBoard(
      user.id,
      tenant.id,
      boardId,
      validation.data
    );

    return ok({
      board: {
        id: board.id,
        name: board.name,
        description: board.description,
        updatedAt: board.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Update Board Error]', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return unauthorized();
      }
      if (error.message.includes('not a member')) {
        return forbidden('You are not a member of this organization');
      }
      if (error.message === 'Board not found') {
        return notFound('Board not found');
      }
      if (error.message.includes('already exists')) {
        return badRequest(error.message);
      }
    }

    return internalServerError('Failed to update board');
  }
}

export async function DELETE(
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
    await boardService.deleteBoard(user.id, tenant.id, boardId);

    return noContent();
  } catch (error) {
    console.error('[Delete Board Error]', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return unauthorized();
      }
      if (error.message.includes('not a member')) {
        return forbidden('You are not a member of this organization');
      }
      if (error.message === 'Board not found') {
        return notFound('Board not found');
      }
    }

    return internalServerError('Failed to delete board');
  }
}
