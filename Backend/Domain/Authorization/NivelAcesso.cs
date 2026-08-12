namespace NexoPedidos.Backend.Domain.Authorization;

/// <summary>Nível hierárquico de acesso de um recurso.</summary>
public enum NivelAcesso : byte
{
    Nenhum = 0,
    Visualizar = 1,
    Editar = 2,
    Administrar = 3
}
