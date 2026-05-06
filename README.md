# When Wildlife Hits Aircraft

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Python](https://img.shields.io/badge/Python-14354C?style=for-the-badge&logo=python&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-F9A03C?style=for-the-badge&logo=d3.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

Commercial aircraft in the U.S. collide with wildlife 21 times per day. The FAA has tracked every reported strike since 1990, but that data has only ever existed as a 288,810-row government spreadsheet that nobody outside aviation safety has ever seen. I took the full dataset and turned it into a visual story anyone can read in about 3 minutes.

[**(https://wildlife-strikes-infographic-o4u3tr1bn.vercel.app)**

![Infographic Preview](./preview.png)

---

## The Problem

Over 200,000 wildlife strikes have been reported on U.S. commercial flights since 1990. But the public has no way to actually understand what that means. Most people either have no idea this happens at all, or they remember Sully's emergency landing and think every strike is a catastrophe. Neither is right. The data tells a much more interesting story.

## What the Data Shows

- **21 strikes per day** on commercial flights. Roughly one every 70 minutes.
- **91% cause zero damage.** But the 9% that do follow predictable patterns.
- **69% of strikes happen below 500 feet** during approach and landing. Cruising altitude is almost strike-free.
- **4.3x seasonal spike** between August (27,363 strikes) and February (6,349), driven by bird migration.
- **Canada Geese and white-tailed deer** represent under 2% of total strikes but cause a disproportionate share of destroyed aircraft.
- **Memphis International ranks #3 nationally** for strikes, ahead of Chicago O'Hare, because of FedEx's nighttime cargo hub lining up with peak bird activity.
- **33 years of data:** 62 aircraft destroyed, 1.2M days grounded, 223 injuries, 24 fatalities.

---

## How I Built It

- **Data pipeline:** Took the raw FAA dataset (288,810 rows, 100 columns, 186MB) and filtered it down to 202,514 commercial aircraft strikes. Cleaned species names, derived component-struck rollups from 11 boolean fields, and exported 7 pre-aggregated CSV files totaling under 50KB. The browser never touches the full dataset.

- **7 custom D3 charts:** Annotated timeline with markers for the Miracle on the Hudson, the 2019 peak, the COVID dip, and the recovery. Radial bar chart styled like a radar screen for seasonal patterns. Flight path diagram with proportional bubbles and a 500ft danger zone annotation. Waffle chart for the 91/9 damage split. Sankey flow diagram tracing 18,619 damaging strikes from species through flight phase to damaged component. US bubble map of the top airports. Closing stat cards.

- **Design system:** Dark navy background to fit the aviation cockpit theme and make the data colors pop. Five-color palette where teal means safe and coral means danger, so by the time you reach the waffle chart your eye already knows which squares are the bad ones without reading a legend. Every chart title states the finding, not the chart type.

### Tech Stack

| Component | Technology |
| :--- | :--- |
| Data pipeline | Python, pandas |
| Frontend | React 19, Vite 8 |
| Visualization | D3.js v7, d3-sankey, topojson-client |
| Export | Puppeteer |
| Deployment | Vercel |

Production build: 337 KB JS + 1.87 KB CSS

---

## Run Locally

```bash
cd wildlife-infographic
npm install
npm run dev
```

Open http://localhost:5173

## Data Source

[FAA National Wildlife Strike Database](https://wildlife.faa.gov/home) (1990-2023). Commercial aircraft only (AC_CLASS = A). Public domain, zero PII.

---

*Built by Samuel | Supervised by Professor Jasser Jasser | DTA 350 Capstone | Rollins College | 2026*
