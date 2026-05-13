# @glosspilot/web

React 18 + Vite + TypeScript + Tailwind frontend.

**Status:** stub. Real implementation lands in v0.2.0+.

Planned layout:

```
src/
├── main.tsx
├── App.tsx
├── api/             # TanStack Query hooks per resource
├── auth/            # login, session context
├── components/      # shared UI (Sidebar, Topbar, Modal, FAB)
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Calendar.tsx
│   ├── Reports.tsx
│   ├── Materials.tsx
│   ├── Tools.tsx
│   ├── Archive.tsx
│   ├── Users.tsx
│   ├── SiteDetail.tsx
│   └── WorkerProfile.tsx
├── copy/en.ts       # all UI strings (swap this file for i18n)
└── lib/             # date, format, fetch helpers
```
