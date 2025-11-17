// Boards API routes - GET all boards, POST new board

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requireTenantBySlug } from '@/lib/tenant';
import { boardService } from '@/core/services/boardService';
import { CreateBoardSchema } from '@/lib/validation/boardSchemas';
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
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const user = await requireAuth();

    if (!user || !user.id) {
      return unauthorized();
    }

    const tenant = await requireTenantBySlug(tenantSlug);
    const boards = await boardService.getBoardsForTenant(user.id, tenant.id);

    return ok({ boards });
  } catch (error) {
    console.error('[Get Boards Error]', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return unauthorized();
      }
      if (error.message.includes('not a member')) {
        return forbidden('You are not a member of this organization');
      }
      if (error.message === 'Tenant not found') {
        return badRequest('Organization not found');
      }
    }

    return internalServerError('Failed to fetch boards');
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  try {
    const { tenantSlug } = await params;
    const user = await requireAuth();

    if (!user || !user.id) {
      return unauthorized();
    }

    const tenant = await requireTenantBySlug(tenantSlug);
    const body = await request.json();

    // Validate input
    const validation = CreateBoardSchema.safeParse(body);

    if (!validation.success) {
      return badRequest('Invalid input', validation.error.errors);
    }

    const board = await boardService.createBoard(
      user.id,
      tenant.id,
      validation.data
    );

    return created({
      board: {
        id: board.id,
        name: board.name,
        description: board.description,
        createdAt: board.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Create Board Error]', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return unauthorized();
      }
      if (error.message.includes('not a member')) {
        return forbidden('You are not a member of this organization');
      }
      if (error.message === 'Tenant not found') {
        return badRequest('Organization not found');
      }
      if (error.message.includes('already exists')) {
        return badRequest(error.message);
      }
    }

    return internalServerError('Failed to create board');
  }
}
