function PlaneIllustration() {
  return (
    <svg width="340" height="160" viewBox="0 0 240 100" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      {/* High-Contrast Jet Silhouette */}
      <g opacity="0.95">
        {/* Wing (Back) */}
        <polygon points="110,50 140,50 160,20 130,20" fill="#7A8F9E" />
        {/* Fuselage */}
        <ellipse cx="120" cy="50" rx="100" ry="14" fill="#E2E8F0" />
        {/* Tail */}
        <polygon points="200,50 230,10 235,50" fill="#C2D1DC" />
        {/* Wing (Front) */}
        <polygon points="90,50 130,50 100,95 60,95" fill="#C2D1DC" />
        {/* Engines */}
        <ellipse cx="90" cy="65" rx="14" ry="7" fill="#1B3A4B" stroke="#E2E8F0" strokeWidth="2" />
        {/* Cockpit Window */}
        <polygon points="28,48 45,43 55,43 45,48" fill="#0F1923" />
      </g>
      
      {/* Bird Strike Danger Zone (Vibrant Orange) */}
      <circle cx="22" cy="50" r="10" fill="#E8593C" opacity="0.9" />
      <circle cx="12" cy="40" r="5" fill="#E8593C" opacity="0.7" />
      <circle cx="16" cy="62" r="6" fill="#E8593C" opacity="0.8" />
      
      {/* Action Lines (Impact velocity) */}
      <line x1="-10" y1="36" x2="16" y2="44" stroke="#E8593C" strokeWidth="2.5" strokeDasharray="4 4" />
      <line x1="-15" y1="50" x2="16" y2="50" stroke="#E8593C" strokeWidth="2.5" strokeDasharray="4 4" />
      <line x1="-8"  y1="66" x2="16" y2="58" stroke="#E8593C" strokeWidth="2.5" strokeDasharray="4 4" />
    </svg>
  );
}

function BirdFlock() {
  const birds = [{ x: 40, y: 12, s: 0.7 }, { x: 64, y: 0, s: 0.55 }, { x: 86, y: 8, s: 0.6 }];
  return (
    <svg width="140" height="30" aria-hidden="true" style={{ display: 'block', opacity: 0.14, marginBottom: '6px' }}>
      {birds.map((b, i) => (
        <g key={i} transform={`translate(${b.x},${b.y}) scale(${b.s})`}>
          <path d="M0,0 Q-8,-5 -14,-2" fill="none" stroke="#C2D1DC" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M0,0 Q8,-5 14,-2"  fill="none" stroke="#C2D1DC" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}

export default function Header() {
  return (
    <div style={{
      padding: '60px 0 40px',
      borderBottom: '1px solid rgba(194,209,220,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '40px',
    }}>
      {/* LEFT: text block */}
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <BirdFlock />

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '78px',
          lineHeight: 1.0,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          color: '#FFFFFF',
          marginBottom: '14px',
        }}>
          When Wildlife Hits Aircraft
        </h1>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '22px',
          color: 'var(--color-safe)',
          marginBottom: '16px',
          letterSpacing: '1px'
        }}>
          The 9% that actually matter
        </div>

        {/* intro text */}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          fontSize: '15px',
          color: '#C2D1DC',
          lineHeight: 1.7,
          maxWidth: '640px',
          marginBottom: '20px',
        }}>
          Every year, thousands of animals collide with commercial aircraft across the United States.
          Most of these strikes cause no damage at all.
          But a predictable few cause real destruction.
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(194,209,220,0.15)' }} />
      </div>

      {/* RIGHT: aircraft illustration */}
      <div style={{ flexShrink: 0 }}>
        <PlaneIllustration />
      </div>
    </div>
  );
}
