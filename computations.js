"use strict"

function fullCityName(cityData) {
  const { name, state, country } = cityData;
  if (country === 'IL') {
    return cityData.local_names.he;
  } else {
    return `${name}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`;
  }
}

function getTimezoneName(timeZone, date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  }).formatToParts(date);
  return parts.find(p => p.type === "timeZoneName").value;
}

function getOffsetMinutes(timeZone, date) {
  const tz = getTimezoneName(timeZone, date);
  const match = tz.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!match) return 0;

  const h = parseInt(match[1], 10);
  const min = match[2] ? parseInt(match[2], 10) : 0;
  return h * 60 + Math.sign(h) * min;
}

function formatOffset(minutes) {  // usable as tz identifier for Intl.DateTimeFormat
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const h = String(Math.floor(abs / 60)).padStart(2, "0");
  const m = String(abs % 60).padStart(2, "0");
  return `${sign}${h}:${m}`;
}

function longStr(longitude) {
  const degrees = Math.trunc(longitude);
  const decimalDegrees = Math.abs(longitude - degrees);
  const minutes = Math.trunc(decimalDegrees * 60);
  const seconds = Math.round((decimalDegrees * 60 - minutes) * 60);
  const dir = degrees >= 0 ? 'E' : 'W';
  return `${Math.abs(degrees)}°${String(minutes).padStart(2,'0')}'${String(seconds).padStart(2,'0')}"${dir}`;
}

function latStr(latitude) {
  const degrees = Math.trunc(latitude);
  const decimalDegrees = Math.abs(latitude - degrees);
  const minutes = Math.trunc(decimalDegrees * 60);
  const seconds = Math.round((decimalDegrees * 60 - minutes) * 60);
  const dir = degrees >= 0 ? 'N' : 'S';
  return `${Math.abs(degrees)}°${String(minutes).padStart(2,'0')}'${String(seconds).padStart(2,'0')}"${dir}`;
}

function directionStr(deg) {
  // 16-sector compass
  const sectors = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const idx = Math.floor(((deg + 11.25) % 360) / 22.5);
  return sectors[idx];
}

function d2r(deg) {
  return deg * Math.PI / 180;
}

function r2d(rad) {
  return rad * 180 / Math.PI;
}

function greatCircleDirection(lat1, lon1, lat2, lon2) {
  lat1 = d2r(lat1);
  lon1 = d2r(lon1);
  lat2 = d2r(lat2);
  lon2 = d2r(lon2);
  const dLon = lon2 - lon1;
  const y = Math.sin(dLon);
  const x = Math.cos(lat1)*Math.tan(lat2) - Math.sin(lat1)*Math.cos(dLon);
  let brng = r2d(Math.atan2(y, x));
  if (brng < 0)
    brng += 360
  else if (brng > 360)
    brng -= 360;
  return `${directionStr(brng)} (${brng.toFixed(0)}°)`;
}

function fullDate(dateStr) {
  const date = new Date(dateStr);
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return date.toLocaleDateString(undefined, dateOptions);
}

function timeZoneStr(cityData, dateStr) {
  const date = new Date(dateStr);
  const timeOptions = {
    timeZone: cityData.timezone,
    timeZoneName: "long",
    hour12: false,
  };
  return date.toLocaleTimeString(undefined, timeOptions).match(/\s+(.+)/)[1]
    + ` (${formatOffset(getOffsetMinutes(cityData.timezone, date))})`;
}

function hebrewNumber(num) {
  const thousands = num - num % 1000;
	const hundreds = num - thousands - num % 100;
  const tens = num - thousands - hundreds - num % 10;
  const ones = num - thousands - hundreds - tens;
  const hundredsLetters = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
  const tensLetters = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const onesLetters = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  let letterString = '' + hundredsLetters[hundreds/100] + tensLetters[tens/10] + onesLetters[ones];
  if(letterString.length > 1)
    letterString = letterString.slice(0, letterString.length - 1) + '"' + letterString[letterString.length-1]
  else
    letterString += "'";
  if(letterString.endsWith('י"ה'))
  	letterString = letterString.slice(0, letterString.length - 3) + 'ט"ו'
  else if(letterString.endsWith('י"ו'))
    letterString = letterString.slice(0, letterString.length - 3) + 'ט"ז';
  return letterString;
}

function hebrewDate(date) {
  const dateStr = Intl.DateTimeFormat("he", {calendar: "hebrew"}).format(date);
  const parts = dateStr.split(" ");
  parts[0] = hebrewNumber(parts[0]);
  parts[2] = hebrewNumber(parts[2]);
  return `${parts[0]} ${parts[1]} ${parts[2]}`;
}

function twilightAngle(dateStr, locationData, decentAngle, evening=false) {
  const dateParts = dateStr.split("-");
  const date = {
    year: Number(dateParts[0]),
    month: Number(dateParts[1]),
    day: Number(dateParts[2])
  };
  const location = {
    lat: locationData.lat,
    long: -locationData.lon
  };
  const time = twilightTime(-decentAngle, evening, date, location);
  return time.toLocaleTimeString("he", {timeZone: locationData.timezone});
}

function temporalHour(dateStr, locationData, hour, options = {}) {
  const dateParts = dateStr.split("-");
  const date = {
    year: Number(dateParts[0]),
    month: Number(dateParts[1]),
    day: Number(dateParts[2])
  };
  const location = {
    lat: locationData.lat,
    long: -locationData.lon
  };
  const {
    bySunPosition = true,
    graMga = "GRA",
    twilightAngles = {},
    atmospheric = {},
  } = options;

  let time;
  if (graMga === "MGA") {
    time = bySunPosition
      ? temporalHourR(hour, date, location, atmospheric, twilightAngles.alot)
      : temporalHourD(hour, date, location, twilightAngles.alot);
  } else if (graMga === "MGA2") {
    hour = (hour - 6) * 1.25 + 6;
    time = bySunPosition
      ? temporalHourR(hour, date, location, atmospheric)
      : temporalHourS(hour, date, location);
  } else {
    time = bySunPosition
      ? temporalHourR(hour, date, location, atmospheric)
      : temporalHourS(hour, date, location);
  }
  let timeStr = time.toLocaleTimeString("he", {timeZone: locationData.timezone});
  if (timeStr == 'Invalid Date') timeStr = "--:--";
  return timeStr;
}

const evening = true;
const zmanim = {
  "עלות השחר": (date, location, settings) => twilightAngle(date, location, settings.twilightAngles.alot),
  "משיכיר": (date, location, settings) => twilightAngle(date, location, settings.twilightAngles.misheyakir),
  "הנץ החמה": (date, location, settings) => twilightAngle(date, location, 50/60),
  "סוף זמן קריאת שמע": (date, location, settings) => temporalHour(date, location, 3, settings),
  "סוף זמן תפילה": (date, location, settings) => temporalHour(date, location, 4, settings),
  "חצות היום": (date, location, settings) => temporalHour(date, location, 6, settings),
  "מנחה גדולה": (date, location, settings) => temporalHour(date, location, 6.5, settings),
  "סמוך למנחה": (date, location, settings) => temporalHour(date, location, 9, settings),
  "מנחה קטנה": (date, location, settings) => temporalHour(date, location, 9.5, settings),
  "פלג המנחה": (date, location, settings) => temporalHour(date, location, 10.75, settings),
  "שקיעת החמה": (date, location, settings) => twilightAngle(date, location, 50/60, evening),
  "צאת הכוכבים": (date, location, settings) => twilightAngle(date, location, settings.twilightAngles.tzeit, evening),
  "צאת שבת": (date, location, settings) => twilightAngle(date, location, settings.twilightAngles.shabbat, evening),
  "חצות הלילה": (date, location) => twilightAngle(date, location, 90, evening),
}
