# Entertainment Guild
Online store prototype for books, movies and games. React + Bootstrap front end using the INFT3050 API and StoreDB database.

## Setup
You need Docker Desktop, Node.js 18+ and the INFT3050 API folder from Canvas (inft3050_2026_v.1-1).
1. Open Docker Desktop. In the API folder run `docker compose up -d`
2. Check http://localhost:3001/api/inft3050/Genre shows Books, Movies and Games
3. In this folder run `cd frontend` then `npm install` (first time only)
4. Run `npm start`. The site opens at http://localhost:3000 (has to be port 3000 or the API blocks it)
5. To stop: Ctrl + C, then `docker compose down` in the API folder

## Logins
- Customer: jane.l.j.citizen@somemail.com / JCpw (Customer tab)
- Admin: adminAccount / adminPW (Staff tab)

## Test cards (no real payment)
Use any future expiry and any 3 digit CVV.
- 4242 4242 4242 4242 = approved
- 4000 0000 0000 0002 = declined
- 4000 0000 0000 0119 = times out

## Tests
`cd frontend` then `npm test -- --watchAll=false`. The tests use a fake API so Docker isn't needed and the database isn't changed.

## Where things are
- frontend/src/pages - one file per page
- frontend/src/components - navbar, footer, product card, address inputs
- frontend/src/data - all the API calls (auth, catalogue, cart, account, orders, admin)
- frontend/src/App.js - the routes
