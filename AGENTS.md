# Huong Dan Cho AI Coding Agent

File nay danh cho tat ca thanh vien dung AI/Vibe Code trong du an Vegetarian Support. Truoc khi code, AI phai doc file nay, `README.md`, `STRUCTURE.md`, `docs/mvp.md` va `contracts/README.md`.

Muc tieu cua file nay la giup AI biet chuc nang nao nam o folder nao, tranh code lung tung, de nhom de quan ly, fix loi va giai thich khi bao ve truoc hoi dong.

## 1. Nguyen tac chung

- Chi co 3 role: `Guest`, `User`, `Admin`.
- Khong them role moi neu chua duoc nhom thong nhat.
- Khong them tinh nang ngoai MVP trong `docs/mvp.md`.
- Neu cac file huong dan mau thuan nhau, thu tu uu tien la: yeu cau moi nhat cua nhom -> `docs/mvp.md` -> `contracts/` -> `AGENTS.md` -> `STRUCTURE.md` -> README.
- Khong commit secret, API key Gemini, connection string that, file upload that, du lieu suc khoe that.
- Frontend khong tu quyet dinh quyen han; backend phai kiem tra quyen lai.
- AI/Gemini chi goi tu backend, khong goi truc tiep tu frontend.
- Moi tinh nang nen co FE folder, BE feature folder, API contract va migration neu co DB.
- Khi sua mot tinh nang, chi sua dung module lien quan tru khi loi nam o shared/common.
- Neu thay doi request/response API, cap nhat `contracts/README.md` hoac file contract rieng trong `contracts/`.

## 2. Kien truc backend

Backend nam trong `backend/src/` va theo Clean Architecture:

```text
Api -> Application -> Domain
Api -> Infrastructure -> Application -> Domain
```

Khong dao nguoc dependency. `Domain` khong duoc tham chieu `Application`, `Infrastructure` hoac ASP.NET. `Application` khong duoc tham chieu `Infrastructure`.

### Api

Folder: `backend/src/Api/`

Kiem tra quyen dat trong `Api/Authorization`. Hien chua can folder `Api/Configuration` va `Api/Middleware`; chi tao khi co code thuc te can tach.

Dung cho:

- Controllers va endpoints HTTP.
- Authentication/Authorization filter hoac policy.
- Middleware.
- Mapping request/response DTO neu DTO chi phuc vu API.
- Cau hinh app startup trong `Program.cs`.

Khong dat business rule, EF query phuc tap, Gemini prompt, hay logic tinh toan nghiep vu o `Api`.

### Application

Folder: `backend/src/Application/`

Khong giu folder `Application/Abstractions` rong. Interface repository rieng cua feature dat trong feature tuong ung.

Dung cho:

- Use case cua tung feature.
- Command/query handler, service interface, DTO noi bo use case.
- Validation nghiep vu o muc application.
- Dieu phoi Domain, Repository interface, AI interface.

Vi du: lap thuc don 7 ngay, gui bai viet di duyet, xu ly ket qua AI flag, tao scan result.

### Domain

Folder: `backend/src/Domain/`

Dung cho:

- Entity cot loi.
- Enum.
- Value object.
- Rule nghiep vu khong phu thuoc framework.

Vi du: Role, trang thai duyet bai viet, trang thai AI flag, trang thai ket qua scan, loai an chay, quy tac phan loai thanh phan.

### Infrastructure

Folder: `backend/src/Infrastructure/`

Dung cho:

- EF Core, SQL Server, `AppDbContext`.
- Repository implementation.
- Migration, configuration, seeding.
- Gemini API client, prompt, contract.
- Email, storage, background job, external service.

Khong dat controller o `Infrastructure`.

## 3. Kien truc frontend

Frontend nam trong `frontend/src/`.

### app

Folder: `frontend/src/app/`

Dung cho:

- Router.
- Layout tong.
- Provider chung.
- App bootstrap.

Khong code toan bo UI tinh nang truc tiep trong `App.tsx`. `App.tsx` chi nen lap router/provider.

### features

Folder: `frontend/src/features/`

Moi tinh nang dat trong folder rieng:

- `auth`: dang ky, dang nhap, quen mat khau, reset mat khau.
- `profile`: ho so ca nhan, che do an, di ung, chi so co the.
- `recipes`: cong thuc cong khai, chi tiet cong thuc, luu yeu thich.
- `articles`: bai viet cong khai va bai viet cua toi.
- `videos`: video cong khai va video cua toi.
- `comments`: binh luan, phan hoi, vote huu ich.
- `restaurants`: tim nha hang, chi tiet nha hang, ban do/chi duong.
- `ai-chat`: chat AI cho Guest/User.
- `food-scan`: upload anh mon an/nhan thanh phan, xac nhan thong tin, xem ket qua.
- `meal-plans`: lap thuc don 7 ngay, doi mon, danh sach di cho, PDF.
- `pantry`: tu bep, nguyen lieu dang co, goi y thay the.
- `favorites`: luu cong thuc, video, nha hang.
- `admin`: tat ca man hinh quan tri.

Trong moi feature co the tach:

```text
components/
pages/
api/
types/
hooks/
utils/
```

### shared

Folder: `frontend/src/shared/`

Dung cho:

- API client dung chung.
- UI component dung chung.
- Type dung chung giua nhieu feature.
- Hook chung.
- Utility thuan tuy.

Khong dat logic nghiep vu rieng cua mot feature vao `shared`.

## 4. Ban do chuc nang va folder can code

| Chuc nang | Frontend | Backend Application | Backend Domain | Backend Infrastructure | Api |
|---|---|---|---|---|---|
| Dang ky/dang nhap | `frontend/src/features/auth` | `Application/Features/Auth` | `Domain/Entities`, `Domain/Enums` | `Infrastructure/Identity`, `Infrastructure/Persistence` | `Api/Controllers` |
| Ho so user | `frontend/src/features/profile` | `Application/Features/Profiles` | `Domain/Entities`, `Domain/ValueObjects` | `Infrastructure/Persistence` | `Api/Controllers` |
| Cong thuc | `frontend/src/features/recipes` | `Application/Features/Recipes` | `Domain/Entities`, `Domain/Rules` | `Infrastructure/Persistence`, `Infrastructure/Storage` | `Api/Controllers` |
| Admin quan ly cong thuc | `frontend/src/features/admin/recipes` | `Application/Features/Recipes` | `Domain/Entities`, `Domain/Rules` | `Infrastructure/Persistence`, `Infrastructure/Storage` | `Api/Controllers` |
| Nguyen lieu | `frontend/src/features/admin/ingredients` | `Application/Features/Ingredients` | `Domain/Entities`, `Domain/Enums` | `Infrastructure/Persistence` | `Api/Controllers` |
| Bai viet | `frontend/src/features/articles` | `Application/Features/Articles` | `Domain/Entities`, `Domain/Enums` | `Infrastructure/Persistence`, `Infrastructure/Storage` | `Api/Controllers` |
| Video | `frontend/src/features/videos` | `Application/Features/Videos` | `Domain/Entities`, `Domain/Enums` | `Infrastructure/Persistence`, `Infrastructure/Storage` | `Api/Controllers` |
| Binh luan | `frontend/src/features/comments` | `Application/Features/Comments` | `Domain/Entities` | `Infrastructure/Persistence` | `Api/Controllers` |
| Admin quan ly binh luan | `frontend/src/features/admin/comments` | `Application/Features/Comments` | `Domain/Entities`, `Domain/Enums` | `Infrastructure/Persistence` | `Api/Controllers` |
| AI Flag Check | `frontend/src/features/admin/moderation` | `Application/Features/Moderation` | `Domain/Enums`, `Domain/Rules` | `Infrastructure/AI/Gemini`, `Infrastructure/Persistence` | `Api/Controllers` |
| Admin duyet noi dung | `frontend/src/features/admin/moderation` | `Application/Features/Moderation` | `Domain/Entities`, `Domain/Enums` | `Infrastructure/Persistence` | `Api/Controllers` |
| Chat AI | `frontend/src/features/ai-chat` | `Application/Features/AiChat` | `Domain/Entities` neu luu lich su | `Infrastructure/AI/Gemini`, `Infrastructure/Persistence` | `Api/Controllers` |
| Scan mon an/nhan | `frontend/src/features/food-scan` | `Application/Features/FoodScanning` | `Domain/Rules`, `Domain/ValueObjects`, `Domain/Enums` | `Infrastructure/AI/Gemini`, `Infrastructure/Storage`, `Infrastructure/Persistence` | `Api/Controllers` |
| Lap thuc don | `frontend/src/features/meal-plans` | `Application/Features/MealPlans` | `Domain/Rules`, `Domain/Entities` | `Infrastructure/Persistence`, `Infrastructure/Documents` | `Api/Controllers` |
| Tu bep | `frontend/src/features/pantry` | `Application/Features/Pantry` | `Domain/Entities`, `Domain/Rules` | `Infrastructure/Persistence` | `Api/Controllers` |
| Nha hang | `frontend/src/features/restaurants` va `frontend/src/features/admin/restaurants` | `Application/Features/Restaurants` | `Domain/Entities` | `Infrastructure/Persistence` | `Api/Controllers` |
| Danh muc | `frontend/src/features/admin/categories` | `Application/Features/Categories` | `Domain/Entities` | `Infrastructure/Persistence` | `Api/Controllers` |
| Thanh vien | `frontend/src/features/admin/members` | `Application/Features/Administration` hoac `Application/Features/Auth` | `Domain/Entities`, `Domain/Enums` | `Infrastructure/Identity`, `Infrastructure/Persistence` | `Api/Controllers` |
| Admin dashboard | `frontend/src/features/admin/dashboard` | `Application/Features/Administration`, `Application/Features/Moderation` | `Domain/Entities`, `Domain/Enums` | `Infrastructure/Persistence` | `Api/Controllers` |
| Favorite | `frontend/src/features/favorites` | `Application/Features/Favorites` | `Domain/Entities` | `Infrastructure/Persistence` | `Api/Controllers` |

## 5. Phan chia 5 nguoi de de quan ly

Day la goi y chia viec. Nhom co the doi ten nguoi nhung nen giu ranh gioi module.

### FE 1

- `frontend/src/features/auth`
- `frontend/src/features/profile`
- `frontend/src/features/articles`
- `frontend/src/features/admin`

### FE 2

- `frontend/src/features/recipes`
- `frontend/src/features/videos`
- `frontend/src/features/ai-chat`
- `frontend/src/features/food-scan`
- `frontend/src/features/meal-plans`
- `frontend/src/features/pantry`
- `frontend/src/features/restaurants`

### BE 1

- Auth, profile, member, role.
- Folder chinh: `Application/Features/Auth`, `Application/Features/Profiles`, `Application/Features/Administration`, `Infrastructure/Identity`.

### BE 2

- Recipes, ingredients, restaurants, categories, favorites.
- Folder chinh: `Application/Features/Recipes`, `Ingredients`, `Restaurants`, `Categories`, `Favorites`.

### BE 3

- Articles, videos, comments, moderation, AI chat, food scan, meal plans, pantry.
- Folder chinh: `Application/Features/Articles`, `Videos`, `Comments`, `Moderation`, `AiChat`, `FoodScanning`, `MealPlans`, `Pantry`, `Infrastructure/AI/Gemini`.

Neu mot feature can ca FE va BE, hai nguoi phai thong nhat API contract truoc khi code.

## 6. Quy trinh code mot tinh nang

Core Data BE 2: DTO dat trong `Application/Features/<Feature>/Dtos`, tach file theo type; service dieu phoi, validation va mapping tach ro. Repository implementation dat trong `Infrastructure/Persistence/Repositories`. Khong gom lai nhieu request/response/exception vao file Contracts. Xem `backend/CORE_DATA.md` de biet ban do code, seed, test va quy trinh migration chung.

1. Doc phan lien quan trong `docs/mvp.md`.
2. Xac dinh role nao duoc dung tinh nang.
3. Viet contract API truoc: endpoint, method, request, response, error, status.
4. Backend tao Domain/Entity/Enum neu can.
5. Backend tao use case trong `Application/Features/<FeatureName>`.
6. Backend tao repository/interface neu can.
7. Infrastructure cai dat DB/Gemini/storage/email neu can.
8. Api tao controller goi Application.
9. Frontend tao page/component/api client trong `frontend/src/features/<feature>`.
10. Test build FE/BE.

Khi giao task cho Vibe Code/AI, nen dua prompt theo mau:

```text
Doc AGENTS.md, docs/mvp.md va contracts/README.md truoc.
Hay lam tinh nang: <ten tinh nang>.
Pham vi role: <Guest/User/Admin>.
Folder duoc sua: <frontend folder>, <backend Application/Domain/Infrastructure/Api folder>.
Khong them tinh nang ngoai MVP. Khong doi cau truc folder.
Sau khi lam xong, chay build/lint va ghi ro file da sua.
```

Lenh bat buoc truoc khi commit:

```powershell
dotnet build backend/Backend.sln -c Release
cd frontend
npm run lint
npm run build
```

## 7. Quy tac API va trang thai

- API nen dat theo REST ro rang, vi du `/api/articles`, `/api/admin/articles/{id}/approve`.
- Khong tra ve entity EF truc tiep cho frontend. Dung DTO.
- Moi danh sach can co phan trang neu co kha nang nhieu du lieu.
- Loi validation tra ve thong diep de FE hien thi duoc.
- Khong tron trang thai AI va trang thai Admin.

Trang thai AI flag nen tach rieng:

- `NotSubmitted`
- `Checking`
- `Passed`
- `Flagged`
- `Partial`
- `Failed`

Trang thai Admin duyet nen tach rieng:

- `Draft`
- `Submitted`
- `PendingAdminReview`
- `Published`
- `RevisionRequested`
- `Rejected`
- `Removed`

## 8. Quy tac rieng cho AI/scan

- Khong noi AI phat hien duoc thanh phan an trong mon an neu anh khong chung minh duoc.
- Ket qua scan phai co 3 nhom: phu hop theo thong tin da cung cap, khong phu hop, chua du thong tin.
- Anh mon an phai cho user xac nhan/sua nguyen lieu va tra loi cau hoi bo sung.
- Anh nhan thanh phan phai co OCR va cho user sua text.
- Khong dung tu “100% an toan”, “chung nhan chay”, “dam bao khong di ung”.
- Di ung la canh bao rieng, khong tron voi phan loai an chay.

## 9. Quy tac bao ve truoc hoi dong

Neu duoc hoi “Tai sao chia Clean Architecture?”, tra loi:

> Nhom tach `Api`, `Application`, `Domain`, `Infrastructure` de giam phu thuoc. `Domain` giu nghiep vu cot loi, `Application` dieu phoi use case, `Infrastructure` xu ly SQL Server/Gemini/external service, `Api` chi nhan request va tra response. Cach nay giup de test, de thay doi cong nghe va de chia viec cho 3 backend.

Neu duoc hoi “Tai sao dung monorepo?”, tra loi:

> Nhom co 2 FE va 3 BE nen monorepo giup quan ly chung source, docs, contract API va pull request trong mot noi. FE/BE van doc lap dependency va build rieng, khong bi tron cong nghe.

Neu duoc hoi “Tai sao AI khong tu duyet noi dung?”, tra loi:

> AI chi flag va dua bang chung. Quyet dinh xuat ban, yeu cau sua, tu choi hoac go noi dung thuoc Admin. Cach nay giam rui ro AI sai va phu hop yeu cau kiem duyet co trach nhiem.

Neu duoc hoi “Tai sao scan khong ket luan chac chan mon chay?”, tra loi:

> Anh mon an khong chung minh duoc thanh phan an nhu nuoc mam, nuoc ham xuong hay gia vi. He thong chi danh gia dua tren thong tin da thay, OCR va xac nhan cua user, nen co trang thai “chua du thong tin”. Day la thiet ke an toan va trung thuc.

Neu duoc hoi “Tai sao Gemini goi tu backend?”, tra loi:

> API key khong duoc dua len frontend. Backend kiem soat prompt, log, quota, quyen truy cap, luu ket qua va bao ve du lieu nguoi dung tot hon.

## 10. Nhung viec AI khong duoc tu y lam

- Khong them endpoint mau/placeholder neu nhom khong yeu cau.
- Khong them UI demo/landing page neu nhom yeu cau scaffold trang.
- Khong them role moi.
- Khong them thong bao, lich ngay le, payment, mobile app, barcode, dat ban, danh gia nha hang neu chua duoc yeu cau.
- Khong doi cau truc folder neu khong cap nhat `STRUCTURE.md` va file nay.
- Khong dua code nghiep vu vao sai tang chi de cho nhanh.
- Khong commit file build: `bin/`, `obj/`, `node_modules/`, `dist/`, `.local/`.

