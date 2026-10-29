# Favorites API contract

Cập nhật 28/10/2026: response video đã lưu trả `imageUrl=/api/videos/{id}/thumbnail` khi phiên bản công khai có ảnh đại diện và `durationSeconds` nullable từ metadata của đúng tệp công khai. Bản nháp sửa mới không thay ảnh/thời lượng của mục đã lưu. Loại nội dung khác giữ `durationSeconds=null`; thiếu metadata không tạo thời lượng giả. Chỉ video Published/IsCurrentPublished và đúng PublishedSubmissionId của Video được trả về. FE hiển thị ảnh, huy hiệu thời lượng và giữ hàng nút ở đáy các thẻ cùng hàng.

## Authorization and visibility

`GET /api/favorites`, `POST /api/favorites`, and `DELETE /api/favorites/{id}` require a Bearer token for role `User` or `Admin`. Each account only sees and changes its own favorites. `Guest` receives `401`; another authenticated role receives `403`; a favorite ID belonging to a different account returns `404`.

Favorite is different from a like or vote. It stores one personal saved link to a target. The tuple `(user, targetType, targetId)` is unique.

Cập nhật 27/10/2026: công thức được lưu từ trang Công thức hoặc Tủ bếp AI vào cùng Profile → Mục đã lưu → Công thức. Request tạo có thể gửi `savedFrom: "Recipe" | "Pantry"` khi `targetType` là `Recipe`; bỏ trống mặc định là `Recipe` cho bản lưu mới. Response danh sách/tạo bổ sung `savedFrom` (enum hoặc null). Bản ghi cũ giữ null và UI hiển thị “Chưa ghi nhận nguồn lưu”, không tự gán nguồn. Nguồn chỉ là thông tin nơi bấm lưu, không quyết định quyền truy cập. Lưu trùng trả 409 và giữ nguồn của bản ghi đang tồn tại; bỏ lưu rồi lưu lại sẽ ghi nhận nguồn mới.

Available targets are:

- `Recipe`: only an active recipe.
- `Restaurant`: only an active restaurant.
- `Video`: only a Video submission whose current version is published by the BE3 moderation module.
- `Article`: only the currently published version of an article.

The API refuses an absent, inactive, unpublished, removed, or unsupported target with `404`. This prevents a saved list from exposing unpublished content.

## Create and delete

Yêu cầu UI cập nhật sau cùng ngày 27/10/2026: không hiển thị nhãn nguồn lưu trong Profile. Trường `savedFrom` vẫn được giữ để tương thích và không ảnh hưởng thao tác lưu/bỏ lưu.

`POST /api/favorites` accepts:

```json
{
  "targetType": "Recipe",
  "targetId": "6c1df49b-6b93-4470-bba2-cd6378d05d43"
}
```

`targetType` is `Recipe`, `Video`, `Restaurant`, or `Article`. A duplicate returns `409`. A successful request returns `201`:

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

If Admin removes a published `Article` or `Video`, or deactivates a `Restaurant`, all saved links to that exact target are deleted in the same operation. The item disappears from every user's saved list and does not reappear if a new item with the same name is later created. An inactive recipe is only omitted from list results; its saved link is retained until the owner removes it.

## Errors

| Status | Meaning |
| --- | --- |
| `400` | Invalid target type/ID or paging input. |
| `401` | Missing or invalid access token. |
| `403` | Authenticated caller lacks `User` or `Admin`. |
| `404` | Target or own favorite does not exist, or target is not publicly visible. |
| `409` | The exact target is already saved by this account. |
