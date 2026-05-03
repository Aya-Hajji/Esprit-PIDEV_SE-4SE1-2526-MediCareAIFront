/**
 * Helper utility to extract user ID from localStorage
 * Tries multiple sources to ensure reliability
 */
export function getUserIdFromStorage(): number | null {
  // Try direct userId key first
  const directUserId = localStorage.getItem('userId');
  if (directUserId && directUserId !== 'null' && directUserId !== 'undefined') {
    const parsed = parseInt(directUserId, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  // Fall back to authUser object
  const authUserJson = localStorage.getItem('authUser');
  if (authUserJson && authUserJson !== 'null' && authUserJson !== 'undefined') {
    try {
      const authUser = JSON.parse(authUserJson);
      if (authUser?.id) {
        const id = parseInt(String(authUser.id), 10);
        if (!isNaN(id)) {
          return id;
        }
      }
    } catch (error) {
      console.warn('Failed to parse authUser from localStorage:', error);
    }
  }

  return null;
}

/**
 * Get user ID as string for comparison and logging
 */
export function getUserIdAsString(): string | null {
  const id = getUserIdFromStorage();
  return id ? id.toString() : null;
}
