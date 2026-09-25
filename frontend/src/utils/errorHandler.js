/**
 * Format and sanitize API error responses
 * Prevents raw Mongo/Axios/CastError internals from reaching the UI
 * @param {Error|Object} error
 * @returns {Object} { message: string, code: string|null, status: number }
 */
export const sanitizeApiError = (error) => {
  if (!error) {
    return {
      message: 'An unexpected error occurred. Please try again.',
      code: 'UNKNOWN_ERROR',
      status: 500
    };
  }

  // If response exists from backend Express error handler
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data || {};

    let message = data.message;
    const code = data.code || null;

    if (!message) {
      switch (status) {
        case 400:
          message = 'Invalid request. Please check your data.';
          break;
        case 401:
          message = 'Authentication required. Please log in to continue.';
          break;
        case 403:
          message = 'Access denied. You do not have permission for this action.';
          break;
        case 404:
          message = 'Requested resource not found.';
          break;
        case 409:
          message = 'Conflict. This action or resource already exists.';
          break;
        case 429:
          message = 'Too many requests. Please slow down.';
          break;
        default:
          message = 'Unable to process your request. Please try again later.';
      }
    }

    return {
      message,
      code,
      status,
      nextClaimAt: data.nextClaimAt || null
    };
  }

  // Network or connection error
  if (error.request) {
    return {
      message: 'Network error. Unable to connect to VELoop servers. Please check your connection.',
      code: 'NETWORK_ERROR',
      status: 0
    };
  }

  return {
    message: error.message || 'Something went wrong.',
    code: 'CLIENT_ERROR',
    status: 500
  };
};
