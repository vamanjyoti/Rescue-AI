"""
RescueAI – Priority Calculation Service
Runs as a lightweight HTTP server on port 8000.
Called by the Node.js backend at POST /priority
"""

from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import numpy as np

# Severity weights per disaster type
DISASTER_WEIGHTS = {
    "Earthquake": 1.4,
    "Tsunami":    1.3,
    "Flood":      1.1,
    "Cyclone":    1.2,
    "Fire":       1.0,
    "Landslide":  1.0,
}

def calculate_priority(disaster_type: str, severity: float) -> dict:
    """
    Score = severity * disaster_weight
    Normalized to 0–10 using numpy clip.
    """
    weight = DISASTER_WEIGHTS.get(disaster_type, 1.0)
    raw_score = float(severity) * weight
    score = float(np.clip(raw_score, 0, 10))
    score = round(score, 2)

    if score >= 8:
        level = "HIGH"
    elif score >= 5:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {"level": level, "score": score, "weight": weight}


class PriorityHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[Analytics] {format % args}")

    def do_POST(self):
        if self.path != "/priority":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            data = json.loads(body)
            result = calculate_priority(
                data.get("disasterType", "Flood"),
                data.get("severity", 5),
            )
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())


if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 8000), PriorityHandler)
    print("🐍 Python Analytics Service running on http://localhost:8000")
    server.serve_forever()
