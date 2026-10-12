# Meal Plans API contract

Meal plans are available to authenticated `User` and `Admin` callers through `Authorization: Bearer <token>`. Every operation is scoped to the caller's own plans. A missing plan or one owned by another account returns `404`.

## Rules

- A plan stores exactly seven days with `Breakfast`, `Lunch`, and `Dinner`: 21 meal positions.
- Generation only uses active recipes whose ingredients are compatible with the caller's required diet, allergy list, and avoided-food list. Unknown ingredient evidence is not accepted as compatible.
- The profile constraints and recipe/ingredient values are snapshotted when a plan is generated. Editing a profile later does not modify an existing plan.
- Replacing a meal and regenerating a plan keep using that saved profile snapshot. If no active recipe matches it, the API returns `409` rather than weakening a dietary or allergy condition.
- The shopping list aggregates snapshot ingredient quantities and subtracts the matching measured pantry quantity. An unmatched pantry name is never used to reduce the required amount.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/meal-plans/generate` | Validate profile and save a generated 7-day plan. |
| `GET` | `/api/meal-plans?page=1&pageSize=20` | Page through the caller's saved plans. |
| `GET` | `/api/meal-plans/{id}` | Read a plan, nutrition totals, meals, and shopping list. |
| `POST` | `/api/meal-plans/{id}/regenerate` | Rebuild the 21 positions using the saved profile snapshot. |
| `POST` | `/api/meal-plans/{id}/apply-to-week` | Copy the saved plan snapshot to another week and rebuild its shopping list from current pantry quantities. |
| `PUT` | `/api/meal-plans/{id}/meals/{day}/{slot}` | Replace a meal. `day` is 1–7 and `slot` is `Breakfast`, `Lunch`, or `Dinner`. |
| `GET` | `/api/meal-plans/{id}/shopping-list` | Read the calculated shopping list. |
| `PUT` | `/api/meal-plans/{id}/shopping-list/{itemId}/purchase` | Mark a shopping item purchased or not purchased. |
| `GET` | `/api/meal-plans/{id}/pdf` | Download a PDF for the saved plan. |

### Generate request

```json
{
  "name": "Thực đơn Vegan tuần 12/10",
  "weekStartDate": "2026-10-12"
}
```

`name` is required and at most 120 characters. `weekStartDate` is required.

### Replacement request

```json
{
  "recipeId": "a7b5617d-48bd-4cc5-92e1-6f5dbd3f8e42",
  "servings": 2
}
```

`recipeId` must identify an active, compatible recipe. `servings` is 1–20.

### Apply-to-week request

```json
{
  "weekStartDate": "2026-10-19",
  "name": "Thực đơn Vegan tuần kế tiếp"
}
```

`name` is optional; omitting it keeps the source plan name.

### Plan response shape

```json
{
  "id": "...",
  "name": "Thực đơn Vegan tuần 12/10",
  "weekStartDate": "2026-10-12",
  "profileDiet": "Vegan",
  "meals": [
    {
      "id": "...",
      "dayNumber": 1,
      "slot": "Breakfast",
      "recipeId": "...",
      "recipeName": "Đậu hũ sốt nấm",
      "servings": 1,
      "totalTimeMinutes": 25,
      "caloriesPerServing": 360,
      "proteinGramPerServing": 20,
      "carbohydrateGramPerServing": 42,
      "fatGramPerServing": 12
    }
  ],
  "shoppingItems": [
    {
      "id": "...",
      "ingredientId": "...",
      "ingredientName": "Đậu hũ",
      "requiredQuantity": 600,
      "pantryQuantity": 200,
      "quantityToBuy": 400,
      "unit": "g",
      "isPurchased": false
    }
  ],
  "nutrition": {
    "calories": 7560,
    "proteinGrams": 420,
    "carbohydrateGrams": 882,
    "fatGrams": 252
  },
  "createdAt": "2026-10-09T06:00:00+00:00",
  "updatedAt": null
}
```

The daily and weekly nutrition totals come from the same per-serving recipe snapshot used by the 21 meal positions. They are not a food-consumption log.

### Statuses

| Status | Meaning |
|---|---|
| `201` | A generated plan or copied plan was saved. |
| `200` | Read, replacement, regeneration, shopping update, or PDF export succeeded. |
| `400` | Request format, date, day, slot, serving count, or pagination is invalid. |
| `401` / `403` | Missing token or caller does not have `User`/`Admin` role. |
| `404` | The plan, shopping item, or recipe cannot be accessed. |
| `409` | Profile diet is absent, no compatible active recipe exists, or a replacement fails saved dietary/allergy constraints. |
