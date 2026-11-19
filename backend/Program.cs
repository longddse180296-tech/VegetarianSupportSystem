// Điểm chạy chung của solution backend. Tìm project API, chuyển tham số sang tiến trình con và trả lại mã thoát của API.
using System.Diagnostics;

// Tìm project API khi lệnh được chạy từ thư mục gốc hoặc thư mục backend.
var backendDirectory = ResolveBackendDirectory();
var apiProject = Path.Combine(backendDirectory, "src", "Api", "Api.csproj");
var startInfo = new ProcessStartInfo("dotnet")
{
    WorkingDirectory = backendDirectory,
    UseShellExecute = false
};
startInfo.ArgumentList.Add("run");
startInfo.ArgumentList.Add("--project");
startInfo.ArgumentList.Add(apiProject);
startInfo.ArgumentList.Add("--");
foreach (var argument in args)
    startInfo.ArgumentList.Add(argument);

using var api = Process.Start(startInfo) ?? throw new InvalidOperationException("Unable to start the API project.");
// Chuyển thao tác Ctrl+C thành lệnh dừng tiến trình API và các tiến trình con của nó.
Console.CancelKeyPress += (_, eventArgs) =>
{
    eventArgs.Cancel = true;
    if (!api.HasExited)
        api.Kill(entireProcessTree: true);
};
await api.WaitForExitAsync();
return api.ExitCode;

static string ResolveBackendDirectory()
{
    var workingDirectory = Directory.GetCurrentDirectory();
    var candidates = new[]
    {
        workingDirectory,
        Path.Combine(workingDirectory, "backend")
    };

    foreach (var candidate in candidates)
    {
        if (File.Exists(Path.Combine(candidate, "src", "Api", "Api.csproj")))
            return Path.GetFullPath(candidate);
    }

    throw new InvalidOperationException(
        "Cannot locate src/Api/Api.csproj. Run this command from the backend directory.");
}
