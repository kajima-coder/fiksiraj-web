/**
 * Utility to extract a safe, displayable error message from API responses
 * Handles FastAPI/Pydantic validation errors: { detail: [{ type, loc, msg, input, ctx, url }] }
 * Also handles simple string errors: { detail: "Error message" }
 */
export const getErrorMessage = (error, fallbackMessage = 'Došlo je do greške') => {
  try {
    const detail = error?.response?.data?.detail;
    
    // If detail is not present, check for other common error formats
    if (detail === undefined || detail === null) {
      // Check for message field
      if (error?.response?.data?.message) {
        return String(error.response.data.message);
      }
      // Check for error field
      if (error?.response?.data?.error) {
        return String(error.response.data.error);
      }
      // Check for direct error message
      if (error?.message && typeof error.message === 'string') {
        return error.message;
      }
      return fallbackMessage;
    }
    
    // If detail is already a string, return it
    if (typeof detail === 'string') {
      return detail;
    }
    
    // If detail is an array (Pydantic validation errors)
    if (Array.isArray(detail) && detail.length > 0) {
      const firstError = detail[0];
      
      // Pydantic v2 format: { type, loc, msg, input, ctx, url }
      if (firstError?.msg) {
        return String(firstError.msg);
      }
      
      // Legacy format or other array of strings
      if (typeof firstError === 'string') {
        return firstError;
      }
      
      // Try to stringify if it's an object
      if (typeof firstError === 'object') {
        return firstError.message || firstError.msg || fallbackMessage;
      }
    }
    
    // If detail is an object (single error)
    if (typeof detail === 'object') {
      if (detail.msg) return String(detail.msg);
      if (detail.message) return String(detail.message);
    }
    
    // Fallback
    return fallbackMessage;
  } catch (e) {
    console.error('Error parsing error message:', e);
    return fallbackMessage;
  }
};

export default getErrorMessage;
