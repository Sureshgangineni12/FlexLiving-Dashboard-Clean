// /api/reviews/hostaway
// NOTE (assessment):
// The PDF provided Hostaway API credentials (Account ID 61148, API Key ending ...9152).
// For this demo, we read from /mock/reviews.json for stability and deterministic tests.
// In production, replace the file read with a live Hostaway API call, e.g.:
//
//   const resp = await fetch(`https://api.hostaway.com/v1/reviews?accountId=61148`, {
//     headers: { Authorization: 'Bearer <API_KEY>' }
//   });
//   const data = await resp.json();
//
// Then run the same normalization + filtering on that response.

import fs from 'fs';
import path from 'path';

function normalize(item) {
  const categories = {};
  (item.reviewCategory || []).forEach(rc => {
    if (rc && rc.category) categories[rc.category] = rc.rating ?? null;
  });

  return {
    id: item.id,
    listingId: item.listingId ?? null,
    listingName: item.listingName ?? 'Unknown Listing',
    type: item.type || null,
    channel: item.channel || 'hostaway',
    status: item.status || null,
    ratingOverall: item.rating ?? null,
    categories,
    publicReview: item.publicReview || '',
    date: item.submittedAt ? new Date(item.submittedAt).toISOString() : null,
    guestName: item.guestName || null
  };
}

function applyFilters(items, query) {
  let filtered = items;

  if (query.listingId) {
    const id = Number(query.listingId);
    filtered = filtered.filter(r => r.listingId === id);
  }
  if (query.channel) {
    const ch = String(query.channel).toLowerCase();
    filtered = filtered.filter(r => (r.channel || '').toLowerCase() === ch);
  }
  if (query.type) {
    const t = String(query.type).toLowerCase();
    filtered = filtered.filter(r => (r.type || '').toLowerCase() === t);
  }
  if (query.minRating) {
    const min = Number(query.minRating);
    filtered = filtered.filter(r => (r.ratingOverall ?? 0) >= min);
  }
  if (query.category) {
    const cat = String(query.category);
    const minCR = query.minCategoryRating ? Number(query.minCategoryRating) : 0;
    filtered = filtered.filter(r => {
      const v = r.categories?.[cat];
      return typeof v === 'number' ? v >= minCR : false;
    });
  }
  if (query.startDate || query.endDate) {
    const start = query.startDate ? new Date(query.startDate) : new Date('1900-01-01');
    const end = query.endDate ? new Date(query.endDate) : new Date('2999-12-31');
    filtered = filtered.filter(r => {
      const d = r.date ? new Date(r.date) : null;
      return d && d >= start && d <= end;
    });
  }
  if (query.sortBy) {
    const by = String(query.sortBy);
    const dir = (String(query.sortDir || 'desc').toLowerCase() === 'asc') ? 1 : -1;
    filtered = filtered.slice().sort((a,b) => {
      const av = a[by] ?? 0, bv = b[by] ?? 0;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }

  return filtered;
}

export default function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'mock', 'reviews.json');
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    const list = (data?.result || []).map(normalize);
    const filtered = applyFilters(list, req.query || {});

    const byListing = {};
    filtered.forEach(r => {
      if (!r.listingId) return;
      if (!byListing[r.listingId]) {
        byListing[r.listingId] = {
          listingId: r.listingId,
          listingName: r.listingName,
          count: 0,
          avgRating: null
        };
      }
      const group = byListing[r.listingId];
      group.count += 1;
      if (typeof r.ratingOverall === 'number') {
        group.avgRating = group.avgRating == null ? r.ratingOverall
          : (group.avgRating * (group.count-1) + r.ratingOverall) / group.count;
      }
    });

    res.status(200).json({
      status: 'success',
      total: filtered.length,
      reviews: filtered,
      summaryByListing: Object.values(byListing)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Failed to load reviews' });
  }
}
