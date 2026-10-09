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
| BE 1 | Backend | Tai khoan, ho so, thanh vien, dashboard, articles, comments/like/vote | `Application/Features/Auth`, `Profiles`, `Administration`, `Articles`, `Comments`, `Infrastructure/Identity` |
| BE 2 | Backend | Danh muc, nguyen lieu, cong thuc, nha hang, favorite, pantry, meal plans/PDF | `Application/Features/Categories`, `Ingredients`, `Recipes`, `Restaurants`, `Favorites`, `Pantry`, `MealPlans`, `Infrastructure/Documents` |
| BE 3 | Backend | Videos/storage, moderation, AI chat, scan/OCR/history, Gemini | Application/Features/Videos, Moderation, AiChat, FoodScanning; Infrastructure/AI/Gemini, Storage |

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
- BE 2 cho meal plans va Admin core data; BE 3 cho moderation/Admin videos.
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

### Viec can lam

1. Lam home theo scope MVP: link den cong thuc, bai viet, video, AI chat, scan login gate.
2. Lam recipe public: list, filter, chi tiet, favorite.
3. Lam video public: list, chi tiet, like/save/share link/comment.
4. Lam video owner: upload, draft, preview, gui duyet, trang thai file/AI/Admin.
5. Lam restaurants: list, filter khu vuc/che do an, chi tiet, map/link chi duong, favorite.
6. Lam AI chat: guest trial, user chat co ho so, history neu backend ho tro.
7. Lam scan: guest intro, upload user, xac nhan nguyen lieu/OCR, cau hoi bo sung, ket qua co dieu kien.
8. Lam pantry: CRUD nguyen lieu dang co, goi y thay the, goi y cong thuc.
9. Phoi hop FE 1 ve mapping du lieu core data; FE 1 so huu admin categories, ingredients, recipes, restaurants theo AGENTS.md.

### Can phoi hop voi

- BE 2 cho categories/ingredients/recipes/restaurants/favorites.
- BE 2 cho pantry; BE 3 cho videos/AI/scan; BE 1 cho comments/like.
- FE 1 de dung chung auth guard, layout va admin shell.

## Phan cong Backend cap nhat 08/10/2026

Phan cong can bang theo phan viec con lai, thay the bang BE cu. Chi tiet 20 task, API, folder, phu thuoc va nghiem thu o [backend-work-assignment.md](backend-work-assignment.md).

| Nguoi | Pham vi so huu | Task |
|---|---|---|
| BE 1 | Auth, profile/BMI/TDEE, members, dashboard, articles, comments/like/vote | BE1-01 den BE1-07 |
| BE 2 | Categories, ingredients, recipes, restaurants, favorites, pantry, meal plans/shopping/PDF | BE2-01 den BE2-09 |
| BE 3 | Videos/storage, moderation, AI chat, scan/OCR/history, Gemini | BE3-01 den BE3-04 |

BE 1 so huu bai viet va phien ban public; BE 3 so huu AI flag/quyet dinh Admin. Hai ben chot interface content ID/version va ap dung ket qua dung phien ban. BE 2 so huu pantry/meal plan; BE 3 cung cap Gemini client neu can giai thich AI, khong nhan thay nghiep vu lap thuc don.

Moi BE tu lam DB/model/config/migration va test module minh. BE 2 dieu phoi merge snapshot; BE 1 dieu phoi quyen; BE 3 dieu phoi storage/Gemini. Khong giao toan bo test hoac migration cho mot nguoi.

## Thu tu lam khuyen nghi

1. Chot contract chung: profile, recipe query, moderation decision, storage; noi cac API da co vao FE.
2. BE 1 lam articles/comments; BE 2 lam restaurants/favorites/pantry; BE 3 lam videos/moderation.
3. BE 1 hoan thien dashboard/reset email; BE 2 lam meal plans/shopping/PDF; BE 3 hoan thien scan/OCR/history/chat.
4. Ca ba test module cua minh va cung FE chay nghiem thu MVP. Ra lai khoi luong sau dot dau de dieu chinh ticket ho tro.
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
- BE 1 so huu articles/comments; BE 2 so huu pantry/meal plans; BE 3 so huu videos/moderation/AI/scan. Phan cong tinh ca do kho va code da co, khong chia theo so luong man hinh.
- Auth/profile do BE 1 lam vi moi tinh nang ca nhan hoa va admin deu can role, current user va profile.
