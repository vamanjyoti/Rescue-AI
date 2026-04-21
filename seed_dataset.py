"""
Run this once to verify/rebuild disaster_data.csv from the embedded data.
Usage: python seed_dataset.py
"""
import os, csv, random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_PATH = os.path.join(BASE_DIR, "disaster_data.csv")

CITIES = ["Hyderabad","Mumbai","Delhi","Bangalore","Chennai","Kolkata","Pune","Ahmedabad"]

random.seed(42)

rows = []
for i in range(1, 6001):
    city = CITIES[(i - 1) % len(CITIES)]
    rows.append({
        "Area":               f"Zone_{i}",
        "Population_Density": random.randint(30, 99),
        "Disaster_Severity":  random.randint(1, 10),
        "Distance_km":        random.randint(1, 49),
        "Weather_Risk":       random.randint(1, 9),
        "Available_Teams":    random.randint(1, 10),
        "City":               city,
    })

with open(OUT_PATH, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["Area","Population_Density","Disaster_Severity",
                                            "Distance_km","Weather_Risk","Available_Teams","City"])
    writer.writeheader()
    writer.writerows(rows)

print(f"Written {len(rows)} zones to {OUT_PATH}")
