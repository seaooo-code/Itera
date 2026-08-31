import { create } from "zustand";

const initialCode = `type Task = {
  id: number;
  title: string;
  completed: boolean;
};

const tasks: Task[] = [
  { id: 1, title: "接入 CodeMirror 6", completed: true },
  { id: 2, title: "开始编写功能", completed: false },
];

export function getPendingTasks(items: Task[]) {
  return items.filter((item) => !item.completed);
}

console.log(getPendingTasks(tasks));
`;

interface EditorStore {
  code: string;
  savedCode: string;
  setCode: (code: string) => void;
  saveCode: () => void;
  restoreCode: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  code: initialCode,
  savedCode: initialCode,
  setCode: (code) => set({ code }),
  saveCode: () => set((state) => ({ savedCode: state.code })),
  restoreCode: () => set((state) => ({ code: state.savedCode })),
}));
