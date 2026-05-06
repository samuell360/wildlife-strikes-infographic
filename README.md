# When Wildlife Hits Aircraft

A data journalism infographic built on the FAA National Wildlife Strike Database (1990-2023), covering 200,000+ commercial aviation strikes across the United States.

**Live demo:** https://wildlife-strikes-infographic-o4u3tr1bn.vercel.app

![Preview](preview.png)

---

## What it shows

Six interactive sections tell the full story of wildlife strikes in U.S. commercial aviation:

1. **The Scale** - Animated sparkline of yearly strike volume since 1990, with a radial bar chart of seasonal patterns
2. **The Danger Zone** - Bubble chart on a flight path arc showing where in flight strikes occur
3. **The 9%** - Waffle chart showing that 91% of strikes cause zero damage
4. **Who Causes the Damage** - Sankey diagram tracing the top species through flight phase to aircraft component
5. **Where it Happens** - Proportional symbol map of top U.S. airports by strike volume
6. **The Consequences** - Final stats: 62 aircraft destroyed, 223 injured, 24 fatalities over 33 years

---

## Tech stack

| Layer | Tool |
|---|---|
| Framework | React 19 |
| Build | Vite 8 |
| Visualization | D3 v7, d3-sankey, TopoJSON |
| Styling | Vanilla CSS with custom properties |
| Fonts | Outfit + JetBrains Mono (Google Fonts) |
| Export | Puppeteer (export_png.js) |

**Production build:** 337 KB JS + 1.87 KB CSS

---

## Data pipeline

Raw FAA data (`STRIKE_REPORTS.csv`) is processed by `process_strikes.py` into 7 aggregated CSVs:

| File | Rows | Used by |
|---|---|---|
| `agg_yearly.csv` | 34 | Section 1 - sparkline |
| `agg_monthly.csv` | 12 | Section 1 - radial chart |
| `agg_phase.csv` | 10 | Section 2 - bubble chart |
| `agg_damage.csv` | 2 | Section 3 - waffle chart |
| `sankey_links.csv` | 75 | Section 4 - Sankey diagram |
| `agg_airports.csv` | ~50 | Section 5 - map |
| `agg_closing.csv` | 5 | Section 6 - consequence stats |

The raw 37 MB dataset and intermediate files are excluded from this repo. Run `process_strikes.py` with `STRIKE_REPORTS.csv` from the [FAA Wildlife Strike Database](https://wildlife.faa.gov/home) to regenerate them.

---

## Running locally

```bash
cd wildlife-infographic
npm install
npm run dev
```

Open http://localhost:5173

---

## Exporting the infographic

```bash
# Start the dev server first, then in a separate terminal:
node export_png.js
```

Generates `Final_Infographic.png` and `Final_Infographic.pdf` at 2x resolution.

---

## Project structure

```
wildlife-strikes-infographic/
  ├── .gitignore
  ├── README.md
  ├── preview.png
  ├── process_strikes.py          # Full data pipeline: raw FAA CSV -> 7 aggregated files
  ├── wildlife-infographic/
  │   ├── index.html
  │   ├── package.json
  │   ├── vite.config.js
  │   ├── export_png.js           # Puppeteer export script
  │   ├── src/
  │   │   ├── main.jsx
  │   │   ├── App.jsx
  │   │   ├── styles/
  │   │   │   └── globals.css
  │   │   └── components/         # 7 components, 1,687 total lines
  │   │       ├── Header.jsx
  │   │       ├── Section1Hook.jsx
  │   │       ├── Section2FlightPath.jsx
  │   │       ├── Section3Waffle.jsx
  │   │       ├── Section4Sankey.jsx
  │   │       ├── Section5Map.jsx
  │   │       └── Section6Closing.jsx
  │   └── public/
  │       └── data/               # 7 aggregated CSVs, < 50 KB total
```

---

## Data source

FAA National Wildlife Strike Database, 1990-2023. Filtered for commercial aircraft (AC_CLASS = A).

**Course:** DTA 350 Capstone - Rollins College - 2026
**Author:** Samuel
