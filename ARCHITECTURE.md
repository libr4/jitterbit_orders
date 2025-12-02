## Clean Architecture - Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HTTP REQUEST                                │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   Express Middleware     │
                    │  (helmet, cors, etc)     │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │ Auth Middleware (verify  │
                    │ JWT + throw domain err)  │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  Pure Controller Layer   │
                    │  • Validate request      │
                    │  • Call service          │
                    │  • Return success        │
                    │  • Pass errors to next() │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │  Service Layer          │
                    │  • Business logic        │
                    │  • Throw domain errors   │
                    │  • Wrap infrastructure   │
                    │    errors as domain      │
                    └────────────┬─────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │   Error Raised           │
                    │ (DomainError instance)   │
                    └────────────┬─────────────┘
                                 │
        ╔════════════════════════╩════════════════════════════╗
        │ (err passed via next(err) from controller)          │
        │ Express Error Handler Middleware Chain              │
        │ ┌────────────────────────────────────────────────┐  │
        │ │  Global Error Handler Middleware               │  │
        │ │  • Inspect err instance                        │  │
        │ │  • Look up domain error → HTTP status mapping  │  │
        │ │  • Format JSON response { error: { ... } }    │  │
        │ │  • Set response status                         │  │
        │ │  • Send response                               │  │
        │ └────────────────────────────────────────────────┘  │
        └────────────────┬─────────────────────────────────────┘
                         │
               ┌─────────▼──────────┐
               │  Formatted HTTP    │
               │  Error Response    │
               │  (200, 409, 400,   │
               │   401, 404, etc)   │
               └────────────────────┘
```

## Error Flow by Scenario

### Scenario 1: Duplicate Order (Happy Error Path)
```
POST /order { numeroPedido: 'v1' }
    ↓ (Controller)
normalizeOrderPayload() ✓ valid
    ↓ (Service)
createOrder() → Prisma P2002 thrown
    ↓ (Service catches Prisma error)
throw new DuplicateEntityError('Order already exists')
    ↓ (Uncaught, bubbles to global handler)
next(err) called in controller
    ↓ (Global error handler)
err instanceof DomainError? YES
err.code = 'DUPLICATE_ORDER'
domainErrorToHttpStatus['DUPLICATE_ORDER'] = 409
    ↓
HTTP 409 Response:
{ error: { code: 'DUPLICATE_ORDER', message: 'Order already exists' } }
```

### Scenario 2: Invalid Item ID (Validation Error)
```
POST /order { idItem: 'abc' }
    ↓ (Controller)
normalizeOrderPayload() 
    ↓ (Service)
Validation: Number(it.idItem) = NaN → NOT_INTEGER
    ↓
throw new InvalidItemIdError('Item ID must be numeric')
    ↓ (Uncaught, bubbles to global handler)
next(err) called in controller
    ↓ (Global error handler)
err instanceof DomainError? YES
err.code = 'INVALID_ITEM_ID'
domainErrorToHttpStatus['INVALID_ITEM_ID'] = 400
    ↓
HTTP 400 Response:
{ error: { code: 'INVALID_ITEM_ID', message: 'Item ID must be numeric' } }
```

### Scenario 3: Missing Order (Not Found)
```
GET /order/v-missing-id
    ↓ (Controller)
getOrder('v-missing-id')
    ↓ (Service)
repo.findOrder() → null
    ↓
throw new NotFoundError('Order not found')
    ↓ (Uncaught, bubbles to global handler)
next(err) called in controller
    ↓ (Global error handler)
err instanceof DomainError? YES
err.code = 'NOT_FOUND'
domainErrorToHttpStatus['NOT_FOUND'] = 404
    ↓
HTTP 404 Response:
{ error: { code: 'NOT_FOUND', message: 'Order not found' } }
```

### Scenario 4: Invalid Credentials (Auth)
```
POST /auth/login { username: 'x', password: 'y' }
    ↓ (Controller)
authService.authenticate('x', 'y')
    ↓ (Service)
credentials DO NOT match config.DEV_AUTH_USER
    ↓
throw new UnauthorizedError('Invalid credentials')
    ↓ (Uncaught, bubbles to global handler)
next(err) called in controller
    ↓ (Global error handler)
err instanceof DomainError? YES
err.code = 'AUTH_ERROR'
domainErrorToHttpStatus['AUTH_ERROR'] = 401
    ↓
HTTP 401 Response:
{ error: { code: 'AUTH_ERROR', message: 'Invalid credentials' } }
```

### Scenario 5: Invalid JWT (Token Verification)
```
GET /order/list (with invalid Bearer token)
    ↓ (Auth Middleware)
extractToken() → 'invalid-token'
authService.verify('invalid-token')
    ↓ (Service)
jwt.verify() throws JWT error
    ↓
catch JWT error, log internally
    ↓
throw new InvalidTokenError('Invalid token')
    ↓ (Uncaught, bubbles to global handler)
next(err) called in middleware
    ↓ (Global error handler)
err instanceof DomainError? YES
err.code = 'AUTH_ERROR'
domainErrorToHttpStatus['AUTH_ERROR'] = 401
    ↓
HTTP 401 Response:
{ error: { code: 'AUTH_ERROR', message: 'Invalid token' } }
```

## Key Principles Enforced

### ✅ Principle 1: Controllers Are Pure
Controllers NEVER inspect error codes, NEVER call createError, NEVER translate errors.
```typescript
// ❌ BAD (OLD)
if (err.code === 'P2002') {
  return next(createError(409, 'Duplicate', { code: 'DUPLICATE' }));
}

// ✅ GOOD (NEW)
next(err);  // Let global handler deal with it
```

### ✅ Principle 2: Services Throw Domain Errors
Services catch infrastructure errors and convert them to domain errors.
```typescript
// ❌ BAD
throw err;  // Leaks Prisma error

// ✅ GOOD
if (err.code === 'P2002') {
  throw new DuplicateEntityError('Order already exists');
}
```

### ✅ Principle 3: Single Source of Truth
Only one place maps error codes to HTTP statuses.
```typescript
// errorHandler.ts - THE ONLY PLACE
const domainErrorToHttpStatus = {
  'NOT_FOUND': 404,
  'DUPLICATE_ORDER': 409,
  // ...
};
```

### ✅ Principle 4: No Infrastructure Leakage
HTTP layer never sees:
- Prisma error codes (P2002, P2000, etc.)
- JWT error names (JsonWebTokenError, TokenExpiredError)
- Database error messages
- Stack traces
```typescript
// ❌ BAD
{ error: { message: "Unique constraint failed on field 'numeroPedido'" } }

// ✅ GOOD  
{ error: { code: 'DUPLICATE_ORDER', message: 'Order already exists' } }
```

### ✅ Principle 5: Type Safety
No `any` types in error handling paths.
```typescript
// ❌ BAD
catch (err: any) { /* ... */ }

// ✅ GOOD
catch (err) {
  if (err instanceof DomainError) { /* ... */ }
}
```

## Domain Error Hierarchy

```
DomainError (abstract base)
  ├── NotFoundError
  ├── DuplicateEntityError
  ├── InvalidInputError
  ├── InvalidItemIdError
  ├── UnauthorizedError
  ├── InvalidTokenError
  ├── ForbiddenError
  └── ValidationError
```

Each error has:
- ✅ Immutable `code` property (used for HTTP mapping)
- ✅ Clear error message (shown to client)
- ✅ Proper stack trace (for debugging)
- ✅ TypeScript type safety
