import { DomainError } from './DomainError';

/**
 * Thrown when a requested resource is not found.
 */
export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
  }
}

/**
 * Thrown when attempting to create a duplicate entity.
 */
export class DuplicateEntityError extends DomainError {
  readonly code = 'DUPLICATE_ORDER';

  constructor(message: string = 'Order already exists') {
    super(message);
  }
}

/**
 * Thrown when request payload or input data is invalid.
 */
export class InvalidInputError extends DomainError {
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string = 'Invalid input provided') {
    super(message);
  }
}

/**
 * Thrown when authentication fails (invalid credentials, missing token, etc).
 */
export class UnauthorizedError extends DomainError {
  readonly code = 'AUTH_ERROR';

  constructor(message: string = 'Unauthorized') {
    super(message);
  }
}

/**
 * Thrown when an authenticated user lacks required permissions.
 */
export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';

  constructor(message: string = 'Access denied') {
    super(message);
  }
}

/**
 * Thrown when JWT token is invalid or cannot be parsed.
 */
export class InvalidTokenError extends DomainError {
  readonly code = 'AUTH_ERROR';

  constructor(message: string = 'Invalid token') {
    super(message);
  }
}

/**
 * Thrown when a specific piece of input data fails validation.
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';

  constructor(
    message: string = 'Validation failed',
    readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}

/**
 * Thrown when a specific item ID is invalid.
 */
export class InvalidItemIdError extends DomainError {
  readonly code = 'INVALID_ITEM_ID';

  constructor(message: string = 'Item ID must be numeric') {
    super(message);
  }
}
