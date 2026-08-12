namespace NexoPedidos.Backend.Contracts;

public sealed record ReplacePermissionMaskRequest(byte[] Permissions);

public sealed record PermissionMaskResponse(Guid UserId, string Hex, byte[] Bytes);
