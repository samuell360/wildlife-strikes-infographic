import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const STAT_W = 260, GAP = 24, SPARK_H = 500;

function Sparkline({ data }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [sparkW, setSparkW] = useState(700);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => { const w = containerRef.current.getBoundingClientRect().width; if (w > 0) setSparkW(Math.floor(w)); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current || hasAnimated) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHasAnimated(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!data.length || !svgRef.current || !hasAnimated) return;

    const W = sparkW, H = 600;
    const margin = { top: 50, right: 56, bottom: 58, left: 10 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', W).attr('height', H);

    const defs = svg.append('defs');

    // Gradient fill
    const grad = defs.append('linearGradient').attr('id','areaGrad').attr('x1','0').attr('y1','0').attr('x2','0').attr('y2','1');
    grad.append('stop').attr('offset','0%').attr('stop-color','#5DCAA5').attr('stop-opacity',0.30);
    grad.append('stop').attr('offset','100%').attr('stop-color','#5DCAA5').attr('stop-opacity',0.02);

    // Highlight zone gradient (amber)
    const hGrad = defs.append('linearGradient').attr('id','highlightGrad').attr('x1','0').attr('y1','0').attr('x2','0').attr('y2','1');
    hGrad.append('stop').attr('offset','0%').attr('stop-color','#F2A623').attr('stop-opacity',0.22);
    hGrad.append('stop').attr('offset','100%').attr('stop-color','#F2A623').attr('stop-opacity',0.03);

    // Glow filter
    const glow = defs.append('filter').attr('id','lineGlow').attr('x','-20%').attr('y','-20%').attr('width','140%').attr('height','140%');
    glow.append('feGaussianBlur').attr('stdDeviation',6).attr('result','blur');
    const m = glow.append('feMerge'); m.append('feMergeNode').attr('in','blur'); m.append('feMergeNode').attr('in','SourceGraphic');

    const g = svg.append('g').attr('transform',`translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(data, d=>d.year)).range([0, innerW]);
    const y = d3.scaleLinear().domain([0, d3.max(data, d=>d.count)*1.05]).range([innerH, 0]);

    // Gridlines + Y labels
    [2500,5000,7500,10000].forEach(val => {
      const gy = y(val);
      g.append('line').attr('x1',0).attr('y1',gy).attr('x2',innerW).attr('y2',gy)
        .attr('stroke','rgba(194,209,220,0.08)').attr('stroke-dasharray','4,6');
      g.append('text').attr('x',innerW+8).attr('y',gy+4).attr('text-anchor','start')
        .attr('font-family','var(--font-mono)').attr('font-size',9).attr('fill','#7A8F9E').attr('opacity',0.5)
        .text((val/1000)+'K');
    });

    const areaGen = d3.area().x(d=>x(d.year)).y0(innerH).y1(d=>y(d.count)).curve(d3.curveMonotoneX);
    const lineGen = d3.line().x(d=>x(d.year)).y(d=>y(d.count)).curve(d3.curveMonotoneX);

    // ── HIGHLIGHTED ZONE: 2014–2019 acceleration ──
    const zoneData = data.filter(d => d.year >= 2014 && d.year <= 2019);
    if (zoneData.length) {
      const zx1 = x(2014), zx2 = x(2019);
      // Background band
      g.append('rect').attr('x',zx1).attr('y',0).attr('width',zx2-zx1).attr('height',innerH)
        .attr('fill','#F2A623').attr('opacity',0.04).attr('rx',4);
      // Amber area fill for highlighted zone
      const hArea = d3.area().x(d=>x(d.year)).y0(innerH).y1(d=>y(d.count)).curve(d3.curveMonotoneX);
      g.append('path').datum(zoneData).attr('d',hArea).attr('fill','url(#highlightGrad)');
      // Dashed vertical boundary lines
      [2014,2019].forEach(yr => {
        g.append('line').attr('x1',x(yr)).attr('y1',0).attr('x2',x(yr)).attr('y2',innerH)
          .attr('stroke','#F2A623').attr('stroke-width',1).attr('stroke-dasharray','4,6').attr('opacity',0.25);
      });
      // Era label at top
      g.append('text').attr('x',(zx1+zx2)/2).attr('y',-8).attr('text-anchor','middle')
        .attr('font-family','var(--font-display)').attr('font-size',11).attr('font-weight',600)
        .attr('letter-spacing','1.5px').attr('fill','#F2A623').attr('opacity',0.75)
        .text('ACCELERATION ERA');
    }

    // Main area fill with gradient
    g.append('path').datum(data).attr('d',areaGen).attr('fill','url(#areaGrad)')
      .attr('opacity',0).transition().delay(1400).duration(600).attr('opacity',1);

    // Glow line
    g.append('path').datum(data).attr('d',lineGen)
      .attr('fill','none').attr('stroke','#5DCAA5').attr('stroke-width',6)
      .attr('opacity',0.15).attr('filter','url(#lineGlow)');

    // Main line with draw animation
    const linePath = g.append('path').datum(data).attr('d',lineGen)
      .attr('fill','none').attr('stroke','#5DCAA5').attr('stroke-width',3)
      .attr('opacity',0.9).attr('stroke-linecap','round');
    const totalLen = linePath.node().getTotalLength();
    linePath.attr('stroke-dasharray',totalLen).attr('stroke-dashoffset',totalLen)
      .transition().duration(1400).ease(d3.easeCubicOut).attr('stroke-dashoffset',0);

    // Formal X-axis Baseline
    g.append('line').attr('x1', 0).attr('y1', innerH).attr('x2', innerW).attr('y2', innerH)
      .attr('stroke', '#C2D1DC').attr('stroke-width', 2);

    // X-axis Ticks
    [1990,1995,2000,2005,2010,2015,2020,2023].forEach(yr => {
      const lx = x(yr);
      g.append('line').attr('x1',lx).attr('y1',innerH).attr('x2',lx).attr('y2',innerH+8)
        .attr('stroke','#C2D1DC').attr('stroke-width',2);
      g.append('text').attr('x',lx).attr('y',innerH+24).attr('text-anchor','middle')
        .attr('font-family','var(--font-mono)').attr('font-size',12).attr('font-weight',700).attr('fill','#C2D1DC').text(yr);
    });

    // ═══ ANNOTATIONS (appear after draw) ═══
    const aG = g.append('g').attr('opacity',0);
    aG.transition().delay(1500).duration(500).attr('opacity',1);

    // dot marker at a data point
    const dot = (cx,cy,color,r=5) => {
      aG.append('circle').attr('cx',cx).attr('cy',cy).attr('r',r)
        .attr('fill',color).attr('stroke','#0F1923').attr('stroke-width',2);
    };

    // 1990 start value
    const s = data[0];
    if(s){ dot(x(s.year),y(s.count),'#5DCAA5');
      aG.append('text').attr('x',x(s.year)+10).attr('y',y(s.count)-12).attr('text-anchor','start')
        .attr('font-family','var(--font-mono)').attr('font-size',13).attr('font-weight',700).attr('fill','#C2D1DC').text('1,783');
      aG.append('text').attr('x',x(s.year)+10).attr('y',y(s.count)+4).attr('text-anchor','start')
        .attr('font-family','var(--font-display)').attr('font-size',10).attr('fill','#7A8F9E').text('strikes in 1990');
    }

    // 1999 — FAA reporting jump
    const faa = data.find(d=>d.year===1999);
    if(faa){ const fx=x(1999),fy=y(faa.count); dot(fx,fy,'#5DCAA5');
      aG.append('line').attr('x1',fx).attr('y1',fy-10).attr('x2',fx).attr('y2',fy-40)
        .attr('stroke','#5DCAA5').attr('stroke-width',1).attr('stroke-dasharray','3,4').attr('opacity',0.4);
      aG.append('text').attr('x',fx).attr('y',fy-48).attr('text-anchor','middle')
        .attr('font-family','var(--font-display)').attr('font-size',11).attr('fill','#5DCAA5').attr('opacity',0.8)
        .text('FAA online reporting begins');
      aG.append('text').attr('x',fx).attr('y',fy-35).attr('text-anchor','middle')
        .attr('font-family','var(--font-mono)').attr('font-size',10).attr('fill','#7A8F9E')
        .text('4,470');
    }

    // 2009 — Sully
    const hudson = data.find(d=>d.year===2009);
    if(hudson){ const hx=x(2009),hy=y(hudson.count); dot(hx,hy,'#F2A623');
      aG.append('line').attr('x1',hx).attr('y1',hy-10).attr('x2',hx).attr('y2',hy-48)
        .attr('stroke','#F2A623').attr('stroke-width',1).attr('stroke-dasharray','3,4').attr('opacity',0.5);
      aG.append('text').attr('x',hx).attr('y',hy-56).attr('text-anchor','middle')
        .attr('font-family','var(--font-display)').attr('font-size',12).attr('font-style','italic')
        .attr('fill','#F2A623').attr('opacity',0.85).text("Sully's 'Miracle on the Hudson'");
      aG.append('text').attr('x',hx).attr('y',hy-42).attr('text-anchor','middle')
        .attr('font-family','var(--font-mono)').attr('font-size',10).attr('fill','#7A8F9E').text('6,796');
    }

    // 2019 — Peak (hero with pill)
    const peak = data.find(d=>d.year===2019);
    if(peak){ const px=x(2019),py=y(peak.count); dot(px,py,'#F2A623',7);
      const pillW=120,pillH=26;
      aG.append('rect').attr('x',px-pillW/2).attr('y',py-42).attr('width',pillW).attr('height',pillH)
        .attr('rx',13).attr('fill','#F2A623').attr('opacity',0.18);
      aG.append('text').attr('x',px).attr('y',py-24).attr('text-anchor','middle')
        .attr('font-family','var(--font-mono)').attr('font-size',15).attr('font-weight',700).attr('fill','#F2A623')
        .text('Peak: 11,401');
    }

    // 2020 — COVID
    const covid = data.find(d=>d.year===2020);
    if(covid){ const cvx=x(2020),cvy=y(covid.count); dot(cvx,cvy,'#7A8F9E');
      aG.append('line').attr('x1',cvx).attr('y1',cvy+8).attr('x2',cvx).attr('y2',cvy+38)
        .attr('stroke','#7A8F9E').attr('stroke-width',1).attr('stroke-dasharray','3,4').attr('opacity',0.5);
      aG.append('text').attr('x',cvx).attr('y',cvy+52).attr('text-anchor','middle')
        .attr('font-family','var(--font-display)').attr('font-size',12).attr('fill','#7A8F9E').text('COVID-19');
      aG.append('text').attr('x',cvx).attr('y',cvy+66).attr('text-anchor','middle')
        .attr('font-family','var(--font-mono)').attr('font-size',10).attr('fill','#7A8F9E').attr('opacity',0.7)
        .text('−42% drop → 6,624');
    }

    // 2022 — Near-peak recovery
    const r22 = data.find(d=>d.year===2022);
    if(r22){ const rx=x(2022),ry=y(r22.count); dot(rx,ry,'#5DCAA5');
      aG.append('text').attr('x',rx+8).attr('y',ry-10).attr('text-anchor','start')
        .attr('font-family','var(--font-mono)').attr('font-size',11).attr('font-weight',700).attr('fill','#5DCAA5')
        .text('11,163');
      aG.append('text').attr('x',rx+8).attr('y',ry+4).attr('text-anchor','start')
        .attr('font-family','var(--font-display)').attr('font-size',10).attr('fill','#7A8F9E').text('Near-peak recovery');
    }

    // 2023 — End value
    const e = data[data.length-1];
    if(e){ dot(x(e.year),y(e.count),'#5DCAA5');
      aG.append('text').attr('x',x(e.year)-10).attr('y',y(e.count)-14).attr('text-anchor','end')
        .attr('font-family','var(--font-mono)').attr('font-size',13).attr('font-weight',700).attr('fill','#C2D1DC')
        .text(e.count.toLocaleString());
    }

    // ── Growth rate callout inside highlighted zone ──
    aG.append('text').attr('x',(x(2014)+x(2019))/2).attr('y',innerH-16).attr('text-anchor','middle')
      .attr('font-family','var(--font-mono)').attr('font-size',20).attr('font-weight',700)
      .attr('fill','#F2A623').attr('opacity',0.55).text('+23%');
    aG.append('text').attr('x',(x(2014)+x(2019))/2).attr('y',innerH-2).attr('text-anchor','middle')
      .attr('font-family','var(--font-display)').attr('font-size',10)
      .attr('fill','#F2A623').attr('opacity',0.4).text('in just 5 years');

    // ═══ INTERACTIVE HOVER ═══
    const hoverLine = g.append('line').attr('y1',0).attr('y2',innerH)
      .attr('stroke','rgba(194,209,220,0.25)').attr('stroke-dasharray','4,4').style('display','none');
    const hoverGlow = g.append('circle').attr('r',14).attr('fill','#5DCAA5').attr('opacity',0.15).style('display','none');
    const hoverDot = g.append('circle').attr('r',6).attr('fill','#5DCAA5').attr('stroke','#0F1923').attr('stroke-width',2.5).style('display','none');
    const tooltip = g.append('g').style('display','none');
    tooltip.append('rect').attr('width',120).attr('height',46).attr('rx',8)
      .attr('fill','#1B3A4B').attr('stroke','rgba(93,202,165,0.3)').attr('stroke-width',1);
    const ttYear = tooltip.append('text').attr('x',12).attr('y',18)
      .attr('font-family','var(--font-mono)').attr('font-size',11).attr('fill','#7A8F9E');
    const ttCount = tooltip.append('text').attr('x',12).attr('y',36)
      .attr('font-family','var(--font-mono)').attr('font-size',14).attr('font-weight',700).attr('fill','#FFFFFF');
    const bisect = d3.bisector(d=>d.year).left;

    g.append('rect').attr('width',innerW).attr('height',innerH).attr('fill','transparent')
      .on('mousemove', function(event) {
        const [mx] = d3.pointer(event);
        const yr = x.invert(mx);
        const idx = bisect(data,yr,1);
        const d0=data[idx-1], d1=data[idx]; if(!d0) return;
        const d = (!d1||yr-d0.year<d1.year-yr)?d0:d1;
        const cx=x(d.year), cy=y(d.count);
        hoverLine.attr('x1',cx).attr('x2',cx).style('display',null);
        hoverDot.attr('cx',cx).attr('cy',cy).style('display',null);
        hoverGlow.attr('cx',cx).attr('cy',cy).style('display',null);
        const flip = cx > innerW-140;
        tooltip.attr('transform',`translate(${flip?cx-128:cx+12},${cy-28})`).style('display',null);
        ttYear.text(d.year);
        ttCount.text(d.count.toLocaleString()+' strikes');
      })
      .on('mouseleave', function() {
        [hoverLine,hoverDot,hoverGlow,tooltip].forEach(el=>el.style('display','none'));
      });

  }, [data, sparkW, hasAnimated]);

  return (<div ref={containerRef} style={{width:'100%'}}><svg ref={svgRef} width={sparkW} height={SPARK_H} style={{display:'block'}} /></div>);
}

function RadialBar({ data }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!containerRef.current || hasAnimated) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHasAnimated(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [hasAnimated]);

  useEffect(() => {
    if (!data.length || !svgRef.current || !hasAnimated) return;
    const SIZE = 580, cx = SIZE/2, cy = SIZE/2, innerR = 70, outerMaxR = 220;
    const svg = d3.select(svgRef.current); svg.selectAll('*').remove();
    svg.attr('width', SIZE).attr('height', SIZE);

    const defs = svg.append('defs');
    const glow = defs.append('filter').attr('id','barGlow').attr('x','-50%').attr('y','-50%').attr('width','200%').attr('height','200%');
    glow.append('feGaussianBlur').attr('stdDeviation',8).attr('result','blur');
    const mg = glow.append('feMerge'); mg.append('feMergeNode').attr('in','blur'); mg.append('feMergeNode').attr('in','SourceGraphic');

    const maxCount = d3.max(data, d => d.count);
    const totalCount = d3.sum(data, d => d.count);
    const rScale = d3.scaleLinear().domain([0, maxCount]).range([innerR, outerMaxR]);
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const sorted = [...data].sort((a,b) => a.month - b.month);
    const angleStep = (2*Math.PI)/12, startAngle = -Math.PI/2;
    const peakMonths = new Set([7,8,9,10]); // Jul-Oct

    // Concentric guide circles
    [0.25,0.5,0.75,1.0].forEach(lvl => {
      const r = innerR + (outerMaxR - innerR) * lvl;
      svg.append('circle').attr('cx',cx).attr('cy',cy).attr('r',r)
        .attr('fill','none').attr('stroke','rgba(194,209,220,0.09)').attr('stroke-dasharray','3,5');
    });

    // Peak season background arc (Jul-Oct only — indices 6,7,8,9)
    const peakArc = d3.arc().innerRadius(innerR-6).outerRadius(outerMaxR+10)
      .startAngle(startAngle + 6*angleStep - angleStep*0.5)
      .endAngle(startAngle + 9*angleStep + angleStep*0.5);
    svg.append('path').attr('transform',`translate(${cx},${cy})`)
      .attr('d', peakArc()).attr('fill','#E8593C').attr('opacity',0.06);

    // Color tiers — red dominates, others faded
    const getColor = (count) => count > 23000 ? '#E8593C' : count > 15000 ? '#F2A623' : '#5DCAA5';
    const getOpacity = (count) => count > 23000 ? 0.90 : count > 15000 ? 0.25 : 0.18;

    // Bars with animation
    sorted.forEach((d,i) => {
      const angle = startAngle + i*angleStep;
      const barR = rScale(d.count);
      const halfBar = angleStep*0.43;
      const color = getColor(d.count);
      const opacity = getOpacity(d.count);
      const isPeak = peakMonths.has(d.month);

      const arcGen = d3.arc().innerRadius(innerR).outerRadius(barR)
        .startAngle(angle - halfBar).endAngle(angle + halfBar).cornerRadius(3);
      const arcZero = d3.arc().innerRadius(innerR).outerRadius(innerR)
        .startAngle(angle - halfBar).endAngle(angle + halfBar).cornerRadius(3);

      // Animated bar
      const bar = svg.append('path').attr('transform',`translate(${cx},${cy})`)
        .attr('d', arcZero()).attr('fill', color).attr('opacity', opacity);
      bar.transition().delay(i*60).duration(600).ease(d3.easeCubicOut).attrTween('d', function() {
        const interp = d3.interpolate(innerR, barR);
        return function(t) {
          return d3.arc().innerRadius(innerR).outerRadius(interp(t))
            .startAngle(angle-halfBar).endAngle(angle+halfBar).cornerRadius(3)();
        };
      });

      // Month label (bold white for peak, gray for others)
      const labelR = outerMaxR + 26;
      const lx = cx + labelR*Math.sin(angle), ly = cy - labelR*Math.cos(angle);
      svg.append('text').attr('x',lx).attr('y',ly)
        .attr('text-anchor','middle').attr('dominant-baseline','middle')
        .attr('font-family','var(--font-display)')
        .attr('font-size', isPeak ? 13 : 11)
        .attr('font-weight', isPeak ? 700 : 400)
        .attr('fill', isPeak ? '#FFFFFF' : '#7A8F9E')
        .text(monthNames[i]);

      // ALL months get value labels
      const countStr = d.count >= 1000 ? (d.count/1000).toFixed(1)+'K' : d.count.toString();
      const valR = barR > innerR + 30 ? barR - 14 : barR + 14;
      const valFill = barR > innerR + 30 ? '#FFFFFF' : '#7A8F9E';
      const vlx = cx + valR*Math.sin(angle), vly = cy - valR*Math.cos(angle);
      const valEl = svg.append('text').attr('x',vlx).attr('y',vly)
        .attr('text-anchor','middle').attr('dominant-baseline','middle')
        .attr('font-family','var(--font-mono)')
        .attr('font-size', isPeak ? 11 : 9).attr('font-weight',700)
        .attr('fill', valFill).attr('opacity',0);
      valEl.transition().delay(i*60+400).duration(400).attr('opacity', isPeak ? 0.95 : 0.7);
    });

    // "PEAK SEASON" arc label
    const peakLabelR = outerMaxR + 46;
    const peakLabelAngle = startAngle + 8.5*angleStep;
    svg.append('text')
      .attr('x', cx + peakLabelR*Math.sin(peakLabelAngle))
      .attr('y', cy - peakLabelR*Math.cos(peakLabelAngle))
      .attr('text-anchor','middle').attr('dominant-baseline','middle')
      .attr('font-family','var(--font-display)').attr('font-size',9)
      .attr('letter-spacing','2px').attr('font-weight',600)
      .attr('fill','#E8593C').attr('opacity',0.7)
      .text('PEAK SEASON');

    // Center text
    svg.append('text').attr('x',cx).attr('y',cy-14).attr('text-anchor','middle')
      .attr('font-family','var(--font-display)').attr('font-weight',600).attr('font-size',15)
      .attr('fill','#C2D1DC').text('Seasonal');
    svg.append('text').attr('x',cx).attr('y',cy+6).attr('text-anchor','middle')
      .attr('font-family','var(--font-display)').attr('font-weight',600).attr('font-size',15)
      .attr('fill','#C2D1DC').text('pattern');
    svg.append('text').attr('x',cx).attr('y',cy+28).attr('text-anchor','middle')
      .attr('font-family','var(--font-display)').attr('font-size',12)
      .attr('fill','#F2A623').text('Peak: Aug–Oct');

    // Interactive hover overlay
    sorted.forEach((d,i) => {
      const angle = startAngle + i*angleStep;
      const barR = rScale(d.count);
      const halfBar = angleStep*0.48;
      const hitArc = d3.arc().innerRadius(0).outerRadius(outerMaxR+20)
        .startAngle(angle-halfBar).endAngle(angle+halfBar);

      svg.append('path').attr('transform',`translate(${cx},${cy})`)
        .attr('d', hitArc()).attr('fill','transparent').attr('cursor','pointer')
        .on('mouseenter', function() {
          // Tooltip
          const tipAngle = angle;
          const tipR = outerMaxR + 66;
          const tx = cx + tipR*Math.sin(tipAngle);
          const ty = cy - tipR*Math.cos(tipAngle);
          const pct = ((d.count/totalCount)*100).toFixed(1);

          svg.selectAll('.radial-tip').remove();
          const tip = svg.append('g').attr('class','radial-tip');
          tip.append('rect').attr('x',tx-60).attr('y',ty-22).attr('width',120).attr('height',44)
            .attr('rx',8).attr('fill','#1B3A4B').attr('stroke','rgba(93,202,165,0.3)').attr('stroke-width',1);
          tip.append('text').attr('x',tx).attr('y',ty-4).attr('text-anchor','middle')
            .attr('font-family','var(--font-mono)').attr('font-size',13).attr('font-weight',700)
            .attr('fill','#FFFFFF').text(d.count.toLocaleString()+' strikes');
          tip.append('text').attr('x',tx).attr('y',ty+14).attr('text-anchor','middle')
            .attr('font-family','var(--font-mono)').attr('font-size',10)
            .attr('fill','#7A8F9E').text(pct+'% of total');
        })
        .on('mouseleave', function() { svg.selectAll('.radial-tip').remove(); });
    });

  }, [data, hasAnimated]);

  return (
    <div ref={containerRef}>
      <svg ref={svgRef} width={580} height={580} style={{ display:'block' }} />
    </div>
  );
}

// Color legend item
function LegendItem({ color, label, description }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
      <div style={{ width:14, height:14, borderRadius:3, background:color, flexShrink:0, opacity:0.85 }} />
      <div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'13px', fontWeight:600, color:'#C2D1DC' }}>{label}</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:'11px', color:'#7A8F9E', marginTop:'2px' }}>{description}</div>
      </div>
    </div>
  );
}

export default function Section1Hook() {
  const [yearlyData, setYearlyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  useEffect(() => {
    d3.csv('/data/agg_yearly.csv', d3.autoType).then(setYearlyData);
    d3.csv('/data/agg_monthly.csv', d3.autoType).then(setMonthlyData);
  }, []);
  const latestYear = yearlyData.length ? yearlyData[yearlyData.length-1] : null;
  const dailyRate = latestYear ? Math.round(latestYear.count/365) : 21;

  // Compute peak stats for insight panel
  const peakTotal = monthlyData.filter(d => [7,8,9,10].includes(d.month)).reduce((s,d) => s+d.count, 0);
  const grandTotal = monthlyData.reduce((s,d) => s+d.count, 0);
  const peakPct = grandTotal ? Math.round((peakTotal/grandTotal)*100) : 0;

  return (
    <div className="section">
      {/* ── ROW 1: Hero stat + Sparkline ── */}
      <div style={{ display:'flex', alignItems:'flex-start', gap:`${GAP}px`, marginBottom:'36px' }}>
        <div style={{ width:`${STAT_W}px`, flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:'96px', lineHeight:1, color:'#FFFFFF', letterSpacing:'-2px' }}>{dailyRate}</div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:300, fontSize:'16px', color:'var(--text-secondary)', marginTop:'8px' }}>wildlife strikes per day</div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:300, fontSize:'13px', color:'var(--text-secondary)', opacity:0.7, marginTop:'4px' }}>on commercial flights in the U.S.</div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:300, fontSize:'12px', fontStyle:'italic', color:'var(--color-safe)', opacity:0.85, marginTop:'12px' }}>That's roughly one every 70 minutes</div>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'11px', letterSpacing:'2px', textTransform:'uppercase', color:'var(--text-secondary)', marginBottom:'10px' }}>
            Strikes have grown 6× since 1990
          </div>
          <Sparkline data={yearlyData} />
        </div>
      </div>

      {/* ── Narrative bridge ── */}
      <div style={{ textAlign:'center', marginBottom:'14px' }}>
        <span style={{ fontFamily:'var(--font-display)', fontStyle:'italic', fontSize:'12px', color:'var(--text-secondary)' }}>When do strikes peak?</span>
      </div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'11px', letterSpacing:'3px', textTransform:'uppercase', color:'var(--text-secondary)', marginBottom:'24px', textAlign:'center' }}>
        Late summer is the highest-risk window
      </div>

      {/* ── ROW 2: Radial chart LEFT + Legend/Insights RIGHT ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'120px' }}>
        {/* LEFT: Radial bar chart */}
        <div style={{ flexShrink:0 }}>
          <RadialBar data={monthlyData} />
        </div>

        {/* RIGHT: Legend + Insights — toward center */}
        <div style={{ width:'340px', flexShrink:0 }}>
          {/* Color Legend */}
          <div style={{ fontFamily:'var(--font-display)', fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', color:'#7A8F9E', marginBottom:'16px' }}>
            Risk Level by Month
          </div>
          <LegendItem color="#E8593C" label="High Risk — over 23K strikes" description="Aug, Sep, Oct — peak migration overlap" />
          <LegendItem color="#F2A623" label="Moderate — 15K to 23K strikes" description="Apr, May, Jun, Jul — migration ramp-up" />
          <LegendItem color="#5DCAA5" label="Low Risk — under 15K strikes" description="Jan, Feb, Mar, Nov, Dec — winter lull" />

          {/* Divider */}
          <div style={{ borderTop:'1px solid rgba(194,209,220,0.1)', margin:'20px 0' }} />

          {/* Key Insight Stat */}
          <div style={{ fontFamily:'var(--font-display)', fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', color:'#7A8F9E', marginBottom:'12px' }}>
            Key Insight
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:'10px', marginBottom:'8px' }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:'42px', fontWeight:700, color:'#E8593C', lineHeight:1 }}>{peakPct}%</span>
            <span style={{ fontFamily:'var(--font-display)', fontSize:'14px', color:'#C2D1DC' }}>of all strikes</span>
          </div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:'13px', color:'#7A8F9E', lineHeight:1.6 }}>
            happen in just <span style={{ color:'#FFFFFF', fontWeight:600 }}>4 months</span> (Jul–Oct). Bird migration seasons create a predictable danger window every year.
          </div>

          {/* Divider */}
          <div style={{ borderTop:'1px solid rgba(194,209,220,0.1)', margin:'20px 0' }} />

          {/* Secondary insight */}
          <div style={{ fontFamily:'var(--font-display)', fontSize:'12px', fontStyle:'italic', color:'var(--text-secondary)', lineHeight:1.6 }}>
            The safest months are <span style={{ color:'#5DCAA5' }}>January</span> and <span style={{ color:'#5DCAA5' }}>February</span>, with 75% fewer strikes than peak months.
          </div>
        </div>
      </div>
    </div>
  );
}
