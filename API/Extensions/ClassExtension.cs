using API.Entities;

namespace API.Extensions;

public static class ClassExtension
{
    public static IQueryable<Class> SortClasses(this IQueryable<Class> query, string orderBy)
    {
        return orderBy switch
        {
            "classNameAsc" => query.OrderBy(c => c.Name),
            "classNameDesc" => query.OrderByDescending(c => c.Name),
            "classCreatedAtAsc" => query.OrderBy(c => c.CreatedAt),
            "classCreatedAtDesc" => query.OrderByDescending(c => c.CreatedAt),
            "sessionsCountAsc" => query.OrderBy(c => c.Sessions.Count),
            "sessionsCountDesc" => query.OrderByDescending(c => c.Sessions.Count),
            _ => query.OrderByDescending(c => c.CreatedAt)
        };
    }

    public static IQueryable<Class> SearchClasses(this IQueryable<Class> query, string? search) => query.Where(c =>
        string.IsNullOrEmpty(search)
        || c.Name.ToLower().Contains(search.ToLower())
        || (c.Description != null && c.Description.ToLower().Contains(search.ToLower())));
}
