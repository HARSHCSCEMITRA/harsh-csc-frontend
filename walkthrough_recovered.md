# Walkthrough: Zamify v1.0.0 Rebranding, Licensing Audit & Serverless API Consolidation

We have successfully rebranded the software to **Zamify v1.0.0**, corrected the trial/licensing countdown issues, closed offline security vulnerabilities, adjusted the UI logo proportions to avoid distortion, compiled a brand new clean executable installer, and **fully optimized the backend Serverless APIs to fit within the Vercel Hobby plan limit**.

---

## 🚀 Changes Implemented

### 1. Rebranding & UI Polish
* **Window Title & Header:** Changed the application window title and main UI header label in [automation_app.py](file:///C:/Users/goura/Documents/SOFTWARE%20HARSH%20CSC%20EMITRA/_clean_build/automation_app.py) from `eSign Nakal Tool v8.2.0` to `Zamify v1.0.0`.
* **Proportional Logo Scaling:** Replaced the hardcoded square `(50, 50)` logo resize logic in [automation_app.py](file:///C:/Users/goura/Documents/SOFTWARE%20HARSH%20CSC%20EMITRA/_clean_build/automation_app.py). The new code queries the original image dimensions dynamically, locks the height to 50 pixels, and calculates the width proportionally (scaling `logo.png`'s 3:2 aspect ratio to `75x50` pixels) to ensure no stretching or squishing.
* **Config Updates:** Updated `CURRENT_VERSION` to `"1.0.0"` and `APP_NAME` to `"Zamify"` in [config.py](file:///C:/Users/goura/Documents/SOFTWARE%20HARSH%20CSC%20EMITRA/_clean_build/config.py).

### 2. Licensing Audit & Hardening
* **Server-Authoritative Countdown:** Removed the client-side trial days recalculation logic in [main.py](file:///C:/Users/goura/Documents/SOFTWARE%20HARSH%20CSC%20EMITRA/_clean_build/main.py) which was causing the stuck countdown (e.g. frozen at "6 days remaining"). It now directly maps `days_left` from the Vercel API response.
* **Offline Trial Block:** Closed the network error bypass in [main.py](file:///C:/Users/goura/Documents/SOFTWARE%20HARSH%20CSC%20EMITRA/_clean_build/main.py) for trial users. If there is a network error and no license key is stored, the app displays a blocked screen: *"Trial verification requires an active internet connection."* and terminates.
* **Offline Paid License Checks:** If a paid subscriber runs offline, [main.py](file:///C:/Users/goura/Documents/SOFTWARE%20HARSH%20CSC%20EMITRA/_clean_build/main.py) decrypts the local config to read the expiration date. It also performs a **system clock rollback check**:
  * During every successful online run, the client records the trusted server time as `last_run_time`.
  * If the client system clock is ever wound back behind `last_run_time` during offline usage, the app detects the manipulation, blocks access, and asks the user to connect to the internet.
  * If the check succeeds, it updates the stored `last_run_time` with the current clock.
* **Stable Hardware Fingerprint:** Updated [machine_id.py](file:///C:/Users/goura/Documents/SOFTWARE%20HARSH%20CSC%20EMITRA/_clean_build/security/machine_id.py) to use the Windows BIOS UUID (`wmic csproduct get uuid`) instead of the network MAC address, ensuring stability across network interface changes (such as VPN toggles or Wi-Fi to Ethernet shifts).

### 3. Vercel Backend Optimization & Fixes
* **Serverless Functions Optimization:** Vercel Hobby plan has a strict limit of **12 Serverless Functions**. The project previously had 14 endpoints, causing Vercel builds to fail. We optimized this by merging related API functions:
  * Consolidated all 7 admin files under `api/admin/` into a single dynamic router file [api/admin.js](file:///c:/Users/goura/Documents/HARSHCSCEMITRA/harsh-csc-frontend/api/admin.js).
  * Consolidated all 2 admin auth files under `api/auth/admin/` into [api/auth-admin.js](file:///c:/Users/goura/Documents/HARSHCSCEMITRA/harsh-csc-frontend/api/auth-admin.js).
  * This successfully reduced our total serverless count to **7**, allowing production builds to deploy without errors.
* **Vercel Dynamic Routing:** Updated [vercel.json](file:///c:/Users/goura/Documents/HARSHCSCEMITRA/harsh-csc-frontend/vercel.json) to rewrite `/api/admin/:endpoint` and `/api/auth/admin/:endpoint` to the new consolidated router endpoints, forwarding the request as a query parameter (`?endpoint=:endpoint`) to guarantee seamless execution on Vercel without requiring any client-side changes.
* **Admin Token Verification Fix:** Resolved a critical authentication bug in [api/auth-admin.js](file:///c:/Users/goura/Documents/HARSHCSCEMITRA/harsh-csc-frontend/api/auth-admin.js) where login tokens were generated from the plaintext password while `verifyAuth` checked them against the SHA-256 password hash. The token generation has been patched to hash the password with SHA-256 before generating the HMAC token, restoring full access to the admin dashboard.
* **Immediate Razorpay Key Retrieval:** Modified the `retrieve-key` action in the API handler at [software.js](file:///c:/Users/goura/Documents/HARSHCSCEMITRA/harsh-csc-frontend/api/software.js) to verify payment success using both `order.status` and `order.payment_status` (`'Payment Received'`). This allows instant license key retrieval after checkout even if the overall order status is marked as `'Processing'`.
* **Broken Setup Download Redirection:** Configured a redirection rule in [vercel.json](file:///c:/Users/goura/Documents/HARSHCSCEMITRA/harsh-csc-frontend/vercel.json) mapping `/software/Harsh_CSC_Automation_Setup.zip` directly to the public Supabase Storage URL:
  `https://qhqvmzrdncxddzlfrgrn.supabase.co/storage/v1/object/public/software/Harsh_CSC_Automation_Setup.zip`. This ensures users downloading the trial from the website are successfully redirected instead of seeing a broken page rewrite.

### 4. Hindi Text Encoding Fix
* **Double-Encoding Resolution:** Fixed an issue where the previous build iteration double-encoded `automation_app.py`'s UTF-8 character bytes into CP1252 sequences, resulting in corrupted text on several GUI tab headers, search results labels, and option boxes.
* **Restore & Safe Patching:** Restored the source code from the clean UTF-8 backup file `_quick_extract/esign_nakal_tool_v8.1.py` and programmatically patched the rebranded title and proportional logo scaling elements in strict UTF-8 mode, fully preserving all 1,914 original Hindi bytes.

### 5. Build Configuration & Compilation
* Updated [build.ps1](file:///C:/Users/goura/Documents/SOFTWARE%20HARSH%20CSC%20EMITRA/_clean_build/build.ps1) to compile using `Zamify.spec`, target `dist\Zamify\_internal` for merging uncompressed dependencies, and compile the final package using `final_zamify_build.iss`.
* Updated Inno Setup's [final_zamify_build.iss](file:///C:/Users/goura/Documents/SOFTWARE%20HARSH%20CSC%20EMITRA/_clean_build/final_zamify_build.iss) configuration to set the output installer name to `Zamify_Setup_v1.0.0`.
* Compiled the executable utilizing PyInstaller and Inno Setup.
* The successfully compiled setup installer `Zamify_Setup_v1.0.0.exe` has been placed directly on your **Desktop**.

---

## 🛠️ Verification Done

1. **Successful Vercel Deployment:** Executed `vercel --prod` and confirmed that Vercel built and deployed the project successfully, aliasing the deployment to `https://harshcscemitra.vercel.app`.
2. **Programmatic Endpoint API Verification:** Ran an API query script targeting the live website endpoints:
   * **Login Verification:** `/api/auth/admin/login` correctly authenticated using `HarshCSC@2026` and generated a valid session token.
   * **Admin Queries:** `/api/admin/trials` authenticated with the token and successfully returned trial data with code `200`.
3. **Trials Sync Confirmed:** Checked the trials database list. The user's active PC trial (`0ab0af4e044be145b1f1b0c6a23205efca245378de0d6159be4b30ab5bb031c7`) was successfully fetched from the database, meaning sync is fully online and visible on the admin dashboard now.
4. **Desktop Copying:** The compiled installer has been copied to [Zamify_Setup_v1.0.0.exe](file:///C:/Users/goura/Desktop/Zamify_Setup_v1.0.0.exe).
