// Value Objects - Domain-specific value types and validation logic

import { TodoStatus } from './models';

/**
 * Valid status transitions for a Todo
 */
const VALID_STATUS_TRANSITIONS: Record<TodoStatus, TodoStatus[]> = {
  TODO: ['IN_PROGRESS', 'DONE'],
  IN_PROGRESS: ['TODO', 'DONE'],
  DONE: ['TODO', 'IN_PROGRESS'],
};

/**
 * Check if a status transition is valid
 */
export function canTransitionStatus(
  from: TodoStatus,
  to: TodoStatus
): boolean {
  if (from === to) return true;
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validate and normalize a tenant slug
 */
export function validateSlug(slug: string): boolean {
  // Slug must be lowercase, alphanumeric, and can contain hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 2 && slug.length <= 50;
}

/**
 * Create a slug from a name
 */
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/-+/g, '-') // replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // trim hyphens from start/end
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * At least 8 characters
 */
export function validatePassword(password: string): boolean {
  return password.length >= 8;
}

/**
 * Get display name for a status
 */
export function getStatusDisplayName(status: TodoStatus): string {
  const displayNames: Record<TodoStatus, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
  };
  return displayNames[status];
}

/**
 * Get CSS color class for a status
 */
export function getStatusColor(status: TodoStatus): string {
  const colors: Record<TodoStatus, string> = {
    TODO: 'bg-gray-100 text-gray-800 border-gray-300',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-300',
    DONE: 'bg-green-100 text-green-800 border-green-300',
  };
  return colors[status];
}
