using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using SecurityLeakDemo.Models;
using SecurityLeakDemo.Services;
using SecurityLeakDemo.Attributes;

[ApiController]
[Route("api/[controller]")]
public class SafeUserController : ControllerBase
{
    private readonly UserRepository _userRepository;
    private readonly JwtService _jwtService;
    private readonly TwoFactorAuthService _tfaService;
    private readonly AccountLockoutService _lockoutService;
    private readonly ILogger<SafeUserController> _logger;

    public SafeUserController(
        UserRepository userRepository,
        JwtService jwtService,
        TwoFactorAuthService tfaService,
        AccountLockoutService lockoutService,
        ILogger<SafeUserController> logger)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
        _tfaService = tfaService;
        _lockoutService = lockoutService;
        _logger = logger;
    }

    [HttpPost("login")]
    [RateLimit(MaxRequests = 5, TimeWindowMinutes = 5)]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        try
        {
            var user = await _userRepository.GetUserByCredentialsAsync(request.Username, request.Password);
            
            if (user == null)
            {
                await _userRepository.IncrementFailedLoginAttempts(request.Username);
                _logger.LogWarning($"Failed login attempt for username: {request.Username}");
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var (isLocked, lockoutEnd) = await _lockoutService.CheckLockoutStatusAsync(user);
            if (isLocked)
            {
                return StatusCode(423, new { message = $"Account is locked until {lockoutEnd}" });
            }

            if (user.TwoFactorEnabled)
            {
                if (string.IsNullOrEmpty(request.TwoFactorCode))
                {
                    return StatusCode(428, new { message = "2FA code required" });
                }

                if (!_tfaService.ValidateCode(user.TwoFactorSecret, request.TwoFactorCode))
                {
                    await _userRepository.IncrementFailedLoginAttempts(user.Username);
                    return Unauthorized(new { message = "Invalid 2FA code" });
                }
            }

            await _userRepository.ResetFailedLoginAttempts(user.Username);
            var token = _jwtService.GenerateToken(user);

            Response.Cookies.Append("auth_token", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.Now.AddHours(3)
            });

            return Ok(new { token });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    [HttpPost("register")]
    [ValidateModel]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        try
        {
            if (await _userRepository.UsernameExistsAsync(request.Username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            if (await _userRepository.EmailExistsAsync(request.Email))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            var user = new User
            {
                Username = request.Username,
                Email = request.Email
            };

            var result = await _userRepository.CreateUserAsync(user, request.Password);
            if (result)
            {
                _logger.LogInformation($"User registered successfully: {request.Username}");
                return Ok(new { message = "Registration successful" });
            }

            return BadRequest(new { message = "Registration failed" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, new { message = "An error occurred during registration" });
        }
    }

    [HttpPost("enable-2fa")]
    [Authorize]
    public async Task<IActionResult> Enable2FA()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userRepository.GetUserByIdAsync(int.Parse(userId));

            if (user.TwoFactorEnabled)
            {
                return BadRequest(new { message = "2FA is already enabled" });
            }

            var (secretKey, qrCodeUrl) = _tfaService.GenerateSetupInfo(user.Email);
            var qrCodeImage = _tfaService.GenerateQrCodeImage(qrCodeUrl);

            await _userRepository.SetTwoFactorSecretAsync(user.Id, secretKey);

            return Ok(new
            {
                secretKey,
                qrCodeImage = Convert.ToBase64String(qrCodeImage)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enabling 2FA");
            return StatusCode(500, new { message = "An error occurred while enabling 2FA" });
        }
    }

    [HttpPost("verify-2fa")]
    [Authorize]
    public async Task<IActionResult> Verify2FA([FromBody] string code)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userRepository.GetUserByIdAsync(int.Parse(userId));

            if (_tfaService.ValidateCode(user.TwoFactorSecret, code))
            {
                await _userRepository.EnableTwoFactorAsync(user.Id);
                return Ok(new { message = "2FA enabled successfully" });
            }

            return BadRequest(new { message = "Invalid verification code" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying 2FA code");
            return StatusCode(500, new { message = "An error occurred while verifying 2FA code" });
        }
    }
}