import { useRef, useEffect, useState } from 'react';
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
  const [wrapperHeight, setWrapperHeight] = useState('auto');

  useEffect(() => {
    function updateHeight() {
      if (containerRef.current && window.innerWidth < 1100) {
        const scale = window.innerWidth / 1080;
        const actualHeight = containerRef.current.scrollHeight * scale;
        setWrapperHeight(actualHeight + 'px');
      } else {
        setWrapperHeight('auto');
      }
    }

    updateHeight();
    window.addEventListener('resize', updateHeight);
    // Re-check after D3 charts finish rendering
    const timer = setTimeout(updateHeight, 2500);

    return () => {
      window.removeEventListener('resize', updateHeight);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div style={{ height: wrapperHeight, overflow: 'hidden' }}>
      <div ref={containerRef} className="infographic-container">
        <Header />
        <Section1Hook />
        <Section2FlightPath />
        <Section3Waffle />
        <Section4Sankey />
        <Section5Map />
        <Section6Closing />
      </div>
    </div>
  );
}
