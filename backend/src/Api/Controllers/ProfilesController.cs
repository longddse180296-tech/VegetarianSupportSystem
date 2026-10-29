// Chức năng: hồ sơ và nhu cầu dinh dưỡng cá nhân. Tầng API nhận yêu cầu, kiểm tra quyền và chuyển xử lý cho Application.
using System.Text.Json.Serialization;
using Application.Features.Profiles;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

// ProfilesController: cung cấp endpoint HTTP, kiểm tra danh tính và chuyển yêu cầu cho tầng Application.
[ApiController]
[Authorize(Roles = "User,Admin")]
[Route("api/profile/me")]
public sealed class ProfilesController(ProfileService profiles) : ControllerBase
{
    // Get: Đọc dữ liệu theo bộ lọc, danh tính hoặc phạm vi được truyền vào.
    [HttpGet]
    public async Task<ActionResult<ProfileDetails>> Get(CancellationToken cancellationToken)
    {
        var result = await profiles.GetAsync(CurrentUserId, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    // Update: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPut]
    public async Task<ActionResult<ProfileDetails>> Update(
        [FromBody] UpdateProfileRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await profiles.UpdateAsync(CurrentUserId, request.ToCommand(), cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentException ex)
        {
            return Invalid(ex);
        }
        catch (ProfileConflictException ex)
        {
            return ConflictProblem(ex.Message);
        }
    }

    // SetDiet: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPut("diet")]
    public async Task<ActionResult<ProfileDetails>> SetDiet(
        [FromBody] SetDietRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await profiles.SetDietAsync(CurrentUserId, request.Diet, cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return Invalid(ex);
        }
    }

    // UpdatePersonal: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPut("personal")]
    public async Task<ActionResult<ProfileDetails>> UpdatePersonal(
        [FromBody] UpdatePersonalRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await profiles.UpdatePersonalAsync(CurrentUserId,
                new UpdatePersonalDetails(request.FullName, request.PhoneNumber, request.RestaurantArea),
                cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentException ex)
        {
            return Invalid(ex);
        }
    }

    // UpdateBody: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPut("body")]
    public async Task<ActionResult<ProfileDetails>> UpdateBody(
        [FromBody] UpdateBodyRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await profiles.UpdateBodyAsync(CurrentUserId,
                new UpdateBodyDetails(request.BirthDate, request.SexForEnergyEstimate,
                    request.HeightCm, request.WeightKg, request.ActivityLevel, request.WeightGoal),
                cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentException ex)
        {
            return Invalid(ex);
        }
    }

    // PreviewBody: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPost("body/estimate")]
    public async Task<ActionResult<ProfileEstimate>> PreviewBody(
        [FromBody] UpdateBodyRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await profiles.PreviewBodyAsync(CurrentUserId,
                new UpdateBodyDetails(request.BirthDate, request.SexForEnergyEstimate,
                    request.HeightCm, request.WeightKg, request.ActivityLevel, request.WeightGoal),
                cancellationToken);
            return result is null ? NotFound() : Ok(result);
        }
        catch (ArgumentException ex)
        {
            return Invalid(ex);
        }
    }

    // AddAllergy: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPost("allergies")]
    public async Task<ActionResult<ProfileItem>> AddAllergy(
        [FromBody] ProfileItemRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await profiles.AddAllergyAsync(CurrentUserId, request.Name, cancellationToken);
            return result is null ? NotFound() : StatusCode(StatusCodes.Status201Created, result);
        }
        catch (ArgumentException ex) { return Invalid(ex); }
        catch (InvalidOperationException ex) { return ConflictProblem(ex.Message); }
        catch (ProfileConflictException ex) { return ConflictProblem(ex.Message); }
    }

    // RenameAllergy: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPut("allergies/{id:guid}")]
    public async Task<IActionResult> RenameAllergy(
        Guid id, [FromBody] ProfileItemRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return await profiles.RenameAllergyAsync(CurrentUserId, id, request.Name, cancellationToken)
                ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return Invalid(ex); }
        catch (InvalidOperationException ex) { return ConflictProblem(ex.Message); }
        catch (ProfileConflictException ex) { return ConflictProblem(ex.Message); }
    }

    // RemoveAllergy: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    [HttpDelete("allergies/{id:guid}")]
    public async Task<IActionResult> RemoveAllergy(Guid id, CancellationToken cancellationToken) =>
        await profiles.RemoveAllergyAsync(CurrentUserId, id, cancellationToken) ? NoContent() : NotFound();

    // AddAvoidedFood: Tạo hoặc cập nhật dữ liệu theo các điều kiện của tính năng.
    [HttpPost("avoided-foods")]
    public async Task<ActionResult<ProfileItem>> AddAvoidedFood(
        [FromBody] ProfileItemRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await profiles.AddAvoidedFoodAsync(CurrentUserId, request.Name, cancellationToken);
            return result is null ? NotFound() : StatusCode(StatusCodes.Status201Created, result);
        }
        catch (ArgumentException ex) { return Invalid(ex); }
        catch (InvalidOperationException ex) { return ConflictProblem(ex.Message); }
        catch (ProfileConflictException ex) { return ConflictProblem(ex.Message); }
    }

    // RenameAvoidedFood: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    [HttpPut("avoided-foods/{id:guid}")]
    public async Task<IActionResult> RenameAvoidedFood(
        Guid id, [FromBody] ProfileItemRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return await profiles.RenameAvoidedFoodAsync(CurrentUserId, id, request.Name, cancellationToken)
                ? NoContent() : NotFound();
        }
        catch (ArgumentException ex) { return Invalid(ex); }
        catch (InvalidOperationException ex) { return ConflictProblem(ex.Message); }
        catch (ProfileConflictException ex) { return ConflictProblem(ex.Message); }
    }

    // RemoveAvoidedFood: Xóa dữ liệu trong phạm vi cho phép và xử lý các liên kết liên quan.
    [HttpDelete("avoided-foods/{id:guid}")]
    public async Task<IActionResult> RemoveAvoidedFood(Guid id, CancellationToken cancellationToken) =>
        await profiles.RemoveAvoidedFoodAsync(CurrentUserId, id, cancellationToken) ? NoContent() : NotFound();

    private string CurrentUserId => User.FindFirst("sub")!.Value;

    // Invalid: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private ActionResult Invalid(ArgumentException ex)
    {
        ModelState.AddModelError(ex.ParamName ?? "request", ex.Message);
        return ValidationProblem(ModelState);
    }

    // ConflictProblem: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
    private ObjectResult ConflictProblem(string message) => Conflict(new ProblemDetails
    {
        Status = StatusCodes.Status409Conflict,
        Title = message
    });

    // UpdateProfileRequest: định nghĩa dữ liệu trao đổi của tính năng.
    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record UpdateProfileRequest(
        string? FullName,
        string? PhoneNumber,
        VegetarianDiet? Diet,
        DateOnly? BirthDate,
        SexForEnergyEstimate? SexForEnergyEstimate,
        decimal? HeightCm,
        decimal? WeightKg,
        ActivityLevel? ActivityLevel,
        WeightGoal? WeightGoal,
        string? RestaurantArea)
    {
        // ToCommand: Thực hiện bước nghiệp vụ riêng cho luồng xử lý của lớp này.
        public UpdateProfile ToCommand() => new(FullName, PhoneNumber, Diet, BirthDate,
            SexForEnergyEstimate, HeightCm, WeightKg, ActivityLevel, WeightGoal, RestaurantArea);
    }

    // UpdatePersonalRequest: định nghĩa dữ liệu trao đổi của tính năng.
    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record UpdatePersonalRequest(string? FullName, string? PhoneNumber, string? RestaurantArea);

    // UpdateBodyRequest: định nghĩa dữ liệu trao đổi của tính năng.
    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record UpdateBodyRequest(
        DateOnly? BirthDate,
        SexForEnergyEstimate? SexForEnergyEstimate,
        decimal? HeightCm,
        decimal? WeightKg,
        ActivityLevel? ActivityLevel,
        WeightGoal? WeightGoal);

    // ProfileItemRequest: định nghĩa dữ liệu trao đổi của tính năng.
    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record ProfileItemRequest(string? Name);

    // SetDietRequest: định nghĩa dữ liệu trao đổi của tính năng.
    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record SetDietRequest([property: JsonRequired] VegetarianDiet? Diet);
}
