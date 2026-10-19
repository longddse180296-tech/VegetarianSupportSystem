import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Restaurant } from '../types/restaurant.types'
import { formatAddress } from '../utils/restaurantUtils'

interface RestaurantRealMapProps {
  restaurants: Restaurant[]
  selectedRestaurant: Restaurant | null
  onSelectRestaurant: (restaurant: Restaurant) => void
  onNavigate?: (path: string) => void
}

// Known coordinates for districts/cities in Vietnam
const DISTRICT_COORDS: Record<string, [number, number]> = {
  'quận 1': [10.7769, 106.7008],
  'quận 3': [10.7841, 106.6868],
  'quận 7': [10.7295, 106.7219],
  'thủ đức': [10.85, 106.7717],
  'bình thạnh': [10.803, 106.709],
  'ba đình': [21.0359, 105.8198],
  'hoàn kiếm': [21.0285, 105.8542],
  'tây hồ': [21.0673, 105.8241],
  'long biên': [21.0462, 105.894],
  'hải châu': [16.0471, 108.2068],
  'sơn trà': [16.07, 108.235],
  'đà nẵng': [16.0544, 108.2022],
  'hà nội': [21.0285, 105.8542],
  'tp.hcm': [10.7769, 106.7008],
}

function resolveCoordinates(r: Restaurant, index: number): [number, number] {
  if (typeof r.geoLat === 'number' && typeof r.geoLng === 'number' && !isNaN(r.geoLat) && !isNaN(r.geoLng)) {
    return [r.geoLat, r.geoLng]
  }

  // Derive coordinates based on district or city
  const searchStr = `${r.district || ''} ${r.city || ''} ${r.address || ''}`.toLowerCase()
  for (const [key, coords] of Object.entries(DISTRICT_COORDS)) {
    if (searchStr.includes(key)) {
      // Deterministic slight offset so markers in the same district don't overlap completely
      const offsetLat = ((index % 5) - 2) * 0.0035
      const offsetLng = (((index * 3) % 5) - 2) * 0.0035
      return [coords[0] + offsetLat, coords[1] + offsetLng]
    }
  }

  // Default to TP.HCM center
  const offsetLat = ((index % 5) - 2) * 0.004
  const offsetLng = (((index * 2) % 5) - 2) * 0.004
  return [10.7769 + offsetLat, 106.7008 + offsetLng]
}

export const RestaurantRealMap: React.FC<RestaurantRealMapProps> = ({
  restaurants,
  selectedRestaurant,
  onSelectRestaurant,
  onNavigate,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // Default center in Vietnam
    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7008],
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    })

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update Markers when restaurants list changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    if (restaurants.length === 0) return

    const bounds = L.latLngBounds([])

    restaurants.forEach((r, idx) => {
      const [lat, lng] = resolveCoordinates(r, idx)
      const latLng = L.latLng(lat, lng)
      bounds.extend(latLng)

      const isSelected = selectedRestaurant?.id === r.id
      const cleanName = r.name.replace(/^\[Demo\]\s*/i, '')
      const address = formatAddress(r.address, r.district, r.city)
      const distance = r.distanceKm ? `${r.distanceKm.toFixed(1)} km` : '1.2 km'

      // Custom HTML Pin Marker
      const customPinHtml = `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            background-color: ${isSelected ? '#1B5E20' : '#2E7D32'};
            color: #ffffff;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            padding: 4px 8px;
            border-radius: 9999px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            border: 2px solid #ffffff;
            white-space: nowrap;
            transition: transform 0.2s;
          ">
            <span>🥗</span>
            <span>${cleanName.slice(0, 16)}${cleanName.length > 16 ? '...' : ''}</span>
          </div>
          <div style="
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 7px solid ${isSelected ? '#1B5E20' : '#2E7D32'};
          "></div>
        </div>
      `

      const icon = L.divIcon({
        html: customPinHtml,
        className: 'restaurant-map-pin',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })

      const marker = L.marker([lat, lng], { icon }).addTo(map)

      // Clean single popup content
      const popupHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 220px; padding: 4px;">
          <div style="width: 100%; height: 95px; border-radius: 10px; overflow: hidden; margin-bottom: 8px; background-color: #0f172a;">
            <img src="${r.imageUrl}" alt="${cleanName}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a; line-height: 1.3;">
            ${cleanName}
          </h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; line-height: 1.4;">
            📍 ${address}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 11px; font-weight: 600; color: #166534;">
            <span>${r.openingHours ? `🕒 ${r.openingHours}` : ''}</span>
            <span>${r.distanceKm ? `🧭 ${distance}` : ''}</span>
          </div>
          <button id="btn-popup-${r.id}" style="
            width: 100%;
            background-color: #2E7D32;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            padding: 6px 10px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
          ">
            Xem chi tiết →
          </button>
        </div>
      `

      const popup = L.popup({
        closeButton: true,
        autoClose: true,
        closeOnClick: false,
        offset: [0, -32],
        maxWidth: 260,
      }).setContent(popupHtml)

      marker.bindPopup(popup)

      // When marker is clicked: select restaurant & open popup
      marker.on('click', () => {
        onSelectRestaurant(r)
      })

      // Attach button click handler when popup opens
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${r.id}`)
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation()
            if (onNavigate) {
              onNavigate(`/restaurants/${r.id}`)
            }
          }
        }
      })

      markersRef.current.set(r.id, marker)
    })

    // Fit map bounds to encompass all visible restaurants
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
    }
  }, [restaurants, selectedRestaurant, onSelectRestaurant, onNavigate])

  // Center & Open Popup for selected restaurant
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !selectedRestaurant) return

    const marker = markersRef.current.get(selectedRestaurant.id)
    if (marker) {
      const latLng = marker.getLatLng()
      map.flyTo(latLng, Math.max(map.getZoom(), 14), {
        duration: 0.8,
      })
      marker.openPopup()
    }
  }, [selectedRestaurant])

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-slate-100 shadow-xs">
      <div ref={mapContainerRef} className="h-full w-full min-h-[520px] z-10" />

      {/* Floating map info badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-md backdrop-blur-xs border border-emerald-100">
        <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
        <span>Bản đồ trực tiếp ({restaurants.length} quán)</span>
      </div>
    </div>
  )
}

export default RestaurantRealMap
