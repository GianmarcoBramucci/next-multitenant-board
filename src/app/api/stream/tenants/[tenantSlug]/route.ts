// SSE Streaming endpoint - Real-time tenant-level updates (board list)

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { requireTenantBySlug, requireUserMembership } from '@/lib/tenant';
import { boardStreamRegistry } from '@/lib/sse/boardStreamRegistry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantSlug: string }> }
) {
  const { tenantSlug } = await params;

  try {
    // Authenticate user
    const user = await requireAuth();

    if (!user || !user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get tenant and verify access
    const tenant = await requireTenantBySlug(tenantSlug);

    // Check if user is a member of the tenant
    await requireUserMembership(user.id, tenant.id);

    // Create readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Register tenant-level connection
        const connection = boardStreamRegistry.registerTenant(
          tenant.id,
          user.id,
          controller
        );

        console.log(`[SSE] User ${user.id} connected to tenant ${tenant.id}`);

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
          console.log(`[SSE] Client disconnected from tenant: ${connection.id}`);
          clearInterval(keepAliveInterval);
          boardStreamRegistry.unregisterTenant(connection.id);
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
    console.error('[SSE Tenant Error]', error);

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
