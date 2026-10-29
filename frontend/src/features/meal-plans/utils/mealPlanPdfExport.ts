// Chức năng: thực đơn bảy ngày và danh sách đi chợ. Cấu hình hoặc hỗ trợ luồng xử lý của các thành phần trong ứng dụng.
import {
  addPlanDays,
  formatPlanDate,
  mealNutrition,
  PLAN_DIET_LABELS,
} from '../api/mealPlanApi'
import type { PlanShoppingItem, SavedPlan } from '../types/mealPlanBackend.types'

const slotLabels = {
  Breakfast: 'Bữa sáng',
  Lunch: 'Bữa trưa',
  Dinner: 'Bữa tối',
} as const

// Thực hiện bước xử lý riêng được các thành phần trong tính năng sử dụng (printHtmlContent); thuộc thực đơn bảy ngày và danh sách đi chợ.
function printHtmlContent(title: string, htmlBody: string) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.setAttribute('title', title)
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) {
    document.body.removeChild(iframe)
    return
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.45;
      background: #ffffff;
    }
    .header-bar {
      border-bottom: 2.5px solid #2E7D32;
      padding-bottom: 12px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand {
      color: #2E7D32;
      font-size: 18pt;
      font-weight: 900;
      letter-spacing: -0.5px;
    }
    .brand-sub {
      color: #64748b;
      font-size: 9pt;
      margin-top: 2px;
    }
    .doc-meta {
      text-align: right;
      font-size: 8.5pt;
      color: #64748b;
    }
    .doc-title {
      font-size: 15pt;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .info-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 9.5pt;
    }
    .info-item strong {
      color: #0f172a;
    }
    .day-block {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 12px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .day-header {
      background: #f1f5f9;
      padding: 6px 12px;
      font-weight: 700;
      font-size: 10.5pt;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
    }
    .meals-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
    }
    .meals-table th, .meals-table td {
      padding: 6px 10px;
      border-bottom: 1px solid #f1f5f9;
      text-align: left;
    }
    .meals-table th {
      background: #fafafa;
      color: #64748b;
      font-weight: 600;
      font-size: 8.5pt;
    }
    .meals-table tr:last-child td {
      border-bottom: none;
    }
    .slot-badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 8pt;
    }
    .slot-Breakfast { background: #fef3c7; color: #92400e; }
    .slot-Lunch { background: #dcfce7; color: #166534; }
    .slot-Dinner { background: #e0e7ff; color: #3730a3; }
    .nutrition-summary {
      background: #f0fdf4;
      border: 1.5px solid #bbf7d0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 16px;
      page-break-inside: avoid;
    }
    .nutrition-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-top: 8px;
      text-align: center;
    }
    .nutri-box {
      background: #ffffff;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      padding: 8px;
    }
    .nutri-val {
      font-size: 13pt;
      font-weight: 800;
      color: #166534;
    }
    .nutri-lbl {
      font-size: 8pt;
      color: #64748b;
    }
    .checklist-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 9pt;
    }
    .checklist-table th, .checklist-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
    }
    .checklist-table th {
      background: #f8fafc;
      font-weight: 700;
      color: #475569;
      font-size: 8.5pt;
      border-top: 1px solid #e2e8f0;
    }
    .checkbox-box {
      display: inline-block;
      width: 13px;
      height: 13px;
      border: 1.5px solid #94a3b8;
      border-radius: 3px;
      vertical-align: middle;
      margin-right: 6px;
    }
    .qty-badge {
      font-weight: 800;
      color: #2E7D32;
    }
    .footer {
      margin-top: 24px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  ${htmlBody}
  <div class="footer">
    Vegetarian Support · Nền tảng hỗ trợ dinh dưỡng thực vật khoa học · In ngày ${new Date().toLocaleDateString('vi-VN')}
  </div>
</body>
</html>`

  doc.open()
  doc.write(fullHtml)
  doc.close()

  iframe.contentWindow?.focus()
  setTimeout(() => {
    iframe.contentWindow?.print()
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }, 1500)
  }, 400)
}

/**
 * Xuất bản PDF Thực đơn 7 ngày (21 bữa)
 */
export function exportMealPlanPdf(plan: SavedPlan): void {
  const startDateStr = formatPlanDate(plan.weekStartDate)
  const endDateStr = formatPlanDate(addPlanDays(plan.weekStartDate, 6))

  let daysHtml = ''
  for (let dayNum = 1; dayNum <= 7; dayNum++) {
    const dayDate = formatPlanDate(addPlanDays(plan.weekStartDate, dayNum - 1))
    const dayMeals = plan.meals.filter((m) => m.dayNumber === dayNum)

    let mealRows = ''
    dayMeals.forEach((m) => {
      mealRows += `<tr>
        <td style="width: 90px;"><span class="slot-badge slot-${m.slot}">${slotLabels[m.slot]}</span></td>
        <td><strong>${m.recipeName}</strong></td>
        <td style="width: 75px; color: #64748b;">${m.totalTimeMinutes} phút</td>
        <td style="width: 70px;">${m.servings} phần</td>
        <td style="width: 80px; font-weight: 600; color: #92400e;">${mealNutrition(m.caloriesPerServing, m.servings)} kcal</td>
        <td style="width: 140px; color: #475569; font-size: 8pt;">Đạm: ${mealNutrition(m.proteinGramPerServing, m.servings)}g · Carbs: ${mealNutrition(m.carbohydrateGramPerServing, m.servings)}g · Béo: ${mealNutrition(m.fatGramPerServing, m.servings)}g</td>
      </tr>`
    })

    daysHtml += `
      <div class="day-block">
        <div class="day-header">
          <span>Ngày ${dayNum} · ${dayDate}</span>
          <span style="font-size: 8.5pt; font-weight: normal; color: #64748b;">3 bữa chính</span>
        </div>
        <table class="meals-table">
          <thead>
            <tr>
              <th>Bữa</th>
              <th>Món ăn</th>
              <th>Thời gian</th>
              <th>Khẩu phần</th>
              <th>Năng lượng</th>
              <th>Dinh dưỡng</th>
            </tr>
          </thead>
          <tbody>
            ${mealRows}
          </tbody>
        </table>
      </div>
    `
  }

  const htmlBody = `
    <div class="header-bar">
      <div>
        <div class="brand">🌱 Vegetarian Support</div>
        <div class="brand-sub">Kế hoạch dinh dưỡng thực vật cá nhân hóa</div>
      </div>
      <div class="doc-meta">
        <div>Mã thực đơn: <strong>#${plan.id.slice(0, 8)}</strong></div>
        <div>Ngày lập: ${new Date(plan.createdAt).toLocaleDateString('vi-VN')}</div>
      </div>
    </div>

    <h1 class="doc-title">${plan.name}</h1>
    <div class="info-card">
      <div class="info-item">Chế độ ăn: <strong>${PLAN_DIET_LABELS[plan.profileDiet]}</strong></div>
      <div class="info-item">Thời gian: <strong>${startDateStr} – ${endDateStr}</strong> (7 ngày)</div>
      <div class="info-item">Tổng số bữa: <strong>${plan.meals.length} bữa ăn</strong></div>
    </div>

    ${daysHtml}

    <div class="nutrition-summary">
      <strong style="color: #166534; font-size: 11pt;">📊 Tổng hợp dinh dưỡng cả tuần (7 ngày)</strong>
      <div class="nutrition-grid">
        <div class="nutri-box">
          <div class="nutri-val">${mealNutrition(plan.nutrition.calories, 1)}</div>
          <div class="nutri-lbl">Tổng Năng lượng (kcal)</div>
        </div>
        <div class="nutri-box">
          <div class="nutri-val">${mealNutrition(plan.nutrition.proteinGrams, 1)}g</div>
          <div class="nutri-lbl">Tổng Chất đạm (Protein)</div>
        </div>
        <div class="nutri-box">
          <div class="nutri-val">${mealNutrition(plan.nutrition.carbohydrateGrams, 1)}g</div>
          <div class="nutri-lbl">Tổng Carbohydrate</div>
        </div>
        <div class="nutri-box">
          <div class="nutri-val">${mealNutrition(plan.nutrition.fatGrams, 1)}g</div>
          <div class="nutri-lbl">Tổng Chất béo (Fat)</div>
        </div>
      </div>
    </div>
  `

  printHtmlContent(`Thuc-Don-${plan.name}`, htmlBody)
}

/**
 * Xuất bản PDF Danh sách đi chợ (Checklist A4 tiện lợi)
 */
export function exportShoppingListPdf(plan: SavedPlan, items: PlanShoppingItem[] = plan.shoppingItems, day: number | null = null): void {
  const startDateStr = formatPlanDate(plan.weekStartDate)
  const endDateStr = formatPlanDate(addPlanDays(plan.weekStartDate, 6))
  const period = day === null
    ? `Tuần: ${startDateStr} – ${endDateStr}`
    : `Ngày ${day}: ${formatPlanDate(addPlanDays(plan.weekStartDate, day - 1))}`
  const itemsToBuy = items.filter((item) => item.quantityToBuy > 0)

  let itemsHtml = ''
  itemsToBuy.forEach((item, index) => {
    itemsHtml += `<tr>
      <td style="width: 40px; text-align: center;">
        <span class="checkbox-box"></span>
      </td>
      <td style="width: 30px; color: #94a3b8; font-size: 8pt;">${index + 1}</td>
      <td>
        <strong style="color: #0f172a; font-size: 9.5pt;">${item.ingredientName}</strong>
      </td>
      <td style="width: 140px;">
        <span class="qty-badge">${item.quantityToBuy} ${item.unit}</span>
      </td>
      <td style="color: #64748b; font-size: 8.5pt;">
        Cần: ${item.requiredQuantity} ${item.unit} · Tủ bếp có: ${item.pantryQuantity} ${item.unit}
      </td>
      <td style="width: 90px; text-align: right; font-size: 8pt; color: ${item.isPurchased ? '#166534' : '#d97706'}; font-weight: 600;">
        ${item.isPurchased ? 'Đã mua ✓' : 'Cần mua'}
      </td>
    </tr>`
  })
  if (!itemsHtml) {
    itemsHtml = '<tr><td colspan="6" style="padding: 24px; text-align: center; color: #64748b;">Bạn đã có đủ nguyên liệu cho thực đơn này.</td></tr>'
  }

  const htmlBody = `
    <div class="header-bar">
      <div>
        <div class="brand">🛒 Vegetarian Support</div>
        <div class="brand-sub">Danh sách đi chợ &amp; chuẩn bị nguyên liệu</div>
      </div>
      <div class="doc-meta">
        <div>Áp dụng cho: <strong>${plan.name}</strong></div>
        <div>${period}</div>
      </div>
    </div>

    <h1 class="doc-title">Danh sách nguyên liệu cần mua (${day === null ? '21 bữa' : `Ngày ${day} · 3 bữa`})</h1>
    <div class="info-card">
      <div class="info-item">Tổng số loại nguyên liệu cần mua: <strong>${itemsToBuy.length} loại</strong></div>
      <div class="info-item">Chế độ ăn: <strong>${PLAN_DIET_LABELS[plan.profileDiet]}</strong></div>
      <div class="info-item" style="color: #2E7D32;">✓ Đã tự động đối soát và trừ số lượng sẵn có trong Tủ bếp</div>
    </div>

    <table class="checklist-table">
      <thead>
        <tr>
          <th style="width: 40px; text-align: center;">Tích</th>
          <th style="width: 30px;">#</th>
          <th>Tên nguyên liệu</th>
          <th>Số lượng cần mua</th>
          <th>Đối soát tủ bếp</th>
          <th style="text-align: right;">Trạng thái</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
  `

  printHtmlContent(`Danh-Sach-Di-Cho-${plan.name}${day === null ? '' : `-Ngay-${day}`}`, htmlBody)
}
