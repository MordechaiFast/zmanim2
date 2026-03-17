const MIKDASH_LAT = 31.7780, MIKDASH_LON = 35.2353;
const alotDeg = 19.75, misheyakirDeg = 11.5, tzeitDeg = 4.61, shabbatDeg = 8.5;

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('city').value = localStorage.getItem('lastCity') || "בית המקדש";
  document.getElementById('date').valueAsDate = new Date(); // default to today

  document.getElementById('input-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearError();
    const apiKey = api_key_3; // using the imported key from keys.js
    const city = document.getElementById('city').value.trim();
    const dateStr = document.getElementById('date').value; // YYYY-MM-DD
 
    if (!city) {
      showError('City is required.');
      return;
    }
    // Try to save input
    try {
      localStorage.setItem('lastCity', city);
    } catch (err) {
      // localStorage may be unavailable; continue without caching
    } 

    try {
      const cityData = (city == "בית המקדש")
        ? {
            lat: MIKDASH_LAT,
            lon: MIKDASH_LON,
            country: 'IL',
            local_names: { he: "בית המקדש" }
          }
        : await getCityDataCached(city, apiKey);
      // Hebresize data
      if (cityData.country === 'PS') cityData.country = 'IL';
      const { name, state, country } = cityData;
      const fullCityName = country === 'IL'
        ? cityData.local_names.he
        : `${name}${state ? ', ' + state : ''}, ${country}`;
      if (country === 'IL') cityData.timezone = 'Asia/Jerusalem';

      displayCard(fullCityName, dateStr, cityData);
    } catch (err) {
      showError(err.message || String(err));
    }
  });
  
  document.getElementById('input-form').dispatchEvent(new Event('submit'));
});

function showError(msg) {
  const errorField = document.getElementById('error');
  errorField.textContent = msg;
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
}

function displayCard(city, dateStr, locationData) {
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const timeOptions = {
    timeZone: locationData.timezone,
    timeZoneName: "long",
    hour12: false,
  };
  const date = new Date(dateStr);

  document.getElementById('results').hidden = false;
  
  document.getElementById('card-city').textContent = city;
  document.getElementById('card-coords').textContent = 
    `${latStr(locationData.lat)} ${longStr(locationData.lon)}`;
  document.getElementById('card-direction').textContent = 
    greatCircleDirection(locationData.lat, locationData.lon, MIKDASH_LAT, MIKDASH_LON);

  document.getElementById('card-date').textContent = 
    date.toLocaleDateString(undefined, dateOptions);
  document.getElementById('card-tz').textContent = (
    date.toLocaleTimeString(undefined, timeOptions).match(/\s+(.+)/)[1]
    + ` (${formatOffset(getOffsetMinutes(locationData.timezone, date))})`);
  document.getElementById('card-hebrew-date').textContent = 
    hebrewDate(date);

  const zmanimBody = document.getElementById('zmanim-body');
  zmanimBody.innerHTML = '';
  for (let zman in zmanim) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${zman}</td>
      <td dir='ltr'>${zmanim[zman](dateStr, locationData).toLocaleTimeString("he", {timeZone: locationData.timezone})}</td>
    `;
    zmanimBody.appendChild(row);
  }
}
