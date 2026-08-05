let globalHasUnsaved = false;

export const setHasUnsavedChanges = (isDirty: boolean) => {
  globalHasUnsaved = isDirty;
  window.dispatchEvent(new CustomEvent('unsaved-status-change', { detail: isDirty }));
};

export const getHasUnsavedChanges = (): boolean => {
  return globalHasUnsaved;
};
