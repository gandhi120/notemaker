import { makeObservable, observable, action, computed } from 'mobx';
import { NotesStore } from '../stores/NotesStore';
import {
  validateNoteTitle,
  validateNoteContent,
  getContentCharacterCount,
  isContentEmpty,
} from '../utils/validation';
import { showSuccessToast, showErrorToast } from '../config/toast';

/**
 * ViewModel for NoteEditorScreen
 * Handles business logic for creating and editing notes
 */
export class NoteEditorViewModel {
  @observable content: string = '';
  @observable title: string = '';
  @observable hasUnsavedChanges: boolean = false;
  @observable showSaveModal: boolean = false;
  @observable isLoading: boolean = false;

  private notesStore: NotesStore;
  private noteId?: string;

  constructor(notesStore: NotesStore, noteId?: string) {
    makeObservable(this);
    this.notesStore = notesStore;
    this.noteId = noteId;
  }

  /**
   * Check if we're in edit mode
   */
  @computed
  get isEditing(): boolean {
    return !!this.noteId;
  }

  /**
   * Get current character count
   */
  @computed
  get characterCount(): number {
    return getContentCharacterCount(this.content);
  }

  /**
   * Check if save button should be enabled
   */
  @computed
  get canSave(): boolean {
    return !isContentEmpty(this.content) && this.characterCount <= 500;
  }

  /**
   * Initialize view model with existing note data if editing
   */
  @action
  initialize = () => {
    if (this.isEditing && this.noteId) {
      this.notesStore.selectNote(this.noteId);
      const note = this.notesStore.selectedNote;
      if (note) {
        this.content = note.content;
        this.title = note.title;
        this.hasUnsavedChanges = false;
      }
    }
  };

  /**
   * Handle content change from editor
   */
  @action
  handleContentChange = (html: string) => {
    this.content = html;
    this.hasUnsavedChanges = true;
  };

  /**
   * Validate and prepare to save
   * Shows save modal if validation passes
   */
  @action
  handleSavePress = () => {
    const contentValidation = validateNoteContent(this.content);

    if (!contentValidation.isValid) {
      showErrorToast('Cannot save note', contentValidation.error || 'Invalid content');
      return false;
    }

    this.showSaveModal = true;
    return true;
  };

  /**
   * Save or update the note
   * @param noteTitle - The title for the note
   * @returns Promise<boolean> - True if save successful
   */
  @action
  saveNote = async (noteTitle: string): Promise<boolean> => {
    // Validate title
    const titleValidation = validateNoteTitle(noteTitle);
    if (!titleValidation.isValid) {
      showErrorToast('Invalid title', titleValidation.error || 'Please check the title');
      return false;
    }

    // Check for duplicate name (excluding current note if editing)
    const isDuplicate = this.notesStore.checkDuplicateName(noteTitle, this.noteId);
    if (isDuplicate) {
      showErrorToast(
        'Duplicate title',
        'A note with this title already exists. Please choose another title.'
      );
      return false;
    }

    // Validate content
    const contentValidation = validateNoteContent(this.content);
    if (!contentValidation.isValid) {
      showErrorToast('Invalid content', contentValidation.error || 'Please check the content');
      return false;
    }

    try {
      this.isLoading = true;

      if (this.isEditing && this.noteId) {
        // Update existing note in Realm
        await this.notesStore.updateNoteData(this.noteId, {
          title: noteTitle,
          content: this.content,
          formattedContent: this.content,
        });
        showSuccessToast('Note updated successfully!');
      } else {
        // Create new note in Realm
        await this.notesStore.createNote({
          title: noteTitle,
          content: this.content,
          formattedContent: this.content,
        });
        showSuccessToast('Note saved successfully!');
      }

      // Reset state
      this.hasUnsavedChanges = false;
      this.showSaveModal = false;

      // Reload notes from Realm to ensure UI is in sync
      await this.notesStore.loadNotes();

      return true;
    } catch (error) {
      showErrorToast('Save failed', 'An error occurred while saving the note.');
      console.error('Save error:', error);
      return false;
    } finally {
      this.isLoading = false;
    }
  };

  /**
   * Cancel save modal
   */
  @action
  cancelSave = () => {
    this.showSaveModal = false;
  };

  /**
   * Reset unsaved changes flag
   */
  @action
  resetUnsavedChanges = () => {
    this.hasUnsavedChanges = false;
  };

  /**
   * Cleanup method
   */
  @action
  cleanup = () => {
    this.content = '';
    this.title = '';
    this.hasUnsavedChanges = false;
    this.showSaveModal = false;
    this.isLoading = false;
  };
}
