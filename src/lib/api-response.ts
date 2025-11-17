// API Response helpers - Standardized HTTP responses

import { NextResponse } from 'next/server';

/**
 * Success response (200)
 */
export function ok<T>(data: T) {
  return NextResponse.json(data, { status: 200 });
}

/**
 * Created response (201)
 */
export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

/**
 * No content response (204)
 */
export function noContent() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Bad request response (400)
 */
export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      details,
    },
    { status: 400 }
  );
}

/**
 * Unauthorized response (401)
 */
export function unauthorized(message: string = 'Unauthorized') {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 401 }
  );
}

/**
 * Forbidden response (403)
 */
export function forbidden(message: string = 'Forbidden') {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 403 }
  );
}

/**
 * Not found response (404)
 */
export function notFound(message: string = 'Not found') {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 404 }
  );
}

/**
 * Conflict response (409)
 */
export function conflict(message: string) {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 409 }
  );
}

/**
 * Internal server error response (500)
 */
export function internalServerError(message: string = 'Internal server error') {
  return NextResponse.json(
    {
      error: message,
    },
    { status: 500 }
  );
}

/**
 * Custom error response
 */
export function error(status: number, message: string, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      details,
    },
    { status }
  );
}
