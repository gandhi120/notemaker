// Note DTOs and types
export interface NoteDTO {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_synced: boolean;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
}

export interface UpdateNoteRequest {
  id: string;
  title: string;
  content: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface NotesListResponse {
  notes: NoteDTO[];
  total: number;
}

// Navigation types
export type RootStackParamList = {
  Drawer: undefined;
};

export type DrawerParamList = {
  Home: undefined;
  Notes: undefined;
};

export type NotesStackParamList = {
  MyNotes: undefined;
  NoteEditor: { noteId?: string };
};

// Store types
export interface NoteState {
  id: string;
  apiId?: string; // Server's MongoDB _id (set after successful sync)
  title: string;
  name: string; // Note name/title (for API compatibility)
  content: string; // Plain text content
  formattedContent: string; // HTML formatted content
  createdAt: Date;
  updatedAt: Date;
  isSynced: boolean;
  isDirty?: boolean;
}
