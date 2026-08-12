namespace NexoPedidos.Backend.Domain.Authorization;

/// <summary>Máscara binária compacta e expansível, com dois bits por recurso.</summary>
public sealed class PermissionMask : IEquatable<PermissionMask>
{
    private const int BitsPerResource = 2;
    private byte[] _bytes;

    public PermissionMask() : this(Array.Empty<byte>()) { }

    private PermissionMask(byte[] bytes)
    {
        _bytes = bytes;
    }

    public NivelAcesso Get(Recurso recurso)
    {
        var offset = GetOffset(recurso);
        if (offset / 8 >= _bytes.Length)
        {
            return NivelAcesso.Nenhum;
        }

        var value = (_bytes[offset / 8] >> (offset % 8)) & 0b11;
        return Enum.IsDefined((NivelAcesso)value) ? (NivelAcesso)value : NivelAcesso.Nenhum;
    }

    public void Set(Recurso recurso, NivelAcesso nivel)
    {
        if (!Enum.IsDefined(nivel))
        {
            throw new ArgumentOutOfRangeException(nameof(nivel), "Nível de acesso inválido.");
        }

        var offset = GetOffset(recurso);
        var byteIndex = offset / 8;
        EnsureCapacity(byteIndex + 1);
        var shift = offset % 8;
        _bytes[byteIndex] = (byte)(_bytes[byteIndex] & ~(0b11 << shift));
        _bytes[byteIndex] = (byte)(_bytes[byteIndex] | ((byte)nivel << shift));
        TrimTrailingZeros();
    }

    public bool Can(Recurso recurso, NivelAcesso nivelNecessario)
    {
        if (!Enum.IsDefined(nivelNecessario))
        {
            return false;
        }

        return Get(recurso) >= nivelNecessario;
    }

    public byte[] ToByteArray() => (byte[])_bytes.Clone();

    public string ToHexString() => Convert.ToHexString(_bytes);

    public static PermissionMask FromBytes(byte[]? bytes)
    {
        return new PermissionMask(bytes is null ? Array.Empty<byte>() : (byte[])bytes.Clone());
    }

    public static PermissionMask FromHexString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return new PermissionMask();
        }

        var normalized = value.StartsWith("0x", StringComparison.OrdinalIgnoreCase) ? value[2..] : value;
        if (normalized.Length % 2 != 0)
        {
            throw new FormatException("A máscara hexadecimal deve possuir quantidade par de caracteres.");
        }

        try
        {
            return FromBytes(Convert.FromHexString(normalized));
        }
        catch (FormatException exception)
        {
            throw new FormatException("A máscara hexadecimal é inválida.", exception);
        }
    }

    public bool Equals(PermissionMask? other) => other is not null && _bytes.AsSpan().SequenceEqual(other._bytes);
    public override bool Equals(object? obj) => obj is PermissionMask other && Equals(other);
    public override int GetHashCode() => string.GetHashCode(ToHexString(), StringComparison.Ordinal);

    private static int GetOffset(Recurso recurso)
    {
        return checked((int)recurso * BitsPerResource);
    }

    private void EnsureCapacity(int size)
    {
        if (_bytes.Length < size)
        {
            Array.Resize(ref _bytes, size);
        }
    }

    private void TrimTrailingZeros()
    {
        var length = _bytes.Length;
        while (length > 0 && _bytes[length - 1] == 0) length--;
        if (length != _bytes.Length) Array.Resize(ref _bytes, length);
    }
}
