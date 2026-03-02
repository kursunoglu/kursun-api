# kursun-api

Standalone backend service for Kursun Technologies contact form.

## Scripts

- `npm run dev` - watch mode (tsx)
- `npm run build` - TypeScript build
- `npm run start` - run compiled server

## Required Environment Variables

- `RESEND_API_KEY`
- `CONTACT_EMAIL_TO`
- `CONTACT_EMAIL_FROM`

## Health Endpoint

- `GET /api/health` -> `{ "status": "ok" }`
