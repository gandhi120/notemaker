/**
 * Validation utilities for note-taking feature
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate note title/name
 * Rules:
 * - Required (cannot be empty)
 * - Max length: 50 characters
 */
export const validateNoteTitle = (title: string): ValidationResult => {
  const trimmedTitle = title.trim();

  if (!trimmedTitle) {
    return {
      isValid: false,
      error: 'Please enter a name before saving.',
    };
  }

  if (trimmedTitle.length > 50) {
    return {
      isValid: false,
      error: 'Name cannot exceed 50 characters.',
    };
  }

  return { isValid: true };
};

/**
 * Validate note content
 * Rules:
 * - Required (cannot be empty)
 * - Max length: 500 characters
 */
export const validateNoteContent = (content: string): ValidationResult => {
  // Strip HTML tags for character counting
  const strippedContent = content.replace(/<[^>]*>/g, '').trim();

  if (!strippedContent) {
    return {
      isValid: false,
      error: 'Please add some content before saving.',
    };
  }

  if (strippedContent.length > 500) {
    return {
      isValid: false,
      error: 'Content cannot exceed 500 characters.',
    };
  }

  return { isValid: true };
};

/**
 * Get character count from HTML content
 * Strips HTML tags and returns plain text length
 */
export const getContentCharacterCount = (htmlContent: string): number => {
  return htmlContent.replace(/<[^>]*>/g, '').trim().length;
};

/**
 * Check if content is empty (ignoring HTML tags)
 */
export const isContentEmpty = (htmlContent: string): boolean => {
  return getContentCharacterCount(htmlContent) === 0;
};
