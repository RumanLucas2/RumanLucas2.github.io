# Escopo e acompanhamento do projeto

Última atualização: 18/08/2026

Este arquivo separa o que já foi implementado no mockup, o que ainda falta para transformar o protótipo em produto e quais melhorias podem ser avaliadas nas próximas versões.

## 1. O que já foi implementado no mockup

### Navegação e experiência de uso

- [x] **Menu lateral organizado por categorias**
  - Comercial, Cadastros e Operação e Financeiro.
  - Reduz a quantidade de itens visíveis e facilita encontrar cada módulo.
- [x] **Menu lateral responsivo**
  - Em telas menores, o menu abre sobre a página.
  - Cliques dentro da área azul não fecham o menu por engano.
  - O fechamento acontece ao clicar fora, usar o botão de fechar ou pressionar `Esc`.
- [x] **Seletor de empresa no topo**
  - Permite alternar entre Almeida Distribuidora e sua filial demonstrativa.
  - A empresa selecionada fica destacada por cor e a escolha é mantida no navegador.
- [x] **Estados visuais de itens ativos**
  - A página atual, filtros e opções selecionadas possuem destaque visual consistente.
- [x] **Tratamento de responsividade**
  - Ajustes feitos para evitar cortes, sobreposição de textos e overflow horizontal.

### Comercial

- [x] **Dashboard**
  - Indicadores de orçamentos, faturamento, pedidos para envio, ticket médio e margem.
  - Filtros de período e visualização por etapas do fluxo.
- [x] **Fluxo comercial**
  - Visualização das etapas do processo comercial.
  - Movimentação e atualização de registros no protótipo.
- [x] **Orçamentos**
  - Consulta, filtros, prazos, status e abertura de registros.
- [x] **Pedido de venda**
  - Tela dedicada para consulta e abertura de pedidos.
- [x] **PDV**
  - Busca de produtos, carrinho, leitura demonstrativa de código e finalização da venda.

### Cadastros e operação

- [x] **Produtos**
  - Cadastro, estoque, custo, venda, markup, categorias e alertas de estoque.
- [x] **Clientes**
  - Cadastro, contatos, status e alerta de clientes sem compra recente.
- [x] **Parceiros**
  - A página permite alternar entre Fornecedores e Transportadoras.
  - Fornecedores são exibidos inicialmente.
  - Campo de pesquisa por nome, documento, e-mail, telefone, categoria ou região.
  - Fornecedores exibem categoria; transportadoras exibem região de atendimento.
- [x] **Notas de entrada**
  - Consulta de notas recebidas, fornecedor, valor, status e observações.
- [x] **Notas emitidas**
  - Consulta de pedidos faturados e documentos emitidos no protótipo.
- [x] **Equipe**
  - Cadastro demonstrativo de usuários, cargos, setores e status.

### Financeiro e controle

- [x] **Formas de pagamento**
  - Cadastro de modalidades, prazos, taxas e status.
- [x] **Remessas**
  - Consulta e criação de remessas no protótipo.
- [x] **Contas a receber**
  - Vencimentos, valores em aberto, status e baixa demonstrativa.
- [x] **Contas a pagar**
  - Contas internas e externas, vencimentos, origem e baixa.
- [x] **Reconciliação**
  - Comparação entre saldo do extrato e saldo do sistema.
- [x] **Lucratividade**
  - Receita, custo, lucro e margem estimada por produto.
- [x] **Notificações**
  - Alertas de estoque, faturas, clientes sem comprar, orçamentos sem retorno e auditoria.
- [x] **Configurações**
  - Regras de alertas, markup padrão e mensagens de comunicação.

### Qualidade do protótipo

- [x] Dados demonstrativos persistidos no navegador com `localStorage`.
- [x] Formulários reutilizáveis para criação e edição.
- [x] Mensagens de confirmação e feedback visual após ações.
- [x] Atalhos de desfazer e refazer para alterações do protótipo.
- [x] Validação de sintaxe JavaScript após as alterações.
- [x] Validação visual no navegador e verificação de overflow horizontal.

## 2. O que ainda falta implementar para o produto real

### Base técnica e dados

- [ ] Definir banco de dados, hospedagem e estratégia de multi-tenancy.
- [ ] Substituir `localStorage` por persistência real em banco de dados.
- [ ] Separar domínio, aplicação, infraestrutura e interface web.
- [ ] Criar APIs para todos os módulos principais.
- [ ] Implementar logs estruturados, health checks, métricas e CI/CD.

### Segurança e acesso

- [ ] Implementar cadastro, login, logout, recuperação de senha e convite de usuários.
- [ ] Implementar **máscara de permissões**: conjunto de regras que define quais telas, ações e dados cada perfil pode acessar ou alterar.
- [ ] Aplicar isolamento de dados entre empresas.
- [ ] Implementar auditoria de alterações sensíveis.
- [ ] Definir backup, restauração, retenção, LGPD e hardening de segurança.

### Regras de negócio

- [ ] Definir regras transacionais de estoque: entrada, saída, reserva, estorno e ajuste.
- [ ] Relacionar notas de entrada com produtos, quantidades, custos e atualização de estoque.
- [ ] Definir regras de faturamento, cancelamento e emissão fiscal.
- [ ] Integrar meios de pagamento e conciliação bancária reais.
- [ ] Definir histórico completo de pedidos, parceiros, estoque e movimentações financeiras.

### Testes e publicação

- [ ] Criar testes unitários, de integração e dos principais fluxos web.
- [ ] Validar permissões com perfis diferentes.
- [ ] Testar concorrência e isolamento entre empresas.
- [ ] Validar o sistema em homologação antes da produção.

## 3. Melhorias úteis adicionadas ao mockup nesta atualização

- [x] **Pesquisa rápida na página Parceiros**
  - Evita percorrer manualmente a tabela quando houver muitos fornecedores ou transportadoras.
  - A pesquisa considera nome, documento, e-mail, telefone, categoria e região.
- [x] **Contador dinâmico de resultados**
  - Informa quantos registros permanecem visíveis após a pesquisa.
- [x] **Seleção de tipo de parceiro mais clara**
  - Fornecedores e Transportadoras ficaram em opções próprias, com indicação visual da seleção ativa.

## 4. Melhorias recomendadas para validar antes de implementar

- [ ] **Exportar lista de parceiros**
  - Baixar fornecedores ou transportadoras filtrados em CSV ou Excel.
  - Útil para conferência, envio ao contador e trabalho offline.
- [ ] **Filtros avançados de parceiros**
  - Filtrar por status, categoria, região e cidade.
  - Ajuda quando o cadastro crescer.
- [ ] **Histórico do parceiro**
  - Exibir pedidos, notas, pagamentos e contatos relacionados ao parceiro.
  - Centraliza o contexto antes de uma negociação ou compra.
- [ ] **Ações em lote**
  - Alterar status, exportar ou arquivar vários registros de uma vez.
  - Reduz trabalho repetitivo na rotina administrativa.
- [ ] **Busca global**
  - Pesquisar produtos, clientes, pedidos, notas e parceiros a partir do topo.
  - Facilita encontrar rapidamente qualquer registro.
- [ ] **Indicador de saúde do cadastro**
  - Sinalizar registros sem telefone, documento, e-mail ou dados obrigatórios.
  - Melhora a qualidade dos dados antes da operação real.

## 5. Critério de conclusão do produto

- [ ] Nenhum dado comercial depender de `localStorage` ou memória do processo.
- [ ] Usuário não acessar dados de outra empresa.
- [ ] Orçamentos, pedidos, estoque, contas a pagar e contas a receber possuírem histórico e regras transacionais.
- [ ] Perfis e permissões aplicados no backend e na interface.
- [ ] Fluxos críticos cobertos por testes automatizados.
- [ ] Aplicação validada em homologação antes da produção.
