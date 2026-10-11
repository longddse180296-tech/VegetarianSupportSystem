"""Seed isolated BE3 test records in the local VegetarianSupport database.

Run the API and apply migrations first. This script deliberately never calls Gemini.
Synthetic moderation/chat rows are clearly marked as fixtures, not AI test results.
Credentials and generated IDs stay under the Git-ignored .local directory.
"""

from __future__ import annotations

import json
from pathlib import Path
import secrets
import subprocess
import sys
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import NAMESPACE_URL, UUID, uuid5

ROOT = Path(__file__).resolve().parents[3]
LOCAL = ROOT / ".local" / "be3-fixtures"
ASSETS = LOCAL / "assets"
CREDS_FILE = LOCAL / "credentials.json"
MANIFEST_FILE = LOCAL / "manifest.json"
POSTMAN_FILE = LOCAL / "postman-environment.json"
BASE = "http://localhost:5080"
DB_SERVER = r"(localdb)\MSSQLLocalDB"
DB_NAME = "VegetarianSupport"
CATEGORY_ID = "10000000-0000-0000-0000-000000000001"


def save_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_json(path: Path, default: dict) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else default


def api(method: str, path: str, body=None, token: str | None = None,
        upload: Path | None = None, expected=(200, 201, 204)):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = None
    if upload:
        boundary = "BE3FixtureBoundary"
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        data = (
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; "
            f"filename=\"{upload.name}\"\r\nContent-Type: application/octet-stream\r\n\r\n"
        ).encode() + upload.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
    elif body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    request = Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urlopen(request, timeout=30) as response:
            status, text = response.status, response.read().decode("utf-8")
    except HTTPError as error:
        status, text = error.code, error.read().decode("utf-8")
    if status not in expected:
        raise RuntimeError(f"{method} {path}: HTTP {status}: {text[:450]}")
    return status, json.loads(text) if text else None


def sql(query: str) -> str:
    result = subprocess.run(
        ["sqlcmd", "-S", DB_SERVER, "-d", DB_NAME, "-E", "-b", "-I", "-W", "-h", "-1",
         "-Q", "SET NOCOUNT ON; " + query],
        capture_output=True, text=True, check=False,
    )
    if result.returncode:
        raise RuntimeError(f"SQL fixture failed: {result.stderr or result.stdout}")
    return result.stdout.strip()


def quote(value: str) -> str:
    return "N'" + value.replace("'", "''") + "'"


def uid(value: str) -> str:
    return str(UUID(value))


def fixture_guid(name: str) -> str:
    return str(uuid5(NAMESPACE_URL, "VegetarianSupport/BE3Fixture/" + name))


def credentials() -> dict:
    if CREDS_FILE.exists():
        return load_json(CREDS_FILE, {})
    accounts = {
        key: {"email": email, "password": "Test-" + secrets.token_hex(14)}
        for key, email in (
            ("A", "be3.user.a@local.test"),
            ("B", "be3.user.b@local.test"),
            ("M", "be3.admin@local.test"),
        )
    }
    save_json(CREDS_FILE, accounts)
    return accounts


def create_accounts(creds: dict) -> tuple[dict, dict]:
    names = {"A": "[BE3 TEST] User A", "B": "[BE3 TEST] User B",
             "M": "[BE3 TEST] Admin"}
    for key, account in creds.items():
        api("POST", "/api/auth/register", {
            "fullName": names[key], "email": account["email"],
            "password": account["password"], "confirmPassword": account["password"],
        }, expected=(201, 409))
    # Only the dedicated fixture account is promoted; no real account is changed.
    sql("UPDATE Users SET Role=N'Admin' WHERE NormalizedEmail=N'BE3.ADMIN@LOCAL.TEST' "
        "AND FullName=N'[BE3 TEST] Admin' AND Role=N'User'; "
        "IF NOT EXISTS (SELECT 1 FROM Users WHERE NormalizedEmail=N'BE3.ADMIN@LOCAL.TEST' "
        "AND FullName=N'[BE3 TEST] Admin' AND Role=N'Admin') "
        "THROW 50001, 'BE3 fixture admin account is missing or mismatched', 1;")
    tokens, ids = {}, {}
    for key, account in creds.items():
        _, result = api("POST", "/api/auth/login", account)
        tokens[key] = result["accessToken"]
        ids[key] = result["user"]["id"]
        expected_role = "Admin" if key == "M" else "User"
        if result["user"]["role"] != expected_role:
            raise RuntimeError(f"Unexpected role for {key}")
    api("PUT", "/api/profile/me/diet", {"diet": "Vegan"}, tokens["A"])
    api("PUT", "/api/profile/me/diet", {"diet": "LactoOvo"}, tokens["M"])
    _, profile = api("GET", "/api/profile/me", token=tokens["A"])
    if not any(x["name"].casefold() == "đậu phộng" for x in profile["allergies"]):
        api("POST", "/api/profile/me/allergies", {"name": "đậu phộng"}, tokens["A"])
    return tokens, ids


def create_video(name: str, title: str, tokens: dict, manifest: dict,
                 upload: Path | None = None, invalid=False) -> str:
    videos = manifest.setdefault("videos", {})
    if name not in videos:
        existing = sql("SELECT TOP(1) CONVERT(nvarchar(36),v.Id) FROM Videos v "
                       "JOIN Users u ON u.Id=v.OwnerUserId "
                       "WHERE u.NormalizedEmail=N'BE3.USER.A@LOCAL.TEST' "
                       f"AND v.Title={quote(title)} ORDER BY v.CreatedAtUtc DESC;")
        if existing:
            videos[name] = uid(existing.splitlines()[0].strip())
        else:
            _, result = api("POST", "/api/me/videos", {
                "title": title, "description": f"[BE3 TEST] Mô tả {name}",
                "categoryId": CATEGORY_ID,
            }, tokens["A"])
            videos[name] = result["id"]
        save_json(MANIFEST_FILE, manifest)
    video_id = uid(videos[name])
    _, detail = api("GET", f"/api/me/videos/{video_id}", token=tokens["A"])
    if upload and detail["uploadStatus"] != "Ready":
        api("POST", f"/api/me/videos/{video_id}/media", token=tokens["A"],
            upload=upload, expected=(400,) if invalid else (200,))
        if not invalid:
            api("POST", f"/api/me/videos/{video_id}/thumbnail", token=tokens["A"],
                upload=ASSETS / "thumbnail.png")
    return video_id


def synthetic_submission(name: str, video_id: str, owner_id: str,
                         manifest: dict) -> str:
    submission_id = fixture_guid("submission-" + name)
    video_id, owner_id = uid(video_id), owner_id.replace("'", "''")
    sql(f"IF NOT EXISTS (SELECT 1 FROM ModerationSubmissions WHERE Id='{submission_id}') "
        f"INSERT INTO ModerationSubmissions "
        f"(Id,ContentId,Version,ContentType,OwnerUserId,Title,TextContent,MediaReference,"
        f"AiFlagStatus,AdminReviewStatus,AiSummary,AiFlagReason,AiCheckedScope,AiUncheckedScope,"
        f"AiCheckedAt,SubmittedAt,CreatedAtUtc,UpdatedAtUtc,IsCurrentPublished,"
        f"AiEvidence,AiFlagType,AiPriority) "
        f"SELECT '{submission_id}',v.Id,1,N'Video',v.OwnerUserId,v.Title,v.Description,v.MediaKey,"
        f"N'NotSubmitted',N'PendingAdminReview',NULL,NULL,NULL,NULL,"
        f"NULL,SYSDATETIMEOFFSET(),SYSDATETIMEOFFSET(),SYSDATETIMEOFFSET(),0,"
        f"NULL,NULL,NULL FROM Videos v WHERE v.Id='{video_id}' AND v.OwnerUserId=N'{owner_id}' "
        f"AND v.UploadStatus=N'Ready' AND v.MediaKey IS NOT NULL; "
        f"IF NOT EXISTS (SELECT 1 FROM ModerationSubmissions WHERE Id='{submission_id}') "
        f"THROW 50002, 'Could not create synthetic submission', 1;")
    manifest.setdefault("submissions", {})[name] = submission_id
    save_json(MANIFEST_FILE, manifest)
    return submission_id


def decide(submission_id: str, decision: str, tokens: dict):
    _, detail = api("GET", f"/api/admin/moderation/submissions/{submission_id}",
                    token=tokens["M"])
    desired = {"Approve": "Published", "Reject": "Rejected",
               "RequestRevision": "RevisionRequested", "Remove": "Removed"}[decision]
    if detail["adminReviewStatus"] == desired:
        return
    if decision == "Approve" and detail["adminReviewStatus"] == "Removed":
        return
    api("POST", f"/api/admin/moderation/submissions/{submission_id}/decisions", {
        "decision": decision,
        "reason": "[BE3 FIXTURE] Quyết định mẫu để thử API; không chứng minh AI đã kiểm tra.",
    }, tokens["M"])


def seed_chat(tokens: dict, manifest: dict):
    for key in ("A", "B"):
        slot = f"conversation_{key}"
        if slot not in manifest:
            _, conversation = api("POST", "/api/ai-chat/conversations", token=tokens[key])
            manifest[slot] = conversation["id"]
            save_json(MANIFEST_FILE, manifest)
        conversation_id = uid(manifest[slot])
        for role, content in (
            ("User", f"[BE3 FIXTURE {key}] Gợi ý món chay từ đậu hũ"),
            ("Assistant", "[BE3 FIXTURE] Tin nhắn mẫu; không phải phản hồi Gemini."),
        ):
            message_id = fixture_guid(f"chat-{key}-{role}")
            sql(f"IF NOT EXISTS (SELECT 1 FROM AiChatMessages WHERE Id='{message_id}') "
                f"INSERT INTO AiChatMessages(Id,ConversationId,Role,Content,CreatedAtUtc) "
                f"VALUES ('{message_id}','{conversation_id}',N'{role}',{quote(content)},"
                f"SYSDATETIMEOFFSET());")


def seed_scans(tokens: dict, manifest: dict):
    scans = manifest.setdefault("scans", {})
    plant = {"name": "đậu hũ", "kind": "Plant", "source": "UserConfirmed"}
    cases = {
        "unknown_broth": {"sourceType": "Dish", "ingredients": [plant,
            {"name": "nước dùng", "kind": "Unknown", "source": "UserConfirmed"}],
            "ingredientsComplete": False, "unknownAnswers": ["Không biết nguồn gốc nước dùng"]},
        "fish_sauce": {"sourceType": "Dish", "ingredients": [
            {"name": "nước mắm cá", "kind": "Animal", "source": "UserConfirmed"}],
            "ingredientsComplete": True, "unknownAnswers": []},
        "plant": {"sourceType": "Dish", "ingredients": [plant],
            "ingredientsComplete": True, "unknownAnswers": []},
        "egg": {"sourceType": "Dish", "ingredients": [
            {"name": "trứng", "kind": "Egg", "source": "UserConfirmed"}],
            "ingredientsComplete": True, "unknownAnswers": []},
        "dairy": {"sourceType": "Dish", "ingredients": [
            {"name": "sữa", "kind": "Dairy", "source": "UserConfirmed"}],
            "ingredientsComplete": True, "unknownAnswers": []},
        "label_corrected": {"sourceType": "Label", "correctedLabelText": "Tofu, egg, salt",
            "labelIncomplete": False, "ingredients": [
                {"name": "đậu hũ", "kind": "Plant", "source": "UserEdited"},
                {"name": "trứng", "kind": "Egg", "source": "UserEdited"}],
            "ingredientsComplete": True, "unknownAnswers": []},
        "label_incomplete": {"sourceType": "Label", "correctedLabelText": "Tofu, ...",
            "labelIncomplete": True, "ingredients": [plant],
            "ingredientsComplete": True, "unknownAnswers": []},
        "unconfirmed_ai": {"sourceType": "Dish", "ingredients": [
            {"name": "đậu hũ", "kind": "Plant", "source": "AiSuggested"}],
            "ingredientsComplete": True, "unknownAnswers": []},
        "allergy": {"sourceType": "Dish", "ingredients": [
            {"name": "đậu phộng", "kind": "Plant", "source": "UserConfirmed"}],
            "ingredientsComplete": True, "unknownAnswers": []},
        "catalog_animal": {"sourceType": "Dish", "ingredients": [
            {"name": "[Mẫu] Nước mắm cá", "kind": "Plant", "source": "UserConfirmed"}],
            "ingredientsComplete": True, "unknownAnswers": []},
    }
    for name, body in cases.items():
        if name not in scans:
            _, result = api("POST", "/api/food-scans/evaluate", body, tokens["A"])
            scans[name] = result["id"]
            save_json(MANIFEST_FILE, manifest)
    if "revision" not in scans:
        body = {"sourceType": "Dish", "ingredients": [plant],
                "ingredientsComplete": True, "unknownAnswers": [],
                "previousScanId": scans["unknown_broth"]}
        _, result = api("POST", "/api/food-scans/evaluate", body, tokens["A"])
        scans["revision"] = result["id"]
        save_json(MANIFEST_FILE, manifest)


def export_postman_environment(creds: dict, manifest: dict):
    variables = {"baseUrl": BASE, "categoryId": CATEGORY_ID,
                 "emailA": creds["A"]["email"], "emailB": creds["B"]["email"],
                 "emailM": creds["M"]["email"],
                 "userAId": manifest["userIds"]["A"],
                 "userBId": manifest["userIds"]["B"],
                 "adminId": manifest["userIds"]["M"],
                 "conversationA": manifest["conversation_A"],
                 "conversationB": manifest["conversation_B"]}
    variables.update({"video_" + name: value for name, value in manifest["videos"].items()})
    variables.update({"submission_" + name: value for name, value in manifest["submissions"].items()})
    variables.update({"scan_" + name: value for name, value in manifest["scans"].items()})
    variables.update({"tokenA": "", "tokenB": "", "tokenM": ""})
    save_json(POSTMAN_FILE, {
        "name": "BE3 LocalDB fixtures (local only)",
        "values": [{"key": key, "value": value, "enabled": True,
                    "type": "secret" if key.startswith("token") else "default"}
                   for key, value in variables.items()],
    })


def main():
    if not (ASSETS / "video.mp4").exists():
        raise SystemExit("Run generate_media.py before seed_be3.py")
    api("GET", "/api/videos?page=1&pageSize=1")
    sql("IF NOT EXISTS (SELECT 1 FROM Categories WHERE Id='" + CATEGORY_ID + "') "
        "THROW 50003, 'Run --seed-core-data first', 1;")
    creds = credentials()
    manifest = load_json(MANIFEST_FILE, {"database": DB_NAME, "fixture": "BE3"})
    tokens, ids = create_accounts(creds)
    manifest["userIds"] = ids
    manifest["categoryId"] = CATEGORY_ID
    save_json(MANIFEST_FILE, manifest)
    specs = [
        ("draft", "[BE3 TEST] Draft", None, False),
        ("private_ready", "[BE3 TEST] Ready private", ASSETS / "video.mp4", False),
        ("upload_failed", "[BE3 TEST] Upload failed", ASSETS / "invalid.mp4", True),
        ("public", "[BE3 TEST] Published fixture", ASSETS / "video.mp4", False),
        ("pending", "[BE3 TEST] Pending fixture", ASSETS / "video.webm", False),
        ("rejected", "[BE3 TEST] Rejected fixture", ASSETS / "video.mp4", False),
        ("revision_requested", "[BE3 TEST] Revision fixture", ASSETS / "video.mp4", False),
        ("removed", "[BE3 TEST] Removed fixture", ASSETS / "video.mp4", False),
        ("admin_only", "[BE3 TEST] Admin only fixture", ASSETS / "video.mp4", False),
    ]
    for name, title, upload, invalid in specs:
        video_id = create_video(name, title, tokens, manifest, upload, invalid)
        if name in ("draft", "private_ready", "upload_failed"):
            continue
        sub_id = synthetic_submission(name, video_id, ids["A"], manifest)
        if name in ("public", "removed"):
            decide(sub_id, "Approve", tokens)
        if name == "removed":
            decide(sub_id, "Remove", tokens)
        if name == "rejected":
            decide(sub_id, "Reject", tokens)
        if name == "revision_requested":
            decide(sub_id, "RequestRevision", tokens)
    seed_chat(tokens, manifest)
    seed_scans(tokens, manifest)
    save_json(MANIFEST_FILE, manifest)
    export_postman_environment(creds, manifest)
    print(f"BE3 fixtures ready in {DB_SERVER}/{DB_NAME}.")
    print(f"IDs: {MANIFEST_FILE}")
    print(f"Test account credentials (local, ignored): {CREDS_FILE}")
    print(f"Media files: {ASSETS}")
    print(f"Postman environment (set tokenA/B/M after login): {POSTMAN_FILE}")
    print("Synthetic moderation/chat records are fixtures, not proof of Gemini behavior.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"BE3 fixture seed failed: {exc}", file=sys.stderr)
        raise SystemExit(1) from exc
