# Lab 4 — Simple HTTP Server on Node.js (Variant 7: weather.json)

## How to run

```bash
cd backend-course-2025-4
npm i
node main.js -i ./data/weather.json -h 127.0.0.1 -p 3000
# or during development (auto-restart):
npx nodemon main.js -i ./data/weather.json -h 127.0.0.1 -p 3000
```

## Query examples
- Show rainfall & pressure only (no humidity field):
  `http://127.0.0.1:3000/`
- Add humidity:
  `http://127.0.0.1:3000/?humidity=true`
- Filter by min rainfall (strictly greater than X):
  `http://127.0.0.1:3000/?min_rainfall=1.0`
- Combine:
  `http://127.0.0.1:3000/?humidity=true&min_rainfall=1.5`

## Expected XML shape
```xml
<weather_data>
  <record>
    <rainfall>3.6</rainfall>
    <pressure3pm>1008.4</pressure3pm>
    <humidity>36</humidity>
  </record>
</weather_data>
```

## Notes
- Required CLI args: `-i/--input`, `-h/--host`, `-p/--port`.
- If the input file is missing, the program prints exactly: `Cannot find input file` and exits.
- JSON is re-read on every request, as required by the lab.
- The code tolerates slightly different field names and top-level shapes.
```