const MIKDASH_LAT = 31.7780, MIKDASH_LON = 35.2353;
const alotDeg = 19.75, misheyakirDeg = 11.5, tzeitDeg = 4.61, shabbatDeg = 8.5;

document.addEventListener('DOMContentLoaded', () => {
  let currentCityData = null;
  let activeMode = 'city';

  const cityInput = document.getElementById('city');
  const latInput = document.getElementById('lat');
  const lonInput = document.getElementById('lon');
  const findBtn = document.getElementById('find-btn');

  cityInput.value = localStorage.getItem('lastCity') || '';
  latInput.value = localStorage.getItem('lastLat') || '';
  lonInput.value = localStorage.getItem('lastLon') || '';
  document.getElementById('date').valueAsDate = new Date(); // default to today

  const setMode = (mode) => {
    activeMode = mode;

    document.querySelectorAll('.mode-tab').forEach((tab) => {
      const isActive = tab.dataset.mode === mode;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    document.querySelectorAll('.input-pane').forEach((pane) => {
      const isActive = pane.dataset.mode === mode;
      pane.classList.toggle('is-active', isActive);
      pane.setAttribute('aria-hidden', String(!isActive));
    });

    findBtn.textContent = mode === 'city' ? 'Find city' : 'Use coordinates';
  };

  const setCoordinatesPanelMessage = (message) => {
    document.getElementById('coords-mode-result').textContent = message;
  };

  const setCityPanelMessage = (message) => {
    document.getElementById('city-mode-result').textContent = message;
  };

  const findCity = async () => {
    const apiKey = api_key_3;
    const city = cityInput.value.trim();

    try {
      localStorage.setItem('lastCity', city);
    } catch (err) {
      // localStorage may be unavailable; continue without caching
    }

    currentCityData = city ? await getCityDataCached(city, apiKey) : {
      lat: MIKDASH_LAT,
      lon: MIKDASH_LON,
      timezone: 'Asia/Jerusalem',
      country: 'IL',
      local_names: { he: 'בית המקדש' }
    };

    latInput.value = Number(currentCityData.lat).toFixed(6);
    lonInput.value = Number(currentCityData.lon).toFixed(6);
    setCoordinatesPanelMessage(`Coordinates from city lookup: ${latInput.value}, ${lonInput.value}`);
  };

  const findByCoordinates = async () => {
    const apiKey = api_key_3;
    const lat = Number(latInput.value);
    const lon = Number(lonInput.value);

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      throw new Error('Please enter both latitude and longitude.');
    }
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude must be between -90 and 90.');
    }
    if (lon < -180 || lon > 180) {
      throw new Error('Longitude must be between -180 and 180.');
    }

    try {
      localStorage.setItem('lastLat', String(lat));
      localStorage.setItem('lastLon', String(lon));
    } catch (err) {
      // localStorage may be unavailable; continue without caching
    }

    const weatherUrl = buildWeatherQuery(lat, lon, apiKey);
    const weatherData = await getWeatherData(weatherUrl);

    currentCityData = {
      name: `(${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      country: '',
      state: '',
      local_names: {},
      lat,
      lon,
      timezone: weatherData.timezone || 'UTC'
    };

    setCityPanelMessage('City lookup result from coordinates can be added here when you wire the reverse-geocoding call.');
  };

  document.querySelectorAll('.mode-tab').forEach((tab) => {
    tab.addEventListener('click', () => setMode(tab.dataset.mode));
  });

  document.getElementById('input-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearError();

    try {
      if (activeMode === 'coords') {
        await findByCoordinates();
      } else {
        await findCity();
      }

      if (currentCityData) {
        displayCard(currentCityData);
      }
    } catch (err) {
      showError(err.message || String(err));
    }
  });

  document.getElementById('date').addEventListener('change', () => {
    if (currentCityData) {
      clearError();
      displayCard(currentCityData);
    }
  });

  setMode('city');
  document.getElementById('input-form').dispatchEvent(new Event('submit'));
});

function showError(msg) {
  document.getElementById('error').textContent = msg;
}

function clearError() {
  document.getElementById('error').textContent = '';
}

const evening = true;
const zmanim = {
  "עלות השחר": (date, location) => twilightAngle(date, location, alotDeg),
  "משיכיר": (date, location) => twilightAngle(date, location, misheyakirDeg),
  "הנץ החמה": (date, location) => twilightAngle(date, location, 50/60),
  "סוף זמן קריאת שמע": (date, location) => temporalHour(date, location, 3),
  "סוף זמן תפילה": (date, location) => temporalHour(date, location, 4),
  "חצות היום": (date, location) => temporalHour(date, location, 6),
  "מנחה גדולה": (date, location) => temporalHour(date, location, 6.5),
  "סמוך למנחה": (date, location) => temporalHour(date, location, 9),
  "מנחה קטנה": (date, location) => temporalHour(date, location, 9.5),
  "פלג המנחה": (date, location) => temporalHour(date, location, 10.75),
  "שקיעת החמה": (date, location) => twilightAngle(date, location, 50/60, evening),
  "צאת הכוכבים": (date, location) => twilightAngle(date, location, tzeitDeg, evening),
  "צאת שבת": (date, location) => twilightAngle(date, location, shabbatDeg, evening),
  "חצות הלילה": (date, location) => twilightAngle(date, location, 90, evening),
}

function displayCard(cityData) {
  const { name, state, country } = cityData;

  let city = `${name || ''}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`.trim();
  if (country === 'IL' && cityData.local_names?.he) {
    city = cityData.local_names.he;
  }
  if (!city) {
    city = 'Coordinates location';
  }

  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const timeOptions = {
    timeZone: cityData.timezone,
    timeZoneName: "long",
    hour12: false,
  };

  const dateStr = document.getElementById('date').value; // YYYY-MM-DD
  const date = new Date(dateStr);

  document.getElementById('results').hidden = false;

  document.getElementById('card-city').textContent = city;
  document.getElementById('card-coords').textContent =
    `${latStr(cityData.lat)} ${longStr(cityData.lon)}`;
  document.getElementById('card-direction').textContent =
    greatCircleDirection(cityData.lat, cityData.lon, MIKDASH_LAT, MIKDASH_LON);

  document.getElementById('card-date').textContent =
    date.toLocaleDateString(undefined, dateOptions);
  document.getElementById('card-tz').textContent = (
    date.toLocaleTimeString(undefined, timeOptions).match(/\s+(.+)/)[1]
    + ` (${formatOffset(getOffsetMinutes(cityData.timezone, date))})`);
  document.getElementById('card-hebrew-date').textContent =
    hebrewDate(date);

  const zmanimBody = document.getElementById('zmanim-body');
  zmanimBody.innerHTML = '';
  for (let zman in zmanim) {
    const row = document.createElement('tr');
    let timeStr = zmanim[zman](dateStr, cityData).toLocaleTimeString("he", { timeZone: cityData.timezone });
    if (timeStr == 'Invalid Date') timeStr = "--:--";
    row.innerHTML = `<td>${zman}</td><td dir='ltr'>${timeStr}</td>`;
    zmanimBody.appendChild(row);
  }
}
