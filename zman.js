// (c) by Mordechai Fast

const radToDeg = a => a * (180 / Math.PI);
const degToRad = a => a * (Math.PI / 180);

/***********************************************************************
 * Calculate the Julian Day from the Gregorian date
 * @param {number} year - 4 digit year
 * @param {number} month - January = 1
 * @param {number} day  - 1 - 31
 * @returns {number} The Julian day corresponding to the date
 * 
 * Source: "Astronomical Algorithms" by Jean Meeus, 1998, p. 62
 ***********************************************************************/
function calcJD(year, month, day) {
	if (month <= 2) {
		year -= 1;
		month += 12;
	}
	const A = Math.floor(year/100);
	const B = 2 - A + Math.floor(A/4);

	const JD = Math.floor(365.25*(year + 4716))
			+ Math.floor(30.6001*(month+1))
			+ day + B - 1524.5;
	return JD;
}

/***********************************************************************
 *  Calculates the Declination and Equation of Time for a JulianDay
 * 
 *  Source: "Astronomical Algorithms" by Jean Meeus, 1998, p. 163-165, 185
 ***********************************************************************/
function SunPosition(JulianDay) {
	/**Centuries since the J2000.0 epoch */
	const T = (JulianDay - 2451545)/36525;
	
  /**Mean obliquity of the ecliptic */
	const e0 = 23.0 + 26.0/60 + (
    21.448 - T*(46.8150 + T*(0.00059 - T*(0.001813)))
  )/3600;
	
  /**Longitude of the ascending node of the moon's mean orbit on
	 * the ecliptic, measured from the mean equinox of date. */
	let omega = 125.04 - 1934.136 * T;
	omega = degToRad(omega);
	
  /**Corrected obliquity of the ecliptic */
	let epsilon = e0 + 0.00256 * Math.cos(omega);
	epsilon = degToRad(epsilon);
	
  /**Geometric Mean Longitude of the Sun */
	let L0 = 280.46646 + T * (36000.76983 + 0.0003032 * T);
	
  /**Geometric Mean Anomaly of the Sun */
	let M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
	M = degToRad(M);
	const sinM = Math.sin(M);
	const sin2M = Math.sin(M+M);
	const sin3M = Math.sin(M+M+M);
	
  /**Equation of center for the sun */
	const C = sinM * (1.914602 - T * (0.004817 + 0.000014 * T))
			    + sin2M * (0.019993 - 0.000101 * T)
			    + sin3M * 0.000289;
	
  /**True longitude of the sun */
	const O = L0 + C;
	
  /**Apparent longitude of the sun */
	let lambda = O - 0.00569 - 0.00478 * Math.sin(omega);
	lambda = degToRad(lambda);
	
  /**Declination of the sun */
	const delta = Math.asin(Math.sin(epsilon) * Math.sin(lambda));
	
  /**Eccentricity of earth's orbit */
	const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

	let y = Math.tan(epsilon / 2);
	y *= y;
	L0 = degToRad(L0);

  /**The difference between true solar time and mean */
	const equationOfTime = y *  Math.sin(L0 + L0)
                       - 2 * e * sinM 
                       + 4 * e * y * sinM * Math.cos(L0 + L0)
                       - 0.5 * y * y *  Math.sin(4 * L0)
                       - 1.25 * e * e * sin2M;

	return {declination: radToDeg(delta),
		      equationOfTime: radToDeg(equationOfTime)};
}

/************************************************************************
 * Calculate the local hour angle corresponding to the time when a
 * celestial body reaches a given altitude from the horizon
 * @param {number} phi - the geographic latitude of the observer north of
 * the equator in degrees
 * @param {number} h - the desiered altitude of the celestial body in degrees
 * @param {number} delta - the declination of the celestial body, in degrees
 * north of the celestial equator
 * @returns {number} the local hour angle in degrees
 *
 * Source: "Astronomical Algorithms" by Jean Meeus, 1998, p. 102
 ************************************************************************/
function calcHourAngle(phi, h, delta) {
  phi = degToRad(phi);
  h = degToRad(h);
  delta = degToRad(delta);
  const H = Math.acos(
    (Math.sin(h) - Math.sin(phi) * Math.sin(delta))
    / (Math.cos(phi) * Math.cos(delta))
  );
  return radToDeg(H);
}

/************************************************************************
 * Calculate the azimuth of the sun from a given latitude at a given time of
 * day with a given declination.
 * @param {number} phi - the geographic latitude of the observer north of the
 * equator in degrees
 * @param {number} H - the local hour angle of the sun in degrees
 * @param {number} delta - the declination of the sun, in degrees north of the
 * celestial equator
 * @returns {number} the azimuth of the sun in degrees clockwise from South
 *
 * Source: "Astronomical Algorithms" by Jean Meeus, 1998, p. 93
 ************************************************************************/
function calcAzimuth(phi, H, delta) {
  phi = degToRad(phi);
  H = degToRad(H);
  delta = degToRad(delta);
  const A = Math.atan2(
    Math.sin(H), 
    Math.cos(H) * Math.sin(phi) - Math.tan(delta) * Math.cos(phi)
  );
  return radToDeg(A);
}

/************************************************************************
 * Calculate the altitude of the sun from a given latitude at a given
 * time of day with a given declination.
 * @param {number} phi - the geographic latitude of the observer north of
 * the equator in degrees
 * @param {number} H - the local hour angle of the sun in degrees
 * @param {number} delta - the declination of the sun, in degrees north of
 * the celestial equator
 * @returns {number} the altitude of the sun in degrees above the horizon
 *
 * Source: "Astronomical Algorithms" by Jean Meeus, 1998, p. 93
 ************************************************************************/
function calcAltitude(phi, H, delta) {
  phi = degToRad(phi);
  H = degToRad(H);
  delta = degToRad(delta);
  const h = Math.asin(
    Math.sin(phi) * Math.sin(delta)
    + Math.cos(phi) * Math.cos(delta) * Math.cos(H)
  );
  return radToDeg(h);
}

/************************************************************************
 * Calculate the refraction correction for a given altitude
 * @param {number} h - the altitude in degrees above the horizon
 * @param {number} [P=1010] - the atmospheric pressure in millibars
 * (default 1010)
 * @param {number} [T=10] - the temperature in Celsius (default 10)
 * @returns {number} the refraction correction in degrees
 * 
 * Source: "Astronomical Algorithms" by Jean Meeus, 1998, p. 106-107
 ************************************************************************/
function calcRefraction(h, P = 1010, T = 10) {
  if (T > 100) T -= 273; // Convert Kelvin to Celsius
  let R = 1.02 / Math.tan(degToRad(
    h + 10.3 / (h + 5.11)
  )) + .0019279;
  R *= (P / 1010) * (283 / (273 + T));
  return R / 60;  // Convert minutes to degrees
}

/************************************************************************
 * Calculate the hour angle of a celestial body at a given position
 * (azimuth and altitude) at a given latitude
 * @param {number} phi - the geographic latitude of the observer north of
 * the equator in degrees
 * @param {number} A - the azimuth of the celestial body in degrees
 * clockwise from South
 * @param {number} h - the altitude of the celestial body in degrees
 * above the horizon
 * @returns {number} the hour angle of the celestial body in degrees
 * 
 * Source: "Astronomical Algorithms" by Jean Meeus, 1998, p. 94
 ************************************************************************/
function calcHourAngleOfPosition(phi, A, h) {
  phi = degToRad(phi);
  A = degToRad(A);
  h = degToRad(h);
  const H = Math.atan2(
    Math.sin(A), 
    Math.cos(A) * Math.sin(phi) + Math.tan(h) * Math.cos(phi)
  );  
  return radToDeg(H);
}

/************************************************************************
 * Calculate the declination of a celestial body at a given position
 * (azimuth and altitude) at a given latitude
 * @param {number} phi - the geographic latitude of the observer north of
 * the equator in degrees
 * @param {number} A - the azimuth of the celestial body in degrees
 * clockwise from South
 * @param {number} h - the altitude of the celestial body in degrees
 * above the horizon
 * @returns {number} the declination of the celestial body in degrees
 * north of the celestial equator
 * 
 * Source: "Astronomical Algorithms" by Jean Meeus, 1998, p. 94
 ************************************************************************/
function calcDeclinationOfPosition(phi, A, h) {
  phi = degToRad(phi);
  A = degToRad(A);
  h = degToRad(h);
  const delta = Math.asin(
    Math.sin(phi) * Math.sin(h) - Math.cos(phi) * Math.cos(h) * Math.cos(A)
  );
  return radToDeg(delta);
}

function JDtoDate(jd) {
  const unixEpochJD = 2440587.5;
  const msPerDay = 86400000;

  const ms = (jd - unixEpochJD) * msPerDay;
  return new Date(ms);
}

// Main functions

/** Returns the time when the sun reaches a given elevation below the horizon.
 * 
 *  evening is true for evening twilight, false for morning twilight */
function twilightTime(elevation, evening, date, location) {
  const JulianDay = calcJD(date.year, date.month, date.day); // Julian Day at midnight UTC
  let previous = 0;
  let current = JulianDay + .5 + location.long / 360; // Start at local noon
  while (Math.abs(previous - current) > 1/(86400 * 10)) {
    previous = current;
    let {declination, equationOfTime} = SunPosition(current);
    let hourAngle = calcHourAngle(location.lat, elevation, declination);
    if (isNaN(hourAngle))
      hourAngle = (location.lat + elevation - declination > 90 ? 0 : 180);
    hourAngle *= (evening ? 1 : -1);
    let time = 720 + 4 * (hourAngle + location.long - equationOfTime);
    current = JulianDay + time / 1440; // Convert minutes to days
  }
  return JDtoDate(current);
}

/** Calculates the temporal hour accounting for refraction */
function temporalHourR(hour, date, location, atmospheric={}, dawnElevation=0) {
  hour -= 6;
  /**The apparent latitude accounting for the refraction of celestrial pole */
  const latitude = location.lat + calcRefraction(location.lat);
  const JulianDay = calcJD(date.year, date.month, date.day);
  let previous = 0;
  let current = JulianDay + .5 + location.long / 360; // Start at noon LST
  while (Math.abs(previous - current) > 1/(84000 * 10)) {
    previous = current;
    let {declination, equationOfTime} = SunPosition(current);
    let hourAngle = (current % 1 * 360) + equationOfTime - location.long;
    // Correct for refraction
    let azimuth = calcAzimuth(location.lat, hourAngle, declination);
    let altitude = calcAltitude(location.lat, hourAngle, declination);
    let refraction = calcRefraction(altitude, atmospheric.pressure, atmospheric.temp);
    altitude += refraction;
    // Evaluate apparent hour angle and declination
    hourAngle = calcHourAngleOfPosition(latitude, azimuth, altitude);
    declination = calcDeclinationOfPosition(latitude, azimuth, altitude);
    let dawnAngle = calcHourAngle(latitude, -dawnElevation, declination);
    if (isNaN(dawnAngle))
      dawnAngle = (latitude - dawnElevation - declination > 90 ? 0 : 180);
    let temporalHour = hourAngle / dawnAngle * 6;
    current += (hour - temporalHour) / 24 / 2;
  }
  return JDtoDate(current);
}

/** Calculates the temporal hour as a fraction from sunrise to sunset */
function temporalHourS(hour, date, location) {
  const sunrise = twilightTime(-5/6, false, date, location);
  const sunset = twilightTime(-5/6, true, date, location);
  return sunrise + (sunset - sunrise) / 12 * hour;
}

/** Calculates the temporal hour as a fraction from dawn to dusk */
function temporalHourD(hour, date, location, dawnElevation) {
  const dawn = twilightTime(-dawnElevation, false, date, location);
  const dusk = twilightTime(-dawnElevation, true, date, location);
  return dawn + (dusk - dawn) / 12 * hour;
}

/** Finds the geometric time of a temporal hour *
function temporalHourG(hour, date, location) {
  hour -= 6;
  const latitude = location.lat;
  const JulianDay = calcJD(date.year, date.month, date.day); // Julian Day at midnight UTC
  let previous = 0;
  let current = JulianDay + .5 + location.long / 360; // Start at noon LST
  while (Math.abs(previous - current) > 1/(84000 * 10)) {
    previous = current;
    let {declination, equationOfTime} = SunPosition(current);
    let horizonAngle = calcHourAngle(latitude, 0, declination);
    if (isNaN(horizonAngle)) 
      horizonAngle = (latitude - declination > 90 ? 0 : 180);
    let hourAngle = horizonAngle * hour / 6;
    let time = 720 + 4 * (hourAngle + location.long - equationOfTime);
    current = JulianDay + time / 1440; // Convert minutes to days
  }
  return JDtoDate(current);
}
*/

// Testing
/*
function searchForHour(hour) {
  const date = {year, month, day};
  const location = {lat, long, timezone};
  const atmospheric = {pressure, temp};
  let time;
  for (time = temporalHourS(hour, date, location) - 1/2; time <= 24; time += 1/3600) {
    if (hourOf(time, date, location, atmospheric) > hour) {
      time -= 1/3600;
      break;
    }
  }
  return HoursMinutesSeconds(time);
}

function hourOf(time, date, location, atmospheric) {
  const latitude = location.lat + calcRefraction(location.lat);
  const JulianDay = civilTimeToJD(time, date, location);
  let {declination, equationOfTime} = SunPosition(JulianDay);
  let hourAngle = (JulianDay % 1 * 360) + equationOfTime - location.long;
  // Correct for refraction
  let azimuth = calcAzimuth(latitude, hourAngle, declination);
  let altitude = calcAltitude(latitude, hourAngle, declination);
  let refraction = calcRefraction(altitude, atmospheric.pressure, atmospheric.temp);
  altitude += refraction;
  // Evaluate apparent hour angle and declination
  hourAngle = calcHourAngleOfPosition(latitude, azimuth, altitude);
  declination = calcDeclinationOfPosition(latitude, azimuth, altitude);
  let horizonAngle = calcHourAngle(latitude, 0, declination);
  if (isNaN(horizonAngle))
    horizonAngle = (latitude - declination > 90 ? 0 : 180);
  return hourAngle / horizonAngle * 6 + 6;
}

function civilTimeToJD(time, date, location) {
  const JulianDay = calcJD(date.year, date.month, date.day);
  time += Math.round(location.long / 15);
  time += location.tzOffset;
  return JulianDay + time / 24;
}
*/
