using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Api.Configuration;

public sealed class BearerOpenApiTransformer : IOpenApiDocumentTransformer
{
    public Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Token đăng nhập; trong Development có thể lấy tại POST /api/dev-auth/token."
        };

        foreach (var (path, pathItem) in document.Paths)
        {
            if (path.Equals("/api/food-scans/dish-image", StringComparison.OrdinalIgnoreCase)
                && pathItem.Operations?.TryGetValue(HttpMethod.Post, out var uploadOperation) == true)
            {
                uploadOperation.RequestBody = new OpenApiRequestBody
                {
                    Required = true,
                    Content = new Dictionary<string, OpenApiMediaType>
                    {
                        ["multipart/form-data"] = new OpenApiMediaType
                        {
                            Schema = new OpenApiSchema
                            {
                                Type = JsonSchemaType.Object,
                                Required = new HashSet<string> { "image" },
                                Properties = new Dictionary<string, IOpenApiSchema>
                                {
                                    ["image"] = new OpenApiSchema
                                    {
                                        Type = JsonSchemaType.String,
                                        Format = "binary"
                                    }
                                }
                            }
                        }
                    }
                };
                uploadOperation.Responses ??= new OpenApiResponses();
                uploadOperation.Responses.TryAdd("400", new OpenApiResponse { Description = "Ảnh không hợp lệ hoặc quá 10 MB." });
                uploadOperation.Responses.TryAdd("422", new OpenApiResponse { Description = "Không nhận diện được món ăn trong ảnh." });
                uploadOperation.Responses.TryAdd("503", new OpenApiResponse { Description = "Dịch vụ phân tích ảnh chưa sẵn sàng." });
            }

            if (!path.StartsWith("/api/moderation/", StringComparison.OrdinalIgnoreCase)
                && !path.StartsWith("/api/admin/moderation/", StringComparison.OrdinalIgnoreCase)
                && !path.StartsWith("/api/ai-chat/conversations", StringComparison.OrdinalIgnoreCase)
                && !path.StartsWith("/api/food-scans/", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (pathItem.Operations is null) continue;

            foreach (var operation in pathItem.Operations.Values)
            {
                operation.Security ??= [];
                operation.Security.Add(new OpenApiSecurityRequirement
                {
                    [new OpenApiSecuritySchemeReference("Bearer", document)] = []
                });
                operation.Responses ??= new OpenApiResponses();
                operation.Responses.TryAdd("401", new OpenApiResponse
                {
                    Description = "Thiếu Bearer token hoặc token không hợp lệ."
                });
                operation.Responses.TryAdd("403", new OpenApiResponse
                {
                    Description = "Token hợp lệ nhưng không đủ quyền."
                });
            }
        }

        return Task.CompletedTask;
    }
}
