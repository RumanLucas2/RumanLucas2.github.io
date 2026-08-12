# Permissões do backend

As permissões são armazenadas em `PermissionMask`, com dois bits por recurso:

`Nenhum = 00`, `Visualizar = 01`, `Editar = 10`, `Administrar = 11`.

## Regra de compatibilidade

Os valores numéricos de `Recurso` são posições persistidas. Depois que um
recurso for usado, seu número nunca pode ser alterado, reutilizado ou
reorganizado. Para remover um recurso, deixe a posição reservada e atribua um
número novo ao próximo recurso.

## Endpoints e Swagger

Em desenvolvimento, execute:

```powershell
dotnet run --project .\Backend\NexoPedidos.Backend.csproj
```

Abra `/swagger`. O botão `Authorize` aceita um JWT Bearer. O token precisa
conter `sub` ou `NameIdentifier` com o `Guid` do usuário. A máscara não é
colocada no token: a autorização consulta o serviço de permissões no servidor.

O armazenamento atual é em memória porque o banco e o `DbContext` ainda não
foram definidos. A interface `IUserPermissionStore` já isola essa decisão; a
implementação definitiva deve salvar `PermissionMask.ToByteArray()` em uma
coluna binária (`varbinary` ou equivalente).

## Protegendo um endpoint

```csharp
[Recurso(Recurso.Produtos)]
public sealed class ProdutosController : ControllerBase
{
    [Visualizar]
    [HttpGet]
    public IActionResult Listar() => Ok();

    [Editar]
    [HttpPut("{id:guid}")]
    public IActionResult Atualizar(Guid id) => NoContent();
}
```

Também é possível informar o recurso diretamente:

```csharp
[RequerPermissao(Recurso.Produtos, NivelAcesso.Editar)]
```
