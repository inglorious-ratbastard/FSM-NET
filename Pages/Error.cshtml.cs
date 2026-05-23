using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

public class ErrorModel : PageModel
{
    [BindProperty(SupportsGet = true)]
    public int? StatusCode { get; set; }

    public void OnGet(int? statusCode)
    {
        StatusCode = statusCode;
    }
}
