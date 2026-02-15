# Coco — Copains du coin 🥥

Coco is a free, open-source PWA that helps parents organize outings for their kids with neighbors, school friends, and local communities. No more endless WhatsApp threads — propose an outing, gather your crew, and enjoy.

## Features

- **Groups** — Create or join a group for your neighborhood, school, or friend circle. Share an invite code or QR code.
- **Events** — Create outings with date, location, category, photos, and more. Supports recurring events.
- **RSVP** — Sign up as "coming", "maybe", or "can't make it". Waitlist support when events are full.
- **Checklist** — Coordinate who brings what (snacks, drinks, balls...).
- **Comments** — Discussion thread on each event.
- **Push notifications** — Get notified about new events, RSVPs, comments, reminders, and event updates.
- **Calendar integration** — Add events to Google Calendar or download .ics files.
- **Map view** — See events on an interactive map (Leaflet / OpenStreetMap).
- **Dark mode** — Light, dark, or system-based theme.
- **i18n** — French and English.
- **Offline support** — PWA with service worker and offline indicator.
- **Data export** — Download your data as JSON from settings.
- **Privacy-first** — No ads, no tracking, GDPR-compliant, hosted in France (OVH).

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Database | SQLite via [Prisma](https://www.prisma.io/) |
| Maps | [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/) |
| Push | [web-push](https://github.com/web-push-libs/web-push) (VAPID) |
| QR codes | [qrcode.react](https://github.com/zpao/qrcode.react) |

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/your-org/coco.git
cd coco
npm install
```

### Environment variables

Create a `.env` file at the project root:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
```

Generate VAPID keys with:

```bash
npx web-push generate-vapid-keys
```

### Database setup

```bash
npx prisma migrate dev
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

## Project structure

```
app/              → Next.js App Router pages
  about/          → About page
  api/            → API routes (reminders)
  create/         → Event creation form
  events/         → Events list & detail pages
  groups/         → Groups management & join flow
  settings/       → User settings
components/       → Reusable UI components (Navbar, OfflineIndicator, etc.)
lib/              → Shared logic (actions, i18n, push, theme, toast, Prisma client)
prisma/           → Schema & migrations
public/           → Static assets (logo, icons, service worker, manifest)
```

## License

[Apache License 2.0](LICENSE)
