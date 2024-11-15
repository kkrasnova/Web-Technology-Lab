public class SecurityAuditService
{
    private readonly string _connectionString;
    private readonly ILogger<SecurityAuditService> _logger;

    public SecurityAuditService(
        IConfiguration configuration,
        ILogger<SecurityAuditService> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
        _logger = logger;
    }

    public async Task LogSecurityEventAsync(string eventType, string description, string username = null)
    {
        const string sql = @"
            INSERT INTO SecurityAuditLog (EventType, Description, Username, IpAddress, UserAgent, CreatedAt)
            VALUES (@EventType, @Description, @Username, @IpAddress, @UserAgent, @CreatedAt)";

        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync(sql, new
            {
                EventType = eventType,
                Description = description,
                Username = username,
                IpAddress = GetCurrentIpAddress(),
                UserAgent = GetCurrentUserAgent(),
                CreatedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging security event");
        }
    }

    private string GetCurrentIpAddress()
    {
        // Implement getting IP address from current HttpContext
        return "0.0.0.0";
    }

    private string GetCurrentUserAgent()
    {
        // Implement getting User Agent from current HttpContext
        return "Unknown";
    }
}