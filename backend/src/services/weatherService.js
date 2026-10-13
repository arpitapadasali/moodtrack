/**
 * Weather Service for MoodTrack.
 * 
 * Securely and optionally fetches weather metrics for an entered location.
 * Stores strictly the minimal numerical attributes required for analytics:
 * - temperature (Celsius)
 * - weatherCondition (standardized string: Clear, Clouds, Rain, Snow, Thunderstorm, etc.)
 * - precipitation (mm)
 * 
 * Never stores precise GPS coordinates or street addresses.
 * Includes complete error-handling and timeouts so mood entry creation
 * is never blocked or failed if the external weather API is unreachable.
 */

const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';
const REQUEST_TIMEOUT_MS = 3500;

/**
 * Standardize weather condition into core analytical buckets:
 * - "Clear"
 * - "Clouds"
 * - "Rain"
 * - "Drizzle"
 * - "Snow"
 * - "Thunderstorm"
 * - "Other"
 */
function standardizeCondition(condition) {
  if (!condition || typeof condition !== 'string') return 'Unknown';
  const c = condition.toLowerCase();
  if (c.includes('clear') || c.includes('sun')) return 'Clear';
  if (c.includes('cloud') || c.includes('overcast')) return 'Clouds';
  if (c.includes('rain') || c.includes('shower')) return 'Rain';
  if (c.includes('drizzle')) return 'Drizzle';
  if (c.includes('snow') || c.includes('flurr') || c.includes('blizzard') || c.includes('sleet')) return 'Snow';
  if (c.includes('thunder') || c.includes('storm')) return 'Thunderstorm';
  if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return 'Fog';
  return 'Other';
}

/**
 * Map WMO weather codes (Open-Meteo) to standardized condition string
 */
function mapWmoCodeToCondition(code) {
  if (code === 0) return 'Clear';
  if (code >= 1 && code <= 3) return 'Clouds';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'Rain';
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'Snow';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Clouds';
}

/**
 * Fetch weather from OpenWeatherMap using the user's API key
 */
async function fetchFromOpenWeatherMap(locationQuery, apiKey) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(locationQuery)}&appid=${encodeURIComponent(apiKey)}&units=metric`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`OpenWeatherMap API returned status ${res.status} for location "${locationQuery}"`);
      return null;
    }

    const data = await res.json();
    const temp = data.main?.temp !== undefined ? Math.round(data.main.temp * 10) / 10 : null;
    const condition = standardizeCondition(data.weather?.[0]?.main || data.weather?.[0]?.description);
    const rainMm = data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0;
    const snowMm = data.snow ? (data.snow['1h'] || data.snow['3h'] || 0) : 0;
    const precip = Math.round((rainMm + snowMm) * 10) / 10;

    return {
      temperature: temp,
      weatherCondition: condition,
      precipitation: precip
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('OpenWeatherMap request failed:', err.message);
    return null;
  }
}

/**
 * Fetch weather using Open-Meteo free geocoding and weather forecast API
 * (Requires zero API key, acts as seamless fallback)
 */
async function fetchFromOpenMeteo(locationQuery) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    // 1. Geocode location string into coarse coordinates
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(locationQuery)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl, { signal: controller.signal });
    if (!geoRes.ok) {
      clearTimeout(timeoutId);
      return null;
    }

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      clearTimeout(timeoutId);
      return null;
    }

    const { latitude, longitude } = geoData.results[0];

    // 2. Fetch current weather for the coordinates
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,precipitation`;
    const weatherRes = await fetch(weatherUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!weatherRes.ok) return null;

    const weatherData = await weatherRes.json();
    const current = weatherData.current;
    if (!current) return null;

    return {
      temperature: current.temperature_2m !== undefined ? Math.round(current.temperature_2m * 10) / 10 : null,
      weatherCondition: mapWmoCodeToCondition(current.weather_code),
      precipitation: current.precipitation !== undefined ? Math.round(current.precipitation * 10) / 10 : 0.0
    };
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('Open-Meteo request failed:', err.message);
    return null;
  }
}

/**
 * Primary weather retrieval method.
 * Optionally resolves weather info for a user-provided location string.
 * Returns { temperature, weatherCondition, precipitation } or null.
 * 
 * GUARANTEE: Never throws an exception. Returns null on any failure.
 * 
 * @param {string|object} location - City name or coarse location object
 * @returns {Promise<{temperature: number|null, weatherCondition: string|null, precipitation: number|null}|null>}
 */
async function getWeatherForLocation(location) {
  if (!location) return null;

  const locationQuery = typeof location === 'string'
    ? location.trim()
    : (location.city || location.name || '').trim();

  if (!locationQuery || locationQuery.length < 2) return null;

  try {
    // If an API key is configured, prioritize OpenWeatherMap
    if (WEATHER_API_KEY && WEATHER_API_KEY.trim().length > 0) {
      const owmData = await fetchFromOpenWeatherMap(locationQuery, WEATHER_API_KEY.trim());
      if (owmData) return owmData;
    }

    // Fall back to Open-Meteo (no API key required)
    const openMeteoData = await fetchFromOpenMeteo(locationQuery);
    if (openMeteoData) return openMeteoData;

    return null;
  } catch (err) {
    console.warn('Weather retrieval failed gracefully:', err.message);
    return null;
  }
}

module.exports = {
  getWeatherForLocation,
  standardizeCondition,
  WEATHER_API_KEY
};
