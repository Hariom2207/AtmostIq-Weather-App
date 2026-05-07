// Open-Meteo API utilities

export async function fetchCurrentWeather(lat, lon, date) {
  const todayStr = new Date().toISOString().split('T')[0];
  const dateStr = date || todayStr;
  const isPast = dateStr < todayStr;

  // Use archive API for past dates, forecast for today/future
  const weatherUrl = isPast
    ? `https://archive-api.open-meteo.com/v1/archive?` +
      `latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,relative_humidity_2m,precipitation,visibility,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max,precipitation_probability_max` +
      `&start_date=${dateStr}&end_date=${dateStr}` +
      `&timezone=auto`
    : `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,uv_index` +
      `&hourly=temperature_2m,relative_humidity_2m,precipitation,visibility,wind_speed_10m,uv_index` +
      `&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max,precipitation_probability_max` +
      `&start_date=${dateStr}&end_date=${dateStr}` +
      `&timezone=auto`;

  const [weatherRes, airRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?` +
      `latitude=${lat}&longitude=${lon}` +
      `&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,uv_index,european_aqi` +
      `&start_date=${dateStr}&end_date=${dateStr}` +
      `&timezone=auto`
    )
  ]);

  const weather = await weatherRes.json();
  const air = await airRes.json();
  return { weather, air, isPast };
}

export async function fetchHistoricalWeather(lat, lon, startDate, endDate) {
  const [weatherRes, airRes] = await Promise.all([
    fetch(
      `https://archive-api.open-meteo.com/v1/archive?` +
      `latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,sunrise,sunset,precipitation_sum,wind_speed_10m_max,wind_direction_10m_dominant` +
      `&start_date=${startDate}&end_date=${endDate}` +
      `&timezone=auto`
    ),
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?` +
      `latitude=${lat}&longitude=${lon}` +
      `&hourly=pm10,pm2_5` +
      `&start_date=${startDate}&end_date=${endDate}` +
      `&timezone=auto`
    )
  ]);

  const weather = await weatherRes.json();
  const air = await airRes.json();
  return { weather, air };
}

export function celsiusToFahrenheit(c) {
  return (c * 9/5) + 32;
}

export function getWMODescription(code) {
  const descriptions = {
    0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Icy Fog', 51: 'Light Drizzle', 53: 'Moderate Drizzle',
    55: 'Dense Drizzle', 61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
    71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow', 80: 'Slight Showers',
    81: 'Moderate Showers', 82: 'Violent Showers', 95: 'Thunderstorm',
    96: 'Thunderstorm w/ Hail', 99: 'Thunderstorm w/ Heavy Hail'
  };
  return descriptions[code] || 'Unknown';
}

export function getAQILabel(aqi) {
  if (aqi == null || isNaN(aqi)) return { label: 'N/A', color: 'var(--text-muted)' };
  if (aqi <= 20) return { label: 'Good', color: '#b5ff2d' };
  if (aqi <= 40) return { label: 'Fair', color: '#00e5ff' };
  if (aqi <= 60) return { label: 'Moderate', color: '#ffb300' };
  if (aqi <= 80) return { label: 'Poor', color: '#ff7043' };
  if (aqi <= 100) return { label: 'Very Poor', color: '#ff4d6d' };
  return { label: 'Hazardous', color: '#9c27b0' };
}

export function formatTime(isoStr) {
  if (!isoStr) return '--';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// Aggregate hourly air quality to daily average
export function aggregateAirQualityDaily(airData) {
  if (!airData?.hourly?.time) return [];
  const { time, pm10, pm2_5 } = airData.hourly;
  if (!time || !Array.isArray(time)) return [];
  const daily = {};
  time.forEach((t, i) => {
    const day = t.split('T')[0];
    if (!daily[day]) daily[day] = { pm10: [], pm2_5: [] };
    if (pm10?.[i] != null) daily[day].pm10.push(pm10[i]);
    if (pm2_5?.[i] != null) daily[day].pm2_5.push(pm2_5[i]);
  });
  return Object.entries(daily).map(([date, vals]) => ({
    date,
    pm10: vals.pm10.length ? +(vals.pm10.reduce((a,b) => a+b,0)/vals.pm10.length).toFixed(1) : null,
    pm2_5: vals.pm2_5.length ? +(vals.pm2_5.reduce((a,b) => a+b,0)/vals.pm2_5.length).toFixed(1) : null,
  }));
}

export function windDegToDir(deg) {
  if (deg == null) return '—';
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg/45) % 8];
}
