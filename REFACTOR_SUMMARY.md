# Clean Architecture Error Handling Refactor

## Overview
This refactor implements a comprehensive, production-grade error handling system following Clean Architecture principles with strict separation of concerns. All infrastructure errors are wrapped into domain errors, controllers are pure HTTP handlers with no error translation logic, and a single global middleware is responsible for converting domain errors to HTTP responses.

## Architecture Rules Implemented

### ✅ 1. Domain Error Layer (`/src/errors/domain`)
All business rule violations and validation failures are represented as explicit domain error classes.

**Base class:**
- `DomainError` (abstract) - Base for all domain errors with code property and proper stack trace

**Concrete error classes:**
- `NotFoundError` → code: `NOT_FOUND` → HTTP 404
- `DuplicateEntityError` → code: `DUPLICATE_ORDER` → HTTP 409
- `InvalidInputError` → code: `VALIDATION_ERROR` → HTTP 400
- `InvalidItemIdError` → code: `INVALID_ITEM_ID` → HTTP 400
- `UnauthorizedError` → code: `AUTH_ERROR` → HTTP 401
- `InvalidTokenError` → code: `AUTH_ERROR` → HTTP 401
- `ForbiddenError` → code: `FORBIDDEN` → HTTP 403
- `ValidationError` → code: `VALIDATION_ERROR` → HTTP 400

### ✅ 2. Services Throw Only Domain Errors
**Auth Service (`/src/services/auth.service.ts`):**
- ❌ Removed: `createError` from http-errors
- ✅ Added: `UnauthorizedError` for invalid credentials
- ✅ Added: `InvalidTokenError` for JWT verification failures
- Internal error logging for debugging (console.warn) without leaking to client

**Order Service (`/src/services/order.service.ts`):**
- ❌ Removed: All `createError` calls and error status manipulation
- ✅ Added: Domain error throws for all business rule violations
- ✅ Wrapped: Prisma P2002 (unique constraint) → `DuplicateEntityError`
- ✅ Wrapped: Validation failures → `InvalidItemIdError`, `InvalidInputError`
- ✅ Added: `NotFoundError` for missing orders

### ✅ 3. Controllers Are Pure HTTP Handlers
**All controllers follow this pattern:**
```typescript
try {
  const result = await service(...);
  res.status(XXX).json(result);
} catch (err) {
  next(err);  // No error translation!
}
```

**Order Controller (`/src/controllers/order.controller.ts`):**
- ✅ Removed: All error code inspection (P2002, INVALID_ITEM_ID, etc.)
- ✅ Removed: All `createError` calls
- ✅ Removed: if/else error translation chains
- ✅ All errors passed to global handler via `next(err)`

**Auth Controller (`/src/controllers/auth.controller.ts`):**
- ✅ Removed: `any` type (replaced with proper types)
- ✅ All errors delegated to global handler

### ✅ 4. Global Error Handler Middleware
**File: `/src/middlewares/errorHandler.ts`**

This is the ONLY place allowed to:
- Convert domain error codes to HTTP status codes
- Format JSON error responses
- Set HTTP status and response shape

**Single Source of Truth:** `domainErrorToHttpStatus` mapping
```typescript
{
  'NOT_FOUND': 404,
  'DUPLICATE_ORDER': 409,
  'INVALID_ITEM_ID': 400,
  'AUTH_ERROR': 401,
  'FORBIDDEN': 403,
  'VALIDATION_ERROR': 400
}
```

**Response Format:**
```json
{
  "error": {
    "code": "DOMAIN_ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### ✅ 5. Auth Middleware - Domain Errors Only
**File: `/src/middlewares/auth.middleware.ts`**
- ✅ Removed: Error formatting logic
- ✅ Removed: `any` types (uses `TokenPayload` interface)
- ✅ All errors passed to global handler
- ✅ Proper types for `AuthRequest.user`

### ✅ 6. No `any` Types Allowed
**Replaced across entire refactored code:**
- ✅ `auth.controller.ts`: `cookieOpts` is `Record<string, unknown>`
- ✅ `auth.middleware.ts`: `AuthRequest.user` is `TokenPayload`
- ✅ All domain errors have proper TypeScript interfaces
- ✅ Controllers and services properly typed

## Refactored Files

### Created
1. `/src/errors/domain/DomainError.ts` - Base error class
2. `/src/errors/domain/index.ts` - All domain error classes
3. `/src/middlewares/errorHandler.ts` - Global error handler (NEW, replaces error.middleware.ts)

### Updated
1. `/src/services/auth.service.ts`
   - Throws `UnauthorizedError` and `InvalidTokenError` instead of createError
   
2. `/src/services/order.service.ts`
   - Throws domain errors only
   - Wraps Prisma errors
   - No http-errors dependency

3. `/src/controllers/order.controller.ts`
   - Pure HTTP handlers
   - No error translation
   - All errors → `next(err)`

4. `/src/controllers/auth.controller.ts`
   - Proper types instead of `any`
   - All errors → `next(err)`

5. `/src/middlewares/auth.middleware.ts`
   - Uses `TokenPayload` type
   - No error formatting
   - All errors → `next(err)`

6. `/src/app.ts`
   - Updated to use `errorHandler` (new global handler)
   - Comment added: "Global error handler (must be last)"

7. `/src/middlewares/error.middleware.ts`
   - Marked as `@deprecated`
   - Kept for backwards compatibility reference

## Key Improvements

### Separation of Concerns
- **Domain Layer:** Defines business rules via explicit error classes
- **Service Layer:** Orchestrates business logic, throws domain errors, wraps infrastructure errors
- **Controller Layer:** Pure HTTP concerns only (no translation, no infrastructure knowledge)
- **Middleware Layer:** Cross-cutting concerns (auth verification, global error formatting)

### Single Responsibility
- Controllers: HTTP request/response
- Services: Business logic and error wrapping
- Global Handler: Error-to-HTTP conversion
- Auth Middleware: JWT verification only

### Error Traceability
- Console.warn in auth service for JWT failures (debugging)
- Console.error in global handler for all errors (monitoring)
- Full stack traces preserved

### API Consistency
- All endpoints return uniform error format
- Error codes are deterministic (code → HTTP status)
- No infrastructure error leakage to clients

### Type Safety
- Zero `any` types in error handling
- Proper TypeScript interfaces for all payloads
- Compiler ensures correct error handling

## Testing Results
✅ **All 9 tests passing**
- Order endpoints: 5 tests
- Auth endpoints: 4 tests

### Test Coverage
- ✅ Duplicate order creation returns 409 with `DUPLICATE_ORDER` code
- ✅ Invalid item ID returns 400 with `INVALID_ITEM_ID` code
- ✅ Missing order returns 404 with `NOT_FOUND` code
- ✅ Invalid credentials return 401 with `AUTH_ERROR` code
- ✅ All order CRUD operations maintain proper error handling

## Migration Path for Existing Errors
If old `error.middleware.ts` is still referenced in tests or imports:
1. All imports automatically resolve to new `errorHandler.ts` in app.ts
2. Old error.middleware.ts marked as deprecated but functional
3. Gradual migration: replace any imports of old middleware with new one

## Production Readiness Checklist
- ✅ No infrastructure errors leak to HTTP responses
- ✅ No duplicate error handling logic across layers
- ✅ Controllers cannot accidentally inspect low-level error codes
- ✅ Services throw only domain errors (P2002, JWT errors wrapped)
- ✅ Single source of truth for error-to-HTTP mapping
- ✅ Type safety enforced throughout
- ✅ All existing endpoints continue to work
- ✅ Error codes remain consistent with API contract
- ✅ Logging preserved for observability
- ✅ Stack traces maintained for debugging

## Next Steps (Optional)
1. Replace console.warn/error with proper logger service (winston, pino, etc.)
2. Add metrics/monitoring for error frequency by type
3. Consider error correlation IDs for distributed tracing
4. Add error recovery strategies for specific domain errors
