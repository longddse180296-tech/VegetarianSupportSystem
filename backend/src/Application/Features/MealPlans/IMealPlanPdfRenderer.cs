namespace Application.Features.MealPlans;

public interface IMealPlanPdfRenderer
{
    byte[] Render(MealPlanResponse plan);
}
