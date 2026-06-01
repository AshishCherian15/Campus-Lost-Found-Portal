# Campus Lost & Found Portal

Campus Lost & Found Portal is a React and Node.js app for reporting lost and found items, browsing listings, submitting claim requests, and moderating posts from an admin view.

## Tech Stack

- Front end: React, Vite, React Router, Tailwind CSS v4
- Back end: Node.js, Express
- Storage: In-memory seed data in the development server

## Run Locally

1. Install dependencies.

   ```bash
   npm install
   ```

2. Start the development server.

   ```bash
   npm run dev
   ```

3. Open the app at `http://localhost:3000`.

For a production-style run:

```bash
npm run build
npm start
```

## Demo Accounts

- Admin: `admin@campus.edu` / password ignored for the demo login
- Student: `alice@campus.edu`
- Student: `bob@campus.edu`
- Student: `charlie@campus.edu`

## Notes

- Item and claim data reset when the server restarts.
- Uploaded images are stored under `public/uploads`.
- The server serves the Vite app and the API from the same process.
