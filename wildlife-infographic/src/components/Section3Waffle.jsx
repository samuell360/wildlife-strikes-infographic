import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

const ROWS = 10;
const COLS = 10;
const TOTAL = ROWS * COLS;
const DANGER = 9;
const SAFE = TOTAL - DANGER;
const CELL = 34;
const GAP = 6;
const GRID_PX = COLS * CELL + (COLS - 1) * GAP;

const SAFE_STAGGER_MS = 20;
const DANGER_DELAY_MS = SAFE * SAFE_STAGGER_MS + 200;
const DANGER_DUR_MS = 400;

export default function Section3Waffle() {
  const [, setData] = useState([]);
  const [visible, setVisible] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    d3.csv('/data/agg_damage.csv', d3.autoType).then(setData);
  }, []);

  useEffect(() => {
    if (!containerRef.current || visible) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.4 });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [visible]);

  return (
    <div className="section" ref={containerRef} style={{ display: 'flex', flexDirection: 'row', gap: '160px', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes waffleReveal {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 0.25; transform: scale(1); }
        }
        @keyframes wafflePop {
          0% { opacity: 0; transform: scale(0); filter: brightness(2); }
          60% { opacity: 1; transform: scale(1.1); filter: brightness(1.2); }
          100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 8px rgba(232,89,60,0.6)); }
        }
      `}</style>

      {/* Waffle grid */}
      <div style={{ flexShrink: 0, width: GRID_PX, height: GRID_PX }}>
        <svg width={GRID_PX} height={GRID_PX} style={{ overflow: 'visible' }}>
          {Array.from({ length: TOTAL }, (_, i) => {
            const isDanger = i >= SAFE;
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = col * (CELL + GAP);
            const y = row * (CELL + GAP);

            if (isDanger) {
              const dangerIdx = i - SAFE;
              return (
                <rect
                  key={i}
                  x={x} y={y}
                  width={CELL} height={CELL}
                  rx={8} ry={8}
                  fill="#E8593C"
                  style={{
                    opacity: 0,
                    transformOrigin: `${x + CELL / 2}px ${y + CELL / 2}px`,
                    animation: visible
                      ? `wafflePop ${DANGER_DUR_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${DANGER_DELAY_MS + dangerIdx * 60}ms forwards`
                      : 'none',
                  }}
                />
              );
            }

            return (
              <rect
                key={i}
                x={x} y={y}
                width={CELL} height={CELL}
                rx={8} ry={8}
                fill="#5DCAA5"
                style={{
                  opacity: 0,
                  transformOrigin: `${x + CELL / 2}px ${y + CELL / 2}px`,
                  animation: visible
                    ? `waffleReveal 300ms ease-out ${i * SAFE_STAGGER_MS}ms forwards`
                    : 'none',
                }}
              />
            );
          })}
        </svg>
      </div>

      {/* Text & Callout */}
      <div style={{ maxWidth: '440px', textAlign: 'left' }}>
        <div className="section-label" style={{ textAlign: 'left' }}>The damage question</div>
        <div className="section-title" style={{ textAlign: 'left', marginBottom: '32px' }}>Over 9 in 10 cause zero damage</div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: 'var(--font-display)', fontSize: '15px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#5DCAA5', opacity: 0.25 }}></div>
            <div><strong style={{ color: '#FFFFFF' }}>No damage</strong> — 183,895 strikes</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#E8593C', boxShadow: '0 0 8px rgba(232,89,60,0.5)' }}></div>
            <div><strong style={{ color: '#FFFFFF' }}>Damage reported</strong> — 18,619 strikes</div>
          </div>
        </div>

        {/* Premium Callout Box */}
        <div style={{ 
          background: 'linear-gradient(90deg, rgba(232,89,60,0.1) 0%, rgba(232,89,60,0.02) 100%)', 
          borderLeft: '4px solid #E8593C', 
          padding: '24px', 
          marginTop: '40px', 
          borderRadius: '0 12px 12px 0' 
        }}>
          <div style={{ color: '#E8593C', fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
            Roughly 2 damaging strikes
          </div>
          <div style={{ color: '#C2D1DC', fontSize: '16px', marginTop: '8px', lineHeight: '1.5' }}>
            happen every single day on average across the U.S. aviation network.
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: '18px',
          color: 'var(--text-primary)',
          marginTop: '40px',
        }}>
          So what happens in the 9% that do?
        </div>
      </div>
    </div>
  );
}
