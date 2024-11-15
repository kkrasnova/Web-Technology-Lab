public class User
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Password { get; set; }
    public string Email { get; set; }
    public string TwoFactorSecret { get; set; }
    public bool TwoFactorEnabled { get; set; }
    public DateTime? LastLoginAttempt { get; set; }
    public int FailedLoginAttempts { get; set; }
    public bool IsLocked { get; set; }
    public DateTime? LockoutEnd { get; set; }
}