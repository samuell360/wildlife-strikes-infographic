import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const BIG3 = ['KDEN', 'KDFW', 'KMEM'];

export default function Section5Map() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [airports, setAirports] = useState([]);
  const [topoFailed, setTopoFailed] = useState(false);
  const [chartW, setChartW] = useState(1040);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    d3.csv('/data/agg_airports.csv', d3.autoType).then(rows => {
      setAirports(rows.filter(d => d.latitude && d.longitude));
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const w = containerRef.current.getBoundingClientRect().width;
      if (w > 0) setChartW(Math.floor(w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!airports.length || !svgRef.current) return;

    const W = chartW, H = 480; // slightly taller to fit Florida/Texas better
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const projection = d3.geoAlbersUsa()
      .scale(W * 1.05)
      .translate([W / 2, H / 2 - 10]); // Shift map up slightly to center it better

    const path = d3.geoPath().projection(projection);

    const maxCount = d3.max(airports, d => d.count);
    
    // DRAMATIC SCALING: This fixes the issue of bubbles looking too similar
    const rScale = d3.scaleSqrt().domain([0, maxCount]).range([3, 45]);

    const renderCircles = () => {
      // Glow layer (only for Big 3)
      airports.filter(d => BIG3.includes(d.airport_id)).forEach(d => {
        const coords = projection([+d.longitude, +d.latitude]);
        if (!coords) return;
        svg.append('circle')
          .attr('cx', coords[0]).attr('cy', coords[1])
          .attr('r', rScale(d.count) + 8)
          .attr('fill', '#E8593C')
          .attr('fill-opacity', 0.2)
          .style('filter', 'blur(6px)')
          .style('pointer-events', 'none');
      });

      // Main circles
      // Sort so larger circles are drawn first (in the back), smaller in front
      const sortedAirports = [...airports].sort((a, b) => b.count - a.count);
      
      sortedAirports.forEach(d => {
        const coords = projection([+d.longitude, +d.latitude]);
        if (!coords) return;
        
        const isBig3 = BIG3.includes(d.airport_id);
        const fillCol = isBig3 ? '#E8593C' : '#5DCAA5';
        const strokeCol = isBig3 ? '#E8593C' : '#5DCAA5';
        const fillOp = isBig3 ? 0.35 : 0.12;
        const strokeOp = isBig3 ? 0.9 : 0.4;

        svg.append('circle')
          .attr('cx', coords[0]).attr('cy', coords[1])
          .attr('r', rScale(d.count))
          .attr('fill', fillCol)
          .attr('fill-opacity', fillOp)
          .attr('stroke', strokeCol)
          .attr('stroke-opacity', strokeOp)
          .attr('stroke-width', isBig3 ? 2 : 1)
          .style('cursor', 'pointer')
          .style('transition', 'fill-opacity 0.2s')
          .on('mouseenter', (e) => {
             const [x, y] = d3.pointer(e, containerRef.current);
             setTooltip({ x, y, data: d });
             d3.select(e.target).attr('fill-opacity', isBig3 ? 0.6 : 0.4);
          })
          .on('mouseleave', (e) => {
             setTooltip(null);
             d3.select(e.target).attr('fill-opacity', fillOp);
          });
      });

      // Hero Labels for Big 3
      airports.filter(d => BIG3.includes(d.airport_id)).forEach(d => {
        const coords = projection([+d.longitude, +d.latitude]);
        if (!coords) return;
        
        const r = rScale(d.count);
        const code = d.airport_id.replace(/^K/, '');
        
        // Custom offsets to push labels completely outside the massive bubbles
        let ox = 0, oy = 0;
        let anchor = 'middle';
        if (code === 'DEN') { ox = -r - 20; oy = -r - 15; anchor = 'end'; }
        if (code === 'DFW') { ox = r + 20; oy = r + 15; anchor = 'start'; }
        if (code === 'MEM') { ox = r + 20; oy = -r - 10; anchor = 'start'; }

        // Leader line
        svg.append('line')
          .attr('x1', coords[0] + (ox < 0 ? -r : r)*0.6)
          .attr('y1', coords[1] + (oy < 0 ? -r : r)*0.6)
          .attr('x2', coords[0] + ox)
          .attr('y2', coords[1] + oy)
          .attr('stroke', '#E8593C')
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', 1.5)
          .style('pointer-events', 'none');

        const textG = svg.append('g')
          .attr('transform', `translate(${coords[0] + ox + (ox > 0 ? 5 : -5)}, ${coords[1] + oy})`)
          .style('pointer-events', 'none');
        
        textG.append('text')
          .attr('text-anchor', anchor)
          .attr('font-family', 'var(--font-display)')
          .attr('font-size', 16)
          .attr('font-weight', 700)
          .attr('fill', '#FFFFFF')
          .text(code);
          
        textG.append('text')
          .attr('y', 16)
          .attr('text-anchor', anchor)
          .attr('font-family', 'var(--font-mono)')
          .attr('font-size', 12)
          .attr('fill', '#E8593C') // Orange text to match the threat
          .attr('font-weight', 600)
          .text(`${d.count.toLocaleString()} strikes`);

        // FedEx Context for Memphis
        if (code === 'MEM') {
           textG.append('text')
            .attr('y', 32)
            .attr('text-anchor', anchor)
            .attr('font-family', 'var(--font-display)')
            .attr('font-size', 11)
            .attr('font-style', 'italic')
            .attr('fill', '#A1B4C4')
            .text('FedEx hub — heavy nighttime cargo');
        }
      });

      // Size legend
      const lgX = 60, lgY = H - 60;
      [1000, 3000, 5000].forEach((val, i) => {
        const r = rScale(val);
        svg.append('circle')
          .attr('cx', lgX + i * 55).attr('cy', lgY)
          .attr('r', r)
          .attr('fill', '#5DCAA5').attr('fill-opacity', 0.15)
          .attr('stroke', '#5DCAA5').attr('stroke-opacity', 0.5).attr('stroke-width', 1)
          .style('pointer-events', 'none');
          
        svg.append('text')
          .attr('x', lgX + i * 55).attr('y', lgY + r + 16)
          .attr('text-anchor', 'middle')
          .attr('font-family', 'var(--font-mono)')
          .attr('font-size', 10)
          .attr('fill', '#A1B4C4')
          .text(val.toLocaleString());
      });
      svg.append('text')
        .attr('x', lgX).attr('y', lgY - 32)
        .attr('font-family', 'var(--font-display)')
        .attr('font-size', 11)
        .attr('font-weight', 600)
        .attr('fill', '#7A8F9E')
        .attr('letter-spacing', 1)
        .attr('text-transform', 'uppercase')
        .text('STRIKE VOLUME');
    };

    // Try to fetch US topojson
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(r => r.json())
      .then(us => {
        const states = topojson.feature(us, us.objects.states);
        svg.append('g')
          .selectAll('path')
          .data(states.features)
          .join('path')
          .attr('d', path)
          .attr('fill', '#111D26') // Extremely dark, sleek navy background
          .attr('stroke', '#2C3E50') // Crisp, prominent state borders
          .attr('stroke-width', 0.8);
        renderCircles();
      })
      .catch(() => {
        setTopoFailed(true);
        svg.append('rect')
          .attr('x', 0).attr('y', 0)
          .attr('width', W).attr('height', H)
          .attr('fill', '#111D26')
          .attr('rx', 8);
        renderCircles();
      });

  }, [airports, chartW]);

  return (
    <div className="section" ref={containerRef} style={{ position: 'relative' }}>
      <div className="section-label" style={{ color: 'var(--color-danger)' }}>Where it happens</div>
      <div className="section-title">Denver, Dallas, and Memphis lead the country</div>
      
      <p style={{
        color: '#A1B4C4', 
        fontSize: '14px', 
        marginTop: '-10px', 
        marginBottom: '30px', 
        maxWidth: '800px',
        lineHeight: '1.6'
      }}>
        Hover over any airport to view exact strike numbers. The sheer volume at <strong style={{ color: '#E8593C' }}>Denver</strong>, <strong style={{ color: '#E8593C' }}>Dallas-Fort Worth</strong>, and <strong style={{ color: '#E8593C' }}>Memphis</strong> eclipses the rest of the country, acting as massive attractors for wildlife incidents.
      </p>

      {topoFailed && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>
          (Map outlines unavailable offline — showing airport positions)
        </div>
      )}
      
      <svg ref={svgRef} width={chartW} height={480} style={{ display: 'block' }} />

      {/* Interactive Tooltip */}
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: tooltip.x,
          top: tooltip.y - 15, // float slightly above cursor
          transform: 'translate(-50%, -100%)',
          background: 'rgba(15, 23, 30, 0.95)',
          border: `1px solid ${BIG3.includes(tooltip.data.airport_id) ? '#E8593C' : '#5DCAA5'}`,
          padding: '10px 14px',
          borderRadius: '6px',
          color: '#FFF',
          fontSize: '13px',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          zIndex: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: 1, fontSize: '15px' }}>
            {tooltip.data.airport_id.replace(/^K/, '')}
          </div>
          <div style={{ color: '#A1B4C4', marginTop: '4px' }}>
            <span style={{ 
              color: BIG3.includes(tooltip.data.airport_id) ? '#E8593C' : '#FFF', 
              fontFamily: 'var(--font-mono)',
              fontWeight: 600 
            }}>
              {tooltip.data.count.toLocaleString()}
            </span> strikes
          </div>
        </div>
      )}
    </div>
  );
}
