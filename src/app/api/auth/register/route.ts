// Register API route - Create new user and tenant OR join existing tenant

import { NextRequest } from 'next/server';
import { RegisterSchema } from '@/lib/validation/authSchemas';
import { tenantService } from '@/core/services/tenantService';
import { ok, badRequest, conflict, internalServerError, notFound } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = RegisterSchema.safeParse(body);

    if (!validation.success) {
      return badRequest('Invalid input', validation.error.errors);
    }

    const { email, password, displayName, tenantName, tenantSlug } = validation.data;

    let tenant;
    let userId;

    if (tenantName) {
      // Create new tenant with owner user
      const result = await tenantService.createTenantWithOwner({
        email,
        password,
        displayName,
        tenantName,
      });
      tenant = result.tenant;
      userId = result.userId;
    } else if (tenantSlug) {
      // Join existing tenant as member
      const result = await tenantService.addUserToExistingTenant({
        email,
        password,
        displayName,
        tenantSlug,
      });
      tenant = result.tenant;
      userId = result.userId;
    } else {
      return badRequest('Either tenantName or tenantSlug must be provided');
    }

    return ok({
      success: true,
      message: 'Registration successful',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
    });
  } catch (error) {
    console.error('[Register Error]', error);

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return conflict(error.message);
      }
      if (error.message.includes('not found')) {
        return notFound(error.message);
      }
      return badRequest(error.message);
    }

    return internalServerError('Failed to register user');
  }
}
