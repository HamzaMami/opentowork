/**
 * Utility functions for handling image URLs
 */

/**
 * Properly constructs a full URL for an image path
 * 
 * @param {string} imagePath - The path to the image (can be relative or absolute)
 * @returns {string|null} - The full URL to the image or null if no path provided
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, use it as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Handle relative paths that might start with 'uploads/'
  if (imagePath.includes('uploads/')) {
    // Extract the path from uploads/ onwards, regardless of where it appears in the string
    const uploadsIndex = imagePath.indexOf('uploads/');
    const pathFromUploads = imagePath.substring(uploadsIndex);
    
    // Make sure the path is properly normalized
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}/${pathFromUploads}`;
  }

  // Make sure path starts with a slash for other cases
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  // Construct full URL with base API URL
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Creates an error handler for images that displays a fallback when image loading fails
 * 
 * @param {string} fallbackText - Text to display in the fallback (usually first letter of name)
 * @param {string} className - CSS class for the fallback element
 * @returns {Function} - The error handler function to be used with onError
 */
export const createImageErrorHandler = (fallbackText, className = "avatar-placeholder") => {
  return (e) => {
    console.warn('Image failed to load:', e.target.src);
    e.target.style.display = 'none';
    e.target.parentNode.innerHTML = `<div class="${className}">${fallbackText || '?'}</div>`;
  };
};