#!/usr/bin/env python3
import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INPUT_CSV = ROOT / "outputs" / "google_matched_all.csv"
OUTPUT_JSON = ROOT / "web_map" / "data" / "clinics.json"


def clean(value):
    return str(value or "").strip()


def as_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def as_int(value):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return None


def main():
    clinics = []
    with INPUT_CSV.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            lat = as_float(row.get("latitude"))
            lng = as_float(row.get("longitude"))
            if lat is None or lng is None:
                continue

            clinics.append(
                {
                    "id": clean(row.get("ihp_clinic_id")) or f"{len(clinics) + 1}",
                    "name": clean(row.get("clinic_name")),
                    "category": clean(row.get("category")),
                    "ratingBand": clean(row.get("rating_band")),
                    "rating": as_float(row.get("google_rating")),
                    "reviewCount": as_int(row.get("google_review_count")),
                    "address": clean(row.get("address")),
                    "phone": clean(row.get("phone")),
                    "specialty": clean(row.get("specialty")),
                    "area": clean(row.get("area")),
                    "region": clean(row.get("region")),
                    "lat": lat,
                    "lng": lng,
                    "googlePlaceName": clean(row.get("google_place_name")),
                    "googleAddress": clean(row.get("google_formatted_address")),
                    "googleMapsUrl": clean(row.get("google_maps_url")),
                    "matchStatus": clean(row.get("match_status")),
                    "reviewPriority": clean(row.get("review_priority")),
                    "matchNotes": clean(row.get("match_notes")),
                }
            )

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(
        json.dumps({"clinics": clinics}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Wrote {len(clinics)} clinics to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
