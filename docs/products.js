let productsSection = 'estoque';
let suggestionSuppliers = {};

function productSupplierId(productId) {
  const last = db.pedidosCompra.filter(order => order.itens?.some(item => item.produtoId === productId)).sort((a, b) => b.data.localeCompare(a.data))[0];
  return last?.fornecedorId || db.fornecedores[0]?.id;
}

function suggestionRows() {
  return db.produtos.filter(product => Number(product.estoque) <= 0 || (product.estoqueMinimo !== null && Number(product.estoque) <= Number(product.estoqueMinimo))).map(product => {
    const minimum = Math.max(Number(product.estoqueMinimo) || 1, 1);
    return { product, quantity: Math.max(minimum * 2 - Number(product.estoque), minimum), supplierId: Number(suggestionSuppliers[product.id] || productSupplierId(product.id)) };
  });
}

function supplierOptions(selected) {
  return db.fornecedores.filter(supplier => supplier.status === 'Ativo').map(supplier => `<option value="${supplier.id}" ${Number(selected) === Number(supplier.id) ? 'selected' : ''}>${escapeHtml(supplier.nome)}</option>`).join('');
}

function productsStockPage() {
  const data = filtered('produtos');
  const low = suggestionRows().length;
  return `<div class="product-section-summary"><div><strong>${db.produtos.length}</strong><span>produtos cadastrados</span></div><div class="warning"><strong>${low}</strong><span>itens para reposição</span></div><button class="btn primary" data-product-suggestion>＋ Montar pedido sugestão</button></div><div class="card table-card"><div class="filters"><div class="search"><input id="tableSearch" placeholder="⌕  Pesquisar em produtos..." value="${escapeHtml(filterState.query)}"></div><select id="statusFilter"><option>Todos os status</option>${[...new Set(db.produtos.map(x => x.status))].map(status => `<option ${filterState.status === status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}</select><select id="orderFilter"><option>Mais recentes</option><option>Nome A–Z</option></select></div><div class="summary-strip"><span>Produtos encontrados <strong>${data.length}</strong></span><span>Estoque baixo ou zerado <strong>${low}</strong></span></div><div class="table-scroll">${table('produtos', data)}</div><div class="table-footer"><span>Mostrando ${data.length} de ${db.produtos.length} produtos</span></div></div>`;
}

function purchaseOrdersPage() {
  const orders = [...db.pedidosCompra].sort((a, b) => b.data.localeCompare(a.data));
  return `<div class="purchase-history card table-card"><div class="filters"><div class="search"><input id="purchaseSearch" placeholder="⌕  Pesquisar por fornecedor ou número do pedido..."></div><button class="btn primary" data-product-suggestion>＋ Montar pedido sugestão</button></div><div class="summary-strip"><span>Pedidos de compra <strong>${orders.length}</strong></span><span>Valor total <strong>${money(orders.reduce((sum, order) => sum + Number(order.valor), 0))}</strong></span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Pedido</th><th>Fornecedor</th><th>Data</th><th>Itens</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>${orders.map(order => { const supplier = db.fornecedores.find(x => x.id === order.fornecedorId); return `<tr><td><strong>#${order.id}</strong></td><td>${escapeHtml(supplier?.nome || 'Fornecedor removido')}</td><td>${datePt(order.data)}</td><td>${order.itens?.reduce((sum, item) => sum + Number(item.quantidade), 0) || 0} un.</td><td><strong>${money(order.valor)}</strong></td><td><span class="badge green">${escapeHtml(order.status)}</span></td><td><div class="row-actions"><button class="action-button" data-purchase-view="${order.id}">Visualizar</button><button class="action-button" data-purchase-reorder="${order.id}">Pedir novamente</button></div></td></tr>`; }).join('')}</tbody></table></div></div>`;
}

function productsPage() {
  return `<div class="page-head"><div><div class="eyebrow">Gestão de produtos</div><h1>Produtos</h1><p>Controle o estoque atual e acompanhe seus pedidos de compra.</p></div><button class="btn primary" data-add="produtos">＋ Novo produto</button></div><div class="product-tabs" role="tablist"><button class="product-tab ${productsSection === 'estoque' ? 'active' : ''}" data-product-section="estoque" role="tab" aria-selected="${productsSection === 'estoque'}">Estoque</button><button class="product-tab ${productsSection === 'compras' ? 'active' : ''}" data-product-section="compras" role="tab" aria-selected="${productsSection === 'compras'}">Pedido de compras</button></div>${productsSection === 'estoque' ? productsStockPage() : purchaseOrdersPage()}`;
}

function suggestionPage() {
  const rows = suggestionRows();
  return `<div class="suggestion-head"><div><div class="eyebrow">Reposição de estoque</div><h2>Pedido sugestão</h2><p>Itens abaixo do estoque mínimo ou sem estoque. A quantidade sugerida repõe até duas vezes o mínimo.</p></div><button class="btn secondary" data-suggestion-cancel>Voltar para estoque</button></div><div class="card table-card suggestion-card"><div class="table-scroll"><table class="data-table"><thead><tr><th>Produto</th><th>Estoque</th><th>Mínimo</th><th>Quantidade sugerida</th><th>Fornecedor recente</th></tr></thead><tbody>${rows.length ? rows.map(row => `<tr><td><strong>${escapeHtml(row.product.nome)}</strong><small class="table-subtitle">${escapeHtml(row.product.sku)}</small></td><td><span class="badge red">${row.product.estoque} un.</span></td><td>${row.product.estoqueMinimo ?? '—'} un.</td><td><input class="suggestion-quantity" type="number" min="1" value="${row.quantity}" data-suggestion-quantity="${row.product.id}"></td><td><select class="suggestion-supplier" data-suggestion-supplier="${row.product.id}">${supplierOptions(row.supplierId)}</select></td></tr>`).join('') : '<tr><td colspan="5"><div class="filter-empty">Nenhum item precisa de reposição.</div></td></tr>'}</tbody></table></div><div class="suggestion-footer"><span>${rows.length} item(ns) selecionado(s)</span><button class="btn primary" data-generate-suggestion ${rows.length ? '' : 'disabled'}>Gerar pedido de compra</button></div></div>`;
}

function showPurchaseDetail(id) {
  const order = db.pedidosCompra.find(x => x.id === Number(id));
  if (!order) return;
  const supplier = db.fornecedores.find(x => x.id === order.fornecedorId);
  document.getElementById('modalTitle').textContent = `Pedido #${order.id}`;
  document.getElementById('modalDescription').textContent = `${supplier?.nome || 'Fornecedor removido'} · ${datePt(order.data)}`;
  document.getElementById('formFields').innerHTML = `<div class="purchase-detail-list">${order.itens.map(item => { const product = db.produtos.find(x => x.id === item.produtoId); return `<div><span>${escapeHtml(product?.nome || 'Produto removido')}</span><strong>${item.quantidade} un.</strong></div>`; }).join('')}<div class="purchase-detail-total"><span>Total</span><strong>${money(order.valor)}</strong></div></div>`;
  document.getElementById('modalSubmit').hidden = true;
  document.getElementById('modalCancel').textContent = 'Fechar';
  document.getElementById('modalError').textContent = '';
  openModal();
}

function generateSuggestedOrders() {
  const groups = {};
  document.querySelectorAll('[data-suggestion-quantity]').forEach(input => { const productId = Number(input.dataset.suggestionQuantity); const supplierId = Number(document.querySelector(`[data-suggestion-supplier="${productId}"]`)?.value); const quantity = Math.max(1, Number(input.value) || 1); (groups[supplierId] ||= []).push({ productId, quantidade: quantity }); });
  const orders = Object.entries(groups).map(([supplierId, itens], index) => ({ id: Math.max(3000, ...db.pedidosCompra.map(x => x.id)) + index + 1, fornecedorId: Number(supplierId), data: new Date().toISOString().slice(0, 10), status: 'Rascunho', valor: itens.reduce((sum, item) => sum + item.quantidade * Number(db.produtos.find(x => x.id === item.productId)?.valorCompra || 0), 0), itens }));
  if (!orders.length) return;
  checkpoint(); db.pedidosCompra.unshift(...orders); saveData(); showToast(`${orders.length} pedido(s) de compra criado(s).`); productsSection = 'compras'; render('produtos');
}

const originalProductsRender = render;
render = function(page = currentPage, options = {}) { originalProductsRender(page, options); if (page === 'produtos') { document.getElementById('content').innerHTML = productsPage(); bindProductsPage(); } };

function bindProductsPage() {
  document.querySelectorAll('[data-add]').forEach(button => button.onclick = () => openForm(button.dataset.add));
  document.querySelectorAll('[data-product-section]').forEach(button => button.onclick = () => { productsSection = button.dataset.productSection; render('produtos'); });
  document.querySelectorAll('[data-product-suggestion]').forEach(button => button.onclick = () => { document.getElementById('content').innerHTML = suggestionPage(); bindSuggestionPage(); });
  document.querySelectorAll('[data-purchase-view]').forEach(button => button.onclick = () => showPurchaseDetail(button.dataset.purchaseView));
  document.querySelectorAll('[data-purchase-reorder]').forEach(button => button.onclick = () => { const order = db.pedidosCompra.find(x => x.id === Number(button.dataset.purchaseReorder)); if (!order) return; checkpoint(); db.pedidosCompra.unshift({ ...clone(order), id: Math.max(3000, ...db.pedidosCompra.map(x => x.id)) + 1, data: new Date().toISOString().slice(0, 10), status: 'Rascunho' }); saveData(); showToast('Pedido de compra duplicado para revisão.'); render('produtos'); });
  const search = document.getElementById('tableSearch'); if (search) search.oninput = event => { filterState.query = event.target.value; const position = search.selectionStart; document.getElementById('content').innerHTML = productsPage(); bindProductsPage(); const next = document.getElementById('tableSearch'); next.focus(); next.setSelectionRange(position, position); };
  document.getElementById('statusFilter')?.addEventListener('change', event => { filterState.status = event.target.value; document.getElementById('content').innerHTML = productsPage(); bindProductsPage(); });
}

function bindSuggestionPage() { document.querySelector('[data-suggestion-cancel]')?.addEventListener('click', () => render('produtos')); document.querySelector('[data-generate-suggestion]')?.addEventListener('click', generateSuggestedOrders); }

document.getElementById('modalCancel').addEventListener('click', () => { document.getElementById('modalSubmit').hidden = false; document.getElementById('modalCancel').textContent = 'Cancelar'; });
