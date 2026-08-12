using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Filters;
using NexoPedidos.Backend.Domain.Authorization;

namespace NexoPedidos.Backend.Authorization;

public static class PermissionPolicy
{
    public const string Name = "NexoPedidos.Permission";
}

public sealed class RecursoAttribute(Recurso recurso) : Attribute
{
    public Recurso Recurso { get; } = recurso;
}

[AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = true)]
public class RequerPermissaoAttribute : Attribute, IAuthorizeData
{
    public RequerPermissaoAttribute(NivelAcesso nivel) => Nivel = nivel;
    public RequerPermissaoAttribute(Recurso recurso, NivelAcesso nivel) { Recurso = recurso; Nivel = nivel; }

    public Recurso? Recurso { get; }
    public NivelAcesso Nivel { get; }
    public string? Policy { get; set; } = PermissionPolicy.Name;
    public string? Roles { get; set; }
    public string? AuthenticationSchemes { get; set; }
}

public sealed class VisualizarAttribute() : RequerPermissaoAttribute(NivelAcesso.Visualizar);
public sealed class EditarAttribute() : RequerPermissaoAttribute(NivelAcesso.Editar);
public sealed class AdministrarAttribute() : RequerPermissaoAttribute(NivelAcesso.Administrar);

public sealed class PermissionRequirement : IAuthorizationRequirement;

public interface IPermissionService
{
    Task<bool> CanAsync(Guid usuarioId, Recurso recurso, NivelAcesso nivelNecessario, CancellationToken cancellationToken = default);
    Task<PermissionMask?> GetMaskAsync(Guid usuarioId, CancellationToken cancellationToken = default);
    Task<bool> ReplaceMaskAsync(Guid usuarioId, PermissionMask mask, CancellationToken cancellationToken = default);
}

public interface IUserPermissionStore
{
    Task<PermissionMask?> GetMaskAsync(Guid usuarioId, CancellationToken cancellationToken);
    Task<bool> ReplaceMaskAsync(Guid usuarioId, PermissionMask mask, CancellationToken cancellationToken);
}

public sealed class PermissionService(IUserPermissionStore store) : IPermissionService
{
    public async Task<bool> CanAsync(Guid usuarioId, Recurso recurso, NivelAcesso nivelNecessario, CancellationToken cancellationToken = default)
    {
        if (usuarioId == Guid.Empty || !Enum.IsDefined(nivelNecessario)) return false;
        var mask = await store.GetMaskAsync(usuarioId, cancellationToken);
        return mask?.Can(recurso, nivelNecessario) == true;
    }

    public Task<PermissionMask?> GetMaskAsync(Guid usuarioId, CancellationToken cancellationToken = default) => store.GetMaskAsync(usuarioId, cancellationToken);
    public Task<bool> ReplaceMaskAsync(Guid usuarioId, PermissionMask mask, CancellationToken cancellationToken = default) => store.ReplaceMaskAsync(usuarioId, mask, cancellationToken);
}

public sealed class PermissionAuthorizationHandler(IPermissionService permissions) : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User.Identity?.IsAuthenticated != true) return;
        if (!Guid.TryParse(context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? context.User.FindFirstValue("sub"), out var userId)) return;

        var metadata = context.Resource switch
        {
            HttpContext httpContext => httpContext.GetEndpoint()?.Metadata,
            AuthorizationFilterContext filterContext => filterContext.HttpContext.GetEndpoint()?.Metadata,
            _ => null
        };

        var resourceAttribute = metadata?.GetMetadata<RecursoAttribute>();
        var permissionAttribute = metadata?.GetMetadata<RequerPermissaoAttribute>();
        var recurso = permissionAttribute?.Recurso ?? resourceAttribute?.Recurso;
        if (recurso is null || permissionAttribute is null) return;

        if (await permissions.CanAsync(userId, recurso.Value, permissionAttribute.Nivel, context.Resource is HttpContext http ? http.RequestAborted : default))
        {
            context.Succeed(requirement);
        }
    }
}
