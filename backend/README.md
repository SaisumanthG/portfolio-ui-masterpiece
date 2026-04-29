# Portfolio MongoDB Backend

External Express + MongoDB + Socket.IO API for this portfolio.

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm start
```

Set `MONGODB_URI` to your MongoDB connection string and `CLIENT_ORIGIN` to your frontend URL.
The frontend reads `VITE_API_URL`; set it to this backend URL when deploying.

## Data migration

The backend seeds MongoDB with the existing portfolio data from `src/seedData.js` on first run. Existing image assets are referenced from `/seed-assets/...`, which were copied into the frontend public folder so no data is lost.

## Realtime

Every create/update/delete emits `portfolio:update` over Socket.IO. Connected frontend clients refetch only the changed table.
