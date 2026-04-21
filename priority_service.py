"""
RescueAI – Analytics & Priority Service  (port 8000)
Reads disaster_data.csv, calculates priority scores, serves JSON API.
"""

from http.server import BaseHTTPRequestHandler, HTTPServer
import json, os
import pandas as pd
import numpy as np

# ── Load dataset ─
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, "disaster_data.csv")

try:
    raw = pd.read_csv(CSV_PATH)
    df = raw[raw["Area"].notna() & raw["Area"].str.startswith("Zone", na=False)].copy()
    for col in ["Population_Density", "Disaster_Severity", "Distance_km",
                "Weather_Risk", "Available_Teams"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df.dropna(subset=["Disaster_Severity"], inplace=True)
    df.reset_index(drop=True, inplace=True)

    # Pre-compute priority scores once at startup (avoids recalculating on every request)
    df["Priority_Score"] = (
        0.4 * df["Disaster_Severity"] +
        0.3 * (df["Population_Density"] / 10.0).clip(upper=10) +
        0.2 * (df["Distance_km"] / 5.0).clip(upper=10) +
        0.1 * df["Weather_Risk"]
    ).round(2).clip(upper=10)
    df["Priority_Level"] = pd.cut(
        df["Priority_Score"],
        bins=[-1, 4, 7, 10],
        labels=["LOW", "MEDIUM", "HIGH"]
    ).astype(str)

    # Pre-build city summary once
    CITY_SUMMARY = df.groupby("City").agg(
        avg_severity  = ("Disaster_Severity", "mean"),
        avg_score     = ("Priority_Score",    "mean"),
        total_zones   = ("Area",              "count"),
        high_priority = ("Priority_Level",    lambda x: int((x == "HIGH").sum())),
        total_teams   = ("Available_Teams",   "sum")
    ).reset_index().round(2).to_dict(orient="records")

    print(f"Dataset loaded: {len(df)} zones — scores pre-computed")
except Exception as exc:
    df = pd.DataFrame()
    CITY_SUMMARY = []
    print(f"Dataset load failed: {exc}")


# ── Priority formula ──
def calc_score(severity, pop_density, distance, weather_risk):
    """
    Priority Score = 0.4×Severity + 0.3×Population(norm) +
                     0.2×Distance(norm) + 0.1×WeatherRisk
    Inputs are raw values; normalised internally to 0-10.
    """
    sev  = float(severity)
    pop  = min(float(pop_density) / 10.0, 10.0)   # density 0-100 → 0-10
    dist = min(float(distance)    / 5.0,  10.0)   # distance 0-50 → 0-10
    wea  = float(weather_risk)
    score = 0.4*sev + 0.3*pop + 0.2*dist + 0.1*wea
    return round(min(score, 10.0), 2)


def level(score):
    if score >= 7: return "HIGH"
    if score >= 4: return "MEDIUM"
    return "LOW"


# ── Analytics helpers — use pre-computed columns, no per-request recalc ───────
def top_zones(city=None, n=20):
    if df.empty:
        return []
    data = df if not city else df[df["City"].str.lower() == city.lower()]
    top  = data.nlargest(n, "Priority_Score")
    cols = ["Area","City","Disaster_Severity","Population_Density",
            "Distance_km","Weather_Risk","Available_Teams",
            "Priority_Score","Priority_Level"]
    return top[cols].to_dict(orient="records")


def city_summary():
    return CITY_SUMMARY


# ── HTTP handler ---
class Handler(BaseHTTPRequestHandler):

    def log_message(self, fmt, *args):
        print(f"[{self.command}] {self.path}  {fmt % args}")

    def _send(self, payload, status=200):
        body = json.dumps(payload, default=str).encode()
        self.send_response(status)
        self.send_header("Content-Type",  "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin",  "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send({})

    # ── GET ──────
    def do_GET(self):
        path = self.path.split("?")[0]
        qs   = self.path.split("?")[1] if "?" in self.path else ""
        params = dict(p.split("=") for p in qs.split("&") if "=" in p)

        if path in ("/", ""):
            self._send({
                "service": "RescueAI Analytics",
                "status": "running",
                "zones": len(df),
                "endpoints": ["/health", "/zones", "/city-summary"]
            })

        elif path == "/health":
            self._send({"status": "ok", "zones": len(df)})

        elif path == "/zones":
            city = params.get("city", "")
            n    = int(params.get("n", 20))
            self._send(top_zones(city or None, n))

        elif path == "/city-summary":
            self._send(city_summary())

        else:
            self._send({"error": f"Unknown path: {path}"}, 404)

    # ── POST ─────────────────────────────────────────────────────────────────
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body   = self.rfile.read(length)
        try:
            data = json.loads(body) if length else {}
        except Exception:
            data = {}

        path = self.path.split("?")[0]

        if path == "/priority":
            # Accept either raw form values or dataset-style keys
            sev  = float(data.get("severity",         data.get("Disaster_Severity",  5)))
            pop  = float(data.get("populationDensity",data.get("Population_Density", 60)))
            dist = float(data.get("distance",         data.get("Distance_km",        25)))
            wea  = float(data.get("weatherRisk",      data.get("Weather_Risk",        5)))
            score = calc_score(sev, pop, dist, wea)
            self._send({"level": level(score), "score": score})

        elif path == "/analyze-zone":
            area = data.get("area", "")
            if not df.empty and area:
                match = df[df["Area"] == area]
                if not match.empty:
                    r = match.iloc[0]
                    s = calc_score(r["Disaster_Severity"], r["Population_Density"],
                                   r["Distance_km"], r["Weather_Risk"])
                    self._send({
                        "area": area, "city": r["City"],
                        "score": s, "level": level(s),
                        "severity": r["Disaster_Severity"],
                        "population": r["Population_Density"],
                        "distance": r["Distance_km"],
                        "weather": r["Weather_Risk"],
                        "teams": r["Available_Teams"]
                    })
                    return
            self._send({"error": "Zone not found"}, 404)

        else:
            self._send({"error": f"Unknown path: {path}"}, 404)


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port   = int(os.environ.get("PORT", 8000))
    server = HTTPServer(("0.0.0.0", port), Handler)
    print(f"RescueAI Analytics  →  http://localhost:{port}")
    print(f"Zones loaded        :  {len(df)}")
    print(f"Endpoints           :  GET /health  /zones  /city-summary")
    print(f"                       POST /priority  /analyze-zone")
    server.serve_forever()
