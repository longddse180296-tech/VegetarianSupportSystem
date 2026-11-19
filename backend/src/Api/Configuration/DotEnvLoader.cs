// Nạp các cặp tên và giá trị từ file .env vào biến môi trường, ưu tiên giá trị đã được môi trường cấu hình.
namespace Api.Configuration;

// DotEnvLoader: định nghĩa dữ liệu hoặc hành vi nghiệp vụ của tính năng.
internal static class DotEnvLoader
{
    // Load: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    public static void Load(string path)
    {
        // Kiểm tra trường hợp thiếu dữ liệu hoặc trạng thái không phù hợp trước khi tiếp tục.
        if (!File.Exists(path)) return;

        foreach (var rawLine in File.ReadLines(path))
        {
            var line = rawLine.Trim().TrimStart('\uFEFF');
            if (line.Length == 0 || line.StartsWith('#')) continue;
            if (line.StartsWith("export ", StringComparison.Ordinal))
                line = line[7..].TrimStart();

            var separator = line.IndexOf('=');
            if (separator <= 0) continue;

            var name = line[..separator].Trim();
            if (name.Length == 0 || Environment.GetEnvironmentVariable(name) is not null) continue;

            var value = line[(separator + 1)..].Trim();
            if (value.Length >= 2 &&
                ((value[0] == '"' && value[^1] == '"') || (value[0] == '\'' && value[^1] == '\'')))
            {
                value = value[1..^1];
            }

            Environment.SetEnvironmentVariable(name, value);
        }
    }
}
