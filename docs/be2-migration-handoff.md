# Handoff migration cho BE 2 — Moderation và AiChat

Ngày 02/10/2026. Entity/config đã được cập nhật; BE 2 tổng hợp migration chung trước khi chạy SQL Server. **Chưa tạo hoặc áp dụng migration mới trong đợt này.**

## Entity/config hiện có

- `ModerationSubmission` → `ModerationSubmissions`, config `Infrastructure/Persistence/Configurations/ModerationConfiguration.cs`.
- `ModerationDecision` → `ModerationDecisions`, cùng file config.
- `AiChatConversation` → `AiChatConversations`, config `Infrastructure/Persistence/Configurations/AiChatConfiguration.cs`.
- `AiChatMessage` → `AiChatMessages`, cùng file config.
- `AppDbContext` đã có bốn `DbSet`; migration `20260929181927_InitialModerationAiChat` tạo bốn bảng và các index. Migration này chưa được xác nhận đã áp dụng lên SQL Server.

## Delta cần gom vào migration tiếp theo

| Bảng | Cột | Kiểu SQL Server | Backfill nếu bảng đã có dữ liệu |
|---|---|---|---|
| `ModerationSubmissions` | `AiFlagReason` | `nvarchar(2000) NULL` | Giữ `NULL` cho bản cũ; cờ AI cũ cần rà soát thủ công nếu muốn có lý do. |
| `ModerationSubmissions` | `CreatedAtUtc` | `datetimeoffset NOT NULL` | Lấy `SubmittedAt`. |
| `ModerationSubmissions` | `UpdatedAtUtc` | `datetimeoffset NOT NULL` | Ít nhất lấy `SubmittedAt`; nếu có quyết định/AI check thì lấy thời điểm mới nhất. |

Enum `AiFlagStatus` và `AdminReviewStatus` đã lưu dạng string; không cần bảng enum. `ModerationDecisions` giữ `AdminUserId`, `Reason`, `DecidedAt` cho nhật ký quyết định. Chưa thêm foreign key đến bảng User/Article/Video vì các entity đó chưa được nối vào schema chung.

Sau khi BE 2 gom migration, kiểm tra snapshot EF, chạy migration trên DB thử nghiệm rồi thử tạo bản gửi, ghi kết quả AI mock, quyết định Admin và lưu chat User. Contract endpoint nằm trong `contracts/moderation-aichat.md`.
