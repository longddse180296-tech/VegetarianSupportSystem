using System.Text.Json.Serialization;
using Application.Features.Profiles;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Authorize(Roles = "User,Admin")]
[Route("api/profile/me")]
public sealed class ProfilesController(ProfileService profiles) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ProfileDetails>> Get(CancellationToken cancellationToken)
    {
        var result = await profiles.GetAsync(CurrentUserId, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

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

    [HttpDelete("allergies/{id:guid}")]
    public async Task<IActionResult> RemoveAllergy(Guid id, CancellationToken cancellationToken) =>
        await profiles.RemoveAllergyAsync(CurrentUserId, id, cancellationToken) ? NoContent() : NotFound();

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

    [HttpDelete("avoided-foods/{id:guid}")]
    public async Task<IActionResult> RemoveAvoidedFood(Guid id, CancellationToken cancellationToken) =>
        await profiles.RemoveAvoidedFoodAsync(CurrentUserId, id, cancellationToken) ? NoContent() : NotFound();

    private string CurrentUserId => User.FindFirst("sub")!.Value;

    private ActionResult Invalid(ArgumentException ex)
    {
        ModelState.AddModelError(ex.ParamName ?? "request", ex.Message);
        return ValidationProblem(ModelState);
    }

    private ObjectResult ConflictProblem(string message) => Conflict(new ProblemDetails
    {
        Status = StatusCodes.Status409Conflict,
        Title = message
    });

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
        public UpdateProfile ToCommand() => new(FullName, PhoneNumber, Diet, BirthDate,
            SexForEnergyEstimate, HeightCm, WeightKg, ActivityLevel, WeightGoal, RestaurantArea);
    }

    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record UpdatePersonalRequest(string? FullName, string? PhoneNumber, string? RestaurantArea);

    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record UpdateBodyRequest(
        DateOnly? BirthDate,
        SexForEnergyEstimate? SexForEnergyEstimate,
        decimal? HeightCm,
        decimal? WeightKg,
        ActivityLevel? ActivityLevel,
        WeightGoal? WeightGoal);

    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record ProfileItemRequest(string? Name);

    [JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
    public sealed record SetDietRequest([property: JsonRequired] VegetarianDiet? Diet);
}
