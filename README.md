# Flex Living – Reviews Dashboard

This project is a small full-stack Next.js app for managing and displaying guest reviews.

## Features
- **API Route** `/api/reviews/hostaway`  
  - Normalizes review data (rating, categories, dates).  
  - Supports filters: listingId, channel, type, minRating, category rating, date ranges, sort.  

- **Dashboard** `/dashboard`  
  - View all reviews.  
  - Approve/deny reviews (stored in browser localStorage).  
  - Filters: date range, text search, “show only approved”.  
  - CSV export of filtered reviews.  
  - KPI tiles showing total filtered reviews and number approved.  
  - Star ratings and channel badges for better readability.  

- **Dynamic Property Page** `/property/[listingId]`  
  - Works for **any listingId**, not just a hardcoded example.  
  - For instance: `/property/101`, `/property/202`, `/property/303` all display reviews for those listings if approved in the dashboard.  
  - Shows only reviews that were approved in the dashboard.  
  - Displays average rating and count of approved reviews.  
  - Includes guest name, date, categories, and channel badges.  

- **Home Page** `/`  
  - Links to Dashboard and sample properties.  

- **404 Page**  
  - Custom not found page with a link back home.  

## Tech Stack
- Next.js 14 (React + API Routes)  
- Node.js (tested on v20)  
- Deployed on Vercel  

## My Key Decisions
- Used **mock JSON data** instead of the live Hostaway API for stability in demo.  
- Stored approvals in **localStorage** for simplicity. In production, this would be persisted to a database.  
- Added **CSV export** so managers can share review data.  
- Improved UI with stars, badges, KPIs, and filters to make the dashboard user-friendly.  
- Made the property page fully **dynamic** with Next.js routes so it works for any listingId, not only ID 101.  

## Hostaway API (Provided Credentials)
The assessment included an Account ID and API Key.  
For demo purposes, `/api/reviews/hostaway` reads from `mock/reviews.json`.  

In production, the API route can call the Hostaway API, e.g.:

```js
const resp = await fetch(`https://api.hostaway.com/v1/reviews?accountId=61148`, {
  headers: { Authorization: 'Bearer <API_KEY>' }
});
const data = await resp.json();
