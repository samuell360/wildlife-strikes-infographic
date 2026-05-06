export default function Section6Closing() {
  const stats = [
    { value: '62',   label: 'Aircraft destroyed',     color: 'var(--color-danger)' },
    { value: '1.2M', label: 'Days aircraft grounded', color: 'var(--color-danger)' },
    { value: '223',  label: 'People injured',         color: 'var(--color-danger)' },
    { value: '24',   label: 'Fatalities in 33 years', color: 'var(--color-danger)' },
  ];

  return (
    <div className="section section-even" style={{ textAlign: 'center', paddingBottom: '80px' }}>
      
      {/* Narrative Bridge */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '23px',
        color: 'var(--text-primary)',
        maxWidth: '700px',
        margin: '0 auto 24px',
        lineHeight: 1.5,
      }}>
        Wildlife strikes are not a freak event. They are a near-daily reality of commercial aviation.
      </div>

      {/* The 4 Consequence Stats */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '60px' }}>
        {stats.map(({ value, label, color }) => (
          <div key={label} style={{
            flex: 1,
            background: 'var(--bg-surface)',
            border: '1px solid rgba(194, 209, 220, 0.18)',
            borderRadius: '8px',
            padding: '28px 20px',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '36px',
              fontWeight: 700,
              color,
              lineHeight: 1,
              marginBottom: '10px',
            }}>
              {value}
            </div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* NEW: Resolution Phase & Conclusion */}
      <div style={{
        background: 'rgba(93, 202, 165, 0.04)',
        border: '1px solid rgba(93, 202, 165, 0.2)',
        borderRadius: '12px',
        padding: '40px',
        maxWidth: '800px',
        margin: '0 auto 60px',
      }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '28px',
          color: 'var(--color-safe)',
          marginBottom: '16px'
        }}>
          Wildlife awareness is now the frontier of aviation safety.
        </h3>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 400,
          fontSize: '15px',
          color: 'var(--text-primary)',
          lineHeight: 1.7,
          maxWidth: '600px',
          margin: '0 auto 32px',
        }}>
          Over 9 in 10 strikes cause no damage. But the 9% that do follow highly predictable geographic and seasonal patterns. By understanding where, when, and how these collisions occur, we can engineer better flight paths, smarter radar detection, and safer skies.
        </p>
        
        {/* NEW: Call to Action (CTA) */}
        <a href="https://wildlife.faa.gov/home" target="_blank" rel="noreferrer" style={{
          display: 'inline-block',
          backgroundColor: 'var(--color-safe)',
          color: '#0F1923',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '14px',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          padding: '16px 32px',
          borderRadius: '30px',
          textDecoration: 'none',
          boxShadow: '0 8px 24px rgba(93,202,165,0.25)',
          transition: 'all 0.2s ease',
        }}>
          Explore the FAA Database
        </a>
      </div>

      {/* Source Citations */}
      <hr style={{ border: 'none', borderTop: '1px solid rgba(194,209,220,0.1)', margin: '0 0 24px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6 }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
            Source & Methodology
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--text-secondary)' }}>
            FAA National Wildlife Strike Database, 1990–2023. Filtered for Commercial Aircraft (AC_CLASS A).
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>
            Visualization
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', color: 'var(--text-secondary)' }}>
            Samuel · DTA 350 Capstone · Rollins College · 2026
          </div>
        </div>
      </div>
    </div>
  );
}
