export interface StackState {
  id: string;
  text: string;
  timestamp: string;
  wordCount: number;
  charCount: number;
  reason: 'initial' | 'typing' | 'clear' | 'open_file' | 'undo' | 'redo';
}

export interface EditorStats {
  charCount: number;
  wordCount: number;
  lineCount: number;
  undoCount: number;
  redoCount: number;
}
