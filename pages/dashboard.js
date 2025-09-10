import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const LS_KEY = 'flexliving_approved_v2'; // changed key name

function useApproved() {
  const [approved, setApproved] = useState({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setApproved(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(approved)); } catch {}
  }, [approved]);
  const toggle = (id, value) => setApproved(prev => ({ ...prev, [id]: value }));
  return { approved, toggle };
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { approved, toggle } = useApproved();

  // ✅ new states
  const [queryText, setQueryText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [onlyApproved, setOnlyApproved] = useState(false);

  async function fetchData() {
    setLoading(true); setError('');
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    try {
      const res = await fetch('/api/reviews/hostaway?' + params.toString());
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  // build rows with filters
  const rows = (data?.reviews || [])
    .filter(r => {
      const q = queryText.trim().toLowerCase();
      if (!q) return true;
      return (r.publicReview || '').toLowerCase().includes(q) ||
             (r.guestName || '').toLowerCase().includes(q);
    })
    .filter(r => !onlyApproved || approved[r.id]);

  function exportCSV(items) {
    const cols = ['id','listingId','listingName','channel','type','ratingOverall','date','guestName','publicReview'];
    const esc = s => `"${String(s ?? '').replace(/"/g,'""')}"`;
    const csvRows = [cols.join(',')].concat(
      items.map(r => cols.map(c => esc(r[c])).join(','))
    );
    const blob = new Blob([csvRows.join('\n')], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `reviews_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Reviews Control Center</h1>
        <Link className="btn" href="/">Home</Link>
      </div>

      {/* KPI cards */}
      {data && (
        <div className="grid grid-2" style={{marginBottom:16}}>
          <div className="card">
            <div className="small">Total Reviews (filtered)</div>
            <div style={{fontSize:28, fontWeight:700}}>{data.total}</div>
          </div>
          <div className="card">
            <div className="small">Approved (this browser)</div>
            <div style={{fontSize:28, fontWeight:700}}>
              {Object.values(approved).filter(Boolean).length}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{marginBottom:16}}>
        <div className="grid grid-2">
          <div>
            <div className="small">Start Date</div>
            <input type="date" className="input" value={startDate} onChange={e=>setStartDate(e.target.value)} />
          </div>
          <div>
            <div className="small">End Date</div>
            <input type="date" className="input" value={endDate} onChange={e=>setEndDate(e.target.value)} />
          </div>
        </div>

        <div style={{marginTop:12}}>
          <input className="input" style={{minWidth:260}}
            placeholder="Search text or guest name…"
            value={queryText} onChange={e=>setQueryText(e.target.value)} />
        </div>

        <div style={{marginTop:12, display:'flex', gap:8}}>
          <button className="btn primary" onClick={fetchData}>Apply Filters</button>
          <button className="btn" onClick={()=>{setStartDate(''); setEndDate(''); setQueryText(''); setOnlyApproved(false); fetchData();}}>Reset</button>
          <button className="btn" onClick={()=>exportCSV(rows)}>Export CSV</button>
        </div>

        <div style={{marginTop:12}}>
          <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
            <input type="checkbox" checked={onlyApproved} onChange={e=>setOnlyApproved(e.target.checked)} />
            <span className="small">Show only approved</span>
          </label>
        </div>
      </div>

      {loading && <div className="alert">Loading reviews…</div>}
      {error && <div className="alert">{error}</div>}

      {data && (
        <div className="card">
          <h3>Reviews</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Approve</th>
                <th>Listing</th>
                <th>Channel</th>
                <th>Type</th>
                <th>Overall</th>
                <th>Date</th>
                <th>Review</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={!!approved[r.id]}
                      onChange={e => toggle(r.id, e.target.checked)}
                    />
                  </td>
                  <td>{r.listingName}</td>
                  <td><span className={`badge ${r.channel === 'google' ? 'google' : 'hostaway'}`}>{r.channel}</span></td>
                  <td>{r.type}</td>
                  <td className="rating">
                    {typeof r.ratingOverall === 'number'
                      ? Array.from({length:5}).map((_,i)=>(
                          <span key={i} className="star">{i < Math.round(r.ratingOverall/2) ? '★' : '☆'}</span>
                        ))
                      : '—'}
                  </td>
                  <td>{r.date?.slice(0,10)}</td>
                  <td>{r.publicReview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="footer">
        Approvals are saved locally in <code>{LS_KEY}</code>.
      </div>
    </div>
  );
}
