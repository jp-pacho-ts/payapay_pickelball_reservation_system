# Payapay Pickleball Park

A React and TypeScript booking prototype for Payapay Pickleball Park in Purok Payapay, Brgy. 89, San Jose, Tacloban City. The supplied `payapay_pickleball_app.tsx` remains the application source. Vite runs the app, Tailwind CSS supplies its existing styling, and Lucide supplies its icons.

## Run locally

Requires Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Use `npm run build` to check TypeScript and produce `dist/`, and `npm run preview` to preview that build. `npm run typecheck` checks types alone.

## Requirements preserved from the supplied file

- Courts: Bebs, Monte, and Biyo, with their original descriptions.
- Daily operating window: 6:00 AM through 2:00 AM the next calendar day. Last start time is 1:00 AM.
- Day rate: PHP 350 per hour from 6:00 AM until 4:00 PM.
- Night rate: PHP 450 per hour from 4:00 PM until 2:00 AM. Bookings crossing the rate boundary are calculated hour by hour.
- Duration: one to six hours, capped at closing time.
- Player details: name, email, phone, and player count.
- Payment choices: GCash, Maya, QR Ph, and credit/debit card.
- Flow: selection and details, simulated payment, confirmation, printable receipt, and another booking.
- All six original park rules and the original green/lime responsive layout.

For after-midnight slots, the selected date is the operating day's date: selecting October 5 and 1:00 AM means October 6 at 1:00 AM.

## Prototype limitations found during inspection

Payments are simulated with a timer; no money is collected and no PayMongo integration exists. Confirmation numbers are generated in the browser. There is no database, court availability check, prevention of simultaneous bookings, login, notification service, or booking persistence. Refreshing the page clears the booking. The displayed phone number is a placeholder, and the Contact Us button has no action in the original file.

Before accepting real reservations, add server-side availability checks and booking storage, payment-provider checkout and verified webhooks, and real contact details. The current receipts represent demo payments only.

## Repository

Local Git repository, default branch `main`. Dependencies and build output are ignored; commit the lockfile for reproducible installs. No hosting, GitHub remote, or license has been assumed.
