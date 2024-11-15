public class UserRepository
{
    private readonly string _connectionString;
    private readonly PasswordHasher _passwordHasher;
    private readonly ILogger<UserRepository> _logger;

    public UserRepository(
        IConfiguration configuration,
        PasswordHasher passwordHasher,
        ILogger<UserRepository> logger)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection");
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<User> GetUserByCredentialsAsync(string username, string password)
    {
        const string sql = @"
            SELECT * FROM Users 
            WHERE Username = @Username";

        try
        {
            using var connection = new SqlConnection(_connectionString);
            var user = await connection.QueryFirstOrDefaultAsync<User>(sql, new { Username = username });

            if (user != null && _passwordHasher.VerifyPassword(password, user.Password))
            {
                return user;
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by credentials");
            throw;
        }
    }

    public async Task<bool> CreateUserAsync(User user, string password)
    {
        const string sql = @"
            INSERT INTO Users (Username, Password, Email)
            VALUES (@Username, @Password, @Email)";

        try
        {
            using var connection = new SqlConnection(_connectionString);
            user.Password = _passwordHasher.HashPassword(password);
            
            var result = await connection.ExecuteAsync(sql, user);
            return result > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            throw;
        }
    }

    public async Task<bool> UsernameExistsAsync(string username)
    {
        const string sql = "SELECT COUNT(1) FROM Users WHERE Username = @Username";
        
        try
        {
            using var connection = new SqlConnection(_connectionString);
            var count = await connection.ExecuteScalarAsync<int>(sql, new { Username = username });
            return count > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking username existence");
            throw;
        }
    }

    public async Task<bool> EmailExistsAsync(string email)
    {
        const string sql = "SELECT COUNT(1) FROM Users WHERE Email = @Email";
        
        try
        {
            using var connection = new SqlConnection(_connectionString);
            var count = await connection.ExecuteScalarAsync<int>(sql, new { Email = email });
            return count > 0;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking email existence");
            throw;
        }
    }

    public async Task<User> GetUserByIdAsync(int id)
    {
        const string sql = "SELECT * FROM Users WHERE Id = @Id";
        
        try
        {
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryFirstOrDefaultAsync<User>(sql, new { Id = id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user by ID");
            throw;
        }
    }

    public async Task IncrementFailedLoginAttempts(string username)
    {
        const string sql = @"
            UPDATE Users 
            SET FailedLoginAttempts = FailedLoginAttempts + 1,
                LastLoginAttempt = @LastLoginAttempt
            WHERE Username = @Username";

        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync(sql, new 
            { 
                Username = username,
                LastLoginAttempt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error incrementing failed login attempts");
            throw;
        }
    }

    public async Task ResetFailedLoginAttempts(string username)
    {
        const string sql = @"
            UPDATE Users 
            SET FailedLoginAttempts = 0,
                IsLocked = 0,
                LockoutEnd = NULL
            WHERE Username = @Username";

        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync(sql, new { Username = username });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting failed login attempts");
            throw;
        }
    }

    public async Task SetTwoFactorSecretAsync(int userId, string secret)
    {
        const string sql = @"
            UPDATE Users 
            SET TwoFactorSecret = @Secret
            WHERE Id = @UserId";

        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync(sql, new { UserId = userId, Secret = secret });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting 2FA secret");
            throw;
        }
    }

    public async Task EnableTwoFactorAsync(int userId)
    {
        const string sql = @"
            UPDATE Users 
            SET TwoFactorEnabled = 1
            WHERE Id = @UserId";

        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync(sql, new { UserId = userId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enabling 2FA");
            throw;
        }
    }
}