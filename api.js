const GEO_URL = "https://api.openweathermap.org/geo/1.0/direct";
const ONECALL_URL = "https://api.openweathermap.org/data/3.0/onecall";
const REVERSE_URL = "http://api.openweathermap.org/geo/1.0/reverse";

async function getCityDataCached(city, apiKey) {
  const cacheKey = `geoData_${city.toLowerCase()}`;
  
  try {
    // Check if data is already in localStorage
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.log('Using cached data for:', city);
      const json = JSON.parse(cached);
      console.log('Cached data:', json);
      return json;
    }
  } catch (err) {
    console.log(err);
    // Query the API if not in cache
  }

  const geoUrl = buildGeoQuery(city, apiKey);
  const geoData = await getGeoData(geoUrl);
  if (!geoData || geoData.length === 0) {
    throw new Error('No data for this city.');
  }
  let { name, state, country, lat, lon } = geoData[0];
  let local_names = { he: geoData[0].local_names?.he };

  const weatherUrl = buildWeatherQuery(lat, lon, apiKey);
  const weatherData = await getWeatherData(weatherUrl);
  let timezone = weatherData.timezone;

  // Hebresize data
  if (country === 'PS') {
    country = 'IL';
    timezone = 'Asia/Jerusalem';
  }

  const cityData = { name, state, country, local_names, lat, lon, timezone };
  try {
    // Store in localStorage for future use
    localStorage.setItem(cacheKey, JSON.stringify(cityData));
  } catch (err) {
    // localStorage may be unavailable; continue without caching
  }  

  return cityData;
}

async function getLocData(lat, lon, apiKey) {
  const geoUrl = buildNameQuery(lat, lon, apiKey);
  const geoData = await getGeoData(geoUrl);
  if (!geoData || geoData.length === 0) {
    throw new Error('No data for this city.');
  }
  let { name, state, country } = geoData[0];
  let local_names = { he: geoData[0].local_names?.he };

  const weatherUrl = buildWeatherQuery(lat, lon, apiKey);
  const weatherData = await getWeatherData(weatherUrl);
  let timezone = weatherData.timezone;

  // Hebresize data
  if (country === 'PS') {
    country = 'IL';
    timezone = 'Asia/Jerusalem';
  }

  const cityData = { name, state, country, local_names, lat, lon, timezone };
  const cacheKey = `geoData_${name.toLowerCase()}`; 
  try {
    // Store in localStorage for future use
    localStorage.setItem(cacheKey, JSON.stringify(cityData));
  } catch (err) {
    // localStorage may be unavailable; continue without caching
  }  

  return cityData;
}

function buildGeoQuery(city, apiKey) {
  const encoded = encodeURIComponent(city);
  return `${GEO_URL}?q=${encoded}&limit=1&appid=${apiKey}`;
}

async function getGeoData(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Access denied. Check API key.');
    const txt = await resp.text();
    throw new Error(resp.statusText || txt || `HTTP ${resp.status}`);
  }
  const json = await resp.json();
  console.log('Geocode response:', json);
  return json;
}

function buildWeatherQuery(lat, lon, apiKey, fahrenheit=false) {
  const units = fahrenheit ? 'imperial' : 'metric';
  return `${ONECALL_URL}?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
}

async function getWeatherData(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Access denied. Check API key.');
    const txt = await resp.text();
    throw new Error(resp.statusText || txt || `HTTP ${resp.status}`);
  }
  const json = await resp.json();
  console.log('Weather response:', json);
  return json;
}

function buildNameQuery(lat, lon, apiKey) {
    return `${REVERSE_URL}?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;
}

async function getLocName(url) {
  const resp = await fetch(url);
  if (!resp.ok) {
    if (resp.status === 401) throw new Error('Access denied. Check API key.');
    const txt = await resp.text();
    throw new Error(resp.statusText || txt || `HTTP ${resp.status}`);
  }
  const json = await resp.json();
  console.log('Location name response:', json);
  return json;
}
