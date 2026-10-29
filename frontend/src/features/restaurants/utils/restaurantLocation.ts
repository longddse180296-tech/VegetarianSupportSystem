// Tiện ích vị trí: giữ số 0 hợp lệ, phân biệt chưa tính được và định dạng khoảng cách đường chim bay.
export function formatRestaurantDistance(distanceKm?: number | null): string {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0) return ''
  if (distanceKm > 0 && distanceKm < 0.01) return '< 0,01 km'
  return `${distanceKm.toLocaleString('vi-VN', { maximumFractionDigits: distanceKm < 1 ? 2 : 1 })} km`
}

export function hasRestaurantLocation(location: { latitude?: number; longitude?: number }): boolean {
  return typeof location.latitude === 'number' && Number.isFinite(location.latitude) && Math.abs(location.latitude) <= 90 &&
    typeof location.longitude === 'number' && Number.isFinite(location.longitude) && Math.abs(location.longitude) <= 180
}
