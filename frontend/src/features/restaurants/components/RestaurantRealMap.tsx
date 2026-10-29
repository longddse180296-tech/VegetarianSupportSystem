// Chức năng: tra cứu và quản lý nhà hàng. Hiển thị một phần giao diện và phát sự kiện cho màn hình cha xử lý.
import React, { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Restaurant } from '../types/restaurant.types'
import { formatAddress } from '../utils/restaurantUtils'
import { formatRestaurantDistance } from '../utils/restaurantLocation'

// Cấu trúc RestaurantRealMapProps quy định dữ liệu trao đổi trong tra cứu và quản lý nhà hàng.
interface RestaurantRealMapProps {
  restaurants: Restaurant[]
  selectedRestaurant: Restaurant | null
  onSelectRestaurant: (restaurant: Restaurant) => void
  onNavigate?: (path: string) => void
}

// Chỉ dùng tọa độ nhà hàng đã lưu; thiếu dữ liệu thì không dựng marker ở một vị trí giả.
function resolveCoordinates(restaurant: Restaurant): [number, number] | null {
  return typeof restaurant.geoLat === 'number' && Number.isFinite(restaurant.geoLat) && Math.abs(restaurant.geoLat) <= 90 &&
    typeof restaurant.geoLng === 'number' && Number.isFinite(restaurant.geoLng) && Math.abs(restaurant.geoLng) <= 180
    ? [restaurant.geoLat, restaurant.geoLng] : null
}
// Popup Leaflet dùng HTML nên phải escape nội dung từ database trước khi ghép chuỗi.
function escapeMapHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

// Chuẩn hóa hoặc chuyển đổi dữ liệu giữa các bước xử lý (RestaurantRealMap); thuộc tra cứu và quản lý nhà hàng.
export const RestaurantRealMap: React.FC<RestaurantRealMapProps> = ({
  restaurants,
  selectedRestaurant,
  onSelectRestaurant,
  onNavigate,
}) => {
  // Giữ tham chiếu giữa các lần render để quản lý yêu cầu hoặc phần tử giao diện.
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())

  // Initialize Map
  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // Default center in Vietnam
    const map = L.map(mapContainerRef.current, {
      center: [16, 106],
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
    })

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update Markers when restaurants list changes
  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current.clear()

    if (restaurants.length === 0) return

    const bounds = L.latLngBounds([])

    restaurants.forEach((r) => {
      const coordinates = resolveCoordinates(r)
      if (!coordinates) return
      const [lat, lng] = coordinates
      const latLng = L.latLng(lat, lng)
      bounds.extend(latLng)

      const isSelected = selectedRestaurant?.id === r.id
      const cleanName = r.name.replace(/^\[Demo\]\s*/i, '')
      const address = formatAddress(r.address, r.district, r.city)
      const distance = formatRestaurantDistance(r.distanceKm)

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
            <span>${escapeMapHtml(cleanName.slice(0, 16))}${cleanName.length > 16 ? '...' : ''}</span>
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
            <img src="${escapeMapHtml(r.imageUrl)}" alt="${escapeMapHtml(cleanName)}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a; line-height: 1.3;">
            ${escapeMapHtml(cleanName)}
          </h4>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; line-height: 1.4;">
            📍 ${escapeMapHtml(address)}
          </p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 11px; font-weight: 600; color: #166534;">
            <span>${r.openingHours ? `🕒 ${escapeMapHtml(r.openingHours)}` : ''}</span>
            <span>${distance ? `🧭 Cách khoảng ${distance}` : ''}</span>
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
  // Đồng bộ trạng thái hoặc tác động bên ngoài khi các phụ thuộc thay đổi.
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

  // Hiển thị giao diện tra cứu và quản lý nhà hàng từ dữ liệu và các trạng thái đã chuẩn bị ở trên.
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-slate-100 shadow-xs">
      <div ref={mapContainerRef} className="h-full w-full min-h-[520px] z-10" />

      {/* Floating map info badge */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-emerald-800 shadow-md backdrop-blur-xs border border-emerald-100">
        <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
        <span>Bản đồ trực tiếp ({restaurants.filter(restaurant => resolveCoordinates(restaurant) !== null).length} quán có tọa độ)</span>
      </div>
    </div>
  )
}

export default RestaurantRealMap
