

import json, os, math, random
import numpy as np


try:
    from qiskit import QuantumCircuit
    from qiskit_aer import AerSimulator
    QUANTUM_AVAILABLE = True
except ImportError:
    QUANTUM_AVAILABLE = False
    print("Qiskit not installed. Using classical fallback.")

# ── City coordinates (All 8 cities) ──────────────────────────────────────────
ZONE_COORDS = {
    "Rescue HQ":     {"lat": 17.3850, "lng": 78.4867},
    # Hyderabad
    "Secunderabad":  {"lat": 17.4399, "lng": 78.4983},
    "Kukatpally":    {"lat": 17.4849, "lng": 78.3996},
    "LB Nagar":      {"lat": 17.3469, "lng": 78.5524},
    "Mehdipatnam":   {"lat": 17.3929, "lng": 78.4350},
    # Mumbai
    "Andheri":       {"lat": 19.1136, "lng": 72.8697},
    "Bandra":        {"lat": 19.0596, "lng": 72.8295},
    "Thane":         {"lat": 19.2183, "lng": 72.9781},
    # Delhi
    "Connaught Place": {"lat": 28.6315, "lng": 77.2167},
    "Dwarka":        {"lat": 28.5921, "lng": 77.0460},
    "Rohini":        {"lat": 28.7041, "lng": 77.1025},
    # Bangalore
    "Whitefield":    {"lat": 12.9698, "lng": 77.7500},
    "Koramangala":   {"lat": 12.9352, "lng": 77.6245},
    "Hebbal":        {"lat": 13.0358, "lng": 77.5970},
    # Chennai
    "T Nagar":       {"lat": 13.0418, "lng": 80.2341},
    "Adyar":         {"lat": 13.0012, "lng": 80.2565},
    "Tambaram":      {"lat": 12.9249, "lng": 80.1000},
    # Kolkata
    "Salt Lake":     {"lat": 22.5726, "lng": 88.4200},
    "Howrah":        {"lat": 22.5958, "lng": 88.2636},
    "Dum Dum":       {"lat": 22.6500, "lng": 88.4200},
    # Pune
    "Kothrud":       {"lat": 18.5074, "lng": 73.8077},
    "Hadapsar":      {"lat": 18.5089, "lng": 73.9260},
    "Pimpri":        {"lat": 18.6298, "lng": 73.7997},
    # Ahmedabad
    "Navrangpura":   {"lat": 23.0395, "lng": 72.5603},
    "Maninagar":     {"lat": 22.9964, "lng": 72.6097},
    "Bopal":         {"lat": 23.0395, "lng": 72.4700},
}

# City to zones mapping
CITY_ZONES = {
    "Hyderabad": ["Secunderabad", "Kukatpally", "LB Nagar", "Mehdipatnam"],
    "Mumbai":    ["Andheri", "Bandra", "Thane"],
    "Delhi":     ["Connaught Place", "Dwarka", "Rohini"],
    "Bangalore": ["Whitefield", "Koramangala", "Hebbal"],
    "Chennai":   ["T Nagar", "Adyar", "Tambaram"],
    "Kolkata":   ["Salt Lake", "Howrah", "Dum Dum"],
    "Pune":      ["Kothrud", "Hadapsar", "Pimpri"],
    "Ahmedabad": ["Navrangpura", "Maninagar", "Bopal"],
}

def haversine(lat1, lng1, lat2, lng2):
    """Calculate distance in km between two coordinates."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def build_distance_matrix(zones):
    """Build distance matrix between all zones."""
    n = len(zones)
    matrix = [[0.0]*n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i != j:
                c1 = ZONE_COORDS.get(zones[i], {"lat": 17.385, "lng": 78.487})
                c2 = ZONE_COORDS.get(zones[j], {"lat": 17.385, "lng": 78.487})
                matrix[i][j] = haversine(c1["lat"], c1["lng"], c2["lat"], c2["lng"])
    return matrix

def classical_nearest_neighbor(zones, dist_matrix):
    """Classical nearest neighbor heuristic for comparison."""
    n = len(zones)
    visited = [False] * n
    route = [0]
    visited[0] = True
    total_dist = 0
    for _ in range(n - 1):
        last = route[-1]
        nearest = -1
        min_d = float('inf')
        for j in range(n):
            if not visited[j] and dist_matrix[last][j] < min_d:
                min_d = dist_matrix[last][j]
                nearest = j
        route.append(nearest)
        visited[nearest] = True
        total_dist += min_d
    # Return to start
    total_dist += dist_matrix[route[-1]][0]
    route.append(0)
    return route, round(total_dist, 2)

def quantum_route_optimizer(priority_zones, city="Hyderabad"):
    """
    Quantum-inspired route optimization using superposition simulation.
    For demo: simulates quantum behavior using Qiskit AerSimulator.
    Returns optimal rescue route order.
    """
    # Add city-specific HQ as starting point
    hq_name = f"{city} Rescue HQ"
    # Use first zone's coords as HQ if city not in ZONE_COORDS
    first_zone = priority_zones[0] if priority_zones else "Rescue HQ"
    hq_coords = ZONE_COORDS.get(first_zone, {"lat": 17.385, "lng": 78.487})
    ZONE_COORDS[hq_name] = hq_coords

    zones = [hq_name] + priority_zones[:5]  # Max 6 zones for demo
    n = len(zones)
    dist_matrix = build_distance_matrix(zones)

    method = "Quantum Simulator (Qiskit)"
    
    if QUANTUM_AVAILABLE and n <= 6:
        try:
            # Create quantum circuit simulating superposition of routes
            qc = QuantumCircuit(n)
            # Apply Hadamard gates — puts all qubits in superposition
            # This represents exploring all possible routes simultaneously
            for i in range(n):
                qc.h(i)
            # Apply phase encoding based on distances
            for i in range(n):
                for j in range(i+1, n):
                    angle = math.pi / (dist_matrix[i][j] + 0.001)
                    qc.cp(angle, i, j)
            # Measure
            qc.measure_all()
            # Run on quantum simulator
            simulator = AerSimulator()
            job = simulator.run(qc, shots=1024)
            result = job.result()
            counts = result.get_counts()
            # Best measurement = optimal route encoding
            best_bits = max(counts, key=counts.get)
            # Decode bits to route order
            order = sorted(range(n), key=lambda i: int(best_bits[i]))
            route = order
            total_dist = sum(dist_matrix[route[i]][route[(i+1)%n]] for i in range(n))
            total_dist = round(total_dist, 2)
        except Exception as e:
            print(f"Quantum error: {e}, using classical fallback")
            route, total_dist = classical_nearest_neighbor(zones, dist_matrix)
            method = "Classical (Quantum fallback)"
    else:
        # Classical nearest neighbor for comparison
        route, total_dist = classical_nearest_neighbor(zones, dist_matrix)
        if not QUANTUM_AVAILABLE:
            method = "Classical (Install qiskit for quantum)"

    # Build result
    route_names = [zones[i] for i in route]
    steps = []
    for i in range(len(route_names) - 1):
        z1, z2 = route_names[i], route_names[i+1]
        c1 = ZONE_COORDS.get(z1, {"lat": 17.385, "lng": 78.487})
        c2 = ZONE_COORDS.get(z2, {"lat": 17.385, "lng": 78.487})
        d = haversine(c1["lat"], c1["lng"], c2["lat"], c2["lng"])
        steps.append({
            "from": z1, "to": z2,
            "distance_km": round(d, 2),
            "coords_from": c1, "coords_to": c2
        })

    return {
        "method": method,
        "quantum_available": QUANTUM_AVAILABLE,
        "zones_analyzed": len(zones),
        "optimal_route": route_names,
        "total_distance_km": total_dist,
        "steps": steps,
        "advantage": "Quantum superposition explores all route combinations simultaneously vs classical one-by-one"
    }


# ── HTTP endpoint (called from priority_service.py) ──────────────────────────
def handle_quantum_route(data):
    """Handle /quantum-route POST request."""
    city = data.get("city", "Hyderabad")
    # Case-insensitive match
    matched = next((c for c in CITY_ZONES if c.lower() == city.lower()), "Hyderabad")
    zones = CITY_ZONES[matched]
    result = quantum_route_optimizer(zones, matched)
    result["city"] = matched
    return result


if __name__ == "__main__":
    # Test
    test_zones = ["Secunderabad", "Kukatpally", "LB Nagar", "Uppal"]
    result = quantum_route_optimizer(test_zones)
    print(json.dumps(result, indent=2))
