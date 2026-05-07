import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import StatCard from '../components/StatCard';
import ChartPanel from '../components/ChartPanel';
import { fetchCurrentWeather, celsiusToFahrenheit, getAQILabel, formatTime } from '../utils/weather';
import styles from './CurrentWeather.module.css';

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1420',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  fontFamily: 'DM Mono, monospace',
  fontSize: '12px',
  color: '#f0f4ff',
};

export default function CurrentWeather({ location }) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tempUnit, setTempUnit] = useState('C');

  const loadData = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCurrentWeather(location.lat, location.lon, date);
      setData(result);
    } catch (e) {
      setError('Failed to load weather data.');
    } finally {
      setLoading(false);
    }
  }, [location, date]);

  useEffect(() => { loadData(); }, [loadData]);

  const convertTemp = (c) => tempUnit === 'F' ? celsiusToFahrenheit(c).toFixed(1) * 1 : c;
  const tempLabel = `°${tempUnit}`;

  if (loading) return (
    <div className={styles.centered}>
      <div className="loader" />
      <p className={styles.loadingText}>Fetching weather data…</p>
    </div>
  );

  if (error) return (
    <div className={styles.centered}>
      <p className={styles.error}>{error}</p>
    </div>
  );

  const w = data?.weather;
  const a = data?.air;
  const isPast = data?.isPast;
  const daily = w?.daily;
  const hourly = w?.hourly;
  const airHourly = a?.hourly;

  // For today use current hour index; for past dates use midday (12:00)
  const nowIndex = (() => {
    if (!hourly?.time) return 0;
    const targetHour = isPast ? 12 : new Date().getHours();
    const idx = hourly.time.findIndex(t => t.includes(`T${String(targetHour).padStart(2,'0')}:`));
    return idx >= 0 ? idx : Math.min(12, hourly.time.length - 1);
  })();

  // Build hourly chart data (24 points)
  const hourlyData = (hourly?.time || []).slice(0, 24).map((t, i) => {
    const hour = t.split('T')[1]?.slice(0,5) || t;
    const temp = hourly.temperature_2m?.[i];
    // visibility: open-meteo returns meters for forecast, meters for archive too
    const visRaw = hourly.visibility?.[i];
    return {
      hour,
      temp: temp != null ? convertTemp(temp) : null,
      humidity: hourly.relative_humidity_2m?.[i],
      precipitation: hourly.precipitation?.[i],
      visibility: visRaw != null ? +(visRaw / 1000).toFixed(2) : null,
      windSpeed: hourly.wind_speed_10m?.[i],
      pm10: airHourly?.pm10?.[i],
      pm25: airHourly?.pm2_5?.[i],
    };
  });

  // Daily stats
  const tempMax = daily?.temperature_2m_max?.[0];
  const tempMin = daily?.temperature_2m_min?.[0];
  const currentTemp = hourly?.temperature_2m?.[nowIndex];
  const currentHumidity = hourly?.relative_humidity_2m?.[nowIndex];
  const precipitation = daily?.precipitation_sum?.[0];
  const uvIndex = hourly?.uv_index?.[nowIndex] ?? airHourly?.uv_index?.[nowIndex];
  const sunrise = daily?.sunrise?.[0];
  const sunset = daily?.sunset?.[0];
  const windMax = daily?.wind_speed_10m_max?.[0];
  const precipProbMax = daily?.precipitation_probability_max?.[0];

  // Air quality (hourly avg for the day)
  const avgOf = (arr) => arr && arr.length ? (arr.filter(v=>v!=null).reduce((a,b)=>a+b,0)/arr.filter(v=>v!=null).length).toFixed(1)*1 : null;
  const aqi = avgOf(airHourly?.european_aqi?.slice(0,24));
  const pm10 = avgOf(airHourly?.pm10?.slice(0,24));
  const pm25 = avgOf(airHourly?.pm2_5?.slice(0,24));
  const co = avgOf(airHourly?.carbon_monoxide?.slice(0,24));
  const no2 = avgOf(airHourly?.nitrogen_dioxide?.slice(0,24));
  const so2 = avgOf(airHourly?.sulphur_dioxide?.slice(0,24));

  const aqiInfo = getAQILabel(aqi);

  return (
    <div className={styles.page}>
      {/* Date Picker */}
      <div className={styles.topBar}>
        <div className={styles.dateSection}>
          <label className={styles.dateLabel}>Select Date</label>
          <input
            type="date"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setDate(e.target.value)}
            className={styles.datePicker}
          />
        </div>
        <div className={styles.tempToggle}>
          <button
            className={`${styles.toggleBtn} ${tempUnit === 'C' ? styles.toggleActive : ''}`}
            onClick={() => setTempUnit('C')}
          >°C</button>
          <button
            className={`${styles.toggleBtn} ${tempUnit === 'F' ? styles.toggleActive : ''}`}
            onClick={() => setTempUnit('F')}
          >°F</button>
        </div>
      </div>

      {/* Temperature Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🌡 Temperature</h2>
        <div className={styles.grid3}>
          <StatCard icon="🌡" label="Current" value={currentTemp != null ? convertTemp(currentTemp) : null} unit={tempLabel} accent="var(--accent-amber)" />
          <StatCard icon="⬆" label="Maximum" value={tempMax != null ? convertTemp(tempMax) : null} unit={tempLabel} accent="var(--accent-rose)" />
          <StatCard icon="⬇" label="Minimum" value={tempMin != null ? convertTemp(tempMin) : null} unit={tempLabel} accent="var(--accent-cyan)" />
        </div>
      </section>

      {/* Atmospheric Conditions */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🌫 Atmospheric Conditions</h2>
        <div className={styles.grid3}>
          <StatCard icon="💧" label="Precipitation" value={precipitation} unit="mm" accent="var(--accent-cyan)" />
          <StatCard icon="💦" label="Rel. Humidity" value={currentHumidity} unit="%" accent="var(--accent-violet)" />
          <StatCard icon="☀" label="UV Index" value={uvIndex != null ? uvIndex?.toFixed(1) : null} accent="var(--accent-amber)" />
        </div>
      </section>

      {/* Sun Cycle */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🌅 Sun Cycle</h2>
        <div className={styles.grid2}>
          <StatCard icon="🌄" label="Sunrise" value={formatTime(sunrise)} accent="var(--accent-amber)" />
          <StatCard icon="🌇" label="Sunset" value={formatTime(sunset)} accent="var(--accent-rose)" />
        </div>
      </section>

      {/* Wind & Air */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>💨 Wind & Air</h2>
        <div className={styles.grid2}>
          <StatCard icon="🌬" label="Max Wind Speed" value={windMax} unit="km/h" accent="var(--accent-lime)" />
          <StatCard icon="🌧" label="Precip. Prob. Max" value={precipProbMax} unit="%" accent="var(--accent-cyan)" />
        </div>
      </section>

      {/* Air Quality */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🫁 Air Quality Metrics</h2>
        <div className={styles.aqiBadge} style={{ '--aqi-color': aqiInfo.color }}>
          <span className={styles.aqiValue}>{aqi ?? '—'}</span>
          <span className={styles.aqiLabel}>{aqiInfo.label} · European AQI</span>
        </div>
        <div className={styles.grid3}>
          <StatCard icon="🔵" label="PM10" value={pm10} unit="μg/m³" accent="var(--accent-violet)" />
          <StatCard icon="🟣" label="PM2.5" value={pm25} unit="μg/m³" accent="var(--accent-rose)" />
          <StatCard icon="🟡" label="Carbon Monoxide" value={co} unit="μg/m³" accent="var(--accent-amber)" />
          <StatCard icon="🟠" label="Nitrogen Dioxide" value={no2} unit="μg/m³" accent="var(--accent-amber)" />
          <StatCard icon="⚪" label="Sulphur Dioxide" value={so2} unit="μg/m³" accent="var(--accent-lime)" />
          <StatCard icon="🟤" label="CO₂" value="—" accent="var(--text-muted)" sub="Not in free API" />
        </div>
      </section>

      {/* Hourly Charts */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>📈 Hourly Trends</h2>
        <div className={styles.chartsGrid}>

          <ChartPanel title={`Temperature (${tempLabel})`} height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffb300" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ffb300" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="temp" name={`Temp (${tempLabel})`} stroke="#ffb300" fill="url(#tempGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Relative Humidity (%)" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="humGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis domain={[0,100]} tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#a78bfa" fill="url(#humGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Precipitation (mm)" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="precipitation" name="Precipitation (mm)" fill="#00e5ff" radius={[3,3,0,0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Visibility (km)" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#00e5ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="visibility" name="Visibility (km)" stroke="#00e5ff" fill="url(#visGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="Wind Speed at 10m (km/h)" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b5ff2d" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#b5ff2d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="windSpeed" name="Wind Speed (km/h)" stroke="#b5ff2d" fill="url(#windGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartPanel>

          <ChartPanel title="PM10 & PM2.5 (μg/m³)" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#6b7fa3' }} />
                <Line type="monotone" dataKey="pm10" name="PM10" stroke="#a78bfa" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pm25" name="PM2.5" stroke="#ff4d6d" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

        </div>
      </section>
    </div>
  );
}
