public class SecurityMonitoringMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SecurityMonitoringMiddleware> _logger;
    private readonly Dictionary<string, List<DateTime>> _requests;

    public SecurityMonitoringMiddleware(
        RequestDelegate next,
        ILogger<SecurityMonitoringMiddleware> logger)
    {
        _next = next;
        _logger = logger;
        _requests = new Dictionary<string, List<DateTime>>();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ipAddress = context.Connection.RemoteIpAddress?.ToString();
        
        if (!string.IsNullOrEmpty(ipAddress))
        {
            MonitorRequest(ipAddress);
            
            if (IsSuspiciousActivity(ipAddress))
            {
                _logger.LogWarning($"Suspicious activity detected from IP: {ipAddress}");
                context.Response.StatusCode = 429;
                await context.Response.WriteAsJsonAsync(
                    new { message = "Too many requests" });
                return;
            }
        }

        await _next(context);
    }

    private void MonitorRequest(string ipAddress)
    {
        lock (_requests)
        {
            if (!_requests.ContainsKey(ipAddress))
            {
                _requests[ipAddress] = new List<DateTime>();
            }

            _requests[ipAddress].Add(DateTime.UtcNow);
            _requests[ipAddress] = _requests[ipAddress]
                .Where(x => x > DateTime.UtcNow.AddMinutes(-1))
                .ToList();
        }
    }

    private bool IsSuspiciousActivity(string ipAddress)
    {
        lock (_requests)
        {
            return _requests.ContainsKey(ipAddress) && 
                   _requests[ipAddress].Count > 100;
        }
    }
}