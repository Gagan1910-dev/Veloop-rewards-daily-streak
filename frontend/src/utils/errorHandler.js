/**
 * Format and sanitize API error responses
 * Strictly prevents raw Mongo/Axios/CastError internals from reaching the UI
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

    // Detect and scrub any internal infrastructure leaks from the message
    const hasInternalLeak =
      typeof message === 'string' &&
      /buffering|users\.find|mongodb|mongoose|collection|replica|shard|timeout after|econnrefused|topology/i.test(
        message
      );

    if (!message || hasInternalLeak) {
      switch (status) {
        case 400:
          message = 'Invalid request. Please check your details and try again.';
          break;
        case 401:
          message = 'Invalid email or password. Please check your credentials or register first.';
          break;
        case 403:
          message = 'Access denied. You do not have permission for this action.';
          break;
        case 404:
          message = 'Requested service or resource not found.';
          break;
        case 409:
          message = 'Conflict. This record or claim has already been processed.';
          break;
        case 429:
          message = 'Too many requests. Please wait a moment before trying again.';
          break;
        case 502:
        case 503:
        case 504:
          message = "We're having trouble connecting right now. Please try again shortly.";
          break;
        default:
          message = status >= 500
            ? "We're having trouble connecting right now. Please try again shortly."
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
      message: "We're having trouble connecting right now. Please try again shortly.",
      code: 'SERVER_UNAVAILABLE',
      status: 0
    };
  }

  // Fallback sanitized client error
  const safeMessage =
    typeof error.message === 'string' &&
    !/buffering|mongodb|mongoose|collection/i.test(error.message)
      ? error.message
      : "We're having trouble connecting right now. Please try again shortly.";

  return {
    message: safeMessage,
    code: 'CLIENT_ERROR',
    status: 500
  };
};
