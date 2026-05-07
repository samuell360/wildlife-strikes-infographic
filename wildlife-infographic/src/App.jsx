import { useRef, useEffect } from 'react';
import './styles/globals.css';
import Header from './components/Header';
import Section1Hook from './components/Section1Hook';
import Section2FlightPath from './components/Section2FlightPath';
import Section3Waffle from './components/Section3Waffle';
import Section4Sankey from './components/Section4Sankey';
import Section5Map from './components/Section5Map';
import Section6Closing from './components/Section6Closing';

export default function App() {
  const containerRef = useRef(null);

  useEffect(() => {
    function fixHeight() {
      const el = containerRef.current;
      if (!el) return;
      if (window.innerWidth < 1100) {
        const scale = window.innerWidth / 1080;
        // Remove the extra document-flow space that transform:scale() leaves.
        // The container is H px tall in layout but only H*scale px tall visually.
        // A negative margin-bottom of -H*(1-scale) collapses that gap.
        const extra = el.scrollHeight * (1 - scale);
        el.style.marginBottom = `-${extra}px`;
      } else {
        el.style.marginBottom = '';
      }
    }

    fixHeight();
    window.addEventListener('resize', fixHeight);
    // Re-run after D3 charts finish rendering
    const t1 = setTimeout(fixHeight, 1500);
    const t2 = setTimeout(fixHeight, 3500);

    return () => {
      window.removeEventListener('resize', fixHeight);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div ref={containerRef} className="infographic-container">
      <Header />
      <Section1Hook />
      <Section2FlightPath />
      <Section3Waffle />
      <Section4Sankey />
      <Section5Map />
      <Section6Closing />
    </div>
  );
}
