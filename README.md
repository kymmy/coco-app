# Le Village — Entourage (Tribu)

**Ton entourage local** — Organize outings with neighbours and local friends. No more 42 WhatsApp messages.

**Live:** https://tribu.le-village-marseille.fr

**Portal:** https://le-village-marseille.fr

---

## Features

- **Groups** — Create or join a group for your neighbourhood, school, or friend circle. Share an invite code or QR code.
- **Events** — Create outings with date, location, category, photos, and more. Supports recurring events.
- **RSVP** — Sign up as "coming", "maybe", or "can't make it". Indicate how many people you're bringing (e.g. you + 2 kids). Waitlist support when events are full.
- **Checklist** — Coordinate who brings what (snacks, drinks, balls...).
- **Comments** — Discussion thread on each event with @mentions.
- **Push notifications** — New events, RSVPs, comments, reminders, and event updates.
- **Calendar integration** — Add events to Google Calendar or download .ics files.
- **Map view** — See events on an interactive map (Leaflet / OpenStreetMap).
- **i18n** — French and English.
- **Offline support** — PWA with service worker and offline indicator.
- **Data export** — Download your data as JSON from settings.
- **Privacy-first** — No ads, no tracking, GDPR-compliant.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL via Prisma (Neon) |
| Maps | Leaflet + OpenStreetMap |
| Push | web-push (VAPID) |
| QR codes | qrcode.react |
| Hosting | Vercel |

## Getting Started

```bash
npm install
cp .env.example .env    # fill in your database URL and VAPID keys
npx prisma migrate dev
npm run dev              # http://localhost:3000
```

### Environment Variables

```env
DATABASE_URL="postgresql://..."     # Pooled connection (runtime)
DIRECT_URL="postgresql://..."       # Direct connection (migrations)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""      # Generate with: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY=""
```

## Part of Le Village

| Project | URL | Repo |
|---------|-----|------|
| Portal | [le-village-marseille.fr](https://le-village-marseille.fr) | [kymmy/le-village-portal](https://github.com/kymmy/le-village-portal) |
| Entourage (this) | [tribu.le-village-marseille.fr](https://tribu.le-village-marseille.fr) | This repo |
| Little Movers | [little-movers.le-village-marseille.fr](https://little-movers.le-village-marseille.fr) | [kymmy/little-movers](https://github.com/kymmy/little-movers) |
| Amour Toujours | [amour-toujours.le-village-marseille.fr](https://amour-toujours.le-village-marseille.fr) | [kymmy/amour-toujours](https://github.com/kymmy/amour-toujours) |

## License

[Apache License 2.0](LICENSE)
