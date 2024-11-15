using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;

[ApiController]
[Route("api/[controller]")]
public class UnsafeUserController : ControllerBase
{
    private readonly string _connectionString = "Server=localhost;Database=SecurityDemo;Trusted_Connection=True;";

    [HttpPost("login")]
    public IActionResult Login(string username, string password)
    {
        // НЕБЕЗПЕЧНИЙ КОД: Пряма конкатенація в SQL-запиті
        string query = $"SELECT * FROM Users WHERE Username = '{username}' AND Password = '{password}'";
        
        using (var connection = new SqlConnection(_connectionString))
        {
            connection.Open();
            using (var command = new SqlCommand(query, connection))
            {
                var reader = command.ExecuteReader();
                if (reader.HasRows)
                {
                    return Ok("Login successful");
                }
            }
        }
        
        return Unauthorized();
    }

    [HttpPost("register")]
    public IActionResult Register(string username, string password, string email)
    {
        // НЕБЕЗПЕЧНИЙ КОД: Пароль зберігається у відкритому вигляді
        string query = $"INSERT INTO Users (Username, Password, Email) VALUES ('{username}', '{password}', '{email}')";
        
        using (var connection = new SqlConnection(_connectionString))
        {
            connection.Open();
            using (var command = new SqlCommand(query, connection))
            {
                try
                {
                    command.ExecuteNonQuery();
                    return Ok("Registration successful");
                }
                catch
                {
                    return BadRequest("Registration failed");
                }
            }
        }
    }
}