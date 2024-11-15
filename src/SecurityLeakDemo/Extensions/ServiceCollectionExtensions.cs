public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddSecurityServices(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        services.AddScoped<JwtService>();
        services.AddScoped<PasswordHasher>();
        services.AddScoped<TwoFactorAuthService>();
        services.AddScoped<AccountLockoutService>();
        services.AddScoped<UserRepository>();
        services.AddScoped<SecurityAuditService>();

        services.Configure<JwtConfig>(configuration.GetSection("Jwt"));

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configuration["Jwt:Key"]))
                };
            });

        return services;
    }
}