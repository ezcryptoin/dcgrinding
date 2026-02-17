 📚 TUTORIAL MENJALANKAN SCRIPT DISCORD AI BOT

Berikut adalah panduan lengkap menjalankan script untuk **Python** dan **JavaScript (Node.js)** di **Termux**.

---

## 📋 PRASYARAT

Pastikan Anda sudah memiliki:
- [x] Aplikasi **Termux** (dari F-Droid atau GitHub, bukan Play Store)
- [x] File **`.env`** (berisi Groq API Keys)
- [x] File **`accounts.json`** (berisi Discord Tokens)
- [x] File script **`bot.py`** atau **`bot.js`**

---

# 🐍 VERSI PYTHON

## 1. Install Python & Dependencies

```bash
# Update paket
pkg update && pkg upgrade

# Install Python
pkg install python

# Install library yang dibutuhkan
pip install requests
```

## 2. Struktur Folder

Pastikan struktur folder seperti ini:

```
~/dcgrinding/
├── bot.py
├── .env
├── accounts.json
└── .gitignore
```

## 3. Jalankan Script

```bash
# Masuk ke folder
cd dcgrinding

# Jalankan bot
python bot.py
```

## 4. Input Cooldown

Saat dijalankan, script akan meminta input:

```
Enter cooldown in seconds (default 20):
```

- Tekan **Enter** untuk default (20 detik)
- Atau ketik angka lain (misal: `30`)

---

# 🟨 VERSI JAVASCRIPT (NODE.JS)

## 1. Install Node.js & Dependencies

```bash
# Update paket
pkg update && pkg upgrade

# Install Node.js
pkg install nodejs

# Masuk ke folder
cd dcgrinding

# Install dependencies (axios)
npm install
```

## 2. Struktur Folder

```
~/dcgrinding/
├── bot.js
├── package.json
├── .env
├── accounts.json
└── .gitignore
```

## 3. Jalankan Script

```bash
# Cara 1: Langsung
node bot.js

# Cara 2: Menggunakan npm
npm start
```

## 4. Input Cooldown

Sama seperti Python, masukkan cooldown yang diinginkan.

---

# 🔄 MENJALANKAN DI BACKGROUND (TERMUX)

Agar script tetap berjalan saat terminal ditutup:

## Metode 1: Menggunakan `tmux` (REKOMENDASI)

```bash
# Install tmux
pkg install tmux

# Buat sesi baru
tmux new -s discordbot

# Jalankan script
python bot.py   # atau: node bot.js

# Keluar dari sesi (script tetap jalan)
# Tekan: Ctrl + B, lalu tekan D

# Kembali ke sesi
tmux attach -t discordbot

# Hentikan sesi
tmux kill-session -t discordbot
```

## Metode 2: Menggunakan `nohup`

```bash
# Jalankan di background
nohup python bot.py > bot.log 2>&1 &

# atau untuk Node.js
nohup node bot.js > bot.log 2>&1 &

# Cek apakah berjalan
ps aux | grep bot

# Lihat log
tail -f bot.log

# Hentikan
pkill -f bot.py   # atau: pkill -f bot.js
```

---

# ⚙️ KONFIGURASI TAMBAHAN

## 1. Cek File `.env`

**Cara Mendapatkan Groq API Key:**
1. Buka (https://console.groq.com)
2. Login/Daftar
3. Masuk ke **API Keys**
4. Klik **Create API Key**
5. Buat file dengan cara **nano .env**
6. lalu ganti API Key **gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"** dengan API Key mu
7. Copy dan paste ke file `.env`

```bash
cat .env
```

Pastikan ada API Key Groq:
```
gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 2. Cek File `accounts.json`

```bash
cat accounts.json
```

Pastikan format JSON valid (tidak ada error).

## 3. Validasi JSON

```bash
# Install jq
pkg install jq

# Validasi JSON
cat accounts.json | jq
```

Jika muncul error, format JSON salah.

---

# 🛠️ TROUBLESHOOTING

| Masalah | Solusi |
|---------|--------|
| `ModuleNotFoundError: No module named 'requests'` | `pip install requests` |
| `Error: Cannot find module 'axios'` | `npm install` |
| `.env not found` | Pastikan file `.env` ada di folder yang sama |
| `accounts.json not found` | Pastikan file `accounts.json` ada |
| `Invalid JSON` | Cek format JSON dengan `jq` |
| `401 Unauthorized` | Token Discord salah/expired |
| `429 Too Many Requests` | Cooldown terlalu cepat, tambah waktunya |
| Script berhenti saat terminal ditutup | Gunakan `tmux` atau `nohup` |
| Termux mati sendiri | Matikan optimasi baterai untuk Termux |

---

# 🔒 KEAMANAN

## 1. Jangan Upload File Sensitif

```bash
# Pastikan .gitignore sudah ada
cat .gitignore
```

Isi minimal:
```
.env
accounts.json
node_modules/
__pycache__/
*.log
```

## 2. Cek File yang Akan Diupload

```bash
# Lihat file yang akan di-commit
git status

# Pastikan .env dan accounts.json TIDAK muncul
```

## 3. Jika Terlanjur Upload

```bash
# Hapus dari git history
git rm --cached .env accounts.json
git commit -m "Remove sensitive files"
git push origin main

# GANTI semua token dan API key!
```

---

# 📊 MONITORING

## Cek Proses Berjalan

```bash
# Python
ps aux | grep python

# Node.js
ps aux | grep node
```

## Lihat Log (jika pakai nohup)

```bash
tail -f bot.log
```

## Cek Penggunaan Resource

```bash
top
```

---

# 🚀 QUICK START (Ringkasan)

## Python
```bash
pkg install python
pip install requests
python bot.py
```

## Node.js
```bash
pkg install nodejs
npm install
node bot.js
```

## Background (tmux)
```bash
pkg install tmux
tmux new -s bot
python bot.py
# Ctrl+B, lalu D
```

---

# 📝 CATATAN PENTING

1. ⚠️ **Self-bot melanggar ToS Discord** - Risiko banned permanen
2. 🔐 **Jangan share token** - Orang bisa ambil alih akun
3. 🔑 **Ganti API Key** jika pernah ter-upload ke GitHub
4. 📱 **Matikan optimasi baterai** untuk Termux agar tidak mati
5. 🔄 **Backup file** sebelum update script

---

# 🆘 BANTUAN

Jika ada error, sertakan:
1. Versi Python/Node.js (`python --version` / `node --version`)
2. Pesan error lengkap
3. Sistem operasi (Termux di Android versi berapa)

---

Semoga berhasil! 🎉

---
