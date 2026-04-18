# HARSH CSC EMITRA — Frontend

> Production-ready React + TypeScript frontend for a digital service store (CSC eMitra), built with Vite.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env: set VITE_API_URL to your backend

# 3. Run in development (with mock data)
VITE_USE_MOCK=true npm run dev

# 4. Build for production
npm run build

# 5. Preview production build
npm run preview
```

Open http://localhost:3000

---

## 📁 Project Structure

```
src/
├── types/
│   └── index.ts              ← All TypeScript interfaces
├── utils/
│   ├── api.ts                ← API calls (real + mock fallback)
│   ├── i18n.ts               ← Hindi/English translations
│   └── mockData.ts           ← 20 mock products for development
├── store/
│   ├── cartStore.ts          ← Zustand cart with localStorage
│   └── languageStore.ts      ← Zustand language toggle
├── components/
│   ├── Header.tsx            ← Sticky header with cart badge
│   ├── CartDrawer.tsx        ← Slide-in cart drawer
│   ├── ProductCard.tsx       ← Card with add/quantity stepper
│   ├── QuantityStepper.tsx   ← +/− quantity control
│   └── StatusTimeline.tsx    ← Order tracking visual timeline
├── pages/
│   ├── Home.tsx              ← Catalog: search, filter, grid
│   ├── ProductDetail.tsx     ← Service detail + documents
│   ├── Checkout.tsx          ← Order form + delivery toggle
│   ├── OTPVerification.tsx   ← 6-digit OTP input
│   └── OrderTracking.tsx     ← Live order status + confetti
├── App.tsx                   ← Router + lazy loading
├── main.tsx                  ← Entry point
└── index.css                 ← Global dark theme styles
```

---

## 🔌 API Endpoints

Your backend must implement these endpoints:

| Method | Endpoint              | Description               |
|--------|-----------------------|---------------------------|
| GET    | `/api/catalog`        | List all products         |
| GET    | `/api/catalog/:id`    | Single product + related  |
| POST   | `/api/order`          | Place an order            |
| POST   | `/api/order/verify`   | Verify OTP                |
| POST   | `/api/order/resend-otp` | Resend OTP              |
| GET    | `/api/track/:order_ref` | Order tracking status   |

Set `VITE_API_URL` to your backend base URL. Set `VITE_USE_MOCK=true` to skip real API calls and use built-in mock data.

---

## 🌐 Environment Variables

| Variable              | Default               | Description                         |
|-----------------------|-----------------------|-------------------------------------|
| `VITE_API_URL`        | `http://localhost:8000` | Backend API base URL              |
| `VITE_USE_MOCK`       | `true`                | Use mock data (set `false` for prod)|
| `VITE_STORE_PHONE`    | —                     | Store phone number                  |
| `VITE_STORE_WHATSAPP` | `919999999999`        | WhatsApp number (no + or spaces)    |
| `VITE_STORE_ADDRESS`  | —                     | Physical store address              |

---

## 🎨 Design System

- **Theme**: Dark glassmorphism  
- **Accent**: `#2563EB` (blue) · `#34D399` (green success)
- **Fonts**: Sora (headings) + DM Sans (body)
- **Responsive**: 2-col mobile → 3-col tablet → 4-col desktop
- **Animations**: CSS keyframes + staggered grid entrance

---

## 📦 Dependencies

| Package           | Purpose                          |
|-------------------|----------------------------------|
| `react` 18        | UI framework                     |
| `react-router-dom` v6 | Client-side routing (lazy) |
| `zustand` v4      | Cart + language state            |
| `canvas-confetti` | Confetti on order completion     |
| `vite` v5         | Build tool                       |
| `typescript` v5   | Type safety                      |

---

## 🇮🇳 Hindi/English Toggle

Switch languages at any time via the header toggle. Translations live in `src/utils/i18n.ts`. To add a new key:

```ts
// In i18n.ts
const en = { 'my.key': 'My English Text' };
const hi = { 'my.key': 'मेरा हिंदी टेक्स्ट' };

// In component
const t = createT(lang);
t('my.key') // returns correct language string
```

---

## 🛒 Cart Persistence

Cart uses Zustand `persist` middleware with `localStorage`. Data survives page refresh. Clear via the "Clear Cart" button in the drawer.

---

## 📞 Support

Contact HARSH CSC EMITRA for any service-related queries.
