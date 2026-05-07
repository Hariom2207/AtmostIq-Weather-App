import React, { useState, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import ChartPanel from '../components/ChartPanel';
import { fetchHistoricalWeather, formatDateLabel, aggregateAirQualityDaily, windDegToDir } from '../utils/weather';
import styles from './Historical.module.css';

const TOOLTIP_STYLE = {
  backgroundColor: '#0d1420',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  fontFamily: 'DM Mono, monospace',
  fontSize: '11px',
  color: '#f0f4ff',
};

const MAX_YEARS = 2;

function getMaxEndDate() {
  return new Date().toISOString().split('T')[0];
}

function getMinStartDate(endDate) {
  const d = new Date(endDate);
  d.setFullYear(d.getFullYear() - MAX_YEARS);
  return d.toISOString().split('T')[0];
}

// Custom tick for dense date axes
function CustomTick({ x, y, payload }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="end" fill="#6b7fa3" fontSize={9} transform="rotate(-35)">
        {payload.value}
      </text>
    </g>
  );
}

export default function Historical({ location }) {
  const today = getMaxEndDate();
  const defaultStart = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  })();

  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queried, setQueried] = useState(false);

  const handleFetch = useCallback(async () => {
    if (!location) return;
    // Validate max 2 years
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffYears = (end - start) / (1000 * 60 * 60 * 24 * 365.25);
    if (diffYears > MAX_YEARS) {
      setError('Date range cannot exceed 2 years.');
      return;
    }
    if (end <= start) {
      setError('End date must be after start date.');
      return;
    }
    setLoading(true);
    setError(null);
    setQueried(true);
    try {
      const result = await fetchHistoricalWeather(location.lat, location.lon, startDate, endDate);
      setData(result);
    } catch (e) {
      setError('Failed to load historical data. Try a shorter range.');
    } finally {
      setLoading(false);
    }
  }, [location, startDate, endDate]);

  // Prepare chart data
  const chartData = (() => {
    if (!data?.weather?.daily) return [];
    const d = data.weather.daily;
    const airDaily = aggregateAirQualityDaily(data.air);
    const airMap = Object.fromEntries(airDaily.map(r => [r.date, r]));

    return (d.time || []).map((date, i) => {
      const label = formatDateLabel(date);
      // Convert sunrise/sunset to IST hour:minute
      const toIST = (isoStr) => {
        if (!isoStr) return null;
        const dt = new Date(isoStr);
        // IST = UTC+5:30
        const istMs = dt.getTime() + (5.5 * 60 * 60 * 1000);
        const istDate = new Date(istMs);
        return `${String(istDate.getUTCHours()).padStart(2,'0')}:${String(istDate.getUTCMinutes()).padStart(2,'0')}`;
      };
      const sunriseStr = toIST(d.sunrise?.[i]);
      const sunsetStr = toIST(d.sunset?.[i]);
      // Convert time string HH:MM to decimal hours for chart
      const timeToDecimal = (t) => {
        if (!t) return null;
        const [h, m] = t.split(':').map(Number);
        return h + m / 60;
      };

      return {
        date: label,
        fullDate: date,
        tempMax: d.temperature_2m_max?.[i],
        tempMin: d.temperature_2m_min?.[i],
        tempMean: d.temperature_2m_mean?.[i],
        sunrise: timeToDecimal(sunriseStr),
        sunset: timeToDecimal(sunsetStr),
        sunriseLabel: sunriseStr,
        sunsetLabel: sunsetStr,
        precipitation: d.precipitation_sum?.[i],
        windMax: d.wind_speed_10m_max?.[i],
        windDir: d.wind_direction_10m_dominant?.[i],
        windDirLabel: windDegToDir(d.wind_direction_10m_dominant?.[i]),
        pm10: airMap[date]?.pm10,
        pm25: airMap[date]?.pm2_5,
      };
    });
  })();

  // Tick interval for X axis based on data length
  const tickInterval = chartData.length > 200 ? Math.floor(chartData.length / 30)
    : chartData.length > 60 ? Math.floor(chartData.length / 20)
    : chartData.length > 30 ? 3 : 1;

  const sunTooltipFormatter = (value, name) => {
    const h = Math.floor(value);
    const m = Math.round((value - h) * 60);
    return [`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} IST`, name];
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Historical Analysis</h1>
          <p className={styles.pageSubtitle}>Long-term weather trends · Up to 2 years</p>
        </div>
      </div>

      {/* Date range picker */}
      <div className={styles.rangeCard}>
        <div className={styles.rangeInputs}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Start Date</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              min="1940-01-01"
              onChange={e => setStartDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.rangeSep}>→</div>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>End Date</label>
            <input
              type="date"
              value={endDate}
              max={today}
              min={getMinStartDate(endDate)}
              onChange={e => setEndDate(e.target.value)}
              className={styles.dateInput}
            />
          </div>
        </div>
        <button className={styles.fetchBtn} onClick={handleFetch} disabled={loading}>
          {loading ? <span className={styles.btnLoader} /> : '⚡ Analyze'}
        </button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {!queried && !loading && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📅</div>
          <p>Select a date range and click <strong>Analyze</strong> to load historical data.</p>
        </div>
      )}

      {loading && (
        <div className={styles.loadingState}>
          <div className="loader" />
          <p>Fetching historical records…</p>
        </div>
      )}

      {!loading && chartData.length > 0 && (
        <div className={styles.chartsGrid}>

          {/* Temperature */}
          <ChartPanel title="Temperature — Mean, Max & Min (°C)" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={<CustomTick />} interval={tickInterval} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#6b7fa3', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="tempMax" name="Max °C" stroke="#ff4d6d" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="tempMean" name="Mean °C" stroke="#ffb300" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="tempMin" name="Min °C" stroke="#00e5ff" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          {/* Sun Cycle IST */}
          <ChartPanel title="Sun Cycle — Sunrise & Sunset (IST Hours)" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={<CustomTick />} interval={tickInterval} tickLine={false} axisLine={false} />
                <YAxis domain={[4, 21]} tickFormatter={v => `${Math.floor(v)}h`} tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={sunTooltipFormatter} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#6b7fa3', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="sunrise" name="Sunrise IST" stroke="#ffb300" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="sunset" name="Sunset IST" stroke="#ff7043" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

          {/* Precipitation */}
          <ChartPanel title="Precipitation — Daily Total (mm)" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={<CustomTick />} interval={tickInterval} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="precipitation" name="Precipitation (mm)" fill="#00e5ff" opacity={0.75} maxBarSize={8} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>

          {/* Wind */}
          <ChartPanel title="Wind — Max Speed (km/h) & Dominant Direction" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={<CustomTick />} interval={tickInterval} tickLine={false} axisLine={false} />
                <YAxis yAxisId="speed" tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(val, name, props) => {
                    if (name === 'windMax') return [`${val} km/h`, 'Max Wind'];
                    return [val, name];
                  }}
                  labelFormatter={(label, payload) => {
                    const dir = payload?.[0]?.payload?.windDirLabel;
                    return `${label}${dir ? ` · ${dir}` : ''}`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#6b7fa3', paddingTop: '8px' }} />
                <Bar yAxisId="speed" dataKey="windMax" name="Max Wind (km/h)" fill="#b5ff2d" opacity={0.7} maxBarSize={8} radius={[2,2,0,0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartPanel>

          {/* Air Quality PM10 & PM2.5 */}
          <ChartPanel title="Air Quality — PM10 & PM2.5 Daily Average (μg/m³)" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={<CustomTick />} interval={tickInterval} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#6b7fa3', fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#6b7fa3', paddingTop: '8px' }} />
                {/* WHO guidelines */}
                <ReferenceLine y={45} stroke="rgba(167,139,250,0.3)" strokeDasharray="4 4" label={{ value: 'WHO PM10', fill: '#6b7fa3', fontSize: 9 }} />
                <ReferenceLine y={15} stroke="rgba(255,77,109,0.3)" strokeDasharray="4 4" label={{ value: 'WHO PM2.5', fill: '#6b7fa3', fontSize: 9 }} />
                <Line type="monotone" dataKey="pm10" name="PM10 (μg/m³)" stroke="#a78bfa" strokeWidth={1.5} dot={false} connectNulls />
                <Line type="monotone" dataKey="pm25" name="PM2.5 (μg/m³)" stroke="#ff4d6d" strokeWidth={1.5} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </ChartPanel>

        </div>
      )}
    </div>
  );
}
