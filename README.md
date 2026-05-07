# AtmosIQ — Weather Intelligence Dashboard

A responsive React weather application powered by the Open-Meteo API.

## Features

### Page 1 — Current Weather & Hourly Forecast
- **Auto GPS Detection** on page load (falls back to New Delhi if denied)
- **Date picker** — view any past or present date
- **°C / °F toggle** for all temperature displays
- **Stat cards**: Temp (current/min/max), Humidity, Precipitation, UV Index, Sunrise/Sunset, Max Wind, Precip Probability, AQI, PM10, PM2.5, CO, NO₂, SO₂
- **6 hourly charts**: Temperature, Humidity, Precipitation (bar), Visibility, Wind Speed, PM10+PM2.5

### Page 2 — Historical Analysis
- **Date range picker** with 2-year max enforcement
- **5 trend charts**: Temperature (mean/max/min), Sun Cycle in IST, Precipitation (bar), Wind Max Speed, PM10+PM2.5 with WHO guidelines
- Dense dataset handling with adaptive X-axis tick intervals

### Chart Features (all charts)
- ↔ **Horizontal scrolling** for dense datasets
- 🔍 **Zoom in/out/reset** buttons (up to 4× width expansion)
- 📱 **Fully responsive** — single column on mobile

## Tech Stack
- **React 18** + Vite
- **Recharts** for all data visualizations
- **Open-Meteo API** (free, no API key required)
  - Forecast: `api.open-meteo.com`
  - Archive: `archive-api.open-meteo.com`
  - Air Quality: `air-quality-api.open-meteo.com`
- **Nominatim** (OpenStreetMap) for reverse geocoding

## Getting Started

```bash
npm install
npm run dev
```

Open ( atmost-iq-weather-app.vercel.app ) in your browser.

> ⚠️ Allow location access when prompted for auto-detect. If denied, defaults to New Delhi.

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── App.jsx                    # Root component, page routing
├── index.css                  # Design system (CSS variables, global styles)
├── hooks/
│   └── useLocation.js         # GPS + reverse geocoding
├── utils/
│   └── weather.js             # Open-Meteo API calls + data helpers
├── components/
│   ├── Navbar.jsx             # Sticky nav with page tabs
│   ├── StatCard.jsx           # Individual metric card
│   └── ChartPanel.jsx         # Scrollable + zoomable chart wrapper
└── pages/
    ├── CurrentWeather.jsx     # Page 1
    └── Historical.jsx         # Page 2
```

## API Notes

- **No API key needed** — Open-Meteo is free and open
- Air quality historical data available from **2022-07-29** onwards
- For dates before this, PM10/PM2.5 charts will show no data
- CO₂ is not available in Open-Meteo's free tier (shown as "—")
- IST (Indian Standard Time = UTC+5:30) is used for sunrise/sunset display
