export const pythonTemplateCode = `import tkinter as tk
from tkinter import filedialog, messagebox, ttk
import datetime

# =========================================================================
# KELOMPOK STRUKTUR DATA: DOUBLE STACK (UNDO & REDO)
# =========================================================================

class Stack:
    """
    Implementasi Struktur Data Stack (LIFO: Last In First Out)
    untuk melayani mekanisme Undo dan Redo secara realtime.
    """
    def __init__(self, name="Stack"):
        self.items = []
        self.name = name

    def push(self, item):
        """Menambahkan state item baru ke posisi teratas tumpukan."""
        self.items.append(item)

    def pop(self):
        """Mengambil & mengeluarkan item dari posisi teratas tumpukan."""
        if not self.isEmpty():
            return self.items.pop()
        return None

    def peek(self):
        """Mengintip item teratas tumpukan tanpa mengeluarkannya."""
        if not self.isEmpty():
            return self.items[-1]
        return None

    def isEmpty(self):
        """Memeriksa apakah tumpukan kosong."""
        return len(self.items) == 0

    def size(self):
        """Mendapatkan jumlah item yang ada di tumpukan."""
        return len(self.items)

    def clear(self):
        """Mengosongkan seluruh tumpukan."""
        self.items.clear()


# =========================================================================
# APLIKASI UTAMA: SMART TEXT EDITOR (GUI WITH TKINTER)
# =========================================================================

class SmartTextEditorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Smart Text Editor - Double Stack Visualizer")
        self.root.geometry("1050x650")
        self.root.configure(bg="#F3F4F6")  # Background Soft Light Gray
        
        # Inisialisasi Double Stack
        self.undo_stack = Stack("Undo Stack")
        self.redo_stack = Stack("Redo Stack")
        
        # Bendera pencegah trigger event saat update manual oleh program
        self.is_updating = False
        
        # Konfigurasi Tema & Desain Modern
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.style.configure('TButton', font=('Inter', 9), background='#E5E7EB', borderwidth=0)
        
        # Setup Layout Grid Utama (Dua Kolom)
        # Kiri (65%): Editor & Kontrol
        # Kanan (35%): Panel Visualisasi Stack
        self.root.columnconfigure(0, weight=65)
        self.root.columnconfigure(1, weight=35)
        self.root.rowconfigure(0, weight=1)
        
        # Setup Komponen Panel
        self.setup_editor_panel()
        self.setup_visualizer_panel()
        
        # Inisialisasi State Awal ke Undo Stack
        initial_state = {
            "text": "",
            "time": datetime.datetime.now().strftime("%H:%M:%S")
        }
        self.undo_stack.push(initial_state)
        self.update_visualizer_list()
        self.update_statistics()

    def setup_editor_panel(self):
        """Mempersiapkan area kerja penulisan teks dan kontrol utama."""
        editor_frame = tk.Frame(self.root, bg="#FFFFFF", bd=0)
        editor_frame.grid(row=0, column=0, sticky="nsew", padx=15, pady=15)
        
        # Header Aplikasi (Notion-Like)
        header_frame = tk.Frame(editor_frame, bg="#FFFFFF", pady=10)
        header_frame.pack(fill="x", padx=15)
        
        icon_label = tk.Label(header_frame, text="📝", font=("Segoe UI Symbol", 20), bg="#FFFFFF")
        icon_label.pack(side="left")
        
        title_label = tk.Label(
            header_frame, 
            text="Smart Text Editor", 
            font=("Segoe UI", 16, "bold"), 
            fg="#1F2937", 
            bg="#FFFFFF"
        )
        title_label.pack(side="left", padx=8)
        
        subtitle = tk.Label(
            header_frame, 
            text="Double Stack Undo-Redo Simulator", 
            font=("Segoe UI", 8), 
            fg="#9CA3AF", 
            bg="#FFFFFF"
        )
        subtitle.pack(side="left", fill="y", padx=5)

        # Sekat Pemisah Tipis
        seperator = tk.Frame(editor_frame, height=1, bg="#E5E7EB")
        seperator.pack(fill="x", padx=15)

        # Frame Toolbar Tombol Utama
        toolbar = tk.Frame(editor_frame, bg="#FFFFFF", pady=8)
        toolbar.pack(fill="x", padx=15)

        # Event binding untuk hover
        def on_enter(e, color):
            e.widget['background'] = color
        def on_leave(e, color):
            e.widget['background'] = color

        # Fungsionalitas Tombol dengan Hover Modern
        self.btn_undo = tk.Button(
            toolbar, text="↩ Undo (Ctrl+Z)", bg="#E5E7EB", fg="#1F2937", 
            font=("Segoe UI", 9, "bold"), bd=0, padx=12, pady=6, cursor="hand2",
            command=self.trigger_undo
        )
        self.btn_undo.pack(side="left", padx=3)
        self.btn_undo.bind("<Enter>", lambda e: on_enter(e, "#D1D5DB"))
        self.btn_undo.bind("<Leave>", lambda e: on_leave(e, "#E5E7EB"))

        self.btn_redo = tk.Button(
            toolbar, text="↪ Redo (Ctrl+Y)", bg="#E5E7EB", fg="#1F2937", 
            font=("Segoe UI", 9, "bold"), bd=0, padx=12, pady=6, cursor="hand2",
            command=self.trigger_redo
        )
        self.btn_redo.pack(side="left", padx=3)
        self.btn_redo.bind("<Enter>", lambda e: on_enter(e, "#D1D5DB"))
        self.btn_redo.bind("<Leave>", lambda e: on_leave(e, "#E5E7EB"))

        self.btn_clear = tk.Button(
            toolbar, text="🗑️ Clear Text", bg="#FEE2E2", fg="#EF4444", 
            font=("Segoe UI", 9), bd=0, padx=12, pady=6, cursor="hand2",
            command=self.clear_text
        )
        self.btn_clear.pack(side="left", padx=3)
        self.btn_clear.bind("<Enter>", lambda e: on_enter(e, "#FCA5A5"))
        self.btn_clear.bind("<Leave>", lambda e: on_leave(e, "#FEE2E2"))

        # Pemisah toolbar kanan
        tk.Label(toolbar, bg="#FFFFFF", width=3).pack(side="left")

        self.btn_open = tk.Button(
            toolbar, text="📂 Open", bg="#EFF6FF", fg="#3B82F6", 
            font=("Segoe UI", 9), bd=0, padx=12, pady=6, cursor="hand2",
            command=self.open_file
        )
        self.btn_open.pack(side="right", padx=3)
        self.btn_open.bind("<Enter>", lambda e: on_enter(e, "#DBEAFE"))
        self.btn_open.bind("<Leave>", lambda e: on_leave(e, "#EFF6FF"))

        self.btn_save = tk.Button(
            toolbar, text="💾 Save File", bg="#3B82F6", fg="#FFFFFF", 
            font=("Segoe UI", 9, "bold"), bd=0, padx=12, pady=6, cursor="hand2",
            command=self.save_file
        )
        self.btn_save.pack(side="right", padx=3)
        self.btn_save.bind("<Enter>", lambda e: on_enter(e, "#2563EB"))
        self.btn_save.bind("<Leave>", lambda e: on_leave(e, "#3B82F6"))

        # Area Text Editor (Notion Style)
        # Menghapus border native agar aesthetics modern
        self.text_area = tk.Text(
            editor_frame, 
            font=("Courier" if False else "Inter", 11), 
            wrap="word", 
            bd=0, 
            highlightthickness=1,
            highlightbackground="#E5E7EB", 
            highlightcolor="#3B82F6",
            undo=False,  # Gunakan double stack custom kita, bukan undo native Tkinter!
            padx=12, 
            pady=12, 
            fg="#374151", 
            bg="#FAFAFA"
        )
        self.text_area.pack(fill="both", expand=True, padx=15, pady=5)
        
        # Shortcut Keyboard Integrations
        self.text_area.bind("<Control-z>", lambda e: [self.trigger_undo(), "break"][1])
        self.text_area.bind("<Control-y>", lambda e: [self.trigger_redo(), "break"][1])
        
        # Binding typing event untuk menangkap perubahan kalimat
        self.text_area.bind("<KeyRelease>", self.on_key_release)
        
        # Status Bar / Footer (Statistik Editor)
        self.status_bar = tk.Frame(editor_frame, bg="#FFFFFF", height=28)
        self.status_bar.pack(fill="x", side="bottom", padx=15, pady=10)
        
        self.lbl_stats = tk.Label(
            self.status_bar, 
            text="Karakter: 0   |   Kata: 0   |   Baris: 1", 
            font=("Segoe UI", 9), 
            fg="#6B7280", 
            bg="#FFFFFF"
        )
        self.lbl_stats.pack(side="left")
        
        self.lbl_activity = tk.Label(
            self.status_bar, 
            text="Status: Siap menulis...", 
            font=("Segoe UI", 9, "italic"), 
            fg="#10B981", 
            bg="#FFFFFF"
        )
        self.lbl_activity.pack(side="right")

    def setup_visualizer_panel(self):
        """Mempersiapkan panel sebelah kanan untuk visualisasi Double Stack."""
        vis_frame = tk.Frame(self.root, bg="#EFF6FF", bd=0)
        vis_frame.grid(row=0, column=1, sticky="nsew", padx=(0, 15), pady=15)
        
        # Judul Panel Visualisasi
        lbl_vis_title = tk.Label(
            vis_frame, 
            text="🕵️‍♂️ Realtime Stack Visualizer", 
            font=("Segoe UI", 12, "bold"), 
            fg="#1E3A8A", 
            bg="#EFF6FF", 
            pady=12
        )
        lbl_vis_title.pack(fill="x")
        
        # Container Dua Stack Visualizer
        stacks_container = tk.Frame(vis_frame, bg="#EFF6FF")
        stacks_container.pack(fill="both", expand=True, padx=10, pady=5)
        
        # Sisi Kiri Stack Container: UNDO Stack List
        undo_title_frame = tk.Frame(stacks_container, bg="#EFF6FF")
        undo_title_frame.pack(fill="x")
        
        self.lbl_undo_header = tk.Label(
            undo_title_frame, text="⏪ UNDO STACK (Push on Edit)", 
            font=("Segoe UI", 9, "bold"), fg="#4B5563", bg="#EFF6FF"
        )
        self.lbl_undo_header.pack(anchor="w", padx=5)

        self.undo_listbox = tk.Listbox(
            stacks_container, bg="#FFFFFF", bd=0, 
            highlightthickness=1, highlightbackground="#D1D5DB", 
            font=("Consolas", 9), selectbackground="#DBEAFE", 
            selectforeground="#1E40AF"
        )
        self.undo_listbox.pack(fill="both", expand=True, padx=5, pady=(2, 10))

        # Sisi Kanan Stack Container: REDO Stack List
        redo_title_frame = tk.Frame(stacks_container, bg="#EFF6FF")
        redo_title_frame.pack(fill="x")
        
        self.lbl_redo_header = tk.Label(
            redo_title_frame, text="⏩ REDO STACK (Push on Undo)", 
            font=("Segoe UI", 9, "bold"), fg="#4B5563", bg="#EFF6FF"
        )
        self.lbl_redo_header.pack(anchor="w", padx=5)

        self.redo_listbox = tk.Listbox(
            stacks_container, bg="#FFFFFF", bd=0, 
            highlightthickness=1, highlightbackground="#D1D5DB", 
            font=("Consolas", 9), selectbackground="#FEE2E2", 
            selectforeground="#991B1B"
        )
        self.redo_listbox.pack(fill="both", expand=True, padx=5, pady=2)
        
        # Penjelasan Alur Singkat
        lbl_explanation = tk.Label(
            vis_frame, 
            text="💡 TIPS:\n"
                 "- Tiap ketikan spasi/enter memicu push() ke Undo Stack.\n"
                 "- Undo memicu pop() Undo → push() Redo Stack.\n"
                 "- Redo memicu pop() Redo → push() Undo Stack.",
            font=("Segoe UI", 8), 
            fg="#4B5563", 
            bg="#DBEAFE", 
            justify="left", 
            padx=10, 
            pady=10
        )
        lbl_explanation.pack(fill="x", padx=10, pady=10)

    # =========================================================================
    # DETEKSI EVENT & LOGIKA DOUBLE STACK
    # =========================================================================

    def on_key_release(self, event):
        """Mendeteksi ketikan tombol keyboard untuk mengambil state snapshot baru."""
        # Abaikan tombol kontrol seperti Control, Alt, Shift dll
        if event.keysym in ("Control_L", "Control_R", "Shift_L", "Shift_R", "Alt_L", "Alt_R", "Caps_Lock"):
            return
            
        current_text = self.text_area.get("1.0", "end-1c")
        
        # Ambil state paling atas
        last_state = self.undo_stack.peek()
        if last_state and last_state["text"] == current_text:
            return  # Tidak ada perubahan teks aktual
            
        # Untuk kepraktisan visualisasi, kita lakukan push snapshot baru saat:
        # 1. Tombol Spasi (Space) atau Enter ditekan (penyelesaian kata/kalimat)
        # 2. Perubahan panjang karakter cukup signifikan (+/- 5 karakter)
        # 3. Stack Undo dalam keadaan kosong
        should_push = (
            event.keysym in ("space", "Return", "BackSpace") or
            self.undo_stack.isEmpty() or
            abs(len(current_text) - len(last_state["text"])) >= 5
        )
        
        if should_push:
            # PUSH state baru ke Undo Stack
            new_state = {
                "text": current_text,
                "time": datetime.datetime.now().strftime("%H:%M:%S")
            }
            self.undo_stack.push(new_state)
            
            # Setiap ada ketikan baru, kosongkan Redo Stack secara permanen (berlaku aturan Redo standard)
            self.redo_stack.clear()
            
            # Update Tampilan
            self.update_visualizer_list()
            self.update_statistics()
            self.lbl_activity.config(text="Status: State ditambahkan ke Undo...", fg="#3B82F6")

    def trigger_undo(self):
        """Mekanisme POP Undo Stack -> PUSH Redo Stack -> Update Text Area"""
        if self.undo_stack.size() <= 1:
            # Sisa 1 state (state awal/kosong), tidak bisa di-undo lagi
            self.lbl_activity.config(text="Status: Batas Undo Tercapai!", fg="#EF4444")
            self.show_notification("Info", "Tidak ada aksi yang bisa dibatalkan (Undo Stack kosong atau sisa state basis)!")
            return
            
        # POP state saat ini dari Undo Stack
        popped_state = self.undo_stack.pop()
        
        # PUSH state yang telah di-pop tersebut ke Redo Stack
        self.redo_stack.push(popped_state)
        
        # Dapatkan state sebelumnya (peek dari Undo Stack)
        previous_state = self.undo_stack.peek()
        
        if previous_state is not None:
            self.is_updating = True
            # Tuliskan teks sebelum ke area editor
            self.text_area.delete("1.0", "end")
            self.text_area.insert("1.0", previous_state["text"])
            self.is_updating = False
            
            # Feedbacks & Logs
            self.update_visualizer_list()
            self.update_statistics()
            self.lbl_activity.config(text=f"Status: Undo Sukses ({self.undo_stack.size()} Tersisa)", fg="#10B981")

    def trigger_redo(self):
        """Mekanisme POP Redo Stack -> PUSH Undo Stack -> Update Text Area"""
        if self.redo_stack.isEmpty():
            self.lbl_activity.config(text="Status: Batas Redo Tercapai!", fg="#EF4444")
            self.show_notification("Info", "Tidak ada aksi yang bisa dikembalikan (Redo Stack Kosong)!")
            return
            
        # POP state dari Redo Stack
        popped_state = self.redo_stack.pop()
        
        # PUSH kembali state tersebut ke Undo Stack
        self.undo_stack.push(popped_state)
        
        # Terapkan state tersebut ke Text Area
        self.is_updating = True
        self.text_area.delete("1.0", "end")
        self.text_area.insert("1.0", popped_state["text"])
        self.is_updating = False
        
        # Feedbacks
        self.update_visualizer_list()
        self.update_statistics()
        self.lbl_activity.config(text="Status: Redo Berhasil dilakukan!", fg="#10B981")

    def clear_text(self):
        """Mengosongkan teks area dan push state kosong ke Stack."""
        current_text = self.text_area.get("1.0", "end-1c")
        if not current_text:
            return
            
        confirm = messagebox.askyesno("Konfirmasi", "Apakah Anda yakin ingin menghapus seluruh teks?")
        if confirm:
            # Ambil snapshot sebelum hapus untuk cadangan undo
            self.text_area.delete("1.0", "end")
            
            new_state = {
                "text": "",
                "time": datetime.datetime.now().strftime("%H:%M:%S")
            }
            self.undo_stack.push(new_state)
            self.redo_stack.clear()
            
            self.update_visualizer_list()
            self.update_statistics()
            self.lbl_activity.config(text="Status: Editor dibersihkan!", fg="#EF4444")

    # =========================================================================
    # UTILITY & STATISTIK
    # =========================================================================

    def update_statistics(self):
        """Menghitung statistik kalimat secara realtime dan diupdate ke UI footer."""
        text = self.text_area.get("1.0", "end-1c")
        char_count = len(text)
        
        # Hitung kata secara spesifik
        words = text.split()
        word_count = len(words)
        
        # Hitung baris
        lines_count = text.count('\n') + 1 if char_count > 0 else 1
        
        # Set text baris status
        self.lbl_stats.config(
            text=f"Karakter: {char_count}   |   Kata: {word_count}   |   Baris: {lines_count}"
        )
        
        # SINKRONISASI visual header stack counter
        self.lbl_undo_header.config(text=f"⏪ UNDO STACK (Size: {self.undo_stack.size()})")
        self.lbl_redo_header.config(text=f"⏩ REDO STACK (Size: {self.redo_stack.size()})")

    def update_visualizer_list(self):
        """Siklus Redraw List visualisasi stack pada panel kanan."""
        # Clears listboxes
        self.undo_listbox.delete(0, tk.END)
        self.redo_listbox.delete(0, tk.END)
        
        # Render Undo Stack (Urutan Tumpukan: Elemen terbaru di paling ATAS)
        # Oleh karena itu array kita loop dari belakang
        u_size = self.undo_stack.size()
        for idx in range(u_size - 1, -1, -1):
            state = self.undo_stack.items[idx]
            txt_preview = state["text"].replace("\n", " ").strip()
            if len(txt_preview) > 20:
                txt_preview = txt_preview[:18] + "..."
            elif not txt_preview:
                txt_preview = "[Kosong / Awal]"
                
            prefix = "⭐ TOP | " if idx == u_size - 1 else f"[{idx}] "
            self.undo_listbox.insert(tk.END, f"{prefix}{txt_preview} ({state['time']})")
            
        # Render Redo Stack (Urutan Tumpukan: Elemen teratas di paling atas)
        r_size = self.redo_stack.size()
        for idx in range(r_size - 1, -1, -1):
            state = self.redo_stack.items[idx]
            txt_preview = state["text"].replace("\n", " ").strip()
            if len(txt_preview) > 20:
                txt_preview = txt_preview[:18] + "..."
            elif not txt_preview:
                txt_preview = "[Kosong]"
                
            prefix = "🔴 PEEK | " if idx == r_size - 1 else f"[{idx}] "
            self.redo_listbox.insert(tk.END, f"{prefix}{txt_preview} ({state['time']})")

    def open_file(self):
        """Membuka file dialog lokal dan meload kontennya ke editor teks."""
        file_path = filedialog.askopenfilename(filetypes=[("Text Files", "*.txt"), ("All Files", "*.*")])
        if file_path:
            try:
                with open(file_path, "r", encoding="utf-8") as file:
                    content = file.read()
                    
                self.text_area.delete("1.0", "end")
                self.text_area.insert("1.0", content)
                
                # Push state hasil open ke stack
                new_state = {
                    "text": content,
                    "time": datetime.datetime.now().strftime("%H:%M:%S")
                }
                self.undo_stack.push(new_state)
                self.redo_stack.clear()
                
                self.update_visualizer_list()
                self.update_statistics()
                self.lbl_activity.config(text="Status: File berhasil dibuka & diload!", fg="#3B82F6")
            except Exception as e:
                messagebox.showerror("Error", f"Gagal membaca file: {str(e)}")

    def save_file(self):
        """Menyimpan konten teks editor ke sebuah file lokal (.txt)"""
        file_path = filedialog.asksaveasfilename(
            defaultextension=".txt",
            filetypes=[("Text Files", "*.txt"), ("All Files", "*.*")]
        )
        if file_path:
            try:
                content = self.text_area.get("1.0", "end-1c")
                with open(file_path, "w", encoding="utf-8") as file:
                    file.write(content)
                self.lbl_activity.config(text="Status: File Tersimpan!", fg="#10B981")
                messagebox.showinfo("Berhasil", "File berhasil disimpan!")
            except Exception as e:
                messagebox.showerror("Error", f"Gagal menyimpan file: {str(e)}")

    def show_notification(self, title, msg):
        """Wrapper dialog tips kecil."""
        # dialog non-blocking sederhana
        pass


if __name__ == "__main__":
    root = tk.Tk()
    app = SmartTextEditorApp(root)
    root.mainloop()
`;
