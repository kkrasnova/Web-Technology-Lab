using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Mvc;

public class RateLimitAttribute : ActionFilterAttribute
{
    public int MaxRequests { get; set; }
    public int TimeWindowMinutes { get; set; }

    private static readonly Dictionary<string, (int Count, DateTime FirstRequest)> 
        _requestCounts = new Dictionary<string, (int Count, DateTime FirstRequest)>();

    public override void OnActionExecuting(ActionExecutingContext context)
    {
        var ipAddress = context.HttpContext.Connection.RemoteIpAddress?.ToString();
        if (string.IsNullOrEmpty(ipAddress))
        {
            context.Result = new StatusCodeResult(400);
            return;
        }

        lock (_requestCounts)
        {
            if (_requestCounts.TryGetValue(ipAddress, out var requestInfo))
            {
                if (DateTime.Now.Subtract(requestInfo.FirstRequest).TotalMinutes < TimeWindowMinutes)
                {
                    if (requestInfo.Count >= MaxRequests)
                    {
                        context.Result = new StatusCodeResult(429);
                        return;
                    }
                    _requestCounts[ipAddress] = (requestInfo.Count + 1, requestInfo.FirstRequest);
                }
                else
                {
                    _requestCounts[ipAddress] = (1, DateTime.Now);
                }
            }
            else
            {
                _requestCounts.Add(ipAddress, (1, DateTime.Now));
            }
        }

        base.OnActionExecuting(context);
    }
}