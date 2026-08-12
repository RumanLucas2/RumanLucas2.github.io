namespace NexoPedidos.Backend.Entities
{
    public abstract class Entity
    {
        public string Nome { get; private set; }

        public Guid Id { get; private set; }

        private Entity(string nome, Guid id)
        {
            Nome = nome;
            Id = id;
        }

        public Entity(string nome) : this(nome, Guid.NewGuid())
        {
        }
    }
}

