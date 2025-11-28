/**
 * Unit tests for validation utilities
 */

import {
  validateNoteTitle,
  validateNoteContent,
  getContentCharacterCount,
  isContentEmpty,
} from '../validation';

describe('validateNoteTitle', () => {
  it('should pass validation for valid title (1-50 chars)', () => {
    const result = validateNoteTitle('My Note');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should pass validation for title with exactly 50 characters', () => {
    const fiftyCharTitle = 'a'.repeat(50);
    const result = validateNoteTitle(fiftyCharTitle);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should fail validation for empty title', () => {
    const result = validateNoteTitle('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter a name before saving.');
  });

  it('should fail validation for title with only whitespace', () => {
    const result = validateNoteTitle('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please enter a name before saving.');
  });

  it('should fail validation for title over 50 characters', () => {
    const fiftyOneCharTitle = 'a'.repeat(51);
    const result = validateNoteTitle(fiftyOneCharTitle);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Name cannot exceed 50 characters.');
  });

  it('should trim whitespace before validation', () => {
    const result = validateNoteTitle('  Valid Title  ');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });
});

describe('validateNoteContent', () => {
  it('should pass validation for valid HTML content', () => {
    const result = validateNoteContent('<p>Valid content</p>');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should pass validation for plain text content', () => {
    const result = validateNoteContent('Plain text content');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should fail validation for empty content', () => {
    const result = validateNoteContent('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please add some content before saving.');
  });

  it('should fail validation for content with only HTML tags', () => {
    const result = validateNoteContent('<p></p><div></div>');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please add some content before saving.');
  });

  it('should fail validation for content with only whitespace', () => {
    const result = validateNoteContent('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Please add some content before saving.');
  });

  it('should pass validation for content with exactly 500 characters (plain text)', () => {
    const fiveHundredChars = 'a'.repeat(500);
    const result = validateNoteContent(fiveHundredChars);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should fail validation for content over 500 characters (plain text)', () => {
    const fiveHundredOneChars = 'a'.repeat(501);
    const result = validateNoteContent(fiveHundredOneChars);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Content cannot exceed 500 characters.');
  });

  it('should not count HTML tags in character limit', () => {
    // Create content with 500 chars of text + HTML tags
    const textContent = 'a'.repeat(500);
    const htmlContent = `<p><b>${textContent}</b></p>`;
    const result = validateNoteContent(htmlContent);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should fail validation when HTML content exceeds 500 plain text characters', () => {
    // Create content with 501 chars of text + HTML tags
    const textContent = 'a'.repeat(501);
    const htmlContent = `<p><b>${textContent}</b></p>`;
    const result = validateNoteContent(htmlContent);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Content cannot exceed 500 characters.');
  });

  it('should return correct error message for empty content', () => {
    const result = validateNoteContent('');
    expect(result.error).toBe('Please add some content before saving.');
  });

  it('should return correct error message for content exceeding limit', () => {
    const longContent = 'a'.repeat(501);
    const result = validateNoteContent(longContent);
    expect(result.error).toBe('Content cannot exceed 500 characters.');
  });
});

describe('getContentCharacterCount', () => {
  it('should correctly strip HTML tags and count characters', () => {
    const count = getContentCharacterCount('<p>Hello World</p>');
    expect(count).toBe(11); // "Hello World" = 11 chars
  });

  it('should handle nested HTML tags', () => {
    const count = getContentCharacterCount('<div><p><b>Test</b></p></div>');
    expect(count).toBe(4); // "Test" = 4 chars
  });

  it('should handle empty string', () => {
    const count = getContentCharacterCount('');
    expect(count).toBe(0);
  });

  it('should handle plain text without HTML tags', () => {
    const count = getContentCharacterCount('Plain text');
    expect(count).toBe(10); // "Plain text" = 10 chars
  });

  it('should handle HTML with multiple tags', () => {
    const count = getContentCharacterCount('<p>First</p><p>Second</p>');
    expect(count).toBe(11); // "FirstSecond" = 11 chars
  });

  it('should trim whitespace before counting', () => {
    const count = getContentCharacterCount('  <p>Text</p>  ');
    expect(count).toBe(4); // "Text" = 4 chars
  });

  it('should handle complex nested HTML structure', () => {
    const html = '<div><ul><li><b>Item 1</b></li><li>Item 2</li></ul></div>';
    const count = getContentCharacterCount(html);
    expect(count).toBe(12); // "Item 1Item 2" = 12 chars
  });
});

describe('isContentEmpty', () => {
  it('should return true for empty string', () => {
    expect(isContentEmpty('')).toBe(true);
  });

  it('should return true for HTML with no text content', () => {
    expect(isContentEmpty('<p></p><div></div>')).toBe(true);
  });

  it('should return true for whitespace only', () => {
    expect(isContentEmpty('   ')).toBe(true);
  });

  it('should return false for content with text', () => {
    expect(isContentEmpty('Some text')).toBe(false);
  });

  it('should return false for HTML with text content', () => {
    expect(isContentEmpty('<p>Content</p>')).toBe(false);
  });

  it('should return true for HTML with only whitespace inside tags', () => {
    expect(isContentEmpty('<p>   </p>')).toBe(true);
  });

  it('should return false for single character content', () => {
    expect(isContentEmpty('a')).toBe(false);
  });
});
