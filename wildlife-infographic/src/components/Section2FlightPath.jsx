import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const PHASE_X = {
  'Taxi':0.03,'Take-off Run':0.11,'Climb':0.23,'Departure':0.33,
  'En Route':0.50,'Descent':0.67,'Approach':0.80,'Arrival':0.88,
  'Landing Roll':0.95,'Parked':0.99,
};
const PHASE_Y = {
  'Taxi':0.95,'Take-off Run':0.88,'Climb':0.50,'Departure':0.34,
  'En Route':0.08,'Descent':0.32,'Approach':0.50,'Arrival':0.70,
  'Landing Roll':0.88,'Parked':0.95,
};
const LABEL_CFG = {
  'Taxi':{side:'above',dx:0,dy:0},'Take-off Run':{side:'above',dx:0,dy:0},
  'Climb':{side:'above',dx:0,dy:0},'Departure':{side:'above',dx:0,dy:0},
  'En Route':{side:'above',dx:0,dy:0},'Descent':{side:'above',dx:0,dy:0},
  'Approach':{side:'above',dx:0,dy:0},'Arrival':{side:'below',dx:-24,dy:8},
  'Landing Roll':{side:'below',dx:0,dy:8},'Parked':{side:'above',dx:0,dy:0},
};

const PLANE_PATH = `M 0,0 L 60,0 Q 80,-2 78,-8 Q 76,-14 60,-12 L 40,-12
  L 20,-30 L 10,-28 L 24,-12 L 8,-12 L 2,-20 L -4,-19 L 4,-12
  L -8,-12 Q -12,-12 -10,-8 Q -8,-4 0,0 Z`;

export default function Section2FlightPath() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [data, setData] = useState([]);
  const [chartW, setChartW] = useState(1040);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => { d3.csv('/data/agg_phase.csv', d3.autoType).then(setData); }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => { const w = containerRef.current.getBoundingClientRect().width; if (w > 0) setChartW(Math.floor(w)); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current || hasAnimated) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHasAnimated(true); obs.disconnect(); } }, { threshold: 0.25 });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!data.length || !svgRef.current || !hasAnimated) return;

    const W = chartW, H = 420;
    const padL = 20, padR = 20, padT = 40, padB = 55;
    const innerW = W - padL - padR, innerH = H - padT - padB;
    const totalCount = d3.sum(data, d => d.count);

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    // Glow filter for Approach hero bubble
    const glow = defs.append('filter').attr('id','bubbleGlow').attr('x','-50%').attr('y','-50%').attr('width','200%').attr('height','200%');
    glow.append('feGaussianBlur').attr('stdDeviation',12).attr('result','blur');
    const mg = glow.append('feMerge'); mg.append('feMergeNode').attr('in','blur'); mg.append('feMergeNode').attr('in','SourceGraphic');

    const g = svg.append('g').attr('transform', `translate(${padL},${padT})`);

    // Ground line
    g.append('line').attr('x1',0).attr('y1',innerH).attr('x2',innerW).attr('y2',innerH)
      .attr('stroke','#7A8F9E').attr('stroke-width',1).attr('stroke-dasharray','4,6').attr('opacity',0.25);

    // Flight path bezier
    const pathPoints = [
      [0,innerH],[innerW*0.08,innerH*0.86],[innerW*0.22,innerH*0.48],
      [innerW*0.38,innerH*0.18],[innerW*0.50,innerH*0.06],
      [innerW*0.64,innerH*0.20],[innerW*0.78,innerH*0.46],
      [innerW*0.92,innerH*0.82],[innerW,innerH],
    ];
    const lineGen = d3.line().curve(d3.curveCatmullRom.alpha(0.5));
    g.append('path').attr('d', lineGen(pathPoints))
      .attr('fill','none').attr('stroke','rgba(194,209,220,0.30)').attr('stroke-width',2).attr('stroke-dasharray','6,8');

    // Plane silhouette at cruise
    g.append('path').attr('d', PLANE_PATH)
      .attr('transform', `translate(${innerW*0.50-40},${innerH*0.08}) scale(0.9)`)
      .attr('fill','#5DCAA5').attr('opacity',0.25);

    // 500ft horizontal reference line across chart
    const altY = innerH * 0.63;
    g.append('line').attr('x1',0).attr('y1',altY).attr('x2',innerW).attr('y2',altY)
      .attr('stroke','#F2A623').attr('stroke-width',1).attr('stroke-dasharray','6,8').attr('opacity',0.18);
    // 500ft annotation (Moved to center, highlighting 'below 500 ft')
    const textX = innerW * 0.48; // Centered but slightly left of the Approach bubble
    
    g.append('text').attr('x',textX).attr('y',altY-24).attr('text-anchor','middle')
      .attr('font-family','var(--font-display)').attr('font-size',13).attr('font-weight',600)
      .attr('fill','#F2A623').attr('opacity',0.9)
      .text('The Danger Zone: 69% of strikes happen');
      
    const line2 = g.append('text').attr('x',textX).attr('y',altY-8).attr('text-anchor','middle')
      .attr('font-family','var(--font-display)').attr('font-size',13);
      
    line2.append('tspan')
      .attr('fill','#FFFFFF').attr('font-weight',800)
      .text('below 500 ft');
      
    line2.append('tspan')
      .attr('fill','#F2A623').attr('font-weight',600).attr('opacity',0.9)
      .text(' (Take-off, Landing & Final Approach)');

    // Legend in top left
    const legend = svg.append('g').attr('transform', `translate(${padL + 20}, ${padT + 10})`);
    
    // High Risk
    legend.append('circle').attr('cx',0).attr('cy',0).attr('r',5).attr('fill','#E8593C').attr('opacity',0.8);
    legend.append('text').attr('x',14).attr('y',4).attr('font-family','var(--font-display)').attr('font-size',10).attr('font-weight',600).attr('letter-spacing','1px').attr('fill','#C2D1DC').text('HIGH RISK (>25K)');
    
    // Moderate Risk
    legend.append('circle').attr('cx',0).attr('cy',20).attr('r',5).attr('fill','#F2A623').attr('opacity',0.8);
    legend.append('text').attr('x',14).attr('y',24).attr('font-family','var(--font-display)').attr('font-size',10).attr('font-weight',600).attr('letter-spacing','1px').attr('fill','#C2D1DC').text('MODERATE RISK (1K-25K)');
    
    // Low Risk
    legend.append('circle').attr('cx',0).attr('cy',40).attr('r',5).attr('fill','#5DCAA5').attr('opacity',0.8);
    legend.append('text').attr('x',14).attr('y',44).attr('font-family','var(--font-display)').attr('font-size',10).attr('font-weight',600).attr('letter-spacing','1px').attr('fill','#C2D1DC').text('LOW RISK (<1K)');

    // Color + danger tier
    const getColor = (count) => count > 25000 ? '#E8593C' : count > 1000 ? '#F2A623' : '#5DCAA5';
    const getOpacity = (count) => count > 25000 ? 0.35 : count > 1000 ? 0.25 : 0.20;
    const getStrokeOp = (count) => count > 25000 ? 0.85 : count > 1000 ? 0.6 : 0.5;

    const radiusScale = d3.scaleSqrt().domain([0, d3.max(data, d => d.count)]).range([6, 58]);
    const phaseMap = {}; data.forEach(d => { phaseMap[d.phase] = d; });

    // Draw bubbles with animation + labels
    Object.entries(PHASE_X).forEach(([phase, xNorm], idx) => {
      if (!phaseMap[phase]) return;
      const d = phaseMap[phase];
      const cx = innerW * xNorm, cy = innerH * PHASE_Y[phase];
      const r = radiusScale(d.count);
      const color = getColor(d.count);
      const isHero = phase === 'Approach';
      const cfg = LABEL_CFG[phase] || { side:'above', dx:0, dy:0 };
      const pct = ((d.count / totalCount) * 100).toFixed(1);
      const showPct = d.count > 25000; // top 4 phases

      // Glow layer for Approach
      if (isHero) {
        g.append('circle').attr('cx',cx).attr('cy',cy).attr('r',r+8)
          .attr('fill',color).attr('opacity',0).attr('filter','url(#bubbleGlow)')
          .transition().delay(idx*80+300).duration(800).attr('opacity',0.15);
      }

      // Animated bubble
      const bubble = g.append('circle').attr('cx',cx).attr('cy',cy).attr('r',0)
        .attr('fill',color).attr('fill-opacity',getOpacity(d.count))
        .attr('stroke',color).attr('stroke-width', isHero ? 2 : 1)
        .attr('stroke-opacity',getStrokeOp(d.count));
      bubble.transition().delay(idx*80).duration(600).ease(d3.easeCubicOut).attr('r',r);

      // Label positioning
      let nameX, nameY, countX, countY;
      if (cfg.side === 'below') {
        nameX = cx+(cfg.dx||0); nameY = cy+r+14+(cfg.dy||0);
        countX = cx+(cfg.dx||0); countY = cy+r+28+(cfg.dy||0);
      } else {
        nameX = cx+(cfg.dx||0); nameY = cy-r-22+(cfg.dy||0);
        countX = cx+(cfg.dx||0); countY = cy-r-8+(cfg.dy||0);
      }

      // Phase name
      const nameEl = g.append('text').attr('x',nameX).attr('y',nameY).attr('text-anchor','middle')
        .attr('font-family','var(--font-display)')
        .attr('font-size', isHero ? 13 : 10)
        .attr('font-weight', isHero ? 600 : 400)
        .attr('fill', isHero ? '#FFFFFF' : '#7A8F9E').attr('opacity',0);
      nameEl.transition().delay(idx*80+400).duration(400).attr('opacity',1);

      // Count
      const countEl = g.append('text').attr('x',countX).attr('y',countY).attr('text-anchor','middle')
        .attr('font-family','var(--font-mono)')
        .attr('font-size', isHero ? 16 : 12).attr('font-weight',700)
        .attr('fill', isHero ? '#FFFFFF' : '#C2D1DC').attr('opacity',0);
      countEl.transition().delay(idx*80+400).duration(400).attr('opacity',1);

      // Phase name text (set after transition setup)
      nameEl.text(phase);
      countEl.text(d.count.toLocaleString());

      // Percentage label for top phases
      if (showPct) {
        const pctY = cfg.side === 'below' ? countY + 14 : countY + 12;
        const pctEl = g.append('text').attr('x',countX).attr('y',pctY).attr('text-anchor','middle')
          .attr('font-family','var(--font-mono)').attr('font-size',10).attr('font-weight',700)
          .attr('fill','#FFFFFF').attr('opacity',0)
          .text(pct + '%');
        pctEl.transition().delay(idx*80+600).duration(400).attr('opacity',0.85);
      }

      // Hero badge for Approach
      if (isHero) {
        const badgeY = cfg.side === 'below' ? countY + 26 : nameY - 26;
        const pillW = 148, pillH = 24;
        const pillEl = g.append('rect')
          .attr('x',cx-pillW/2).attr('y',badgeY-16).attr('width',pillW).attr('height',pillH)
          .attr('rx',12).attr('fill','#E8593C').attr('opacity',0);
        pillEl.transition().delay(idx*80+700).duration(500).attr('opacity',0.8);
        
        const badgeText = g.append('text').attr('x',cx).attr('y',badgeY-1).attr('text-anchor','middle')
          .attr('font-family','var(--font-display)').attr('font-size',11).attr('font-weight',700)
          .attr('fill','#FFFFFF').attr('opacity',0)
          .text('43% of all strikes');
        badgeText.transition().delay(idx*80+700).duration(500).attr('opacity',1);
      }
    });

    // Interactive hover overlays
    Object.entries(PHASE_X).forEach(([phase, xNorm]) => {
      if (!phaseMap[phase]) return;
      const d = phaseMap[phase];
      const cx = innerW * xNorm, cy = innerH * PHASE_Y[phase];
      const r = radiusScale(d.count);
      const pct = ((d.count / totalCount) * 100).toFixed(1);
      const avgH = d.avg_height ? Math.round(d.avg_height).toLocaleString() + ' ft' : 'Ground';

      g.append('circle').attr('cx',cx).attr('cy',cy).attr('r',Math.max(r,20))
        .attr('fill','transparent').attr('cursor','pointer')
        .on('mouseenter', function() {
          svg.selectAll('.fp-tip').remove();
          const tipW = 160, tipH = 62;
          const tx = cx - tipW/2, ty = cy - r - tipH - 14;
          const tip = g.append('g').attr('class','fp-tip');
          tip.append('rect').attr('x',tx).attr('y',ty).attr('width',tipW).attr('height',tipH)
            .attr('rx',8).attr('fill','#1B3A4B').attr('stroke','rgba(93,202,165,0.3)').attr('stroke-width',1);
          tip.append('text').attr('x',cx).attr('y',ty+18).attr('text-anchor','middle')
            .attr('font-family','var(--font-display)').attr('font-size',12).attr('font-weight',600)
            .attr('fill','#FFFFFF').text(phase);
          tip.append('text').attr('x',cx).attr('y',ty+34).attr('text-anchor','middle')
            .attr('font-family','var(--font-mono)').attr('font-size',12).attr('font-weight',700)
            .attr('fill','#C2D1DC').text(d.count.toLocaleString()+' strikes · '+pct+'%');
          tip.append('text').attr('x',cx).attr('y',ty+50).attr('text-anchor','middle')
            .attr('font-family','var(--font-mono)').attr('font-size',10)
            .attr('fill','#7A8F9E').text('Avg height: '+avgH);
        })
        .on('mouseleave', function() { svg.selectAll('.fp-tip').remove(); });
    });

  }, [data, chartW, hasAnimated]);

  return (
    <div className="section section-even" ref={containerRef}>
      <div className="section-label">Where in the flight</div>
      <div className="section-title">The danger zone is below 500 feet</div>
      <svg ref={svgRef} width={chartW} height={420} style={{ display:'block', overflow:'visible' }} />
    </div>
  );
}
