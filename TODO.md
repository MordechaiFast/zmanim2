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

## Formattinng improvements
- `card-left` and `card-right` should be divided in the middle of the `results-card`'s width, provided that the card is wide enough for both.
- `daily-data` should have some formatting, appropriate for the overall style of the page
- In settings, the select menus should line up vertically.
- The text of the labels for the twilight times menus, which are in Hebrew, should be right justified.
