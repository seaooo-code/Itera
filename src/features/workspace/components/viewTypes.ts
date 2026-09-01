export interface ConfirmState {
  title: string;
  message: string;
  dirtyPaths: string[];
  savePaths: string[];
  action: () => void | Promise<void>;
}

export interface ToastState {
  message: string;
  detail?: string;
  tone: "neutral" | "success" | "error";
}
