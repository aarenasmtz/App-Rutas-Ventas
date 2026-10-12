using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using RutaVentas.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuración de Base de Datos SQL Server
var connectionString = builder.Configuration.GetConnectionString("RutaVentasDb")
    ?? "Server=localhost;Database=RutaVentasDb;Integrated Security=SSPI;TrustServerCertificate=True;";

builder.Services.AddDbContext<RutaVentasDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

// 2. Controladores y Serialización JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// 3. CORS para Expo Web y Dispositivos Móviles
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 4. Seguridad JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "RutaVentas_SuperSecret_Jwt_Key_2026_Miguel_Rutas_Autenticacion!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "RutaVentasApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "RutaVentasClients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 5. OpenAPI / Swagger con soporte para Authorization Bearer
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "RutaVentas API - Sistema de Ventas en Ruta de Miguel",
        Version = "v1",
        Description = "API REST oficial en .NET 9 para la App de Ventas en Ruta con soporte para SQL Server, JWT, bitácora de auditoría y sincronización offline."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Encabezado de autorización JWT utilizando el esquema Bearer. Ejemplo: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Habilitar Swagger siempre en desarrollo y pruebas locales
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "RutaVentas API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint directo
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "Online",
    framework = ".NET 9",
    security = "JWT Bearer",
    timestamp = DateTime.Now,
    service = "RutaVentas.Api"
}));

// Ensure columns exist on Clientes in SQL Server
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<RutaVentasDbContext>();
    db.Database.ExecuteSqlRaw(@"
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Clientes') AND name = 'Latitud')
            ALTER TABLE Clientes ADD Latitud FLOAT NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Clientes') AND name = 'Longitud')
            ALTER TABLE Clientes ADD Longitud FLOAT NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Clientes') AND name = 'Colonia')
            ALTER TABLE Clientes ADD Colonia NVARCHAR(100) NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Clientes') AND name = 'Ciudad')
            ALTER TABLE Clientes ADD Ciudad NVARCHAR(100) NULL;

        UPDATE Clientes SET Latitud = 21.1219, Longitud = -101.6825, Colonia = 'Centro', Ciudad = 'León, Gto' WHERE Codigo = 'c1' AND Latitud IS NULL;
        UPDATE Clientes SET Latitud = 21.1245, Longitud = -101.6850, Colonia = 'Centro', Ciudad = 'León, Gto' WHERE Codigo = 'c2' AND Latitud IS NULL;
        UPDATE Clientes SET Latitud = 21.1350, Longitud = -101.6780, Colonia = 'Obrera', Ciudad = 'León, Gto' WHERE Codigo = 'c3' AND Latitud IS NULL;
        UPDATE Clientes SET Latitud = 21.1190, Longitud = -101.6790, Colonia = 'Centro', Ciudad = 'León, Gto' WHERE Codigo = 'c4' AND Latitud IS NULL;
        UPDATE Clientes SET Latitud = 21.1165, Longitud = -101.6815, Colonia = 'San Juan de Dios', Ciudad = 'León, Gto' WHERE Codigo = 'c5' AND Latitud IS NULL;
        UPDATE Clientes SET Latitud = 21.1685, Longitud = -101.6892, Colonia = 'Echeveste', Ciudad = 'León, Gto' WHERE Codigo = 'c6' AND Latitud IS NULL;
        UPDATE Clientes SET Latitud = 21.1092, Longitud = -101.6695, Colonia = 'León Moderno', Ciudad = 'León, Gto' WHERE Codigo = 'c7' AND Latitud IS NULL;
        UPDATE Clientes SET Latitud = 21.1200 + (Id * 0.003), Longitud = -101.6800 - (Id * 0.0025), Colonia = 'León', Ciudad = 'León, Gto' WHERE Latitud IS NULL;
    ");
}
catch (Exception ex)
{
    Console.WriteLine($"DB Migration check note: {ex.Message}");
}

app.Run();
