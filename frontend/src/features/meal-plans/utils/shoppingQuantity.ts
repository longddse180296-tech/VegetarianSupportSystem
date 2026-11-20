export function shoppingQuantityError(value: string, maximum: number, unit: string): string | null {
  if (!value.trim()) return 'Vui lòng nhập số lượng đã có.'
  if (!/^-?\d+(?:[.,]\d+)?$/.test(value.trim())) return 'Số lượng chỉ được nhập bằng số.'
  const quantity = Number(value.trim().replace(',', '.'))
  if (quantity < 0) return 'Số lượng không được là số âm.'
  if (!Number.isFinite(quantity) || quantity > maximum) return `Số lượng đã có cho danh sách này không được vượt quá ${maximum} ${unit}.`
  if ((value.trim().split(/[.,]/)[1]?.length ?? 0) > 3) return 'Vui lòng nhập tối đa 3 chữ số sau dấu thập phân.'
  return null
}
