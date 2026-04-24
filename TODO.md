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

## Fixing of Alot degrees for MGA setting
- When the temporal hour method is set to "MGA" (not "MGA2") the selection for עלות השחר and צאת שבת is fixed at 19.75.
- The page displays this "choice" in the select menu, freezing it.
- The origonal setting is remembered for this session, so that it will be reset when a different method is selected.
