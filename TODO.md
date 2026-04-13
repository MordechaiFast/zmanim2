# TODO for new zmanim page

## Page goals

- Should be able to accept either the city name or the coordinates
- Should be able to accept either hebrew or english date

- Cache the city name and coordinates/timezone
- Sanatize Palestinian locations
- Show the zmain for that place and time
- Includes midnight for end of that day

- Should calculate and display the margin of error, how much earlier or latter the zman could be under resonable weather conditions
- Should provide a link to Itim Labina for exact sunrise/sunset
- Should allow setting of the twilight times from dropdown menues
- Should allow for displaying GRA or MGA times, by sun position or fixed proportion
- Should produce monthly and yearly tables

## Edge cases

### Artic times:
- Defaluts on non-existant summer twilight times with midnight
- Non-existant sunrise and sunset, shows --:--

## Current progress, arangement for coord. input

I have the lat and long and full city name displayed in the input fields on the page.
I want to add an find location button that will call the OpenWeather API to find the city name from the coords.
I then need to change the CSS to have only one row allow input and put the other in output mode.