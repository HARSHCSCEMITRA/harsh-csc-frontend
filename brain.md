# Zamify Project Brain Database

## Active Context & State
- **Current Version:** v1.1.19 (Fully compiled, built and verified)
- **QR & Multi-Nakal Batch Scanner Added**:
  - Built **MobileQrScanner.tsx** in `harsh-csc-frontend` for batch scanning eSign Jamabandi QR codes & PDFs.
  - Automatically deduplicates and calculates all **Unique Khatedars** (अद्वितीय खातेदार) across multiple scanned Nakals.
  - Computes consolidated land area per owner (in Hectares & Bigha) and **Krishi Shreni** land classification.
  - Includes a **1-Tap WhatsApp Batch Share** button to send full consolidated land report to clients.
- **Zamify Mobile Web Portal Implemented**:
  - Built dedicated **Zamify Mobile Web App Portal** (`/portal` & `/mobile`) inside `harsh-csc-frontend` for licensed users.
  - Added **License Key Verification** (`ZamifyWebPortal.tsx`) to restrict access to active license holders.
  - Integrated **BHUNAKSHA PRO 1-Tap Naksha Link Generator** with instant WhatsApp sharing (`MobileNakshaLink.tsx`).
  - Integrated **PRO REPORT Land Share & Bigha/Biswa Converter** (`MobileHissaCalc.tsx`).
  - Integrated **e-Mitra Client Receipt & Invoice Generator** with WhatsApp delivery (`MobileReceiptGen.tsx`).
- **Comprehensive Build Backup System (Refined)**:
  - **Change**: Updated the backup zip archive creation in `build_manager.py`. It now excludes temporary PyInstaller compilation files (`build/`), Python bytecode caches (`__pycache__/`), PyArmor temporary files (`.pyarmor/`), and version control metadata (`.git/`).
  - **Space Saving Logic**: Inside the `dist/` folder, the build manager now ONLY includes the `dist/Zamify/` folder (which contains the compiled `Zamify.exe` and `_internal/` files that Inno Setup compiles). It skips all other compiled executables (like `dist/ZamifyBuildManager/`), resulting in a 100% complete yet clean snapshot of the build (roughly ~180-200 MB compressed instead of 5+ GB).
