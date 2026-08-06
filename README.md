# NexoPedidos

SaaS B2B de gestão comercial para pequenas e médias empresas, cobrindo o ciclo completo da venda: **orçamento, aprovação, pedido, faturamento, separação e envio**. O sistema também centralizará produtos, estoque, compradores, fornecedores, equipe, formas de pagamento, alertas e indicadores comerciais.

> Status atual: fase de concepção. O diretório [`docs`](./docs) contém um protótipo visual navegável com dados demonstrativos; ele não representa a aplicação final nem possui backend persistente.

## Visão do produto

O NexoPedidos deve substituir controles comerciais dispersos em planilhas, mensagens e sistemas desconectados por uma aplicação web simples, responsiva, segura e auditável.

### Objetivos

- Oferecer uma visão única de todo o fluxo comercial.
- Reduzir erros na conversão de orçamentos em pedidos.
- Controlar estoque e alertar sobre indisponibilidade ou saldo inconsistente.
- Facilitar o acompanhamento de clientes, fornecedores e cobranças.
- Permitir que equipes trabalhem com permissões e responsabilidades bem definidas.
- Entregar indicadores confiáveis para decisões comerciais.
- Suportar múltiplas empresas em uma única plataforma SaaS, com isolamento rigoroso dos dados.

## Escopo funcional

### Autenticação e empresas

- Cadastro, login, logout e recuperação de senha.
- Confirmação de e-mail e proteção contra tentativas abusivas de acesso.
- Múltiplas empresas por usuário, com seletor de empresa ativa.
- Convite de colaboradores por e-mail.
- Perfis iniciais: `Administrador`, `Gestor`, `Vendedor`, `Operador` e `Financeiro`.
- Autorização por política e por recurso, nunca apenas pela interface.
- Configurações, dados e numerações independentes por empresa.
- Trilhas de auditoria para operações sensíveis.

### Dashboard

- Orçamentos em aberto e valor total das propostas ativas.
- Pedidos por etapa e valores por etapa.
- Total faturado e quantidade de pedidos aguardando envio.
- Ticket médio e atividades recentes.
- Filtros por período, responsável e situação.
- Indicadores calculados exclusivamente com dados da empresa ativa.

### Fluxo comercial

- Visão em etapas: `Orçamentos`, `Pedidos`, `Faturados` e `Enviados`.
- Busca por comprador e filtros por período, responsável e status.
- Movimentação controlada entre etapas, com validação das transições permitidas.
- Histórico de alterações, responsável e data de cada transição.
- Conversão de orçamento aceito em pedido sem redigitação.
- Cancelamento com motivo obrigatório e preservação do histórico.

### Orçamentos

- Criação, edição, duplicação, envio e cancelamento.
- Numeração sequencial por empresa.
- Comprador, itens, quantidades, preços, descontos, frete, observações, validade e forma de pagamento.
- Estados iniciais: `Rascunho`, `Enviado`, `Em análise`, `Aceito`, `Recusado`, `Expirado` e `Cancelado`.
- Cálculo consistente de subtotal, descontos, acréscimos e total.
- Geração de documento para impressão/PDF.
- Registro da data da última interação para alertas de falta de retorno.
- Conversão idempotente em pedido: um orçamento não pode gerar pedidos duplicados por repetição da requisição.

### Pedidos

- Criação manual ou a partir de um orçamento aceito.
- Itens e condições comerciais registrados como fotografia do momento da venda.
- Estados iniciais: `A faturar`, `Em separação`, `Faturado`, `Enviado`, `Entregue` e `Cancelado`.
- Responsável, datas relevantes e histórico completo das transições.
- Reserva e baixa de estoque conforme regra de negócio definida.
- Impedimento de transições inválidas e de venda sem estoque quando a empresa bloquear essa operação.
- Impressão e exportação dos dados do pedido.

### Produtos e estoque

- Cadastro de produto com nome, SKU, categoria, descrição, unidade, custo, preço de venda, status e estoque mínimo.
- SKU único dentro da empresa.
- Margem bruta calculada a partir de custo e preço de venda.
- Movimentações de entrada, saída, reserva, estorno e ajuste, sempre com origem e responsável.
- Saldo derivado de movimentações ou atualizado de forma transacional, sem alterações silenciosas.
- Alertas de estoque baixo, zerado e inconsistente.
- Histórico de custos e preços quando necessário para preservar relatórios passados.

### Compradores

- Pessoa física ou jurídica, CPF/CNPJ, nome, razão social, contatos e endereços.
- Canal preferencial de comunicação: WhatsApp ou e-mail.
- Situação ativa/inativa e histórico de compras.
- Busca e prevenção de duplicidade por documento dentro da empresa.
- Atalho de contato com mensagem sugerida, sempre iniciado pelo usuário.
- Alerta configurável para compradores sem compra recente.

### Fornecedores e contas a pagar

- Cadastro, contatos, documento, categorias fornecidas e situação.
- Faturas com descrição, competência, valor, vencimento, pagamento e comprovante futuro.
- Alertas de vencimento próximo e fatura vencida.
- Baixa de pagamento com data, responsável e auditoria.

### Equipe e permissões

- Convite, ativação, inativação e troca de função.
- Permissões mínimas por módulo e ação: visualizar, criar, editar, excluir/cancelar, aprovar e exportar.
- Revogação imediata de acesso ao remover um colaborador da empresa.
- Visualização de auditoria restrita aos perfis autorizados.

### Formas de pagamento

- Nome, prazo, número de parcelas, taxa e situação.
- Formas ativas disponíveis em orçamentos e pedidos.
- Alterações futuras não devem modificar documentos comerciais já emitidos.

### Notificações

- Central de alertas com estado lido/não lido por usuário.
- Estoque baixo, zerado ou inconsistente.
- Orçamento sem retorno e próximo do vencimento.
- Cliente sem compra há um período configurável.
- Fatura próxima do vencimento ou vencida.
- Edição relevante feita por outro colaborador.
- Preferências configuráveis por empresa e, quando aplicável, por usuário.

### Configurações

- Dados e identidade visual da empresa.
- Numeração e validade padrão de orçamentos.
- Regras de estoque e transições do fluxo.
- Prazos que disparam alertas.
- Usuários, funções e permissões.
- Fuso horário, moeda e formatação no padrão brasileiro inicialmente.

## Requisitos não funcionais

- Interface responsiva, acessível por teclado e compatível com leitores de tela, tendo WCAG 2.2 nível AA como referência.
- Idioma inicial `pt-BR`, moeda `BRL` e datas exibidas no fuso da empresa.
- Valores monetários representados com `decimal` no C# e tipo decimal apropriado no banco; nunca `float` ou `double`.
- Datas armazenadas em UTC quando representam instante; datas civis, como vencimento, armazenadas sem conversão indevida de fuso.
- Paginação, ordenação e filtros executados no servidor para listagens potencialmente grandes.
- Operações críticas transacionais, concorrência otimista e endpoints idempotentes quando houver risco de repetição.
- Logs estruturados com correlação de requisições, métricas e rastreamento de erros, sem dados sensíveis.
- Backup, restauração testada e política de retenção antes da entrada em produção.
- Compatibilidade com as versões estáveis e suportadas do .NET e dos navegadores modernos no início da implementação.

## Stack tecnológica

### Backend

- **C# e ASP.NET Core**.
- ASP.NET Core MVC para páginas renderizadas no servidor.
- Controllers finos: recebem a requisição, validam o contrato, executam um caso de uso e retornam a resposta.
- Casos de uso e regras de negócio independentes do framework de apresentação.
- Entity Framework Core como opção preferencial de persistência, confirmada após a decisão do banco.
- Validação no servidor obrigatória; validação no navegador serve apenas como melhoria de experiência.

### Frontend

- **Razor Views/MVC**, HTML semântico e CSS próprio.
- JavaScript ou TypeScript somente onde interação no cliente trouxer benefício real.
- Prioridade para renderização no servidor, progressive enhancement e baixo volume de JavaScript.
- Componentes reutilizáveis por partial views, view components e módulos pequenos.
- Bundling/minificação no processo de build; nenhuma regra de negócio crítica exclusiva no cliente.
- O protótipo atual serve como referência visual, não como base arquitetural obrigatória.

### Banco de dados

O banco está **a decidir**. A decisão deve ser registrada em um ADR antes da implementação da camada de infraestrutura. Critérios obrigatórios:

- Transações ACID e suporte adequado à concorrência.
- Índices, constraints, migrations e backup confiável.
- Custo total, operação, observabilidade e disponibilidade no provedor escolhido.
- Suporte maduro pelo Entity Framework Core.
- Estratégia segura de isolamento multi-tenant.

Para este domínio relacional, **PostgreSQL é a recomendação inicial**, sujeito à validação de hospedagem e operação. SQL Server também é compatível com a stack e deve ser escolhido se houver vantagem operacional concreta no ambiente final. O domínio não deve depender de recursos exclusivos de um fornecedor sem justificativa registrada.

## Arquitetura

O projeto seguirá **Clean Architecture**, com dependências sempre apontando para o núcleo da aplicação.

```text
Presentation (ASP.NET Core MVC)
        │
        ▼
Application (casos de uso e contratos)
        │
        ▼
Domain (entidades, value objects e regras)
        ▲
        │
Infrastructure (banco, e-mail, arquivos e integrações)
```

### Responsabilidade das camadas

- **Domain**: entidades, value objects, invariantes, eventos de domínio e regras puras. Não referencia ASP.NET Core, EF Core ou serviços externos.
- **Application**: casos de uso, DTOs, interfaces de persistência/serviços, autorização de negócio e orquestração de transações.
- **Infrastructure**: EF Core, banco, migrations, repositórios, identidade, e-mail, armazenamento e integrações externas.
- **Web**: controllers, Razor Views, view models, assets, autenticação HTTP, tratamento de erros e composição da aplicação.

Clean Architecture não significa criar abstrações sem uso. Repositórios genéricos, mediadores, CQRS ou event bus somente devem ser adotados quando resolverem uma necessidade real do projeto.

### Estrutura prevista da solução

```text
NexoPedidos.sln
src/
  NexoPedidos.Domain/
  NexoPedidos.Application/
  NexoPedidos.Infrastructure/
  NexoPedidos.Web/
tests/
  NexoPedidos.Domain.Tests/
  NexoPedidos.Application.Tests/
  NexoPedidos.IntegrationTests/
  NexoPedidos.Web.Tests/
docs/
  adr/
```

### Modelo de domínio inicial

- `Tenant/Empresa`, `Usuário`, `MembroDaEmpresa`, `Função` e `Permissão`.
- `Produto`, `CategoriaDeProduto` e `MovimentaçãoDeEstoque`.
- `Comprador`, `Endereço` e `Contato`.
- `Fornecedor` e `FaturaDeFornecedor`.
- `Orçamento` e `ItemDeOrçamento`.
- `Pedido`, `ItemDePedido` e `HistóricoDoPedido`.
- `FormaDePagamento` e `CondiçãoDePagamento`.
- `Notificação`, `PreferênciaDeNotificação` e `RegistroDeAuditoria`.

Os agregados e limites transacionais devem ser refinados durante a modelagem, antes de transformar essa lista diretamente em tabelas.

## Multi-tenancy

- Toda entidade pertencente a uma empresa deve possuir um identificador de tenant obrigatório.
- O tenant deve ser resolvido a partir da sessão autenticada, nunca aceito cegamente do formulário ou da URL.
- Consultas e comandos devem aplicar o filtro da empresa ativa por padrão.
- Chaves únicas devem considerar o tenant, por exemplo `(EmpresaId, SKU)`.
- Testes de integração devem provar que um usuário não lê nem altera dados de outra empresa.
- Tarefas em segundo plano, caches, arquivos, logs e notificações também devem respeitar o tenant.

## Segurança e privacidade

- ASP.NET Core Identity ou provedor compatível, cookies seguros, `HttpOnly`, `SameSite` e HTTPS obrigatório em produção.
- Proteção CSRF em operações mutáveis e prevenção de XSS por encoding padrão das Razor Views.
- Senhas armazenadas exclusivamente por mecanismo de hashing de identidade consolidado.
- Segredos fora do repositório, fornecidos por variáveis de ambiente ou cofre de segredos.
- Rate limiting nos fluxos de autenticação, convite e recuperação de senha.
- Uploads, quando implementados, validados por tamanho, tipo e conteúdo, armazenados fora da raiz pública.
- Auditoria imutável de login, permissões, cancelamentos, alterações de estoque e operações financeiras.
- Coleta mínima de dados pessoais, controle de acesso e procedimentos de exportação/anonimização compatíveis com a LGPD.
- Exclusão lógica para registros referenciados por documentos comerciais; dados fiscais e históricos não devem desaparecer por exclusão em cascata.

## Qualidade e testes

- Testes unitários para invariantes do domínio, cálculos monetários e transições de estado.
- Testes de aplicação para casos de uso, autorização e cenários de falha.
- Testes de integração com banco real ou container compatível para constraints, concorrência, migrations e isolamento entre empresas.
- Testes web dos principais fluxos: autenticação, orçamento, conversão em pedido, estoque, faturamento e permissões.
- Análise estática, formatação, build e testes executados no CI em todo pull request.
- Migrations aplicadas primeiro em ambiente de homologação, com estratégia de rollback ou correção progressiva.

Critérios mínimos para uma entrega:

1. Build sem erros.
2. Testes relacionados passando.
3. Nenhum segredo ou dado pessoal real versionado.
4. Autorização e isolamento de tenant cobertos quando o recurso manipular dados da empresa.
5. Interface responsiva, acessível e com estados de carregamento, vazio, sucesso e erro.
6. Logs e mensagens de erro úteis, sem expor detalhes internos ao usuário.

## Observabilidade e operação

- Logs estruturados com nível, evento, correlação, usuário técnico e tenant quando seguro.
- Health checks separados para aplicação e dependências.
- Métricas de latência, taxa de erros, autenticação, filas e uso de recursos.
- Alertas operacionais para indisponibilidade, aumento de erros e falha de tarefas agendadas.
- Ambientes separados de desenvolvimento, homologação e produção.
- Pipeline de CI/CD reprodutível, configuração externa e deploy sem edição manual de arquivos.

## Roadmap de implementação

### Fase 1 — Fundação

- Criar a solução .NET e os projetos da Clean Architecture.
- Registrar ADR da escolha do banco e da estratégia multi-tenant.
- Configurar identidade, empresas, membros, permissões, persistência, migrations, tratamento de erros, logs e testes base.
- Transformar o mockup em layout MVC responsivo e acessível.

### Fase 2 — Operação comercial essencial

- Produtos, categorias, compradores, fornecedores e formas de pagamento.
- Orçamentos com itens, cálculos, estados e geração para impressão/PDF.
- Conversão de orçamento em pedido e fluxo de estados.
- Movimentações e alertas básicos de estoque.

### Fase 3 — Gestão e colaboração

- Dashboard, filtros e atividades recentes.
- Equipe, convites e permissões detalhadas.
- Faturas de fornecedores e notificações configuráveis.
- Auditoria e histórico completo das operações.

### Fase 4 — Produção e evolução

- Hardening de segurança, desempenho, acessibilidade e observabilidade.
- Backup/restauração, retenção, LGPD e rotinas operacionais.
- Integrações de e-mail, WhatsApp, pagamentos, logística ou fiscal apenas conforme requisitos validados.
- Relatórios e exportações orientados pelo uso real do produto.

## Fora do escopo inicial

- Emissão fiscal/NF-e, contabilidade completa e conciliação bancária.
- Marketplace, e-commerce público ou aplicativo móvel nativo.
- Integração automática com WhatsApp sem provedor oficial contratado.
- Roteirização logística avançada.
- Personalizações específicas por cliente que comprometam o produto multi-tenant.

Esses itens poderão entrar no roadmap após validação comercial e análise de requisitos legais, técnicos e operacionais.

## Protótipo atual

O mockup pode ser aberto diretamente no navegador:

```powershell
Start-Process .\docs\index.html
```

Ele usa `localStorage`, possui dados fictícios e existe apenas para validar navegação, conteúdo e aparência. Não deve ser publicado como aplicação real e não oferece autenticação, autorização, isolamento de empresas, banco de dados ou garantias de integridade.

## Decisões pendentes antes do desenvolvimento

- Banco de dados e provedor de hospedagem.
- Estratégia de identificação da empresa ativa (sessão/domínio/subdomínio).
- Regras exatas de reserva e baixa de estoque.
- Momento e significado do faturamento sem integração fiscal inicial.
- Provedor de e-mail e armazenamento de arquivos.
- Política comercial de planos, limites e cobrança do SaaS.
- Requisitos legais de retenção e integrações futuras.

Cada decisão arquitetural relevante deve ser registrada em `docs/adr` com contexto, decisão, alternativas e consequências.

## Licença

Projeto proprietário. Uso, cópia, distribuição e publicação dependem de autorização do titular.
