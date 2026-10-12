# Favorites API contract

## Authorization and visibility

`GET /api/favorites`, `POST /api/favorites`, and `DELETE /api/favorites/{id}` require a Bearer token for role `User` or `Admin`. Each account only sees and changes its own favorites. `Guest` receives `401`; another authenticated role receives `403`; a favorite ID belonging to a different account returns `404`.

Favorite is different from a like or vote. It stores one personal saved link to a target. The tuple `(user, targetType, targetId)` is unique.

Available targets are:

- `Recipe`: only an active recipe.
- `Restaurant`: only an active restaurant.
- `Video`: only a Video submission whose current version is published by the BE3 moderation module.

The API refuses an absent, inactive, unpublished, removed, or unsupported target with `404`. This prevents a saved list from exposing unpublished content.

## Create and delete

`POST /api/favorites` accepts:

```json
{
  "targetType": "Recipe",
  "targetId": "6c1df49b-6b93-4470-bba2-cd6378d05d43"
}
```

`targetType` is `Recipe`, `Video`, or `Restaurant`. A duplicate returns `409`. A successful request returns `201`:

```json
{
  "id": "a3d7c64b-e06c-4b62-9a5b-6c59d831a456",
  "targetType": "Recipe",
  "targetId": "6c1df49b-6b93-4470-bba2-cd6378d05d43",
  "targetName": "Tofu rice",
  "imageUrl": "https://cdn.example/recipes/tofu-rice.jpg",
  "createdAt": "2026-10-09T10:00:00+00:00"
}
```

`DELETE /api/favorites/{id}` removes the caller's saved link and returns `204`.

## List

`GET /api/favorites?targetType=Recipe&pageNumber=1&pageSize=20` lists visible favorites newest first. `targetType` is optional; `pageNumber` is at least 1; `pageSize` is 1 through 100.

```json
{
  "items": [
    {
      "id": "a3d7c64b-e06c-4b62-9a5b-6c59d831a456",
      "targetType": "Recipe",
      "targetId": "6c1df49b-6b93-4470-bba2-cd6378d05d43",
      "targetName": "Tofu rice",
      "imageUrl": null,
      "createdAt": "2026-10-09T10:00:00+00:00"
    }
  ],
  "totalCount": 1,
  "pageNumber": 1,
  "pageSize": 20
}
```

If a previously saved target is later inactive, unpublished, or removed, it is omitted from list results. The record stays private and can still be deleted by its owner.

## Errors

| Status | Meaning |
| --- | --- |
| `400` | Invalid target type/ID or paging input. |
| `401` | Missing or invalid access token. |
| `403` | Authenticated caller lacks `User` or `Admin`. |
| `404` | Target or own favorite does not exist, or target is not publicly visible. |
| `409` | The exact target is already saved by this account. |
