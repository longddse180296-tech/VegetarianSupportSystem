# Pantry API contract

## Scope and authorization

Pantry is a per-account ingredient list for `User` and `Admin`. Every endpoint below requires `Authorization: Bearer <token>`. A caller can only read or change its own pantry; accessing another account's item returns `404`.

`Guest` receives `401`; an authenticated role other than `User` or `Admin` receives `403`.

The pantry stores either a managed active Ingredient or an unmatched user-entered name. An unmatched name is intentionally not classified as compatible or safe. Pantry does not infer food freshness or safety from an image.

## Items

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/pantry/items` | List the caller's pantry items. |
| `GET` | `/api/pantry/items/{id}` | Get one item owned by the caller. |
| `POST` | `/api/pantry/items` | Create an item. |
| `PUT` | `/api/pantry/items/{id}` | Replace an item. |
| `DELETE` | `/api/pantry/items/{id}` | Delete an item; responds `204`. |

Create and update use this request body. Exactly one of `ingredientId` and `name` is required. `quantity` and `unit` must either both be supplied or both be absent.

```json
{
  "ingredientId": "6c1df49b-6b93-4470-bba2-cd6378d05d43",
  "quantity": 250,
  "unit": "g"
}
```

```json
{
  "name": "Homemade sauce",
  "quantity": 1,
  "unit": "jar"
}
```

`ingredientId` must refer to an active managed ingredient. When `name` exactly matches an active ingredient name or alias (case-insensitive), the API saves the managed ingredient rather than an unmatched name. One managed ingredient and one unmatched name may each occur only once per account; duplicate creation returns `409`.

Successful item responses use this shape:

```json
{
  "id": "a3d7c64b-e06c-4b62-9a5b-6c59d831a456",
  "ingredientId": "6c1df49b-6b93-4470-bba2-cd6378d05d43",
  "name": "Tofu",
  "isCatalogMatched": true,
  "quantity": 250,
  "unit": "g",
  "profileDiet": "Vegan",
  "dietaryCompatibility": "Compatible",
  "dietaryNotice": "Compatible with the dietary profile based on managed ingredient data.",
  "allergenWarnings": [],
  "avoidedFoodWarnings": [],
  "createdAt": "2026-10-09T10:00:00+00:00",
  "updatedAt": "2026-10-09T10:05:00+00:00"
}
```

`profileDiet`, `dietaryCompatibility`, and warnings reflect the caller's stored profile. If the account has no diet, catalog data is insufficient, or the item is not catalog matched, `dietaryCompatibility` can be `null`. Allergy and avoided-food warnings remain separate from diet compatibility.

## Recipe suggestions

`GET /api/pantry/recipe-suggestions?limit=20` returns at most 20 active recipes by default, ordered by the percentage of their recipe ingredients present in the caller's managed pantry items. `limit` is an integer from 1 to 50.

Recipes that conflict with the caller's stored diet, allergy, or avoided-food data are excluded. Unmatched pantry names do not count toward a recipe match.

```json
[
  {
    "recipeId": "c1a36d60-bd7c-452a-a7d2-a9467aa3018d",
    "recipeName": "Tofu rice",
    "imageUrl": null,
    "servings": 2,
    "totalTimeMinutes": 30,
    "caloriesPerServing": 123.456,
    "matchPercent": 50,
    "availableIngredients": [
      { "ingredientId": "6c1df49b-6b93-4470-bba2-cd6378d05d43", "name": "Tofu", "quantity": 200, "unit": "g", "isAvailable": true }
    ],
    "missingIngredients": [
      { "ingredientId": "d5b3a4ab-01ed-497a-a53b-7e9538a4426e", "name": "Rice", "quantity": 100, "unit": "g", "isAvailable": false }
    ]
  }
]
```

Presence indicates that the managed ingredient exists in the pantry; it does not calculate whether the stored quantity is sufficient.

## Substitution candidates

`GET /api/pantry/items/{id}/substitution-candidates` returns up to ten active catalog ingredients with the same default unit as the selected managed item, after excluding ingredients that conflict with the caller's saved profile. It returns `[]` for an unmatched item or an item without a managed default unit.

Each candidate includes `ingredientId`, `name`, `defaultUnit`, `dietaryCompatibility`, `allergenWarnings`, and `avoidedFoodWarnings`. The API only suggests candidates: it never changes the pantry item. The user must explicitly choose a replacement with the normal item update endpoint.

## Errors

| Status | Meaning |
| --- | --- |
| `400` | Invalid request, including both/neither ingredient inputs, an incomplete quantity/unit pair, or invalid suggestion limit. |
| `401` | Missing or invalid access token. |
| `403` | Authenticated caller lacks the `User` or `Admin` role. |
| `404` | Pantry item is absent, belongs to another account, or requested catalog ingredient is inactive or absent. |
| `409` | The caller already has the same managed ingredient or unmatched name. |
