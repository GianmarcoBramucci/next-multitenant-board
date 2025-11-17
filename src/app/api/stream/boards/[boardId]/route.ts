// SSE Streaming endpoint - Real-time board updates

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { boardRepository } from '@/core/repositories/boardRepository';
import { requireUserMembership } from '@/lib/tenant';
import { boardStreamRegistry } from '@/lib/sse/boardStreamRegistry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { boardId } = await params;

  try {
    // Authenticate user
    const user = await requireAuth();

    if (!user || !user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get board and verify access
    const board = await boardRepository.findById(boardId);

    if (!board) {
      return new Response('Board not found', { status: 404 });
    }

    // Check if user is a member of the board's tenant
    await requireUserMembership(user.id, board.tenantId);

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Register connection
        const connection = boardStreamRegistry.register(
          boardId,
          user.id,
          controller
        );

        console.log(`[SSE] User ${user.id} connected to board ${boardId}`);

        // Send initial connection message
        const encoder = new TextEncoder();
        const welcomeMessage = `: connected\n\n`;
        controller.enqueue(encoder.encode(welcomeMessage));

        // Keep-alive interval for THIS specific connection (every 15 seconds)
        const keepAliveInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch (error) {
            // Connection closed, clear interval
            clearInterval(keepAliveInterval);
          }
        }, 15000);

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          console.log(`[SSE] Client disconnected: ${connection.id}`);
          clearInterval(keepAliveInterval);
          boardStreamRegistry.unregister(connection.id);
          try {
            controller.close();
          } catch (e) {
            // Controller might already be closed
          }
        });
      },
    });

    // Return SSE response with proper headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error('[SSE Error]', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return new Response('Unauthorized', { status: 401 });
      }
      if (error.message.includes('not a member')) {
        return new Response('Forbidden', { status: 403 });
      }
    }

    return new Response('Internal Server Error', { status: 500 });
  }
}
