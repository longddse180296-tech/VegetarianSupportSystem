using System.Diagnostics;

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
