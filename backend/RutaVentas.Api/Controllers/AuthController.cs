using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RutaVentas.Api.Data;
using RutaVentas.Api.Data.Entities;
using RutaVentas.Api.DTOs;

namespace RutaVentas.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly RutaVentasDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(RutaVentasDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto req)
    {
        if (string.IsNullOrWhiteSpace(req.Usuario) || string.IsNullOrWhiteSpace(req.Password))
        {
            return BadRequest(new { message = "Usuario y contraseña requeridos" });
        }

        var normalizedUser = req.Usuario.Trim().ToLower();
        var user = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.NombreUsuario.ToLower() == normalizedUser && u.Activo);

        if (user == null || user.PasswordHash != req.Password)
        {
            // Registrar intento fallido en bitácora de seguridad
            _db.BitacoraEventos.Add(new BitacoraEvento
            {
                FechaHora = DateTime.Now,
                Tipo = "Seguridad",
                Modulo = "Auth",
                Accion = $"Intento fallido de inicio de sesión para el usuario '{req.Usuario}'",
                UsuarioNombre = req.Usuario,
                Dispositivo = req.DispositivoId ?? "Dispositivo Desconocido",
                Detalle = "Credenciales inválidas",
                Estado = "Advertencia"
            });
            await _db.SaveChangesAsync();

            return Unauthorized(new { message = "Credenciales incorrectas" });
        }

        // Generar JWT firmado criptográficamente
        var jwtKey = _config["Jwt:Key"] ?? "RutaVentas_SuperSecret_Jwt_Key_2026_Miguel_Rutas_Autenticacion!";
        var jwtIssuer = _config["Jwt:Issuer"] ?? "RutaVentasApi";
        var jwtAudience = _config["Jwt:Audience"] ?? "RutaVentasClients";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Nombre),
            new Claim(ClaimTypes.Role, user.Rol),
            new Claim("Usuario", user.NombreUsuario),
            new Claim("RutaId", user.RutaAsignada ?? "Ruta Centro")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7), // Validez extendida para operaciones en ruta
            Issuer = jwtIssuer,
            Audience = jwtAudience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var securityToken = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(securityToken);

        // Registrar inicio de sesión exitoso en bitácora
        _db.BitacoraEventos.Add(new BitacoraEvento
        {
            FechaHora = DateTime.Now,
            Tipo = "Seguridad",
            Modulo = "Auth",
            Accion = $"Inicio de sesión exitoso de {user.Nombre} ({user.Rol})",
            UsuarioNombre = user.Nombre,
            UsuarioId = user.Id,
            Dispositivo = req.DispositivoId ?? "Terminal Móvil",
            Detalle = $"{{\"ruta\":\"{user.RutaAsignada}\", \"rol\":\"{user.Rol}\"}}",
            Estado = "Exitoso"
        });
        await _db.SaveChangesAsync();

        return Ok(new LoginResponseDto
        {
            Token = tokenString,
            RefreshToken = $"rtv_refresh_{Guid.NewGuid():N}",
            Usuario = new EmpleadoDto
            {
                Id = user.Id.ToString(),
                Nombre = user.Nombre,
                Rol = user.Rol,
                RutaId = user.RutaAsignada ?? "Ruta Centro",
                RutaNombre = user.RutaAsignada ?? "Ruta Centro"
            }
        });
    }

    [HttpGet("perfil")]
    public async Task<IActionResult> GetPerfil()
    {
        // Inspeccionar claim si viene Authorization header
        var authHeader = Request.Headers["Authorization"].FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        {
            // Retorna perfil de Miguel por defecto si no hay token explícito
            var defaultUser = await _db.Usuarios.FirstOrDefaultAsync(u => u.Rol == "Administrador")
                              ?? await _db.Usuarios.FirstAsync();
            return Ok(new EmpleadoDto
            {
                Id = defaultUser.Id.ToString(),
                Nombre = defaultUser.Nombre,
                Rol = defaultUser.Rol,
                RutaId = defaultUser.RutaAsignada ?? "Ruta Centro",
                RutaNombre = defaultUser.RutaAsignada ?? "Ruta Centro"
            });
        }

        var token = authHeader.Substring("Bearer ".Length).Trim();
        var handler = new JwtSecurityTokenHandler();
        try
        {
            var jwtToken = handler.ReadJwtToken(token);
            var idClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "nameid")?.Value;
            if (int.TryParse(idClaim, out var userId))
            {
                var user = await _db.Usuarios.FindAsync(userId);
                if (user != null)
                {
                    return Ok(new EmpleadoDto
                    {
                        Id = user.Id.ToString(),
                        Nombre = user.Nombre,
                        Rol = user.Rol,
                        RutaId = user.RutaAsignada ?? "Ruta Centro",
                        RutaNombre = user.RutaAsignada ?? "Ruta Centro"
                    });
                }
            }
        }
        catch
        {
            // Token no parseable
        }

        return Unauthorized(new { message = "Token inválido o expirado" });
    }
}
