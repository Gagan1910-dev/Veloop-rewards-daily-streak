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
        case 502:
        case 503:
        case 504:
          message = 'VELoop servers are waking up or temporarily unavailable. Please try again in a moment.';
          break;
        default:
          message = status >= 500
            ? 'VELoop server error. Please try again in a moment.'
            : 'Unable to process your request. Please try again later.';
      }
    }

    return {
      message,
      code,
      status,
      nextClaimAt: data.nextClaimAt || null
    };
  }

  // Check if browser is genuinely offline
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      message: 'You appear to be offline. Please check your internet connection.',
      code: 'OFFLINE',
      status: 0
    };
  }

  // Timeout error (e.g. Axios ECONNABORTED when cold starting)
  if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
    return {
      message: 'VELoop servers are waking up. Please try again in a moment.',
      code: 'SERVER_WAKING_UP',
      status: 0
    };
  }

  // Network or connection error when request was made but no response received
  if (error.request) {
    return {
      message: 'VELoop servers are currently waking up or unreachable. Please try again in a moment.',
      code: 'SERVER_UNAVAILABLE',
      status: 0
    };
  }

  return {
    message: error.message || 'Something went wrong.',
    code: 'CLIENT_ERROR',
    status: 500
  };
};
