// Form nhập định lượng cho 1 người; API lưu tổng nguyên liệu của cả công thức.
// Làm tròn tổng tới 3 chữ số theo độ chính xác định lượng của backend.
export function totalRecipeQuantity(perPerson: number, people: number): number {
  return Math.round(perPerson * people * 1000) / 1000
}

export function quantityPerPerson(total: number, people: number): number {
  return total / people
}
