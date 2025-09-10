import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const LS_KEY = 'flexliving_approved_v2'; // same key used on the dashboard

export default function PropertyPage() {
  const router = useRouter();
  const { listingId } = router.query;

  const [data, setData] = useState(null);
  const [approved, setApproved] = useState({});

  // load approvals from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setApproved(JSON.parse(raw));
    } catch {}
  }, []);

  // fetch reviews for this listing
  useEffect(() => {
    if (!listingId) return;
    (async () => {
      const res = await fetch(`/api/reviews/hostaway?listingId=${listingId}`);
      const json = await res.json();
      setData(json);
    })();
  }, [listingId]);

  // only approved
  const approvedReviews = useMemo(() => {
    if (!data?.reviews) return [];
    return data.reviews.filter(r => approved[r.id]);
  }, [data, approved]);

  // listing name from first record
  const listingName = useMemo(() => {
    if (!data?.reviews?.length) return `Property ${listingId}`;
    return data.reviews[0].listingName || `Property ${listingId}`;
  }, [data, listingId]);

  // average overall rating from approved
  const avg = useMemo(() => {
    const nums = approvedReviews.map(r => r.ratingOverall).filter(v => typeof v === 'number');
    if (!nums.length) return null;
    return (nums.reduce((a,b)=>a+b,0) / nums.length).toFixed(2);
  }, [approvedReviews]);

  // star renderer for overall rating (0–10 scaled to 5 stars)
  function Stars({ value }) {
    if (typeof value !== 'number') return <>—</>;
    const filled = Math.round(value / 2); // 10 -> 5 stars
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="star">{i < filled ? '★' : '☆'}</span>
        ))}
      </>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 style={{margin:0}}>{listingName}</h1>
          <div className="small">
            Approved reviews: <strong>{approvedReviews.length}</strong>
            {avg ? <> • Avg rating: <strong>{avg}</strong> (<Stars value={Number(avg)} />)</> : null}
          </div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <Link className="btn" href="/">Home</Link>
          <Link className="btn" href="/dashboard">Dashboard</Link>
        </div>
      </div>

      <div className="card">
        <h3 style={{marginTop:0}}>Guest Reviews</h3>

        {approvedReviews.length === 0 ? (
          <div className="alert">
            No approved reviews yet. Approve some in the <Link href="/dashboard">Dashboard</Link>.
          </div>
        ) : (
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
            {approvedReviews.map(r => (
              <div key={r.id} className="card" style={{borderColor:'#f0f0f0'}}>
                <div className="small" style={{marginBottom:8}}>
                  {r.date?.slice(0,10)} •{' '}
                  <span className={`badge ${r.channel === 'google' ? 'google' : 'hostaway'}`}>{r.channel}</span>{' '}
                  • {r.type}
                </div>

                {/* review text */}
                <div style={{fontSize:16, lineHeight:1.5, marginBottom:8}}>
                  {r.publicReview}
                </div>

                {/* who */}
                <div className="small">By {r.guestName || 'Guest'}</div>

                {/* overall as stars */}
                <div className="small" style={{marginTop:8}}>
                  Overall: <strong>{typeof r.ratingOverall === 'number' ? r.ratingOverall : '—'}</strong>{' '}
                  <Stars value={r.ratingOverall} />
                </div>

                {/* categories */}
                {!!r.categories && Object.keys(r.categories).length > 0 && (
                  <div className="small" style={{marginTop:8}}>
                    {Object.entries(r.categories).map(([k,v]) => (
                      <span key={k} className="tag" style={{marginRight:6}}>
                        {k}: {typeof v === 'number' ? v : '—'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="footer">
        This page mimics a property details layout and only shows reviews you approved in the dashboard.
      </div>
    </div>
  );
}
