# Asisten Belajar AI

Aplikasi pembelajaran cerdas berbasis AI menggunakan React Native dan Gemini 2.5 Flash.

**Tugas Kelompok UTS - Pemrograman Bergerak**

## Anggota Kelompok

| Nama | NIM |
|------|-----|
| Akmal Fauzi | 230401010160 |
| Firdi | 230401010153 |
| Ridwan Mubarok | 230401010053 |

## Fitur

- ✅ **Chat dengan AI** - Gemini 2.5 Flash model terbaru
- ✅ **Ambil Foto** - Analisis gambar dengan kamera
- ✅ **Upload Gambar** - Pilih gambar dari galeri
- ✅ **Upload Dokumen** - AI bisa membaca PDF/DOC/DOCX
- ✅ **Markdown Rendering** - Response AI dengan format yang bagus
- ✅ **Typing Animation** - Animasi dots saat AI berpikir
- ✅ **Modern UI** - Gradient, animasi, dan design yang clean
- ✅ **Bahasa Indonesia** - Semua dalam Bahasa Indonesia
- ✅ **Persistent Chat** - Riwayat chat tersimpan otomatis
- ✅ **Custom AI Prompt** - 5 preset gaya AI + custom prompt
- ✅ **Dropdown Menu** - Menu settings yang elegan

## Login Credentials

Aplikasi menggunakan autentikasi statis untuk login:

- **Username**: `pbrkel`
- **Password**: `12345678`

# Cara Menjalankan Aplikasi

## Prasyarat

Pastikan sudah terinstall:
- **Node.js** (versi 18 atau lebih baru)
- **React Native CLI** - `npm install -g react-native-cli`
- **Android Studio** (untuk Android) dengan SDK dan Emulator
- **Xcode** (untuk iOS/macOS only)
- **Java Development Kit (JDK)** versi 17

Untuk panduan lengkap setup environment, lihat [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment).

## Langkah-Langkah Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd pbr
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

**PENTING**: Setup API key sebelum menjalankan aplikasi!

1. Copy file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

2. Dapatkan Gemini API Key:
   - Kunjungi [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Login dengan Google Account
   - Klik "Create API Key"
   - Copy API key yang dihasilkan

3. Edit file `.env` dan isi dengan API key Anda:
```env
GEMINI_API_KEY=your_api_key_here
```

**Catatan Keamanan**:
- File `.env` sudah ada di `.gitignore` - jangan commit!
- Gunakan `.env.example` sebagai template
- Jangan hardcode API key di source code

### 4. Jalankan Metro Bundler

Di terminal pertama, jalankan Metro bundler:

```bash
npm start
```

Atau dengan cache reset (jika ada masalah):

```bash
npx react-native start --reset-cache
```

### 5. Jalankan Aplikasi

Buka terminal baru (Metro tetap running di terminal pertama):

#### Untuk Android:

```bash
npm run android
```

**Catatan Android**:
- Pastikan Android Emulator sudah running atau device terkoneksi
- Pastikan USB Debugging enabled di device
- Jika error, coba clean build:
  ```bash
  cd android && ./gradlew clean && cd ..
  npm run android
  ```

#### Untuk iOS (macOS only):

1. Install CocoaPods dependencies:
```bash
cd ios
pod install
cd ..
```

2. Jalankan aplikasi:
```bash
npm run ios
```

**Catatan iOS**:
- Hanya bisa di macOS dengan Xcode terinstall
- Simulasi bisa memakan waktu beberapa menit untuk build pertama

## Build APK untuk Testing (Android)

Untuk generate APK yang bisa di-install di device:

```bash
cd android
./gradlew assembleRelease
```

APK akan tersimpan di: `android/app/build/outputs/apk/release/app-release.apk`

## Teknologi yang Digunakan

### Core Technologies
- **React Native 0.76.6** - Framework mobile app
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Navigation management

### AI & Backend
- **Google Gemini 2.5 Flash** - AI model untuk chat
- **@google/generative-ai** - Gemini API client

### UI Libraries
- **react-native-linear-gradient** - Gradient backgrounds
- **@react-native-vector-icons/ionicons** - Icon library
- **react-native-markdown-display** - Markdown rendering

### Media & File Handling
- **react-native-image-picker** - Camera dan gallery access
- **@react-native-documents/picker** - Document picker
- **react-native-blob-util** - File operations

### State & Storage
- **React Hooks** - State management
- **@react-native-async-storage/async-storage** - Persistent storage
- **Animated API** - Native animations

### Development Tools
- **react-native-dotenv** - Environment variables
- **Metro Bundler** - JavaScript bundler
- **Babel** - JavaScript compiler

# Troubleshooting

## Cannot find module '@env'

Jika muncul error ini, hapus cache dan rebuild:
```bash
rm -rf node_modules/.cache
npx react-native start --reset-cache
```

Untuk Android, clean build:
```bash
cd android && ./gradlew clean && cd ..
npm run android
```

## Permission Error untuk Dokumen (Android)

Aplikasi akan meminta permission saat pertama kali mengakses dokumen. Pastikan izin diberikan di Settings > Apps > Asisten Belajar AI > Permissions.

## API Quota Exceeded

Jika mendapat error "Quota Exceeded":
- Tunggu 24 jam untuk quota reset
- Atau buat API key baru di [Google AI Studio](https://makersuite.google.com/app/apikey)
- Lihat usage di [Google AI Usage](https://ai.dev/usage?tab=rate-limit)

## Masalah Umum Lainnya

If you're having other issues, see the [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Fitur Unggulan

## Persistent Chat History

Aplikasi secara otomatis menyimpan semua riwayat percakapan menggunakan **AsyncStorage**:

- ✅ Chat history tersimpan otomatis setiap kali ada pesan baru
- ✅ Riwayat tetap ada walaupun aplikasi ditutup dan dibuka lagi
- ✅ Data tersimpan secara lokal di device (offline-first)
- ✅ Hanya akan terhapus jika user memilih "Bersihkan Semua Chat"

## Custom AI Prompt

Sesuaikan gaya komunikasi AI sesuai kebutuhan:

**5 Preset Gaya AI:**
1. **Asisten Belajar (Default)** - Ramah dan mudah dipahami
2. **Guru Profesional** - Mendalam dengan metode pengajaran efektif
3. **Penjelasan Sederhana** - Seperti menjelaskan ke anak kecil
4. **Akademis Formal** - Gaya formal dengan terminologi ilmiah
5. **Kreatif & Interaktif** - Menggunakan cerita dan pendekatan kreatif

**Custom Prompt:**
- Tulis instruksi sendiri untuk AI
- Kontrol penuh atas gaya komunikasi AI
- Tersimpan dan bisa digunakan kapan saja

# Model AI

Aplikasi menggunakan **Gemini 2.5 Flash** yang mendukung:
- Multimodal (text + image + PDF)
- Response cepat dan akurat
- Context window besar untuk dokumen panjang

**Free Tier Limits:**
- 15 RPM (requests per minute)
- 1500 RPD (requests per day)

Untuk quota lebih besar, upgrade ke paid plan mulai dari $0.50 per 1M tokens.

# Struktur Project

```
pbr/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx          # Halaman login
│   │   └── AIChatScreen.tsx         # Halaman chat dengan AI
│   ├── components/
│   │   ├── PromptCustomizationModal.tsx # Modal untuk customize AI prompt
│   │   ├── ConfirmationModal.tsx    # Modal konfirmasi reusable
│   │   └── index.ts                 # Barrel exports
│   ├── hooks/
│   │   ├── useLoginForm.ts          # Hook untuk login form logic
│   │   ├── useLoginAnimation.ts     # Hook untuk login animations
│   │   ├── useChatMessages.ts       # Hook untuk chat messages & AI
│   │   ├── useAttachments.ts        # Hook untuk attachments handling
│   │   ├── useTypingAnimation.ts    # Hook untuk typing animations
│   │   ├── useDropdownMenu.ts       # Hook untuk dropdown menu state
│   │   ├── useSystemPrompt.ts       # Hook untuk AI prompt customization
│   │   ├── usePersistedMessages.ts  # Hook untuk persistent chat storage
│   │   └── index.ts                 # Barrel exports
│   └── types/
│       └── env.d.ts                 # TypeScript definitions
├── android/                          # Android native code
├── ios/                              # iOS native code
├── .env                              # Environment variables (API key)
├── .env.example                      # Template untuk .env
├── babel.config.js                   # Babel configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

# License

MIT
