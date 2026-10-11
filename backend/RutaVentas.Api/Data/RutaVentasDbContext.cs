using Microsoft.EntityFrameworkCore;
using RutaVentas.Api.Data.Entities;

namespace RutaVentas.Api.Data;

public class RutaVentasDbContext : DbContext
{
    public RutaVentasDbContext(DbContextOptions<RutaVentasDbContext> options) : base(options)
    {
    }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Ruta> Rutas => Set<Ruta>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<PresentacionProducto> PresentacionesProducto => Set<PresentacionProducto>();
    public DbSet<Venta> Ventas => Set<Venta>();
    public DbSet<VentaDetalle> VentaDetalles => Set<VentaDetalle>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<AbonoCobranza> AbonosCobranza => Set<AbonoCobranza>();
    public DbSet<InventarioMovimiento> InventarioMovimientos => Set<InventarioMovimiento>();
    public DbSet<AuditoriaInventario> AuditoriaInventario => Set<AuditoriaInventario>();
    public DbSet<AuditoriaInventarioDetalle> AuditoriaInventarioDetalles => Set<AuditoriaInventarioDetalle>();
    public DbSet<CorteCaja> CortesCaja => Set<CorteCaja>();
    public DbSet<GastoOperativo> GastosOperativos => Set<GastoOperativo>();
    public DbSet<Devolucion> Devoluciones => Set<Devolucion>();
    public DbSet<BitacoraEvento> BitacoraEventos => Set<BitacoraEvento>();
    public DbSet<Categoria> Categorias => Set<Categoria>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<BitacoraEvento>(entity =>
        {
            entity.ToTable("BitacoraEventos");
        });

        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.ToTable("Categorias");
        });

        modelBuilder.Entity<Devolucion>(entity =>
        {
            entity.ToTable("Devoluciones");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("Usuarios");
            entity.Property(e => e.NombreUsuario).HasColumnName("Usuario");
        });

        modelBuilder.Entity<Ruta>(entity =>
        {
            entity.ToTable("Rutas");
        });

        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.ToTable("Clientes");
        });

        modelBuilder.Entity<Producto>(entity =>
        {
            entity.ToTable("Productos");
            entity.HasMany(p => p.Presentaciones)
                  .WithOne(pr => pr.Producto)
                  .HasForeignKey(pr => pr.ProductoId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PresentacionProducto>(entity =>
        {
            entity.ToTable("PresentacionesProducto");
        });

        modelBuilder.Entity<Venta>(entity =>
        {
            entity.ToTable("Ventas");
            entity.HasMany(v => v.Detalles)
                  .WithOne(d => d.Venta)
                  .HasForeignKey(d => d.VentaId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(v => v.Pagos)
                  .WithOne(p => p.Venta)
                  .HasForeignKey(p => p.VentaId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<VentaDetalle>(entity =>
        {
            entity.ToTable("VentaDetalles");
        });

        modelBuilder.Entity<Pago>(entity =>
        {
            entity.ToTable("Pagos");
        });

        modelBuilder.Entity<AbonoCobranza>(entity =>
        {
            entity.ToTable("AbonosCobranza");
        });

        modelBuilder.Entity<InventarioMovimiento>(entity =>
        {
            entity.ToTable("InventarioMovimientos");
        });

        modelBuilder.Entity<AuditoriaInventario>(entity =>
        {
            entity.ToTable("AuditoriaInventario");
            entity.HasMany(a => a.Detalles)
                  .WithOne(d => d.Auditoria)
                  .HasForeignKey(d => d.AuditoriaId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuditoriaInventarioDetalle>(entity =>
        {
            entity.ToTable("AuditoriaInventarioDetalles");
        });

        modelBuilder.Entity<CorteCaja>(entity =>
        {
            entity.ToTable("CortesCaja");
        });

        modelBuilder.Entity<GastoOperativo>(entity =>
        {
            entity.ToTable("GastosOperativos");
        });
    }
}
