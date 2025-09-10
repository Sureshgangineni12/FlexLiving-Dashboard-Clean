import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <h1 style={{marginBottom:8}}>Flex Living — Reviews Suite</h1>
      <p className="small">Manager tools to curate guest feedback and a public page to showcase approved reviews.</p>

      <div className="grid grid-2" style={{marginTop:16}}>
        <div className="card">
          <h3 style={{marginTop:0}}>Reviews Control Center</h3>
          <p>Filter, search, set date ranges, export CSV, and approve reviews for each property.</p>
          <Link className="btn primary" href="/dashboard">Open Dashboard</Link>
        </div>
        <div className="card">
          <h3 style={{marginTop:0}}>Property Reviews</h3>
          <p>Public-facing view that displays only <b>approved</b> reviews. Try a sample listing.</p>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <Link className="btn" href="/property/101">View Listing 101</Link>
            <Link className="btn" href="/property/202">View Listing 202</Link>
          </div>
        </div>
      </div>

      <div className="footer" style={{marginTop:20}}>
        API endpoint: <code>/api/reviews/hostaway</code> (supports filters).
      </div>
    </div>
  );
}
