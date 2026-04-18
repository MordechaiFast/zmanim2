const MIKDASH_LAT = 31.7780, MIKDASH_LON = 35.2353;
const shabbatDeg = 8.5;

document.addEventListener('DOMContentLoaded', () => {
  let currentCityData = null;
  initialize(loadCity(), loadSettings());

  const findCity = async () => {
    clearError();
    
    const apiKey = api_key_3; // using the imported key from keys.js
    const city = document.getElementById('city').value.trim();
    if (!city) {
      currentCityData = {
        name: '',
        lat: MIKDASH_LAT,
        lon: MIKDASH_LON,
        timezone: 'Asia/Jerusalem',
        country: 'IL',
        local_names: { he: "בית המקדש" }
      };
      return;        
    }
    try {
      currentCityData = loadCityData(city);
    } catch (err) {
      // Call API if not in local storage
      try {
        currentCityData = await getCityDataCached(city, apiKey);
      } catch (err) {
        showError(err.message || String(err));
      }
    }
    persistCity(city);
    persistCityData(currentCityData, city);
  };

  document.getElementById('input-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    await findCity();
    if (currentCityData) {
      displayCard(currentCityData);
    }
  });
  
  const findLoc = async () => {
    clearError();
    const apiKey = api_key_3;
    const lat = Number(document.getElementById('lat').value);
    const lon = Number(document.getElementById('lon').value);
    currentCityData = await getLocData(lat, lon, apiKey);
    persistCity(currentCityData.name);
    persistCityData(currentCityData, city);
  };

  document.getElementById('coords-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    await findLoc();
    if (currentCityData) {
      displayCard(currentCityData);
    }
  });

  document.getElementById('date').addEventListener('change', () => {
    if (currentCityData) {
      displayCard(currentCityData);
    }
  });

  document.querySelectorAll('#settings input, #settings select').forEach((control) => {
    control.addEventListener('change', () => {
      persistSettings();
      if (currentCityData) {
        displayCard(currentCityData);
      }
    });
  });
  
  document.getElementById('input-form').dispatchEvent(new Event('submit'));
});

function showError(msg) {
  document.getElementById('error').textContent = msg;
}

function clearError() {
  document.getElementById('error').textContent = '';
}

function initialize(city, settings) {
  document.getElementById('city').value = city;
  document.getElementById('date').valueAsDate = new Date(); // default to today
  document.getElementById('setting-sun-position').checked = settings.bySunPosition;
  document.querySelector(`input[name="gra-mga"][value="${settings.graMga}"]`).checked = true;
  document.getElementById('setting-alot').value = String(settings.twilightAngles.alot);
  document.getElementById('setting-misheyakir').value = String(settings.twilightAngles.misheyakir);
  document.getElementById('setting-tzeit').value = String(settings.twilightAngles.tzeit);
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('zmanimSettings'));
  } catch (err) {
    return getCurrentSettings();
  }
}

function getCurrentSettings() {
  return {
    bySunPosition: document.getElementById('setting-sun-position').checked,
    graMga: document.querySelector('input[name="gra-mga"]:checked').value,
    twilightAngles: {
      alot: Number(document.getElementById('setting-alot').value),
      misheyakir: Number(document.getElementById('setting-misheyakir').value),
      tzeit: Number(document.getElementById('setting-tzeit').value),
    },
  };
}

function persistSettings() {
  try {
    localStorage.setItem('zmanimSettings', JSON.stringify(getCurrentSettings()));
  } catch (err) {
    // localStorage may be unavailable; continue without caching
  }
}

function loadCity() {
    try {
        return localStorage.getItem('lastCity');
    } catch (err) {
        return '';
    }
}
function persistCity(city) {
  try {
    localStorage.setItem('lastCity', city);
  } catch (err) {
    // localStorage may be unavailable; continue without caching
  }
}

function loadCityData(city) {
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
  }
    
}
function persistCityData(cityData, city) {
  if (!city) city = cityData.name;
  const cacheKey = `geoData_${city.toLowerCase()}`;
  try {
    // Store in localStorage for future use
    localStorage.setItem(cacheKey, JSON.stringify(cityData));
  } catch (err) {
    // localStorage may be unavailable; continue without caching
  }  
}

function displayCard(cityData) {
  const city = fullCityName(cityData);

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
  const settings = getCurrentSettings();
  
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
    let timeStr = zmanim[zman](dateStr, cityData, settings).toLocaleTimeString("he", {timeZone: cityData.timezone});
    if (timeStr == 'Invalid Date') timeStr = "--:--";
    row.innerHTML = `<td>${zman}</td><td dir='ltr'>${timeStr}</td>`;
    zmanimBody.appendChild(row);
  }
}
