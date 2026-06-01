# IHP Singapore Panel Clinic Map

An interactive map of IHP Singapore panel clinics with GP, Specialist, and TCM filters, Google ratings, and Google Maps links.

Clinic panel data is as of October 2025. Google ratings are as of May 2026.

## How To Use

- Filter by clinic type: GP, Specialist, or TCM.
- Filter by Google rating: `4.5+`, `4.0-4.4`, or `<4.0 / no rating`.
- Search by clinic name, address, area, or specialty.
- Select a marker to view clinic details.
- Use `Open in Google Maps` from a marker popup for directions or the original Google place page.

## Data Notes

This project is an independent map built from IHP panel clinic spreadsheets and Google Places matching. It is not an official IHP or Google product.

Google ratings and clinic availability may change after the data version date. Please verify clinic participation, opening hours, and coverage before visiting.

## For Contributors

This is a static Leaflet map. No backend is required.

Current data version: `Oct2025_May2026`

### Project Structure

```text
index.html
assets/
  app.js
  styles.css
data/
  clinics_latest.json
  clinics_Oct2025_May2026.json
source/
  Oct2025_May2026/
    raw_excel/
    processed/
    my_maps_layers/
scripts/
```

### Files

- `index.html` and `assets/` contain the static web map.
- `data/clinics_latest.json` is the file loaded by the web map.
- `data/clinics_Oct2025_May2026.json` preserves the current versioned data.
- `source/Oct2025_May2026/raw_excel/` stores the original panel spreadsheets.
- `source/Oct2025_May2026/processed/` stores cleaned and Google-matched outputs.
- `source/Oct2025_May2026/my_maps_layers/` stores CSVs that can be imported into Google My Maps.
- `scripts/` stores the local processing scripts used to prepare, match, and export data.

### Local Preview

Run from the repository root:

```bash
python3 -m http.server 8765
```

Then open:

```text
http://localhost:8765
```

Do not open `index.html` directly from Finder, because browsers often block JSON loading from local files.

### Updating Data

1. Create a new version label, for example `Jan2026_Jun2026`.
2. Add the new raw Excel files under `source/<version>/raw_excel/`.
3. Run the cleaning and Google Places matching scripts locally.
4. Export a new `data/clinics_<version>.json`.
5. Replace `data/clinics_latest.json` with the new version data.
6. Add processed reports and My Maps CSV exports under `source/<version>/`.
7. Update the version text in `index.html` and this README.

### Google API Key

The Google Places matching script reads `GOOGLE_MAPS_API_KEY` from the environment or a local `.env` file. Do not commit API keys.
