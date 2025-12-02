/**
 * Map HTTP status codes to standardized error codes.
 * Provides a single source of truth for error code inference.
 */
export const mapErrorCode = (status: number, defaultCode: string = 'UNKNOWN_ERROR'): string => {
  const statusCodeMap: { [key: number]: string } = {
    400: 'VALIDATION_ERROR',
    401: 'AUTH_ERROR',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  };

  return statusCodeMap[status] || defaultCode;
};
