import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

function stripPrefix(name) {
  return name.replace(/^(species:|phase:|component:)/, '');
}

// species color map — top 3 are vivid, rest are muted
function getSpeciesColor(id) {
  if (id === 'species:White-tailed deer') return '#E8593C'; // Red/Orange
  if (id === 'species:Canada goose') return '#5DCAA5';      // Teal
  if (id === 'species:Gulls') return '#F2A623';             // Amber
  return '#4A5D6E';                                         // Faint gray for minor species
}

export default function Section4Sankey() {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [links, setLinks] = useState([]);
  const [chartW, setChartW] = useState(1040);

  useEffect(() => {
    d3.csv('/data/sankey_links.csv', d3.autoType).then(setLinks);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      const w = containerRef.current.getBoundingClientRect().width;
      // Clamp to desktop size: on mobile the container is scaled down via CSS
      // transform, so getBoundingClientRect() returns the scaled size. We always
      // want to render at full desktop width and let the transform handle scaling.
      if (w > 0) setChartW(Math.max(Math.floor(w), 1040));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!links.length || !svgRef.current) return;

    // 1. Filter out the junk data that obscured the real story
    const filteredLinks = links.filter(l => 
      l.source !== 'species:Unknown bird' && 
      l.source !== 'species:Other'
    );

    const W = chartW, H = 540; // Increased height to give labels breathing room
    const margin = { top: 50, right: 160, bottom: 20, left: 160 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Build unique node list preserving prefix for collision prevention
    const nodeSet = new Set();
    filteredLinks.forEach(l => { nodeSet.add(l.source); nodeSet.add(l.target); });
    const nodes = Array.from(nodeSet).map(id => ({ id }));
    const nodeIndex = Object.fromEntries(nodes.map((n, i) => [n.id, i]));

    const sankeyLinks = filteredLinks.map(l => ({
      source: nodeIndex[l.source],
      target: nodeIndex[l.target],
      value: +l.value,
    }));

    const sankeyGen = sankey()
      .nodeWidth(20)
      .nodePadding(18)
      .extent([[margin.left, margin.top], [W - margin.right, H - margin.bottom]]);

    const { nodes: sNodes, links: sLinks } = sankeyGen({
      nodes: nodes.map(d => ({ ...d })),
      links: sankeyLinks.map(d => ({ ...d })),
    });

    const g = svg.append('g');

    // Column labels
    const columns = [
      { label: 'Identified Species', x: margin.left + 10 },
      { label: 'Phase of flight', x: W / 2 },
      { label: 'Damaged component', x: W - margin.right - 10 },
    ];
    columns.forEach(col => {
      g.append('text')
        .attr('x', col.x).attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-family', 'var(--font-display)')
        .attr('font-size', 12)
        .attr('letter-spacing', 2)
        .attr('text-transform', 'uppercase')
        .attr('fill', '#7A8F9E')
        .attr('font-weight', 700)
        .text(col.label.toUpperCase());
    });

    // Links
    const linkHoverOpacity = 0.9;
    const linkDimOpacity = 0.05;

    function getDefaultOpacity(d) {
      const srcId = d.source.id;
      if (srcId === 'species:White-tailed deer' || srcId === 'species:Canada goose' || srcId === 'species:Gulls') {
        return 0.75; // Deep, vibrant colors for the top 3
      }
      if (srcId.startsWith('species:')) {
        return 0.15; // Very faint for minor birds
      }
      return 0.3; // Luminous silver for Phase -> Component to fix contrast
    }

    const paths = g.append('g')
      .selectAll('path')
      .data(sLinks)
      .join('path')
      .attr('class', 'sankey-link')
      .attr('d', sankeyLinkHorizontal())
      .attr('fill', 'none')
      .attr('stroke', d => {
        const srcId = d.source.id;
        if (srcId.startsWith('species:')) return getSpeciesColor(srcId);
        return '#8EA5B5'; // Brighter silver/blue to stand out against dark background
      })
      .attr('stroke-opacity', d => getDefaultOpacity(d))
      .attr('stroke-width', d => Math.max(1, d.width))
      .style('transition', 'stroke-opacity 0.2s ease')
      .on('mouseover', function(e, d) {
        d3.selectAll('.sankey-link').attr('stroke-opacity', linkDimOpacity);
        d3.select(this).attr('stroke-opacity', linkHoverOpacity);
      })
      .on('mouseout', function() {
        d3.selectAll('.sankey-link').attr('stroke-opacity', l => getDefaultOpacity(l));
      });

    // Nodes
    const rects = g.append('g')
      .selectAll('rect')
      .data(sNodes)
      .join('rect')
      .attr('class', 'sankey-node')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => Math.max(1, d.y1 - d.y0))
      .attr('fill', d => {
        if (d.id.startsWith('species:')) return getSpeciesColor(d.id);
        return '#7A8F9E'; // Neutral color for Phase and Component nodes
      })
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function(e, d) {
        // Highlight all links connected to this node
        d3.selectAll('.sankey-link').attr('stroke-opacity', l => {
          if (l.source.id === d.id || l.target.id === d.id) return linkHoverOpacity;
          return linkDimOpacity;
        });
      })
      .on('mouseout', function() {
        d3.selectAll('.sankey-link').attr('stroke-opacity', l => getDefaultOpacity(l));
      });

    // Node labels (Species, Phase, Component)
    sNodes.forEach(d => {
      const isLeft = d.x0 < W / 3;
      const isRight = d.x0 > W * 2 / 3;
      const label = stripPrefix(d.id);
      const midY = (d.y0 + d.y1) / 2;

      // Text legibility fix: Pure white, larger font
      g.append('text')
        .attr('x', isLeft ? d.x0 - 10 : isRight ? d.x1 + 10 : (d.x0 + d.x1) / 2)
        .attr('y', midY - 2)
        .attr('text-anchor', isLeft ? 'end' : isRight ? 'start' : 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-family', 'var(--font-display)')
        .attr('font-size', 13)
        .attr('font-weight', 600)
        .attr('fill', '#FFFFFF')
        .style('pointer-events', 'none')
        .text(label);

      g.append('text')
        .attr('x', isLeft ? d.x0 - 10 : isRight ? d.x1 + 10 : (d.x0 + d.x1) / 2)
        .attr('y', midY + 12)
        .attr('text-anchor', isLeft ? 'end' : isRight ? 'start' : 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', 11)
        .attr('fill', '#A1B4C4')
        .style('pointer-events', 'none')
        .text(d.value ? d.value.toLocaleString() : '');
    });

  }, [links, chartW]);

  return (
    <div className="section section-even" ref={containerRef} style={{ position: 'relative' }}>
      
      <div className="section-label" style={{ color: 'var(--color-danger)' }}>The 9% that matter</div>
      <div className="section-title" style={{ marginBottom: '20px' }}>Gulls, deer, and geese cause the most destruction</div>
        
      {/* Descriptive Annotation placed exactly between the middle and right columns */}
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '60%',
        maxWidth: '320px',
        fontSize: '13px',
        color: '#C2D1DC', // Slightly brighter for even better readability
        lineHeight: '1.5',
        textAlign: 'left',
        pointerEvents: 'none'
      }}>
        <strong style={{ color: '#FFFFFF' }}>How to read this chart:</strong><br />
        Hover over any species to trace its path. The thickness of the colored lines represents the volume of damaging strikes.
      </div>

      <div style={{ marginTop: '30px' }}>
        <svg ref={svgRef} width={chartW} height={540} style={{ display: 'block', overflow: 'visible' }} />
      </div>

      {/* Callout box */}
      <div style={{
        border: '1px solid var(--color-danger)',
        borderRadius: '8px',
        background: 'rgba(232,89,60,0.05)',
        padding: '20px 24px',
        marginTop: '40px',
        fontSize: '15px',
        color: '#C2D1DC',
        maxWidth: '720px',
        margin: '40px auto 0',
        lineHeight: '1.6',
      }}>
        <strong style={{ color: '#FFFFFF' }}>White-tailed deer</strong> account for{' '}
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-danger)', fontWeight: 800, fontSize: '16px' }}>
          1,038
        </span>{' '}
        damaging strikes, almost entirely during landing roll, hitting wings and landing gear.{' '}
        <span style={{ color: '#F2A623', fontWeight: 600 }}>Gulls</span> and{' '}
        <span style={{ color: '#5DCAA5', fontWeight: 600 }}>Canada geese</span> dominate the airspace threats during approach and climb phases.
      </div>
    </div>
  );
}
