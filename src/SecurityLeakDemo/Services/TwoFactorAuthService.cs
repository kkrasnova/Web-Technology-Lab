using OtpNet;
using QRCoder;

namespace SecurityLeakDemo.Services;

public class TwoFactorAuthService
{
    private const string IssuerName = "SecurityDemo";
    
    public (string SecretKey, string QrCodeUrl) GenerateSetupInfo(string userEmail)
    {
        var secretKey = KeyGeneration.GenerateRandomKey(20);
        var base32Secret = Base32Encoding.ToString(secretKey);
        
        var qrCodeUrl = $"otpauth://totp/{IssuerName}:{userEmail}?secret={base32Secret}&issuer={IssuerName}";
        
        return (base32Secret, qrCodeUrl);
    }

    public bool ValidateCode(string secretKey, string code)
    {
        try
        {
            var secretBytes = Base32Encoding.ToBytes(secretKey);
            var totp = new Totp(secretBytes);
            return totp.VerifyTotp(code, out _);
        }
        catch
        {
            return false;
        }
    }

    public byte[] GenerateQrCodeImage(string qrCodeUrl)
    {
        using var qrGenerator = new QRCodeGenerator();
        using var qrCodeData = qrGenerator.CreateQrCode(qrCodeUrl, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        return qrCode.GetGraphic(20);
    }
}