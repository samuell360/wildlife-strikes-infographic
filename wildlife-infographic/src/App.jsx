import './styles/globals.css';
import Header from './components/Header';
import Section1Hook from './components/Section1Hook';
import Section2FlightPath from './components/Section2FlightPath';
import Section3Waffle from './components/Section3Waffle';
import Section4Sankey from './components/Section4Sankey';
import Section5Map from './components/Section5Map';
import Section6Closing from './components/Section6Closing';

export default function App() {
  return (
    <div className="infographic-container">
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
