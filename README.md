# Campus Lost & Found Portal

A full-stack campus lost and found portal where students can register, post lost or found items, search listings, request claims, and let item owners or admins moderate requests.

## Features

- Student registration and login with profile details
- Post lost or found items with descriptions, location, category, and image uploads
- Browse and search items by keyword, status, and category
- Claim request flow with approve/reject actions for owners
- Admin dashboard for users, posts, and claim moderation
- Responsive UI designed for desktop and mobile

## Tech Stack

- Front end: HTML, CSS, JavaScript
- Back end: Node.js, Express.js
- File uploads: Multer
- Data storage: Local JSON persistence with file-backed state

## Setup Instructions

1. Install Node.js 18 or newer.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the app:

   ```bash
   npm start
   ```

4. Open the site at `http://localhost:3000`.

## Demo Accounts

- Admin: `admin@campus.local` / `Admin@123`
- Student: `aarav@campus.local` / `Student@123`
- Student: `maya@campus.local` / `Student@123`

## Live Demo

Not deployed yet.

## Notes

- Uploaded images are stored locally in `public/uploads`.
- Application data is persisted in `server/data/state.json`.
