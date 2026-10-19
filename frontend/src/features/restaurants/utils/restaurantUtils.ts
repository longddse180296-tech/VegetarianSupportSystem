/**
 * Format address string and deduplicate repeated districts/cities
 * Example: Converts "Quận 3, TP.HCM, Quận 3" to "Quận 3, TP.HCM"
 */
export function formatAddress(
  address?: string | null,
  district?: string | null,
  city?: string | null,
): string {
  if (!address) return [district, city].filter(Boolean).join(', ')

  // Strip simulated placeholder text and trim
  const cleaned = address
    .replace(/^\[Demo\]\s*/i, '')
    .replace(/\s*\(địa chỉ giả lập\)\s*/gi, '')
    .trim()

  const rawParts = cleaned.split(',').map((p) => p.trim()).filter(Boolean)

  if (district && district.trim()) {
    const dTrim = district.trim()
    const alreadyHasDistrict = rawParts.some((part) =>
      part.toLowerCase().includes(dTrim.toLowerCase()),
    )
    if (!alreadyHasDistrict) {
      rawParts.push(dTrim)
    }
  }

  if (city && city.trim()) {
    const cTrim = city.trim()
    const alreadyHasCity = rawParts.some((part) =>
      part.toLowerCase().includes(cTrim.toLowerCase()),
    )
    if (!alreadyHasCity) {
      rawParts.push(cTrim)
    }
  }

  // Deduplicate parts case-insensitively
  const deduped: string[] = []
  for (const part of rawParts) {
    if (!deduped.some((d) => d.toLowerCase() === part.toLowerCase())) {
      deduped.push(part)
    }
  }

  return deduped.join(', ')
}
