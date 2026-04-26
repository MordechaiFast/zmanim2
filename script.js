const MIKDASH_LAT = 31.7780, MIKDASH_LON = 35.2353;
const MGA_TWILIGHT_VALUE = '19.75';

let twilightMemory = null;

document.addEventListener('DOMContentLoaded', () => {
  let currentCityData = null;
  initialize(loadCity(), loadSettings());
  applyMgaTwilightLock();

  const findCity = async () => {
    clearError();

    const city = document.getElementById('city').value.trim();
    if (city) {
      try {
        currentCityData = loadCityData(city);
        persistCity(city);
        persistCityData(currentCityData, city);
      } catch (err) {
        // Call API if not in local storage
        try {
          currentCityData = await getCityData(city);
          persistCity(city);
          persistCityData(currentCityData, city);
        } catch (err) {
          showError(err.message || String(err));
        }
      }
    } else {
      currentCityData = {
        name: '',
        lat: MIKDASH_LAT,
        lon: MIKDASH_LON,
        timezone: 'Asia/Jerusalem',
        country: 'IL',
        local_names: { he: "בית המקדש" }
      };
    }
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

    const lat = Number(document.getElementById('lat').value);
    const lon = Number(document.getElementById('lon').value);
    currentCityData = await getLocData(lat, lon);
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
      applyMgaTwilightLock();
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
  document.getElementById('setting-shabbat').value = String(settings.twilightAngles.shabbat);
}

function applyMgaTwilightLock() {
  const selectedMethod = document.querySelector('input[name="gra-mga"]:checked')?.value;
  const alot = document.getElementById('setting-alot');
  const shabbat = document.getElementById('setting-shabbat');

  if (selectedMethod === 'MGA') {
    if (twilightMemory === null) {
      twilightMemory = {
        alot: alot.value,
        shabbat: shabbat.value,
      };
    }
    alot.value = MGA_TWILIGHT_VALUE;
    shabbat.value = MGA_TWILIGHT_VALUE;
    alot.disabled = true;
    shabbat.disabled = true;
  } else {
    if (twilightMemory !== null) {
      alot.value = twilightMemory.alot;
      shabbat.value = twilightMemory.shabbat;
    }
    alot.disabled = false;
    shabbat.disabled = false;
    twilightMemory = null;
  }
}

function loadSettings() {
  try {
    const cache = localStorage.getItem('zmanimSettings');
    if (cache)
      return JSON.parse(cache);
  } catch (err) { }
  return getCurrentSettings();
}

function getCurrentSettings() {
  return {
    bySunPosition: document.getElementById('setting-sun-position').checked,
    graMga: document.querySelector('input[name="gra-mga"]:checked').value,
    twilightAngles: {
      alot: Number(document.getElementById('setting-alot').value),
      misheyakir: Number(document.getElementById('setting-misheyakir').value),
      tzeit: Number(document.getElementById('setting-tzeit').value),
      shabbat: Number(document.getElementById('setting-shabbat').value),
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
  const cached = localStorage.getItem(cacheKey);
  if (cached != null) {
    console.log('Using cached data for:', city);
    const json = JSON.parse(cached);
    if (json) {
      console.log('Cached data:', json);
      return json;
    }
  }
  throw new Error();
}

function persistCityData(cityData, city) {
  if (!city) city = cityData.name;
  try {
    const cacheKey = `geoData_${city?.toLowerCase()}`;
    localStorage.setItem(cacheKey, JSON.stringify(cityData));
  } catch (err) {
    // localStorage may be unavailable; continue without caching
  }
}

function displayCard(cityData) {
  const dateStr = document.getElementById('date').value; // YYYY-MM-DD
  const settings = getCurrentSettings();

  document.getElementById('card-city').textContent = fullCityName(cityData);
  document.getElementById('card-coords').textContent =
   `${latStr(cityData.lat)} ${longStr(cityData.lon)}`;
  document.getElementById('card-direction').textContent = 
    greatCircleDirection(cityData.lat, cityData.lon, MIKDASH_LAT, MIKDASH_LON);
  document.getElementById('card-date').textContent = fullDate(dateStr);
  document.getElementById('card-tz').textContent = timeZoneStr(cityData, dateStr);
  document.getElementById('card-hebrew-date').textContent = hebrewDate(new Date(dateStr));

  const zmanimBody = document.getElementById('zmanim-body');
  zmanimBody.innerHTML = '';
  for (let zman in zmanim) {
    const row = document.createElement('tr');
    row.innerHTML =
      `<td>${zman}</td><td dir='ltr'>${zmanim[zman](dateStr, cityData, settings)}</td>`;
    zmanimBody.appendChild(row);
  }
}
