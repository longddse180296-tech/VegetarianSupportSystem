// Ràng buộc đầu ra Gemini cho kiểm tra bài viết; tránh status/tên trường hoặc kiểu dữ liệu tự suy diễn.
using System.Text.Json;

namespace Infrastructure.AI.Gemini.Contracts;

internal static class ModerationOutputSchema
{
    // responseSchema tương thích generateContent của Gemini 2.5; giữ phạm vi/bằng chứng dạng chuỗi như Domain.
    public static JsonElement Create() => JsonSerializer.Deserialize<JsonElement>("""
        {
          "type": "OBJECT",
          "properties": {
            "status": {"type":"STRING", "enum":["Passed","Flagged","Partial"]},
            "summary": {"type":"STRING"},
            "checkedScope": {"type":"STRING"},
            "uncheckedScope": {"type":"STRING", "nullable":true},
            "flagReason": {"type":"STRING", "nullable":true},
            "flagType": {"type":"STRING", "nullable":true, "enum":["Spam","Abuse","Advertising","HealthClaim","OffTopic","InappropriateImage"]},
            "priority": {"type":"STRING", "nullable":true, "enum":["Low","Medium","High"]},
            "evidence": {"type":"STRING", "nullable":true},
            "evidenceSource": {"type":"STRING", "nullable":true, "enum":["Text","Image"]}
          },
          "required":["status","summary","checkedScope","uncheckedScope","flagReason","flagType","priority","evidence","evidenceSource"],
          "propertyOrdering":["status","summary","checkedScope","uncheckedScope","flagReason","flagType","priority","evidence","evidenceSource"]
        }
        """);
}
