/**
 * Notes API Service
 * All API calls related to notes CRUD operations
 */

import apiClient from './apiClient';
import { API_ENDPOINTS } from '../config/api';

/**
 * API Request/Response Types
 */

export interface CreateNoteRequest {
  name: string;
  content: string;
  formattedContent: string;
}

export interface UpdateTitleRequest {
  title: string;
}

export interface UpdateContentRequest {
  content: string;
  formattedContent: string;
}

export interface NoteResponse {
  _id: string;
  name: string;
  content: string;
  formattedContent: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  success: true;
  data: T[];
  count: number;
}

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalNotes: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiPaginatedResponse<T> {
  success: true;
  data: {
    notes: T[];
    pagination: PaginationMetadata;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

/**
 * Notes API Service Class
 */
class NotesService {
  /**
   * Create a new note
   * @param data - Note data (name, content, formattedContent)
   * @returns Created note data
   */
  async createNote(
    data: CreateNoteRequest
  ): Promise<ApiSuccessResponse<NoteResponse>> {
    const response = await apiClient.post(
      API_ENDPOINTS.NOTES.CREATE,
      data
    );
    // Unwrap nested response: response.data.data -> response.data
    return {
      success: response.data.success,
      data: response.data.data, // Extract inner data
      message: response.data.message,
    };
  }

  /**
   * Get paginated notes
   * @param page - Page number (default: 1)
   * @param limit - Notes per page (default: 20)
   * @returns Paginated list of notes with metadata
   */
  async getAllNotes(page: number = 1, limit: number = 20): Promise<ApiPaginatedResponse<NoteResponse>> {
    const response = await apiClient.get(
      `${API_ENDPOINTS.NOTES.GET_ALL}?limit=${limit}&page=${page}`
    );

    // Handle nested response structure: { data: { data: { notes: [...], pagination: {...} } } }
    if (response.data.data && response.data.data.notes && Array.isArray(response.data.data.notes)) {
      return {
        success: response.data.success,
        data: {
          notes: response.data.data.notes,
          pagination: response.data.data.pagination || {
            currentPage: page,
            totalPages: 1,
            totalNotes: response.data.data.notes.length,
            limit: limit,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      };
    }

    // Fallback: Handle if data.data is directly an array (legacy response)
    if (response.data.data && Array.isArray(response.data.data)) {
      return {
        success: response.data.success,
        data: {
          notes: response.data.data,
          pagination: {
            currentPage: page,
            totalPages: 1,
            totalNotes: response.data.data.length,
            limit: limit,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      };
    }

    return response.data;
  }

  /**
   * Get a single note by ID
   * @param id - Note ID
   * @returns Note data
   */
  async getNoteById(id: string): Promise<ApiSuccessResponse<NoteResponse>> {
    const response = await apiClient.get(
      API_ENDPOINTS.NOTES.GET_BY_ID(id)
    );
    // Unwrap nested response if exists
    if (response.data.data) {
      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    }
    return response.data;
  }

  /**
   * Update note title
   * @param id - Note ID
   * @param data - New title
   * @returns Updated note data
   */
  async updateNoteTitle(
    id: string,
    data: UpdateTitleRequest
  ): Promise<ApiSuccessResponse<NoteResponse>> {
    const response = await apiClient.patch(
      API_ENDPOINTS.NOTES.UPDATE_TITLE(id),
      data
    );
    // Unwrap nested response if exists
    if (response.data.data) {
      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    }
    return response.data;
  }

  /**
   * Update note content
   * @param id - Note ID
   * @param data - New content and formatted content
   * @returns Updated note data
   */
  async updateNoteContent(
    id: string,
    data: UpdateContentRequest
  ): Promise<ApiSuccessResponse<NoteResponse>> {
    const response = await apiClient.patch(
      API_ENDPOINTS.NOTES.UPDATE_CONTENT(id),
      data
    );
    // Unwrap nested response if exists
    if (response.data.data) {
      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    }
    return response.data;
  }

  /**
   * Soft delete a note
   * @param id - Note ID
   * @returns Success message
   */
  async deleteNote(id: string): Promise<ApiSuccessResponse<null>> {
    const response = await apiClient.delete(
      API_ENDPOINTS.NOTES.DELETE(id)
    );
    // Unwrap nested response if exists
    if (response.data.data !== undefined) {
      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    }
    return response.data;
  }
}

// Export singleton instance
export const notesService = new NotesService();
export default notesService;
