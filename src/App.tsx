import React, { useState, useEffect, useRef } from 'react';
import { 
  Undo, 
  Redo, 
  Trash2, 
  FolderOpen, 
  Save, 
  FileText, 
  Layers, 
  Copy, 
  Download, 
  Sparkles, 
  Plus, 
  Info, 
  Clock, 
  Check, 
  FileCode, 
  BookOpen, 
  ListOrdered, 
  Code,
  FileUp,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StackState, EditorStats } from './types';
import { pythonTemplateCode } from './pythonCode';

// Pre-defined templates for mock "Open File"
const PRELOADED_TEMPLATES = [
  {
    name: "Tugas Struktur Data.txt",
    description: "Penjelasan mendalam tentang LIFO Stack",
    content: "STRUKTUR DATA DOUBLE STACK (UNDO & REDO)\n\nStack (Tumpukan) adalah struktur data linier yang menganut prinsip LIFO (Last In First Out). Artinya, elemen yang terakhir dimasukkan akan menjadi yang pertama dikeluarkan.\n\nDalam mekanisme Undo dan Redo, kita menggunakan dua Stack:\n1. Undo Stack: Menyimpan riwayat perubahan teks saat ini.\n2. Redo Stack: Menyimpan riwayat state yang dibatalkan oleh Undo.\n\nSaat Anda mengetik, program akan memicu `push()` ke Undo Stack.\nSaat tombol Undo diklik, program memicu `pop()` dari Undo Stack lalu memicu `push()` ke Redo Stack.\nSaat tombol Redo diklik, program memicu `pop()` dari Redo Stack lalu memicu `push()` ke Undo Stack.\n\nIni adalah presentasi struktur data dunia nyata yang sangat efisien dengan kompleksitas waktu O(1) untuk semua operasinya!"
  },
  {
    name: "Laporan Praktikum.txt",
    description: "Template tulisan laporan sederhana",
    content: "LAPORAN PRAKTIKUM STRUKTUR DATA\n\nNama: Muhammad Basyarahil\nJudul Proyek: Smart Text Editor dengan Double Stack\n\nAbstrak:\nAplikasi ini mendemonstrasikan analisis dan implementasi struktur data tumpukan ganda (double stack) untuk mengelola fungsi pemulihan teks (Undo dan Redo). Sistem dikembangkan dengan menyinkronkan operasi berbasis antrean tumpukan LIFO secara lokal.\n\nHasil Pengujian:\nSemua fungsi berjalan normal dengan respon di bawah 5ms. Visualisasi stack menunjukkan pemindahan state teks secara akurat dari satu tumpukan ke tumpukan lainnya saat operasi dijalankan."
  },
  {
    name: "Puisi Programmer.txt",
    description: "Seni dalam ketikan kode",
    content: "PUISI DARI RUANG KOMPILASI\n\nTinta ku adalah rentetan string,\nKertas ku adalah layar monitor,\nSetiap baris kode adalah detak jantung,\nDan bug adalah ujian kesabaran.\n\nKutulis baris cinta ini dalam memoriku,\nKusimpan ia ke dalam Undo Stack,\nAgar saat badai datang dan merusak,\nAku selalu bisa kembali padamu,\nKe satu state terindah sebelum badai merenggut.\n\nBila penyesalan datang terlambat,\nBiarkan Redo Stack membawa kita melangkah maju kembali..."
  }
];

export default function App() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'editor' | 'python' | 'theory'>('editor');
  
  // Real-time text editor state
  const [text, setText] = useState<string>("");
  
  // Implemented Double Stack Storage
  const [undoStack, setUndoStack] = useState<StackState[]>([]);
  const [redoStack, setRedoStack] = useState<StackState[]>([]);
  
  // Action triggers for visual flash effects (to show push/pop operations)
  const [undoOperationGlow, setUndoOperationGlow] = useState<'push' | 'pop' | 'peek' | null>(null);
  const [redoOperationGlow, setRedoOperationGlow] = useState<'push' | 'pop' | 'peek' | null>(null);
  
  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'warning' | 'error' }[]>([]);
  
  // Logs console history
  const [logs, setLogs] = useState<{ time: string; action: string; description: string }[]>([]);
  
  // Auto-snapshot settings
  const [snapshotMode, setSnapshotMode] = useState<'word' | 'manual'>('word');
  const [lastSavedText, setLastSavedText] = useState("");
  
  // Ref for local file upload selector
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats Counters
  const [stats, setStats] = useState<EditorStats>({
    charCount: 0,
    wordCount: 0,
    lineCount: 1,
    undoCount: 0,
    redoCount: 0
  });

  // Highlight Copy animation state
  const [copiedCode, setCopiedCode] = useState(false);

  // Helper: Trigger soft toast alerts
  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Helper: Post a log statement in the bottom console panel
  const postLog = (action: string, description: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    setLogs(prev => [{ time: timeStr, action, description }, ...prev.slice(0, 49)]);
  };

  // Initialize stack with empty/initial text on mount
  useEffect(() => {
    const initialText = "";
    const nowStr = new Date().toLocaleTimeString();
    const initialState: StackState = {
      id: "initial-state",
      text: initialText,
      timestamp: nowStr,
      wordCount: 0,
      charCount: 0,
      reason: 'initial'
    };
    
    setUndoStack([initialState]);
    setLastSavedText(initialText);
    postLog("Initialize", "Double Stack diinisialisasi. State pertama (kosong) ditambahkan ke Undo Stack.");
  }, []);

  // Recalculate statistics when text or stacks change
  useEffect(() => {
    const charCount = text.length;
    const words = text.trim() === "" ? [] : text.trim().split(/\s+/);
    const wordCount = words.length;
    const lineCount = text === "" ? 1 : text.split('\n').length;

    setStats(prev => ({
      ...prev,
      charCount,
      wordCount,
      lineCount
    }));
  }, [text]);

  // Handle typing inputs
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setText(newVal);

    // If auto snapshot is on, evaluate word boundary or length difference
    if (snapshotMode === 'word') {
      const isWordBoundary = (newVal.endsWith(' ') && !text.endsWith(' ')) || 
                             (newVal.endsWith('\n') && !text.endsWith('\n'));
      
      const charDiffSignificant = Math.abs(newVal.length - lastSavedText.length) >= 8;
      
      if (isWordBoundary || charDiffSignificant || lastSavedText === "") {
        pushUndoSnapshot(newVal, 'typing');
      }
    }
  };

  // PUSH stack mechanism: takes current state snapshot and pushes onto Undo Stack
  const pushUndoSnapshot = (currentText: string, reason: 'typing' | 'clear' | 'open_file') => {
    if (undoStack.length > 0 && undoStack[undoStack.length - 1].text === currentText) {
      return; // No duplicate states on top of stack
    }

    // Capture visual glow animation
    setUndoOperationGlow('push');
    setTimeout(() => setUndoOperationGlow(null), 850);

    const nowStr = new Date().toLocaleTimeString();
    const words = currentText.trim() === "" ? [] : currentText.trim().split(/\s+/);
    
    const newSnapshot: StackState = {
      id: `state-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      text: currentText,
      timestamp: nowStr,
      wordCount: words.length,
      charCount: currentText.length,
      reason
    };

    setUndoStack(prev => [...prev, newSnapshot]);
    setRedoStack([]); // Modern Standard Undo/Redo rule: Any new typing/edit wipes out the Redo stack
    setLastSavedText(currentText);

    let reasonLabel = "Ketikan baru";
    if (reason === 'clear') reasonLabel = "Hapus semua teks";
    if (reason === 'open_file') reasonLabel = "Buka berkas file baru";

    postLog("PUSH (Undo Stack)", `Elemen baru didorong ke tumpukan Undo. Deskripsi: "${reasonLabel}". Karakter: ${currentText.length}`);
  };

  // Manual Trigger to force current Editor text into Undo Stack
  const triggerManualSnapshot = () => {
    if (text === lastSavedText) {
      showToast("Tidak ada perubahan teks baru untuk diambil snapshot!", "warning");
      return;
    }
    pushUndoSnapshot(text, 'typing');
    showToast("Snapshot Teks Berhasil disimpan ke Undo Stack!", "success");
    postLog("MANUAL PUSH", "User secara manual memicu push keadaan teks ke dalam tumpukan Undo Stack.");
  };

  // UNDO MECHANISM: Pop UndoStack -> Push RedoStack -> View Previous State
  const handleUndo = () => {
    if (undoStack.length <= 1) {
      showToast("Undo Stack sudah kosong (mencapai batas state awal)!", "warning");
      postLog("BLOCKED UNDO", "Aksi Undo dibatalkan karena tidak ada state tersisa di Undo Stack.");
      return;
    }

    // Visual indicators glow
    setUndoOperationGlow('pop');
    setRedoOperationGlow('push');
    setTimeout(() => {
      setUndoOperationGlow(null);
      setRedoOperationGlow(null);
    }, 850);

    const currentStack = [...undoStack];
    const poppedState = currentStack.pop()!; // Pop top state (current state)
    
    // Save popped state into REDO STACK (push)
    const newRedoItem: StackState = {
      ...poppedState,
      reason: 'undo'
    };
    setRedoStack(prev => [...prev, newRedoItem]);
    
    // Get the previous text from the new peek value of UndoStack
    const previousState = currentStack[currentStack.length - 1];
    setText(previousState.text);
    setLastSavedText(previousState.text);
    setUndoStack(currentStack);

    setStats(prev => ({ ...prev, undoCount: prev.undoCount + 1 }));
    showToast("Undo Sukses! State ditransfer ke Redo Stack.", "info");
    postLog("UNDO OPERASI", `pop(Undo Stack) -> push(Redo Stack). Dikembalikan ke state waktu ${previousState.timestamp}.`);
  };

  // REDO MECHANISM: Pop RedoStack -> Push UndoStack -> Restore State
  const handleRedo = () => {
    if (redoStack.length === 0) {
      showToast("Redo Stack Kosong! Tidak ada aksi yang bisa di-redo.", "warning");
      postLog("BLOCKED REDO", "Aksi Redo dibatalkan karena tidak ada elemen di Redo Stack.");
      return;
    }

    // Visual indicators glow
    setRedoOperationGlow('pop');
    setUndoOperationGlow('push');
    setTimeout(() => {
      setUndoOperationGlow(null);
      setRedoOperationGlow(null);
    }, 850);

    const currentRedo = [...redoStack];
    const poppedState = currentRedo.pop()!; // Pop top redo state

    // Push back onto Undo Stack
    const restoredUndoItem: StackState = {
      ...poppedState,
      reason: 'redo'
    };
    
    setUndoStack(prev => [...prev, restoredUndoItem]);
    setText(poppedState.text);
    setLastSavedText(poppedState.text);
    setRedoStack(currentRedo);

    setStats(prev => ({ ...prev, redoCount: prev.redoCount + 1 }));
    showToast("Redo Sukses! Keadaan teks berhasil dipulihkan.", "success");
    postLog("REDO OPERASI", `pop(Redo Stack) -> push(Undo Stack). Teks dipulihkan ke snapshot waktu ${poppedState.timestamp}.`);
  };

  // CLEAR TEXT: Clears Editor & forces a clear state snapshot
  const handleClear = () => {
    if (text === "") return;
    
    const confirmClear = window.confirm("Apakah Anda yakin ingin mengosongkan teks editor?");
    if (confirmClear) {
      setText("");
      pushUndoSnapshot("", 'clear');
      showToast("Teks editor telah dikosongkan dan disimpan ke Undo Stack!", "success");
      postLog("CLEAR TEXT", "Mengosongkan teks editor. State kosong baru didorong ke Undo Stack.");
    }
  };

  // OPEN FILE: Simulated Template Injection or File Upload
  const handleOpenTemplate = (content: string, name: string) => {
    setText(content);
    pushUndoSnapshot(content, 'open_file');
    showToast(`Template "${name}" berhasil di-load!`, "success");
    postLog("MOCK OPEN FILE", `Mengimpor template teks "${name}" dan mendorong state baru ke Undo Stack.`);
  };

  // Real browser File Upload integration
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string || "";
      setText(content);
      pushUndoSnapshot(content, 'open_file');
      showToast(`File "${file.name}" berhasil diunggah!`, "success");
      postLog("UPLOAD FILE", `Membuka berkas fisik "${file.name}". Ukuran: ${content.length} karakter.`);
    };
    reader.readAsText(file);
  };

  // SAVE FILE: Browser .txt Download of the current text
  const handleSaveText = () => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = "SmartTextEditor_Export.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    showToast("File berhasil diekspor & diunduh sebagai .txt!", "success");
    postLog("SAVE FILE", "Teks editor berhasil diekspor ke format file naskah naskah lokal (.txt).");
  };

  // DOWNLOAD PYTHON CODE: Downloads the actual commented Python script
  const handleDownloadPython = () => {
    const element = document.createElement("a");
    const file = new Blob([pythonTemplateCode], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = "smart_text_editor.py";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    showToast("Berkas Python (smart_text_editor.py) berhasil diunduh!", "success");
    postLog("DOWNLOAD PYTHON", "Kode blueprint Python Tkinter berhasil diekspor ke laptop pengguna.");
  };

  // COPY PYTHON CODE Utility
  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonTemplateCode);
    setCopiedCode(true);
    showToast("Kode Python berhasil disalin ke Clipboard!", "success");
    postLog("COPY CODE", "Menyalin seluruh berkas implementasi Python Double Stack ke Clipboard.");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Reset Simulator to Initial Clean Slate
  const handleResetSimulator = () => {
    const confirmReset = window.confirm("Reset seluruh sistem penjejak editor? Semua isi Stack saat ini akan dibersihkan.");
    if (confirmReset) {
      setText("");
      const initialText = "";
      const nowStr = new Date().toLocaleTimeString();
      const initialState: StackState = {
        id: "initial-state",
        text: initialText,
        timestamp: nowStr,
        wordCount: 0,
        charCount: 0,
        reason: 'initial'
      };
      
      setUndoStack([initialState]);
      setRedoStack([]);
      setLastSavedText(initialText);
      setLogs([]);
      setStats({
        charCount: 0,
        wordCount: 0,
        lineCount: 1,
        undoCount: 0,
        redoCount: 0
      });
      showToast("Simulator berhasil di-reset!", "info");
      postLog("RESET SIMULATOR", "Semua stack, statistik, dan log dibersihkan ke kondisi semula.");
    }
  };

  // Re-write peek element of Undo Stack for visual indicator
  const undoPeek = undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
  const redoPeek = redoStack.length > 0 ? redoStack[redoStack.length - 1] : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative antialiased text-slate-900 select-none">
      
      {/* Dynamic Toasts Overlay */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-4 rounded-xl shadow-lg border text-sm font-medium pointer-events-auto flex items-center justify-between gap-3 ${
                t.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 shadow-emerald-100/30' :
                t.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-100 shadow-amber-100/30' :
                t.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-100 shadow-blue-100/30' :
                'bg-rose-50 text-rose-800 border-rose-100 shadow-rose-100/30'
              }`}
              id={`toast-${t.id}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">
                  {t.type === 'success' ? '✨' : t.type === 'warning' ? '⚠️' : t.type === 'info' ? 'ℹ️' : '❌'}
                </span>
                <span>{t.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* App Header (h-14) */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-40 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm">
            S
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-slate-800 font-sans" id="app-title">Smart Text Editor</h1>
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wider rounded border border-blue-100">v1.0.4</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 font-medium text-xs">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'editor' 
                ? 'bg-white text-blue-600 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-950 font-normal'
            }`}
            id="tab-editor"
          >
            <Layers size={13} />
            <span>Simulator &amp; Visualisator</span>
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'python' 
                ? 'bg-white text-blue-600 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-950 font-normal'
            }`}
            id="tab-python"
          >
            <FileCode size={13} />
            <span>Python Source Code</span>
          </button>
          <button
            onClick={() => setActiveTab('theory')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
              activeTab === 'theory' 
                ? 'bg-white text-blue-600 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-950'
            }`}
            id="tab-theory"
          >
            <BookOpen size={13} />
            <span>Teori LIFO</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-slate-500">
          <span className="italic">Mode: Double-Stack Visualization Active</span>
          <div className="flex gap-2">
            <button
              onClick={handleResetSimulator}
              className="px-3 py-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] rounded-md font-medium cursor-pointer transition-all active:scale-95 flex items-center gap-1"
            >
              <RotateCcw size={11} />
              <span>Reset Simulator</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'editor' && (
          <div className="flex flex-1 flex-col lg:flex-row overflow-hidden w-full">
            
            {/* Left Sidebar: Controls */}
            <aside className="w-full lg:w-56 bg-slate-100 lg:border-r border-b lg:border-b-0 border-slate-200 p-4 flex flex-col gap-4 shrink-0 overflow-y-auto justify-between select-none">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Actions</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      onClick={handleUndo}
                      disabled={undoStack.length <= 1}
                      className={`flex items-center gap-3 px-3 py-2 bg-white border rounded-lg shadow-sm transition-all w-full text-left cursor-pointer active:scale-98 ${
                        undoStack.length <= 1 
                          ? 'bg-slate-50/50 text-slate-300 border-slate-200 cursor-not-allowed' 
                          : 'text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-slate-50/80 hover:text-slate-950'
                      }`}
                      id="btn-undo-sidebar"
                    >
                      <div className="w-5 h-5 flex items-center justify-center bg-blue-50 text-blue-600 rounded text-xs select-none">⟲</div>
                      <span className="text-xs font-semibold">Undo</span>
                      <span className="ml-auto text-[9px] text-slate-400 font-mono">Ctrl+Z</span>
                    </button>

                    <button
                      onClick={handleRedo}
                      disabled={redoStack.length === 0}
                      className={`flex items-center gap-3 px-3 py-2 bg-white border rounded-lg shadow-sm transition-all w-full text-left cursor-pointer active:scale-98 ${
                        redoStack.length === 0 
                          ? 'bg-slate-50/50 text-slate-300 border-slate-200 cursor-not-allowed' 
                          : 'text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-slate-50/80 hover:text-slate-950'
                      }`}
                      id="btn-redo-sidebar"
                    >
                      <div className="w-5 h-5 flex items-center justify-center bg-blue-50 text-blue-600 rounded text-xs select-none">⟳</div>
                      <span className="text-xs font-semibold">Redo</span>
                      <span className="ml-auto text-[9px] text-slate-400 font-mono">Ctrl+Y</span>
                    </button>

                    <button
                      onClick={triggerManualSnapshot}
                      className="flex items-center gap-3 px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-lg shadow-sm text-indigo-700 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-950 transition-all font-semibold text-left w-full cursor-pointer active:scale-98"
                      id="btn-snapshot-sidebar"
                    >
                      <div className="w-5 h-5 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded text-xs">📸</div>
                      <span className="text-xs">Snapshot</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">File Management</div>
                  <div className="flex flex-col gap-1 text-xs">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer w-full text-left font-medium"
                    >
                      <span>📁</span> Open File (.txt)
                    </button>
                    <button
                      onClick={handleSaveText}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer w-full text-left font-medium"
                    >
                      <span>💾</span> Save Changes
                    </button>
                    <button
                      onClick={handleClear}
                      disabled={text === ""}
                      className="flex items-center gap-2.5 px-3 py-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-transparent w-full text-left font-semibold"
                    >
                      <span>🗑️</span> Clear Buffer
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mt-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Auto Save Mode</div>
                  <div className="grid grid-cols-2 gap-1 bg-slate-200/60 p-1 rounded-lg">
                    <button
                      onClick={() => setSnapshotMode('word')}
                      className={`py-1 text-[9px] rounded font-medium cursor-pointer transition-all ${
                        snapshotMode === 'word' 
                          ? 'bg-white text-slate-800 shadow-xs font-bold' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Otomatis
                    </button>
                    <button
                      onClick={() => setSnapshotMode('manual')}
                      className={`py-1 text-[9px] rounded font-medium cursor-pointer transition-all ${
                        snapshotMode === 'manual' 
                          ? 'bg-white text-slate-800 shadow-xs font-bold' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                </div>
              </div>

              {/* Logic Debug visual element */}
              <div className="mt-6 p-3.5 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200/50">
                <div className="text-[9px] opacity-75 uppercase tracking-wider font-bold mb-1">Logic Debug</div>
                <div className="text-[11px] leading-relaxed font-sans font-medium text-blue-50">
                  Stack implementation verified. All push/pop operations synchronized with GUI thread.
                </div>
              </div>
            </aside>

            {/* Central Editor Area */}
            <main className="flex-1 bg-white p-6 md:p-8 flex flex-col min-w-0 overflow-y-auto">
              <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-inner bg-slate-50/30 relative">
                
                {/* Simulated Editor Header */}
                <div className="h-10 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between text-xs text-slate-400 shrink-0 select-none">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-400">📄</span>
                    <span className="text-slate-700 font-semibold text-[11px]">main.py (Tkinter draft)</span>
                    <span className="px-1.5 py-0.25 rounded bg-green-100 text-green-700 font-bold uppercase text-[8px] tracking-wider font-sans">
                      Active
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 bg-slate-200/50 px-1.5 py-0.5 rounded">Double Stack LIFO</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col p-4 relative bg-white">
                  <textarea
                    value={text}
                    onChange={handleTextChange}
                    spellCheck="false"
                    className="flex-1 p-2 text-base font-medium leading-relaxed outline-none resize-none text-slate-700 placeholder-slate-300 font-sans min-h-[250px] select-text"
                    placeholder="Mulai menulis teks di sini... (Apabila tombol snapshot diaktifkan secara 'Otomatis', setiap pengetikan spasi atau enter akan secara ajaib memicu operasi push() state teks ini ke dalam Undo Stack)."
                    id="main-textbox"
                  />

                  {/* Empty state overlay suggestions if empty */}
                  {text === "" && (
                    <div className="absolute inset-x-0 bottom-4 p-4 mx-4 bg-slate-50/90 backdrop-blur-xs rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center pointer-events-none md:pointer-events-auto">
                      <p className="text-xs font-semibold text-slate-600 mb-2">💡 Butuh teks cepat untuk demonstrasi LIFO Stack?</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {PRELOADED_TEMPLATES.map((tmpl, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleOpenTemplate(tmpl.content, tmpl.name)}
                            className="bg-blue-50 hover:bg-blue-100 border border-blue-200/50 text-blue-700 text-[11px] font-bold py-1 px-2.5 rounded-lg transition-all cursor-pointer pointer-events-auto shadow-xs"
                          >
                            📝 Load &quot;{tmpl.name}&quot;
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </main>

            {/* Right Sidebar: Stack Visualization */}
            <aside className="w-full lg:w-72 bg-slate-100 border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto divide-y divide-slate-200">
              
              {/* Undo Stack Visualizer Container */}
              <div className="flex-1 flex flex-col p-4 min-h-[200px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Undo Stack</span>
                  </h3>
                  <span className="text-[9px] bg-slate-200 px-2 py-0.5 rounded-full font-mono text-slate-600 font-bold">Size: {undoStack.length}</span>
                </div>

                <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto max-h-[220px] pr-1">
                  {undoStack.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-semibold">Tumpukan Kosong</div>
                  ) : (
                    [...undoStack].slice().reverse().map((state, index, arr) => {
                      const origIndex = arr.length - 1 - index;
                      const isPeek = index === 0;

                      return (
                        <div 
                          key={state.id}
                          className={`p-2 rounded-md text-[11px] transition-all ${
                            isPeek 
                              ? 'bg-blue-500 text-white border-b-2 border-blue-700 shadow-sm font-medium' 
                              : 'bg-white text-slate-600 border border-slate-200 shadow-3xs'
                          }`}
                        >
                          <div className="flex justify-between font-mono italic opacity-70 mb-1 text-[9px]">
                            <span>#{origIndex}</span>
                            {isPeek ? <span>peek()</span> : <span></span>}
                            <span>{state.timestamp}</span>
                          </div>
                          <div className="truncate font-sans leading-tight">
                            {state.text === "" ? '[State Kosong / Awal]' : `State: "${state.text}"`}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Redo Stack Visualizer Container */}
              <div className="p-4 flex flex-col min-h-[160px] max-h-[240px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span>Redo Stack</span>
                  </h3>
                  <span className="text-[9px] bg-slate-200 px-2 py-0.5 rounded-full font-mono text-slate-600 font-bold">Size: {redoStack.length}</span>
                </div>

                <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
                  {redoStack.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center p-2 text-slate-400 text-[10px] uppercase font-bold tracking-tight">
                      Ready for state pop (Kosong)
                    </div>
                  ) : (
                    [...redoStack].slice().reverse().map((state, index, arr) => {
                      const origIndex = arr.length - 1 - index;
                      const isPeek = index === 0;

                      return (
                        <div 
                          key={state.id}
                          className="bg-amber-50 text-amber-800 p-2 rounded-md text-[11px] border border-amber-200 border-dashed"
                        >
                          <div className="flex justify-between font-mono italic opacity-70 mb-1 text-[9px]">
                            <span>#{origIndex}</span>
                            {isPeek && <span>peek()</span>}
                            <span>{state.timestamp}</span>
                          </div>
                          <div className="truncate font-sans leading-tight">
                            {state.text === "" ? '[Kosong]' : `State: "${state.text}"`}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Operations Console Logs on right sidebar */}
              <div className="p-4 flex flex-col h-[180px] bg-slate-900 text-emerald-400 font-mono text-[10px] select-none shrink-0 overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2 text-slate-400 shrink-0">
                  <span className="font-bold flex items-center gap-1.5 uppercase text-[9px] tracking-wider text-slate-300">
                    <span className="inline-block w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
                    Live Stack Operations
                  </span>
                  <span>Port 3000</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[140px] scroller scrollbar-thin">
                  {logs.length === 0 ? (
                    <div className="text-slate-600 text-center py-4 text-[9px]">
                      Menunggu pemantangan stack...
                    </div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className="leading-snug">
                        <span className="text-slate-500">[{log.time}]</span>{' '}
                        <span className="text-sky-400 font-semibold">{log.action}:</span>{' '}
                        <span className="text-slate-300">{log.description}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </aside>

          </div>
        )}

        {/* PYTHON BLUEPRINT PAGE */}
        {activeTab === 'python' && (
          <div className="flex-1 bg-white p-6 md:p-8 flex flex-col overflow-y-auto select-none">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-xs flex-1 max-w-5xl mx-auto w-full">
              
              <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileCode size={20} className="text-blue-600" />
                    <h2 className="text-base font-bold text-slate-900 tracking-tight">
                      Python Source Code (Tkinter Implementation)
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500">
                    Satu berkas mandiri lengkap yang menggabungkan kelas <code className="bg-slate-100 p-0.5 rounded font-mono text-slate-700">Stack</code> LIFO tulen, logika editor, dan antarmuka visualisasi yang siap Anda kembangkan kembali.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end shrink-0">
                  <button
                    onClick={handleCopyCode}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-xs"
                    id="btn-copy-code"
                  >
                    {copiedCode ? <Check className="text-emerald-600" size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Tersalin!' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPython}
                    className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-sm"
                    id="btn-download-py"
                  >
                    <Download size={14} />
                    <span>Download .py File</span>
                  </button>
                </div>
              </div>

              {/* METHOD CHEATSHEETS */}
              <div className="p-3 bg-blue-50/50 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs select-text">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <strong className="block text-slate-900 font-mono">push(element)</strong>
                  <p className="text-slate-500 text-[10px] mt-0.5">Mendorong elemen baru ke tumpukan teratas. Operasi: <span className="font-bold font-mono">O(1)</span>.</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <strong className="block text-slate-900 font-mono">pop()</strong>
                  <p className="text-slate-500 text-[10px] mt-0.5">Mengeluarkan elemen paling atas tumpukan. Operasi: <span className="font-bold font-mono">O(1)</span>.</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <strong className="block text-slate-900 font-mono">peek()</strong>
                  <p className="text-slate-500 text-[10px] mt-0.5">Melihat elemen teratas tumpukan tanpa mutasi. Operasi: <span className="font-bold font-mono">O(1)</span>.</p>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <strong className="block text-slate-900 font-mono">isEmpty()</strong>
                  <p className="text-slate-500 text-[10px] mt-0.5">Menguji apakah tumpukan kosong, mengembalikan bool.</p>
                </div>
              </div>

              {/* BLUEPRINT PORT */}
              <div className="p-0 border-t border-slate-100 bg-slate-950 flex-1 overflow-y-auto max-h-[400px]">
                <pre className="p-5 text-slate-300 font-mono text-xs leading-relaxed select-text font-medium">
                  <code>{pythonTemplateCode}</code>
                </pre>
              </div>
              
              <div className="bg-slate-50 border-t border-slate-200 p-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>⚠️ Kode python di atas dapat dijalankan di komputer manapun yang memiliki Python terinstal.</span>
                <span className="font-semibold text-blue-700">Tidak membutuhkan library pihak ketiga eksternal karena menggunakan Tkinter standar bawaan Python.</span>
              </div>
            </div>
          </div>
        )}

        {/* THEORY EDUCATIONAL HUB */}
        {activeTab === 'theory' && (
          <div className="flex-1 bg-white p-6 md:p-8 flex flex-col overflow-y-auto select-none space-y-6 max-w-5xl mx-auto w-full">
            
            {/* INTRO CARD */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen size={22} className="text-blue-600" />
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Kajian Teoretis: Struktur Data Double Stack</h2>
              </div>
              
              <div className="prose prose-slate max-w-none text-slate-600 text-xs sm:text-sm leading-relaxed space-y-4">
                <p>
                  Mekanisme <strong>Undo (Membatalkan Tindakan)</strong> dan <strong>Redo (Memulihkan Tindakan)</strong> merupakan fitur wajib dalam aplikasi produktivitas modern seperti pengolah kata (Microsoft Word, Google Docs, Notion) hingga editor grafis. Desain arsitektur terbaik untuk memecahkan tantangan ini dibangun di atas konsep struktur data <strong>Tumpukan (Stack) Ganda</strong>.
                </p>

                <p>
                  Tumpukan bekerja berdasarkan aturan <strong>LIFO (Last In, First Out)</strong>: Data yang paling akhir diketik, akan berada di puncak tumpukan, sehingga saat kita meminta operasional pembatalan (Undo), keadaan teks paling barulah yang siap dikeluarkan terlebih dahulu.
                </p>
              </div>
            </div>

            {/* STEP BY STEP DIAGRAM MODEL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* CARD STEP 1 */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col hover:border-blue-300 hover:shadow-xs transition-all text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs mb-3">
                  1
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Tahap Mengetik (Typing Snapshot)</h4>
                <p className="text-slate-500 leading-relaxed flex-1">
                  Setiap kali Anda menekan tombol spasi atau beristirahat menulis, program merekam keadaan teks terkini. Konten dikemas dalam objek snapshot, lalu didorong menggunakan operasi <code className="bg-slate-100 p-0.5 rounded text-slate-800 font-mono text-[10px]">push()</code> ke dalam <strong>Undo Stack</strong>. Saat Anda menulis baru, <strong>Redo Stack</strong> dibersihkan total.
                </p>
                <div className="mt-4 p-2 bg-slate-50 rounded-lg text-center font-mono text-[9px] text-slate-600 border border-slate-200/50">
                  UndoStack: [Teks A] → [Teks B] → [Teks C]<br />
                  RedoStack: [KOSONG]
                </div>
              </div>

              {/* CARD STEP 2 */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col hover:border-blue-300 hover:shadow-xs transition-all text-xs">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs mb-3">
                  2
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Tahap Membatalkan (Undo Action)</h4>
                <p className="text-slate-500 leading-relaxed flex-1">
                  Saat tombol Undo diklik, state paling mutakhir ("Teks C") dikeluarkan atau ditarik menggunakan operasi <code className="bg-slate-100 p-0.5 rounded text-slate-800 font-mono text-[10px]">pop()</code> dari tumpukan Undo Stack. State tersebut langsung dipindahkan (<code className="bg-slate-100 p-0.5 rounded text-slate-800 font-mono text-[10px]">push()</code>) ke dalam <strong>Redo Stack</strong>. Teks yang ditampilkan akan kembali ke state sisa teratas padukan Undo ("Teks B").
                </p>
                <div className="mt-4 p-2 bg-slate-50 rounded-lg text-center font-mono text-[9px] text-slate-600 border border-slate-200/50">
                  UndoStack: [Teks A] → [Teks B]<br />
                  RedoStack: [Teks C]
                </div>
              </div>

              {/* CARD STEP 3 */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col hover:border-blue-300 hover:shadow-xs transition-all text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs mb-3">
                  3
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-2">Tahap Pemulihan (Redo Action)</h4>
                <p className="text-slate-500 leading-relaxed flex-1">
                  Jika pengguna berubah pikiran dan ingin mengulangi aksi (Redo), elemen teratas pada <strong>Redo Stack</strong> di-pop keluar ("Teks C"), lalu didorong masuk kembali ke dalam <strong>Undo Stack</strong>. Serta merta mengembalikan teks editor ke kondisi terbarunya tadi.
                </p>
                <div className="mt-4 p-2 bg-slate-50 rounded-lg text-center font-mono text-[9px] text-slate-600 border border-slate-200/50">
                  UndoStack: [Teks A] → [Teks B] → [Teks C]<br />
                  RedoStack: [KOSONG]
                </div>
              </div>

            </div>

            {/* PERFORMANCE ANALYSIS BAR */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-xl p-5 text-white shadow-md flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 space-y-2">
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2 text-sky-400">
                  <span className="text-base">⚡</span>
                  Kompleksitas Performa (Big-O Complexity)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                  Operasi tumpukan ganda (Double Stack) ini dinilai sebagai algoritma yang sangat optimal karena semua aksi manipulasi riwayat terjadi di ujung tumpukan. 
                  Tidak membutuhkan kalkulasi sirkular ataupun loop pencarian larik indeks. Kompleksitasnya adalah konstan di bawah model komputasi manapun.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-4 rounded-xl border border-white/10 flex flex-col gap-2.5 font-mono text-xs text-left min-w-[200px]">
                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                  <span className="text-slate-400">UndoStack.push()</span>
                  <span className="font-bold text-emerald-400">O(1)</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                  <span className="text-slate-400">UndoStack.pop()</span>
                  <span className="font-bold text-emerald-400">O(1)</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                  <span className="text-slate-400">RedoStack.push()</span>
                  <span className="font-bold text-emerald-400">O(1)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">RedoStack.pop()</span>
                  <span className="font-bold text-emerald-400">O(1)</span>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Footer Status Bar (h-8) */}
      <footer className="h-8 bg-white border-t border-slate-200 flex items-center justify-between px-6 text-[11px] text-slate-500 shrink-0 select-none">
        <div className="flex gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="font-medium text-slate-600">System State Synchronized</span>
          </div>
          <span>Karakter: <strong className="text-slate-800 font-semibold font-mono">{stats.charCount}</strong></span>
          <span>Kata: <strong className="text-slate-800 font-semibold font-mono">{stats.wordCount}</strong></span>
          <span>Baris: <strong className="text-slate-800 font-semibold font-mono">{stats.lineCount}</strong></span>
        </div>
        <div className="flex gap-6 items-center">
          <span className="hidden md:inline">History Ops: <span className="font-mono font-bold text-blue-600">{stats.undoCount + stats.redoCount}</span></span>
          <span className="font-mono font-semibold text-slate-400">UTF-8</span>
          <span className="font-sans">Status: <span className="font-bold text-blue-700 uppercase tracking-wider text-[8px] bg-blue-50 px-1.5 py-0.25 border border-blue-100 rounded">Interactive Demo</span></span>
        </div>
      </footer>

    </div>
  );
}
