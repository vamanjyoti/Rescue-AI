import { useEffect, useState } from 'react'
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api'

const GMAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''
const MAP_STYLE  = { width: '100%', height: '280px', borderRadius: '8px' }
const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 } // India center

const darkStyle = [
  { elementType: 'geometry',            stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
]

export default function MapSection({ route, location }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GMAPS_KEY,
    libraries: ['places'],
  })

  const [center,     setCenter]     = useState(DEFAULT_CENTER)
  const [directions, setDirections] = useState(null)

  useEffect(() => {
    if (!isLoaded || !location || !GMAPS_KEY) return
    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ address: `${location}, India` }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const loc = results[0].geometry.location
        setCenter({ lat: loc.lat(), lng: loc.lng() })
      }
    })
  }, [isLoaded, location])

  useEffect(() => {
    if (!isLoaded || !route?.origin || !route?.destination || route.distance === 'N/A' || !GMAPS_KEY) return
    const ds = new window.google.maps.DirectionsService()
    ds.route(
      { origin: route.origin, destination: route.destination, travelMode: window.google.maps.TravelMode.DRIVING },
      (result, status) => { if (status === 'OK') setDirections(result) }
    )
  }, [isLoaded, route])

  return (
    <div className="card">
      <div className="card-label">🗺️ Route Map — {location}</div>

      {!GMAPS_KEY ? (
        <div className="map-placeholder">
          <span>🗺️</span>
          <span>Add VITE_GOOGLE_MAPS_KEY to frontend/.env to enable map</span>
        </div>
      ) : loadError ? (
        <div className="map-placeholder">Failed to load Google Maps</div>
      ) : !isLoaded ? (
        <div className="map-placeholder">Loading map...</div>
      ) : (
        <div className="map-container">
          <GoogleMap mapContainerStyle={MAP_STYLE} center={center} zoom={11} options={{ styles: darkStyle, disableDefaultUI: false }}>
            <Marker position={center} />
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        </div>
      )}

      {route && (
        <div className="route-info">
          <span>📍 From: {route.origin || 'Rescue HQ'}</span>
          <span>🏁 To: {route.destination || location}</span>
          {route.distance !== 'N/A' && <span>📏 {route.distance}</span>}
          {route.duration !== 'N/A' && <span>⏱️ {route.duration}</span>}
        </div>
      )}
    </div>
  )
}
