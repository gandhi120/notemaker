import { NotesStore } from './NotesStore';

export class RootStore {
  notesStore: NotesStore;

  constructor() {
    this.notesStore = new NotesStore();
  }

  reset() {
    this.notesStore.reset();
  }
}

// Create singleton instance
let rootStore: RootStore;

export const getRootStore = (): RootStore => {
  if (!rootStore) {
    rootStore = new RootStore();
  }
  return rootStore;
};

export const resetRootStore = (): void => {
  if (rootStore) {
    rootStore.reset();
  }
};
