#!/usr/bin/env python3
"""
Food Express AI - Delivery Time Predictor Web Server
Serves the premium interactive frontend and provides /api/predict backed by Rio.pkl.
"""

import http.server
import json
import mimetypes
import os
import pickle
import struct
import sys
from urllib.parse import parse_qs, urlparse

# Base directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
MODEL_PATH = os.path.join(BASE_DIR, "codes", "Rio.pkl")

# Fallback custom unpickler if scikit-learn is not available in the python env
class StandaloneUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        if "sklearn" in module:
            class StandaloneLinearRegression:
                def __init__(self, **kwargs):
                    self.__dict__.update(kwargs)
                def predict(self, X):
                    import numpy as np
                    arr = np.array(X)
                    return arr @ self.coef_ + self.intercept_
            return StandaloneLinearRegression
        return super().find_class(module, name)

# Load the trained model
def load_rio_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found at: {MODEL_PATH}")
    
    try:
        with open(MODEL_PATH, "rb") as f:
            package = pickle.load(f)
            print("[Food Express] Successfully loaded model using standard pickle.")
            return package
    except Exception:
        with open(MODEL_PATH, "rb") as f:
            package = StandaloneUnpickler(f).load()
            print("[Food Express] Successfully loaded model using StandaloneUnpickler fallback.")
            return package

MODEL_PACKAGE = load_rio_model()
MODEL = MODEL_PACKAGE["model"]
FEATURES = MODEL_PACKAGE["features"]

# Extract model parameters
COEFS = {feat: float(coef) for feat, coef in zip(FEATURES, MODEL.coef_)}
INTERCEPT = float(MODEL.intercept_)

print(f"[Food Express] Model Features: {FEATURES}")
print(f"[Food Express] Model Intercept: {INTERCEPT:.4f}")
for feat, coef in COEFS.items():
    print(f"  - {feat}: {coef:.4f}")

def calculate_prediction(distance_km, preparation_time_min, traffic_level, weather_severity, rider_experience_years):
    """
    Computes linear regression delivery time prediction and detailed factor breakdown.
    Formula: Intercept + sum(coef * feature)
    """
    distance_impact = distance_km * COEFS.get("distance_km", 3.007)
    prep_impact = preparation_time_min * COEFS.get("preparation_time_min", 0.997)
    traffic_impact = traffic_level * COEFS.get("traffic_level", 3.980)
    weather_impact = weather_severity * COEFS.get("weather_severity", 1.979)
    rider_discount = rider_experience_years * COEFS.get("rider_experience_years", -0.358)
    
    raw_time = INTERCEPT + distance_impact + prep_impact + traffic_impact + weather_impact + rider_discount
    predicted_time = max(1.0, raw_time)
    
    return {
        "predicted_time_min": round(predicted_time, 2),
        "raw_time": round(raw_time, 2),
        "breakdown": {
            "intercept": round(INTERCEPT, 2),
            "distance_impact": round(distance_impact, 2),
            "preparation_impact": round(prep_impact, 2),
            "traffic_impact": round(traffic_impact, 2),
            "weather_impact": round(weather_impact, 2),
            "rider_discount": round(rider_discount, 2)
        },
        "inputs": {
            "distance_km": distance_km,
            "preparation_time_min": preparation_time_min,
            "traffic_level": traffic_level,
            "weather_severity": weather_severity,
            "rider_experience_years": rider_experience_years
        }
    }


class RioAppHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        
        # API: Model details
        if parsed.path == "/api/model-info":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            info = {
                "status": "success",
                "model_name": "Rio.pkl",
                "features": FEATURES,
                "coefficients": COEFS,
                "intercept": round(INTERCEPT, 4)
            }
            self.wfile.write(json.dumps(info).encode("utf-8"))
            return
            
        # API: Quick GET prediction with query parameters
        if parsed.path == "/api/predict":
            query = parse_qs(parsed.query)
            try:
                distance_km = float(query.get("distance_km", [5.0])[0])
                prep_time = float(query.get("preparation_time_min", [15.0])[0])
                traffic = int(query.get("traffic_level", [2])[0])
                weather = int(query.get("weather_severity", [1])[0])
                rider_exp = float(query.get("rider_experience_years", [3.0])[0])
                
                result = calculate_prediction(distance_km, prep_time, traffic, weather, rider_exp)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "data": result}).encode("utf-8"))
                return
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))
                return

        # Default static file routing
        if parsed.path in ["", "/"]:
            self.path = "/index.html"
            
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        
        if parsed.path == "/api/predict":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length).decode("utf-8")
            try:
                data = json.loads(body) if body else {}
                distance_km = float(data.get("distance_km", 5.0))
                prep_time = float(data.get("preparation_time_min", 15.0))
                traffic = int(data.get("traffic_level", 2))
                weather = int(data.get("weather_severity", 1))
                rider_exp = float(data.get("rider_experience_years", 3.0))
                
                result = calculate_prediction(distance_km, prep_time, traffic, weather, rider_exp)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "data": result}).encode("utf-8"))
            except Exception as e:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))
            return
            
        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()


def run(port=8000):
    server_address = ("", port)
    httpd = http.server.HTTPServer(server_address, RioAppHandler)
    print(f"============================================================")
    print(f"🚀 Food Express AI Server is running!")
    print(f"👉 Local URL: http://localhost:{port}")
    print(f"📦 Model loaded: {MODEL_PATH}")
    print(f"============================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
        httpd.server_close()


if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
    run(port)

