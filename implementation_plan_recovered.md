# Implementation Plan: Vercel Hobby Plan Serverless Function Optimization

This plan addresses the Vercel deployment build failure due to exceeding the Hobby plan limit of **12 Serverless Functions**. We currently have 14 serverless files. We will optimize this by consolidating related endpoints under single routers.

## User Review Required
> [!IMPORTANT]
> To comply with the Vercel Hobby plan's limit, we are merging all 7 files under `api/admin/` into a single file `api/admin.js` and all 2 files under `api/auth/admin/` into `api/auth-admin.js`. 
> We will configure Vercel routing using `vercel.json` to transparently route requests so that **no changes** are required on the React frontend or the Windows desktop client.

---

## Proposed Changes

### Component 1: Vercel Configuration

#### [MODIFY] [vercel.json](file:///c:/Users/goura/Documents/HARSHCSCEMITRA/harsh-csc-frontend/vercel.json)
* Update rewrites to route requests dynamically:
  * `/api/admin/:endpoint` rewrites to `/api/admin.js?endpoint=:endpoint`
  * `/api/auth/admin/:endpoint` rewrites to `/api/auth-admin.js?endpoint=:endpoint`
  * Keep public endpoints (`/api/auth.js`, `/api/software.js`, etc.) untouched.

---

### Component 2: Consolidated Backend APIs

#### [NEW] [admin.js](file:///c:/Users/goura/Documents/HARSHCSCEMITRA/harsh-csc-frontend/api/admin.js)
* Combines:
  * `api/admin/trials.js`
  * `api/admin/licenses.js`
  * `api/admin/orders.js`
  * `api/admin/reset-requests.js`
  * `api/admin/sign-upload.js`
  * `api/admin/summary.js`
  * `api/admin/update-order.js`
* Dispatches requests dynamically based on the parsed `endpoint` query parameter or pathname.

#### [NEW] [auth-admin.js](file:///c:/Users/goura/Documents/HARSHCSCEMITRA/harsh-csc-frontend/api/auth-admin.js)
* Combines:
  * `api/auth/admin/login.js`
  * `api/auth/admin/change-password.js`
* Dispatches dynamically to `login` or `change-password` handlers.

#### [DELETE] [api/admin directory](file:///c:/Users/goura/Documents/HARSHCSCEMITRA/harsh-csc-frontend/api/admin)
* Remove all 7 individual files inside `api/admin/` to free up serverless slots.

#### [DELETE] [api/auth/admin directory](file:///c:/Users/goura/Documents/HARSHCSCEMITRA/harsh-csc-frontend/api/auth/admin)
* Remove all 2 individual files inside `api/auth/admin/` to free up serverless slots.

---

## Verification Plan

### Automated Tests
* Run Vercel local build using:
  ```bash
  npx vercel build
  ```
  Ensure it compiles all functions successfully.

### Manual Verification
* Push the changes to GitHub and trigger a Vercel production deployment.
* Verify the deployment succeeds and the number of serverless functions drops to **7**.
* Open the live admin dashboard at `https://harshcscemitra.vercel.app/admin/dashboard` (or locally) and confirm that:
  * Login and Change Password functions work.
  * Active Trials, Licenses, Reset Requests, Orders, and AI Summary render correctly without breaking.
