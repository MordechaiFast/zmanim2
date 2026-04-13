const MIKDASH_LAT = 31.7780, MIKDASH_LON = 35.2353;
const alotDeg = 19.75, misheyakirDeg = 11.5, tzeitDeg = 4.61, shabbatDeg = 8.5;

document.addEventListener('DOMContentLoaded', () => {
  let currentCityData = null;

  document.getElementById('city').value = localStorage.getItem('lastCity');
  document.getElementById('date').valueAsDate = new Date(); // default to today

  const findCity = async () => {
    clearError();
    
    const apiKey = api_key_3; // using the imported key from keys.js
    const city = document.getElementById('city').value.trim();
    try {
      currentCityData = city ? await getCityDataCached(city, apiKey) : {
        lat: MIKDASH_LAT,
        lon: MIKDASH_LON,
        timezone: 'Asia/Jerusalem',
        country: 'IL',
        local_names: { he: "בית המקדש" }
      };
    } catch (err) {
      showError(err.message || String(err));
    }
    try {
      // Try to save input
      localStorage.setItem('lastCity', city);
    } catch (err) {
      // localStorage may be unavailable; continue without caching
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
    
    const apiKey = api_key_3;
    const lat = document.getElementById('lat').value;
    const lon = document.getElementById('lon').value;
    try {
      currentCityData = await getLocData(lat, lon, apiKey);
    } catch (err) {
      showError(err.message || String(err));
    }
    try {
      // Try to save input
      localStorage.setItem('lastCity', currentCityData.name);
    } catch (err) {
      // localStorage may be unavailable; continue without caching
    }
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
      clearError();
      displayCard(currentCityData);
    }
  });
  
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
  const city = (country === 'IL')
    ? cityData.local_names.he
    : `${name}${state ? ', ' + state : ''}, ${country}`;

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
  
  document.getElementById('city').value = city;
  const latElmt = document.getElementById('lat');
  latElmt.type = 'text';
  latElmt.value = latStr(cityData.lat);
  const lonElmt = document.getElementById('lon');
  lonElmt.type = 'text';
  lonElmt.value = longStr(cityData.lon);
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
    let timeStr = zmanim[zman](dateStr, cityData).toLocaleTimeString("he", {timeZone: cityData.timezone});
    if (timeStr == 'Invalid Date') timeStr = "--:--";
    row.innerHTML = `<td>${zman}</td><td dir='ltr'>${timeStr}</td>`;
    zmanimBody.appendChild(row);
  }
}
