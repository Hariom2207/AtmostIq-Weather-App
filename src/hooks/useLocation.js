import { useState, useEffect } from 'react';

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      // Fallback to Delhi
      setLocation({ lat: 28.6139, lon: 77.209 });
      setLocationName('New Delhi, India');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLocation({ lat, lon });
        // Reverse geocode using open-meteo's geocoding or nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || 'Unknown';
          const country = data.address?.country || '';
          setLocationName(`${city}, ${country}`);
        } catch {
          setLocationName(`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`);
        }
        setLoading(false);
      },
      (err) => {
        // Fallback to Delhi if denied
        setLocation({ lat: 28.6139, lon: 77.209 });
        setLocationName('New Delhi, India');
        setLoading(false);
      },
      { timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  return { location, locationName, error, loading };
}
