# TODO for new zmanim page

## Page goals

- Can accept either the city name or the coordinates

- Should be able to accept either hebrew or english date

- Cache the city name and coordinates/timezone
- Sanatize Palestinian locations
- Show the zmain for that place and time
- Includes midnight for end of that day

- Should calculate and display the margin of error, how much earlier or latter the zman could be under resonable weather conditions
- Should provide a link to Itim Labina for exact sunrise/sunset
- Should produce monthly and yearly tables

## Edge cases

### Artic times:
- Defaluts on non-existant summer twilight times with midnight
- Non-existant sunrise and sunset, shows --:--

## Plan for adding options
- Choose sun position or fixed proportion. Probably by means of a checkbox. Implemented as indicated by comment in temporalHour function.
- Choose GRA/MGA times. Probably by radio button. Implimented again by comment in temporalHour. Important: This will change the settings for certain twilight times, in a future implimentation.
- Should allow setting of the twilight times from dropdown menues

### Twilight times
Alot
- 19.75 (90 min)
- 16.1 (72 min)  -default
Misheyakir
- 11.5
- 11
- 10.5  -default
Tzeit
- 3.65 (13.5 min)
- 4.61 (18 min)  -default
- 6.45

