namespace NexoPedidos.Backend.Domain.Authorization;

/// <summary>
/// Posição permanente de cada recurso dentro da máscara de permissões.
///
/// ATENÇÃO: estes valores fazem parte do formato persistido. Nunca altere o
/// valor de um recurso existente, reutilize a posição de um recurso removido
/// ou reorganize os itens. Novos recursos devem receber novas posições.
/// </summary>
public enum Recurso : ushort
{
    Usuarios = 0,
    Produtos = 1,
    Fornecedores = 2,
    Equipe = 3,
    Financeiro = 4,
    Estoque = 5
}
