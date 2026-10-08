# Phan chia cong viec cho nhom 5 nguoi

Tai lieu nay chia viec theo Figma va MVP hien tai. Nhom co 2 frontend va 3 backend. Khi giao task cho Vibe Code/AI, dua kem `AGENTS.md`, `docs/mvp.md`, `contracts/README.md` va phan viec cua nguoi do trong file nay.

## Nguyen tac chia viec

- Chia theo luong man hinh va domain, khong chia theo file le.
- FE bam theo man hinh Figma va folder `frontend/src/features`.
- BE bam theo Clean Architecture va folder `backend/src/Application/Features`.
- Moi tinh nang phai thong nhat API contract truoc khi FE/BE tich hop.
- Khong them tinh nang ngoai MVP: notification, lich ngay le, payment, barcode, mobile app, dat ban, danh gia nha hang, theo doi kenh.
- AI/Gemini chi goi tu backend.

## Tong quan phan cong

| Thanh vien | Vai tro | Nhom viec chinh | Folder chinh |
|---|---|---|---|
| FE 1 | Frontend | Auth, profile, bai viet, admin shell/admin moderation, thuc don | `frontend/src/features/auth`, `profile`, `articles`, `admin`, `meal-plans` |
| FE 2 | Frontend | Cong thuc, video, nha hang, AI chat, scan, tu bep | `frontend/src/features/recipes`, `videos`, `restaurants`, `ai-chat`, `food-scan`, `pantry` |
| BE 1 | Backend | Tai khoan, phan quyen, ho so nguoi dung, thanh vien admin | `Application/Features/Auth`, `Profiles`, `Administration`, `Infrastructure/Identity` |
| BE 2 | Backend | Du lieu cot loi: danh muc, nguyen lieu, cong thuc, nha hang, favorite | `Application/Features/Categories`, `Ingredients`, `Recipes`, `Restaurants`, `Favorites` |
| BE 3 | Backend | Noi dung user, video, binh luan, moderation, AI, scan, thuc don, tu bep | `Application/Features/Articles`, `Videos`, `Comments`, `Moderation`, `AiChat`, `FoodScanning`, `MealPlans`, `Pantry` |

## FE 1: Auth, profile, article, admin, meal plan

### Man hinh Figma phu trach

- Dang ky/Dang nhap: node `104:9040`.
- Ho so ca nhan: node `104:13628`, `104:14218`.
- Danh sach/chi tiet bai viet: node `103:1387`.
- Soan bai viet: node `104:8447`.
- Bai viet cua toi: node `104:13109`.
- Admin dashboard: node `104:10071`.
- Admin bai viet/video/moderation: node `104:10884`, `104:11422`.
- Thuc don: node `103:4330`, `103:4842`, `103:5610`, `103:6197`, `104:14881`.

### Folder code

- `frontend/src/features/auth`
- `frontend/src/features/profile`
- `frontend/src/features/articles`
- `frontend/src/features/meal-plans`
- `frontend/src/features/admin/dashboard`
- `frontend/src/features/admin/moderation`
- `frontend/src/features/admin/members`
- `frontend/src/features/admin/comments`

### Viec can lam

1. Tao layout chung cho trang Guest/User/Admin neu chua co router.
2. Lam form dang ky, dang nhap, quen mat khau, reset mat khau.
3. Lam profile: thong tin ca nhan, che do an, di ung, chi so co the.
4. Lam article public: danh sach, filter, chi tiet, binh luan/huu ich.
5. Lam article owner: tao nhap, preview, gui duyet, xem trang thai AI/Admin, sua va gui lai.
6. Lam meal plan: 7 ngay x 3 bua, doi mon, tong dinh duong, danh sach di cho, export PDF.
7. Lam admin dashboard: thong ke thuc te, hang doi duyet, lien ket quan ly core data.
8. Lam moderation UI: xem noi dung, xem AI flag, bang chung, duyet, yeu cau sua, tu choi, go noi dung.

### Can phoi hop voi

- BE 1 cho auth/profile/member.
- BE 3 cho articles/comments/moderation/meal plans.
- FE 2 de thong nhat layout, shared component, empty/loading/error state.

## FE 2: Recipes, videos, restaurants, AI, scan, pantry

### Man hinh Figma phu trach

- Trang chu: node `103:389`.
- Chi tiet video: node `103:2823`.
- Tro ly AI: node `103:6813`.
- Scan: node `103:7298`.
- Tu bep: node `103:7853`.
- Video cua toi: node `104:15631`.
- Cong thuc/nha hang public trong cac man hinh lien quan.

### Folder code

- `frontend/src/features/recipes`
- `frontend/src/features/videos`
- `frontend/src/features/restaurants`
- `frontend/src/features/ai-chat`
- `frontend/src/features/food-scan`
- `frontend/src/features/pantry`
- `frontend/src/features/favorites`
- `frontend/src/features/admin/recipes`
- `frontend/src/features/admin/ingredients`
- `frontend/src/features/admin/restaurants`
- `frontend/src/features/admin/categories`

### Viec can lam

1. Lam home theo scope MVP: link den cong thuc, bai viet, video, AI chat, scan login gate.
2. Lam recipe public: list, filter, chi tiet, favorite.
3. Lam video public: list, chi tiet, like/save/share link/comment.
4. Lam video owner: upload, draft, preview, gui duyet, trang thai file/AI/Admin.
5. Lam restaurants: list, filter khu vuc/che do an, chi tiet, map/link chi duong, favorite.
6. Lam AI chat: guest trial, user chat co ho so, history neu backend ho tro.
7. Lam scan: guest intro, upload user, xac nhan nguyen lieu/OCR, cau hoi bo sung, ket qua co dieu kien.
8. Lam pantry: CRUD nguyen lieu dang co, goi y thay the, goi y cong thuc.
9. Lam admin core data UI: categories, ingredients, recipes, restaurants.

### Can phoi hop voi

- BE 2 cho categories/ingredients/recipes/restaurants/favorites.
- BE 3 cho videos/AI/scan/pantry.
- FE 1 de dung chung auth guard, layout va admin shell.

## BE 1: Auth, profile, member, role

### Folder code

- `backend/src/Application/Features/Auth`
- `backend/src/Application/Features/Profiles`
- `backend/src/Application/Features/Administration`
- `backend/src/Domain/Entities`
- `backend/src/Domain/Enums`
- `backend/src/Infrastructure/Identity`
- `backend/src/Infrastructure/Persistence`
- `backend/src/Api/Authorization`
- `backend/src/Api/Controllers`

### Viec can lam

1. Thiet ke entity/tables cho User, Role, Profile, Allergy/FoodAvoidance neu can.
2. Dang ky, dang nhap, refresh/remember session, dang xuat.
3. Quen mat khau/reset mat khau qua email neu scope nhom chot lam trong MVP.
4. Role guard cho Guest/User/Admin.
5. Profile: che do an, di ung, chieu cao/can nang, muc van dong, muc tieu, khu vuc tim nha hang.
6. BMI/TDEE tinh bang cong thuc co dinh trong backend, khong de chatbot tu tinh tuy y.
7. Admin members: list/filter, xem thong tin, khoa/mo khoa co ly do.

### API contract uu tien

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/me`
- `PUT /api/me/profile`
- `GET /api/admin/members`
- `PATCH /api/admin/members/{id}/status`

### Can phoi hop voi

- FE 1 cho auth/profile/admin members.
- BE 2/BE 3 de cung cap current user, role va profile cho recipe, scan, meal plan, chat.

## BE 2: Core data

### Folder code

- `backend/src/Application/Features/Categories`
- `backend/src/Application/Features/Ingredients`
- `backend/src/Application/Features/Recipes`
- `backend/src/Application/Features/Restaurants`
- `backend/src/Application/Features/Favorites`
- `backend/src/Domain/Entities`
- `backend/src/Domain/Enums`
- `backend/src/Domain/Rules`
- `backend/src/Infrastructure/Persistence`
- `backend/src/Api/Controllers`

### Viec can lam

1. Categories: CRUD, deactivate, check noi dung dang tham chieu.
2. Ingredients: nguon goc thuc vat/dong vat/chua ro, trung/sua/mat ong, di ung, dinh duong, don vi.
3. Recipes: CRUD admin, ingredients/quantity, serving, steps, nutrition, dietary type tinh tu thanh phan, active/inactive.
4. Restaurants: CRUD admin, dia chi, toa do/khu vuc, gio mo cua, lien he, gia tham khao, che do an khai bao, mon lien quan.
5. Public query: recipe list/detail/filter, restaurant list/detail/filter, category list.
6. Favorites: save/unsave recipes, videos, restaurants.
7. Seed data mau vua du de demo meal plan, scan va recipe filter.

### API contract uu tien

- `GET /api/categories`
- `GET /api/ingredients`
- `GET /api/recipes`
- `GET /api/recipes/{id}`
- `GET /api/restaurants`
- `GET /api/restaurants/{id}`
- `POST /api/favorites`
- `DELETE /api/favorites/{id}`
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `GET /api/admin/ingredients`
- `POST /api/admin/ingredients`
- `GET /api/admin/recipes`
- `POST /api/admin/recipes`
- `GET /api/admin/restaurants`
- `POST /api/admin/restaurants`

### Can phoi hop voi

- FE 2 cho recipe/restaurant/admin core data UI.
- BE 3 cho meal plan, pantry, scan can dung recipe/ingredient rules.

## BE 3: Content, moderation, AI, scan, meal plan

### Folder code

- `backend/src/Application/Features/Articles`
- `backend/src/Application/Features/Videos`
- `backend/src/Application/Features/Comments`
- `backend/src/Application/Features/Moderation`
- `backend/src/Application/Features/AiChat`
- `backend/src/Application/Features/FoodScanning`
- `backend/src/Application/Features/MealPlans`
- `backend/src/Application/Features/Pantry`
- `backend/src/Infrastructure/AI/Gemini`
- `backend/src/Infrastructure/Storage`
- `backend/src/Infrastructure/Documents`
- `backend/src/Infrastructure/BackgroundJobs`
- `backend/src/Api/Controllers`

### Viec can lam

1. Articles: public list/detail, user draft, preview, submit, edit, resubmit, status tracking.
2. Videos: public list/detail, upload metadata/file info, draft, submit, processing status, status tracking.
3. Comments: comment/reply/edit/delete own comment, admin hide/remove if needed.
4. Moderation: AI Flag Check cho article/video, tach AI status va Admin review status.
5. Admin review: approve, request revision, reject, remove published content, log reason/version.
6. AI chat: guest trial, user chat co profile, link goi y recipe.
7. Food scan: upload image, detect visible ingredients/OCR, user confirm, extra questions, conditional result.
8. Pantry: CRUD pantry items, substitutions, recipe matching.
9. Meal plans: 7 ngay x 3 bua, pick from recipe kho, nutrition totals, swap meal, shopping list, PDF.

### API contract uu tien

- `GET /api/articles`
- `POST /api/articles`
- `POST /api/articles/{id}/submit`
- `GET /api/my/articles`
- `GET /api/videos`
- `POST /api/videos`
- `POST /api/videos/{id}/submit`
- `GET /api/my/videos`
- `POST /api/comments`
- `GET /api/admin/moderation/queue`
- `GET /api/admin/moderation/{id}`
- `POST /api/admin/moderation/{id}/approve`
- `POST /api/admin/moderation/{id}/request-revision`
- `POST /api/admin/moderation/{id}/reject`
- `POST /api/ai-chat/messages`
- `POST /api/food-scans`
- `POST /api/food-scans/{id}/confirm`
- `GET /api/pantry`
- `POST /api/pantry`
- `POST /api/meal-plans`
- `GET /api/meal-plans/{id}`
- `POST /api/meal-plans/{id}/swap`
- `GET /api/meal-plans/{id}/shopping-list`
- `GET /api/meal-plans/{id}/pdf`

### Can phoi hop voi

- FE 1 cho article/admin moderation/comments.
- FE 2 cho video/AI/scan/pantry/meal plan.
- BE 1 cho profile/role.
- BE 2 cho recipes/ingredients.

## Thu tu lam khuyen nghi

### Dot 1: Nen mong

1. BE 1: Auth, role, current user, profile co ban.
2. BE 2: Categories, ingredients, recipes seed.
3. FE 1: Router, layout, auth/profile forms.
4. FE 2: Recipe list/detail dung mock hoac API BE2.
5. BE 3: Article/video draft + submit flow skeleton.

### Dot 2: Tich hop noi dung va admin

1. BE 3: AI/Admin status model, moderation queue.
2. FE 1: Article owner + admin moderation.
3. FE 2: Video owner + public video.
4. BE 2: Restaurants + favorites.
5. FE 2: Restaurants + favorites.

### Dot 3: AI va ca nhan hoa

1. BE 3: AI chat, pantry, scan, meal plan.
2. FE 2: AI chat, pantry, scan, meal plan.
3. BE 1/BE 2: Profile + recipe/ingredient rules ho tro scan/meal plan.
4. Ca nhom: test nghiem thu trong `docs/mvp.md`.

## Quy tac ban giao giua FE va BE

Moi tinh nang phai co:

- Contract API trong `contracts/` hoac cap nhat `contracts/README.md`.
- Request/response DTO ro rang.
- Status list ro rang, nhat la AI/Admin status.
- Loading/empty/error state o FE.
- Validation o BE; FE chi ho tro UX, khong thay the BE validation.
- Cach test bang command hoac data mau.

## Luu y khi bao ve truoc hoi dong

- FE chia theo man hinh Figma de bao dam UI bam dung prototype.
- BE chia theo domain de giu Clean Architecture va de moi nguoi so huu mot nhom nghiep vu ro rang.
- Core data do BE 2 lam truoc vi recipes/ingredients/restaurants la du lieu nen cho scan, meal plan, pantry va public browsing.
- Moderation va AI do BE 3 lam vi article/video/scan/chat deu can Gemini va can tach AI status voi Admin decision.
- Auth/profile do BE 1 lam vi moi tinh nang ca nhan hoa va admin deu can role, current user va profile.
