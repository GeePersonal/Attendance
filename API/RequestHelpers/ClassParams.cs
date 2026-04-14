namespace API.RequestHelpers;

public class ClassParams : PaginationParams
{
    public string? SearchTerm { get; set; }
    public string? OrderBy { get; set; }
}
