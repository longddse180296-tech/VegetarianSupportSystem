using System.ComponentModel.DataAnnotations;
using Application.Common.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public abstract class CoreDataControllerBase : ControllerBase
{
    protected async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try
        {
            return await action();
        }
        catch (ValidationException ex)
        {
            var members = ex.ValidationResult?.MemberNames.ToArray() ?? [];
            foreach (var member in members.Length == 0 ? ["request"] : members)
            {
                ModelState.AddModelError(member, ex.Message);
            }
            return ValidationProblem(ModelState);
        }
        catch (KeyNotFoundException ex)
        {
            return Problem(statusCode: 404, title: ex.Message);
        }
        catch (ConflictException ex)
        {
            return Problem(statusCode: 409, title: ex.Message);
        }
    }
}
