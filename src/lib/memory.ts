export const memoryManager = {
  save: (key: string, value: string) => {
    localStorage.setItem(`jarvis_mem_${key.toLowerCase()}`, value);
  },
  get: (key: string) => {
    return localStorage.getItem(`jarvis_mem_${key.toLowerCase()}`);
  },
  getAll: (): Record<string, string> => {
    const memories: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("jarvis_mem_")) {
        memories[key.replace("jarvis_mem_", "")] = localStorage.getItem(key) || "";
      }
    }
    return memories;
  },
  delete: (key: string) => {
    localStorage.removeItem(`jarvis_mem_${key.toLowerCase()}`);
  },
  clearAll: () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("jarvis_mem_")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};
