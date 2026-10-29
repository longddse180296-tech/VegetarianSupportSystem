// Chuẩn hóa tiêu đề để phát hiện trùng khi gửi duyệt; giữ dấu tiếng Việt, không suy đoán hai tiêu đề gần giống là trùng.
using System.Text;

namespace Domain.Rules;

public static class ArticleTitleRules
{
    public static string Normalize(string title) =>
        string.Join(" ", title.Normalize(NormalizationForm.FormC).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)).ToUpperInvariant();
}
