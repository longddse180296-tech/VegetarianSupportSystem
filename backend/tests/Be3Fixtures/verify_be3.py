"""Read-only smoke check for seeded BE3 fixtures; does not call Gemini."""

from seed_be3 import CREDS_FILE, MANIFEST_FILE, api, load_json

creds = load_json(CREDS_FILE, {})
ids = load_json(MANIFEST_FILE, {})
tokens = {}
for key in ("A", "B", "M"):
    _, result = api("POST", "/api/auth/login", creds[key])
    tokens[key] = result["accessToken"]

_, page = api("GET", "/api/videos?page=1&pageSize=100")
assert any(x["id"] == ids["videos"]["public"] for x in page["items"])
assert all(x["id"] != ids["videos"]["private_ready"] for x in page["items"])

private_media = f"/api/videos/{ids['videos']['private_ready']}/media"
api("GET", private_media, expected=(404,))
api("GET", private_media, token=tokens["B"], expected=(404,))
_, private = api("GET", f"/api/me/videos/{ids['videos']['private_ready']}", token=tokens["A"])
assert private["uploadStatus"] == "Ready"

_, pending = api("GET", "/api/admin/moderation/submissions/" +
                 ids["submissions"]["pending"], token=tokens["M"])
assert pending["aiFlagStatus"] == "NotSubmitted"
assert pending["adminReviewStatus"] == "PendingAdminReview"
assert pending["aiUncheckedScope"] is None

scans = ids["scans"]


def scan(name):
    return api("GET", "/api/food-scans/" + scans[name], token=tokens["A"])[1]


def statuses(name):
    return {x["diet"]: x["status"] for x in scan(name)["assessments"]}


assert set(statuses("unknown_broth").values()) == {"InsufficientInformation"}
assert set(statuses("fish_sauce").values()) == {"Incompatible"}
assert set(statuses("plant").values()) == {"SuitableBasedOnProvidedInformation"}
assert set(statuses("label_incomplete").values()) == {"InsufficientInformation"}
assert set(statuses("unconfirmed_ai").values()) == {"InsufficientInformation"}
assert set(statuses("catalog_animal").values()) == {"Incompatible"}
assert scan("catalog_animal")["catalogEvidence"]
assert scan("allergy")["allergyWarnings"]
assert scan("revision")["resultVersion"] == 2
api("GET", "/api/food-scans/" + scans["unknown_broth"], token=tokens["B"],
    expected=(404,))
api("GET", "/api/ai-chat/conversations/" + ids["conversation_A"],
    token=tokens["B"], expected=(404,))

print("BE3 fixture smoke checks passed (public/private media, moderation, chat ownership, 11 scans).")
