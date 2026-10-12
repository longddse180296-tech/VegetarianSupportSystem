using System.Globalization;
using System.Text;
using Application.Features.MealPlans;
using Domain.Enums;

namespace Infrastructure.Documents;

public sealed class MealPlanPdfRenderer : IMealPlanPdfRenderer
{
    public byte[] Render(MealPlanResponse plan)
    {
        var lines = new List<string>
        {
            "Vegetarian Support - Meal Plan",
            plan.Name,
            "Week starting: " + plan.WeekStartDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            "Diet: " + plan.ProfileDiet,
            "Nutrition total - Calories: " + Number(plan.Nutrition.Calories) + ", Protein: " + Number(plan.Nutrition.ProteinGrams) + " g, Carbs: " + Number(plan.Nutrition.CarbohydrateGrams) + " g, Fat: " + Number(plan.Nutrition.FatGrams) + " g",
            "",
            "Meals"
        };

        foreach (var day in plan.Meals.GroupBy(meal => meal.DayNumber).OrderBy(group => group.Key))
        {
            lines.Add("Day " + day.Key);
            foreach (var meal in day.OrderBy(meal => meal.Slot))
                lines.Add("  " + SlotName(meal.Slot) + ": " + meal.RecipeName + " (" + meal.Servings + " serving(s))");
        }

        lines.Add("");
        lines.Add("Shopping list");
        foreach (var item in plan.ShoppingItems)
        {
            var status = item.IsPurchased ? "purchased" : item.QuantityToBuy == 0 ? "in pantry" : "to buy";
            lines.Add("  " + item.IngredientName + ": " + Number(item.QuantityToBuy) + " " + item.Unit + " (" + status + ")");
        }

        return WritePdf(lines);
    }

    private static string Number(decimal value) => value.ToString("0.###", CultureInfo.InvariantCulture);
    private static string SlotName(MealSlot slot) => slot switch
    {
        MealSlot.Breakfast => "Breakfast",
        MealSlot.Lunch => "Lunch",
        MealSlot.Dinner => "Dinner",
        _ => slot.ToString()
    };

    private static byte[] WritePdf(IReadOnlyList<string> lines)
    {
        const int linesPerPage = 44;
        var pages = lines.Chunk(linesPerPage).ToArray();
        if (pages.Length == 0) pages = [[]];

        const int catalogObject = 1;
        const int pagesObject = 2;
        const int fontObject = 3;
        var objects = new SortedDictionary<int, byte[]>();
        var pageReferences = new List<string>();

        for (var index = 0; index < pages.Length; index++)
        {
            var pageObject = 4 + index * 2;
            var contentObject = pageObject + 1;
            pageReferences.Add(pageObject + " 0 R");
            var content = BuildPageContent(pages[index]);
            objects[contentObject] = Encoding.ASCII.GetBytes("<< /Length " + content.Length + " >>\nstream\n" + content + "\nendstream");
            objects[pageObject] = Encoding.ASCII.GetBytes("<< /Type /Page /Parent " + pagesObject + " 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 " + fontObject + " 0 R >> >> /Contents " + contentObject + " 0 R >>");
        }

        objects[catalogObject] = Encoding.ASCII.GetBytes("<< /Type /Catalog /Pages " + pagesObject + " 0 R >>");
        objects[pagesObject] = Encoding.ASCII.GetBytes("<< /Type /Pages /Kids [" + string.Join(" ", pageReferences) + "] /Count " + pages.Length + " >>");
        objects[fontObject] = Encoding.ASCII.GetBytes("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

        using var stream = new MemoryStream();
        Write(stream, "%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n");
        var offsets = new Dictionary<int, long>();
        foreach (var (number, body) in objects)
        {
            offsets[number] = stream.Position;
            Write(stream, number + " 0 obj\n");
            stream.Write(body);
            Write(stream, "\nendobj\n");
        }

        var xref = stream.Position;
        Write(stream, "xref\n0 " + (objects.Count + 1) + "\n0000000000 65535 f \n");
        for (var number = 1; number <= objects.Count; number++)
            Write(stream, offsets[number].ToString("D10", CultureInfo.InvariantCulture) + " 00000 n \n");
        Write(stream, "trailer\n<< /Size " + (objects.Count + 1) + " /Root " + catalogObject + " 0 R >>\nstartxref\n" + xref + "\n%%EOF");
        return stream.ToArray();
    }

    private static string BuildPageContent(IEnumerable<string> lines)
    {
        var output = new StringBuilder("BT\n/F1 10 Tf\n48 800 Td\n");
        var first = true;
        foreach (var line in lines)
        {
            if (!first) output.Append("0 -16 Td\n");
            output.Append('(').Append(PdfText(line)).Append(") Tj\n");
            first = false;
        }
        return output.Append("ET").ToString();
    }

    private static string PdfText(string value)
    {
        var ascii = new string(value.Normalize(NormalizationForm.FormD)
            .Select(character => character is >= ' ' and <= '~' ? character : '?').ToArray());
        return ascii.Replace("\\", "\\\\", StringComparison.Ordinal).Replace("(", "\\(", StringComparison.Ordinal).Replace(")", "\\)", StringComparison.Ordinal);
    }

    private static void Write(Stream stream, string value) =>
        stream.Write(Encoding.ASCII.GetBytes(value));
}
