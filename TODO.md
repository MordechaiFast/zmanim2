# TODO for new zmanim page

## Page goals

- Can accept either the city name or the coordinates

- Should be able to accept either hebrew or english date

- Cache the city name and coordinates/timezone
- Sanatize Palestinian locations
- Show the zmain for that place and time
- Includes midnight for end of that day

- Should produce monthly and yearly tables

## Edge cases

### Artic times:
- Defaluts on non-existant summer twilight times with midnight
- Non-existant sunrise and sunset, shows --:--

## Fixing of Alot degrees for MGA setting
- When the temporal hour method is set to "MGA" (not "MGA2") the selection for עלות השחר and צאת שבת is fixed at 19.75.
- The page displays this "choice" in the select menu, freezing it.
- The origonal setting is remembered for this session, so that it will be reset when a different method is selected.

## Margin of error
How much earlier or latter the zman could be under resonable weather conditions.
Calculation has shown that the influince of weather is insignificant.

## Short/long listing
- Add button to page, at the bottom of the card-left section, entitled "Fewer zmanim".
- When that button is pressed, toggle the button to "More zmanim".
- Record the status of the button.
- In 'less' mode, only display these zmanim: 
	עלות השחר, משיכיר, הנץ החמה, סוף זמן קריאת שמע, סוף זמן תפילה, חצות היום, מנחה גדולה, פלג המנחה, שקיעת החמה, צאת הכוכבים, צאת שבת
