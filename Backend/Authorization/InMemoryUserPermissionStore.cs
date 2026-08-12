using System.Collections.Concurrent;
using NexoPedidos.Backend.Domain.Authorization;

namespace NexoPedidos.Backend.Authorization;

/// <summary>
/// Implementação provisória. Substitua por um repositório EF Core quando o banco
/// for escolhido, mantendo a interface e persistindo PermissionMask.ToByteArray().
/// </summary>
public sealed class InMemoryUserPermissionStore : IUserPermissionStore
{
    private readonly ConcurrentDictionary<Guid, PermissionMask> _masks = new();

    public Task<PermissionMask?> GetMaskAsync(Guid usuarioId, CancellationToken cancellationToken)
    {
        _masks.TryGetValue(usuarioId, out var mask);
        return Task.FromResult(mask is null ? null : PermissionMask.FromBytes(mask.ToByteArray()));
    }

    public Task<bool> ReplaceMaskAsync(Guid usuarioId, PermissionMask mask, CancellationToken cancellationToken)
    {
        if (usuarioId == Guid.Empty) return Task.FromResult(false);
        _masks[usuarioId] = PermissionMask.FromBytes(mask.ToByteArray());
        return Task.FromResult(true);
    }
}
