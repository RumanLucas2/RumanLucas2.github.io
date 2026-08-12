using NexoPedidos.Backend.Domain.Authorization;

namespace NexoPedidos.Backend.Entities;

public sealed class User
{
    private User() { }

    public User(Guid id, string nome)
    {
        Id = id == Guid.Empty ? throw new ArgumentException("O usuário precisa de um ID.", nameof(id)) : id;
        Nome = string.IsNullOrWhiteSpace(nome) ? throw new ArgumentException("O nome é obrigatório.", nameof(nome)) : nome.Trim();
        Permissoes = new PermissionMask();
    }

    public Guid Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public PermissionMask Permissoes { get; private set; } = new();

    public NivelAcesso ObterNivel(Recurso recurso) => Permissoes.Get(recurso);

    public void DefinirPermissao(Recurso recurso, NivelAcesso nivel)
    {
        Permissoes.Set(recurso, nivel);
    }
}
