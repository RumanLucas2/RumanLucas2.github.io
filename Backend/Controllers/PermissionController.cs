using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexoPedidos.Backend.Authorization;
using NexoPedidos.Backend.Contracts;
using NexoPedidos.Backend.Domain.Authorization;

namespace NexoPedidos.Backend.Controllers;

[ApiController]
[Route("api/permissions")]
[Recurso(Recurso.Usuarios)]
[Authorize]
public sealed class PermissionController(IPermissionService permissions) : ControllerBase
{
    [HttpGet("{userId:guid}")]
    [Administrar]
    public async Task<ActionResult<PermissionMaskResponse>> Get(Guid userId, CancellationToken cancellationToken)
    {
        var mask = await permissions.GetMaskAsync(userId, cancellationToken);
        return mask is null ? NotFound() : Ok(new PermissionMaskResponse(userId, mask.ToHexString(), mask.ToByteArray()));
    }

    [HttpPut("{userId:guid}")]
    [Administrar]
    public async Task<IActionResult> Replace(Guid userId, ReplacePermissionMaskRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (!Guid.TryParse(currentUserId, out var authenticatedUserId)) return Unauthorized();
        if (authenticatedUserId == userId) return BadRequest("Um usuário não pode alterar a própria máscara de permissões.");
        if (request.Permissions is null) return BadRequest("A máscara binária é obrigatória.");

        var mask = PermissionMask.FromBytes(request.Permissions);
        var updated = await permissions.ReplaceMaskAsync(userId, mask, cancellationToken);
        return updated ? NoContent() : NotFound();
    }
}
