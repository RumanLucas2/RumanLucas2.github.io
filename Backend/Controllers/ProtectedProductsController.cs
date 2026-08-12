using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NexoPedidos.Backend.Authorization;
using NexoPedidos.Backend.Domain.Authorization;

namespace NexoPedidos.Backend.Controllers;

[ApiController]
[Route("api/produtos")]
[Recurso(Recurso.Produtos)]
[Authorize]
public sealed class ProtectedProductsController : ControllerBase
{
    [HttpGet]
    [Visualizar]
    public IActionResult Listar() => Ok(new[] { new { Id = Guid.NewGuid(), Nome = "Endpoint protegido de exemplo" } });

    [HttpPut("{id:guid}")]
    [Editar]
    public IActionResult Atualizar(Guid id) => NoContent();

    [HttpDelete("{id:guid}")]
    [Administrar]
    public IActionResult Excluir(Guid id) => NoContent();
}
