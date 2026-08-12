using Xunit;
using NexoPedidos.Backend.Domain.Authorization;

namespace NexoPedidos.Backend.Tests;

public sealed class PermissionMaskTests
{
    [Theory]
    [InlineData(NivelAcesso.Nenhum, NivelAcesso.Visualizar, false)]
    [InlineData(NivelAcesso.Nenhum, NivelAcesso.Editar, false)]
    [InlineData(NivelAcesso.Visualizar, NivelAcesso.Visualizar, true)]
    [InlineData(NivelAcesso.Visualizar, NivelAcesso.Editar, false)]
    [InlineData(NivelAcesso.Editar, NivelAcesso.Visualizar, true)]
    [InlineData(NivelAcesso.Editar, NivelAcesso.Editar, true)]
    [InlineData(NivelAcesso.Editar, NivelAcesso.Administrar, false)]
    [InlineData(NivelAcesso.Administrar, NivelAcesso.Visualizar, true)]
    [InlineData(NivelAcesso.Administrar, NivelAcesso.Editar, true)]
    [InlineData(NivelAcesso.Administrar, NivelAcesso.Administrar, true)]
    public void Can_respeita_a_hierarquia(NivelAcesso atual, NivelAcesso necessario, bool esperado)
    {
        var mask = new PermissionMask();
        mask.Set(Recurso.Produtos, atual);

        Assert.Equal(esperado, mask.Can(Recurso.Produtos, necessario));
    }

    [Fact]
    public void Expande_para_recursos_altos_sem_corromper_os_anteriores()
    {
        var mask = new PermissionMask();
        mask.Set(Recurso.Produtos, NivelAcesso.Editar);
        mask.Set((Recurso)100, NivelAcesso.Administrar);

        Assert.Equal(NivelAcesso.Editar, mask.Get(Recurso.Produtos));
        Assert.Equal(NivelAcesso.Administrar, mask.Get((Recurso)100));
        Assert.True(mask.ToByteArray().Length >= 26);
    }

    [Fact]
    public void Serializa_e_desserializa_em_bytes_sem_compartilhar_array()
    {
        var original = new PermissionMask();
        original.Set(Recurso.Estoque, NivelAcesso.Administrar);
        var bytes = original.ToByteArray();
        var restored = PermissionMask.FromBytes(bytes);
        bytes[0] = 0;

        Assert.Equal(original.ToHexString(), restored.ToHexString());
        Assert.Equal(NivelAcesso.Administrar, restored.Get(Recurso.Estoque));
    }

    [Fact]
    public void Hex_com_prefixo_e_sem_prefixo_sao_aceitos()
    {
        var mask = PermissionMask.FromHexString("0x000C");

        Assert.Equal(NivelAcesso.Administrar, mask.Get(Recurso.Estoque));
        Assert.Equal("000C", mask.ToHexString());
    }

    [Fact]
    public void Remover_permissao_nao_deixa_bytes_desnecessarios()
    {
        var mask = new PermissionMask();
        mask.Set(Recurso.Produtos, NivelAcesso.Editar);
        mask.Set(Recurso.Produtos, NivelAcesso.Nenhum);

        Assert.Empty(mask.ToByteArray());
    }
}
