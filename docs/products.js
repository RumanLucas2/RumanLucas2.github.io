let productsSection = 'estoque';
let suggestionSuppliers = {};
let suggestionPeriodDays = 90;
let suggestionSupplierFilter = 'all';
let purchaseSearch = '';

function productSupplierId(productId) {
  const last = db.pedidosCompra.filter(order => order.itens?.some(item => item.produtoId === productId)).sort((a, b) => b.data.localeCompare(a.data))[0];
  return last?.fornecedorId || db.fornecedores[0]?.id;
}

function suggestionRows() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(suggestionPeriodDays));
  const history = db.pedidosCompra.filter(order => {
    const date = new Date(`${order.data}T00:00:00`);
    return date >= cutoff && (suggestionSupplierFilter === 'all' || Number(order.fornecedorId) === Number(suggestionSupplierFilter));
  });
  return db.produtos.filter(product => Number(product.estoque) <= 0 || (product.estoqueMinimo !== null && Number(product.estoque) <= Number(product.estoqueMinimo))).map(product => {
    const minimum = Math.max(Number(product.estoqueMinimo) || 1, 1);
    const consumed = history.reduce((sum, order) => sum + (order.itens || []).filter(item => Number(item.produtoId) === Number(product.id)).reduce((total, item) => total + Number(item.quantidade || 0), 0), 0);
    const averageMonthly = consumed * 30 / Number(suggestionPeriodDays);
    const quantity = Math.max(minimum * 2 - Number(product.estoque), Math.ceil(averageMonthly - Number(product.estoque)), 1);
    const supplierId = Number(suggestionSuppliers[product.id] || (suggestionSupplierFilter !== 'all' ? suggestionSupplierFilter : productSupplierId(product.id)));
    return { product, quantity, consumed, averageMonthly, supplierId };
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

function purchaseProductOptions() {
  return db.produtos.map(product => `<option value="${product.id}">${escapeHtml(product.nome)} · ${escapeHtml(product.sku || '')} · ${money(product.valorCompra || 0)}</option>`).join('');
}

function purchaseLineHtml() {
  return `<div class="purchase-line" style="display:grid;grid-template-columns:minmax(0,1fr) 110px auto;gap:8px;align-items:end;margin-top:8px"><select name="purchaseProduct" required><option value="">Selecione o produto</option>${purchaseProductOptions()}</select><input name="purchaseQuantity" type="number" min="1" step="1" value="1" required aria-label="Quantidade"><button type="button" class="action-button" data-remove-purchase-line>Remover</button></div>`;
}

function restorePurchaseForm() {
  document.getElementById('recordForm').onsubmit = submitForm;
  document.getElementById('modalSubmit').textContent = 'Salvar';
}

function openPurchaseOrderForm() {
  const form = document.getElementById('recordForm');
  document.getElementById('modalTitle').textContent = 'Novo pedido de compra';
  document.getElementById('modalDescription').textContent = 'Selecione o fornecedor e os produtos que deseja incluir no pedido.';
  document.getElementById('modalError').textContent = '';
  document.getElementById('modalSubmit').hidden = false;
  document.getElementById('modalSubmit').textContent = 'Criar pedido';
  document.getElementById('formFields').innerHTML = `<label>Fornecedor<select name="purchaseSupplier" required><option value="">Selecione o fornecedor</option>${supplierOptions('').replaceAll('selected', '')}</select></label><div class="purchase-lines-head"><strong>Produtos</strong><button type="button" class="action-button" data-add-purchase-line>＋ Adicionar produto</button></div><div id="purchaseLines">${purchaseLineHtml()}</div>`;
  form.onsubmit = saveNewPurchaseOrder;
  document.getElementById('modalCancel').onclick = () => { restorePurchaseForm(); closeModal(); };
  document.getElementById('modalClose').onclick = () => { restorePurchaseForm(); closeModal(); };
  document.getElementById('formFields').addEventListener('click', event => { if (event.target.closest('[data-add-purchase-line]')) document.getElementById('purchaseLines').insertAdjacentHTML('beforeend', purchaseLineHtml()); if (event.target.closest('[data-remove-purchase-line]')) { const lines = document.querySelectorAll('.purchase-line'); if (lines.length > 1) event.target.closest('.purchase-line').remove(); } });
  openModal();
}

function saveNewPurchaseOrder(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const supplierId = Number(form.elements.purchaseSupplier.value);
  const items = [...document.querySelectorAll('.purchase-line')].map(line => ({ productId: Number(line.querySelector('[name="purchaseProduct"]').value), quantidade: Math.max(1, Number(line.querySelector('[name="purchaseQuantity"]').value) || 0) })).filter(item => item.productId && item.quantidade > 0);
  if (!supplierId || !items.length) { document.getElementById('modalError').textContent = 'Selecione um fornecedor e pelo menos um produto.'; return; }
  const merged = Object.values(items.reduce((result, item) => { const key = item.productId; if (!result[key]) result[key] = { ...item }; else result[key].quantidade += item.quantidade; return result; }, {}));
  const id = Math.max(3000, ...db.pedidosCompra.map(order => order.id)) + 1;
  const valor = merged.reduce((sum, item) => sum + item.quantidade * Number(db.produtos.find(product => product.id === item.productId)?.valorCompra || 0), 0);
  checkpoint(); db.pedidosCompra.unshift({ id, fornecedorId: supplierId, data: new Date().toISOString().slice(0, 10), status: 'Rascunho', notaFiscal: '', valor, itens: merged }); saveData(); restorePurchaseForm(); closeModal(); showToast('Pedido de compra criado como rascunho.'); productsSection = 'compras'; render('produtos');
}

function purchaseOrdersPageBase() {
  const orders = [...db.pedidosCompra].sort((a, b) => b.data.localeCompare(a.data));
  return `<div class="purchase-history card table-card"><div class="filters"><div class="search"><input id="purchaseSearch" placeholder="⌕  Pesquisar por fornecedor ou número do pedido..."></div><button class="btn primary" data-product-suggestion>＋ Montar pedido sugestão</button></div><div class="summary-strip"><span>Pedidos de compra <strong>${orders.length}</strong></span><span>Valor total <strong>${money(orders.reduce((sum, order) => sum + Number(order.valor), 0))}</strong></span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Pedido</th><th>Fornecedor</th><th>Data</th><th>Itens</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>${orders.map(order => { const supplier = db.fornecedores.find(x => x.id === order.fornecedorId); return `<tr><td><strong>#${order.id}</strong></td><td>${escapeHtml(supplier?.nome || 'Fornecedor removido')}</td><td>${datePt(order.data)}</td><td>${order.itens?.reduce((sum, item) => sum + Number(item.quantidade), 0) || 0} un.</td><td><strong>${money(order.valor)}</strong></td><td><span class="badge green">${escapeHtml(order.status)}</span></td><td><div class="row-actions"><button class="action-button" data-purchase-view="${order.id}">Visualizar</button><button class="action-button" data-purchase-reorder="${order.id}">Pedir novamente</button></div></td></tr>`; }).join('')}</tbody></table></div></div>`;
}

function purchaseOrdersPage() {
  return purchaseOrdersPageBase().replace('<button class="btn primary" data-product-suggestion>', '<button class="btn secondary" data-new-purchase-order>＋ Novo pedido do zero</button><button class="btn primary" data-product-suggestion>');
}

function purchaseOrdersPage() {
  const query = purchaseSearch.trim().toLocaleLowerCase('pt-BR');
  const allOrders = [...db.pedidosCompra].sort((a, b) => b.data.localeCompare(a.data));
  const orders = query ? allOrders.filter(order => { const supplier = db.fornecedores.find(x => x.id === order.fornecedorId); return [order.id, order.notaFiscal, supplier?.nome].some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(query)); }) : allOrders;
  return `<div class="purchase-history card table-card"><div class="filters"><div class="search"><input id="purchaseSearch" value="${escapeHtml(purchaseSearch)}" placeholder="Pesquisar por fornecedor, pedido ou nota fiscal..."></div><button class="btn secondary" data-new-purchase-order>＋ Novo pedido do zero</button><button class="btn primary" data-product-suggestion>＋ Montar pedido sugestão</button></div><div class="summary-strip"><span>Pedidos encontrados <strong>${orders.length}</strong></span><span>Valor total <strong>${money(orders.reduce((sum, order) => sum + Number(order.valor), 0))}</strong></span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Pedido</th><th>Nota fiscal</th><th>Fornecedor</th><th>Data</th><th>Itens</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>${orders.map(order => { const supplier = db.fornecedores.find(x => x.id === order.fornecedorId); return `<tr><td><strong>#${order.id}</strong></td><td>${escapeHtml(order.notaFiscal || '—')}</td><td>${escapeHtml(supplier?.nome || 'Fornecedor removido')}</td><td>${datePt(order.data)}</td><td>${order.itens?.reduce((sum, item) => sum + Number(item.quantidade), 0) || 0} un.</td><td><strong>${money(order.valor)}</strong></td><td><span class="badge green">${escapeHtml(order.status)}</span></td><td><div class="row-actions"><button class="action-button" data-purchase-view="${order.id}">Visualizar</button><button class="action-button" data-purchase-reorder="${order.id}">Pedir novamente</button></div></td></tr>`; }).join('')}</tbody></table></div></div>`;
}

function inventoryPage() {
  const records = [...(db.inventario || [])].sort((a, b) => b.data.localeCompare(a.data));
  const productName = id => db.produtos.find(product => Number(product.id) === Number(id))?.nome || 'Produto removido';
  return `<div class="inventory-head"><div><div class="eyebrow">Controle de estoque</div><h2>Inventário</h2><p>Registre conferências e correções de estoque, com o motivo e os itens ajustados.</p></div><button class="btn primary" data-new-inventory>＋ Registrar verificação</button></div><div class="card table-card"><div class="summary-strip"><span>Verificações registradas <strong>${records.length}</strong></span><span>Última atualização <strong>${records[0] ? datePt(records[0].data) : '—'}</strong></span></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Data</th><th>Motivo</th><th>Itens ajustados</th><th>Alterações</th><th>Responsável</th></tr></thead><tbody>${records.length ? records.map(record => `<tr><td>${datePt(record.data)}</td><td><strong>${escapeHtml(record.motivo)}</strong></td><td>${record.itens.length} item(ns)</td><td>${record.itens.map(item => `<span class="inventory-change">${escapeHtml(productName(item.produtoId))}: ${item.antes} → ${item.depois}</span>`).join('')}</td><td>${escapeHtml(record.usuario || 'Usuário atual')}</td></tr>`).join('') : '<tr><td colspan="5"><div class="filter-empty">Nenhuma verificação registrada.</div></td></tr>'}</tbody></table></div></div>`;
}

function inventoryLineHtml() { return `<div class="inventory-line"><select name="inventoryProduct" required><option value="">Selecione o produto</option>${db.produtos.map(product => `<option value="${product.id}">${escapeHtml(product.nome)} · atual: ${product.estoque} un.</option>`).join('')}</select><input name="inventoryStock" type="number" step="1" required placeholder="Novo estoque" aria-label="Novo estoque"><button type="button" class="action-button" data-remove-inventory-line>Remover</button></div>`; }
function openInventoryForm() { document.getElementById('modalTitle').textContent='Registrar verificação de inventário';document.getElementById('modalDescription').textContent='Informe o motivo e o novo estoque contado para cada produto ajustado.';document.getElementById('modalError').textContent='';document.getElementById('modalSubmit').textContent='Registrar ajuste';document.getElementById('formFields').innerHTML=`<label>Motivo<input name="inventoryReason" required placeholder="Ex.: Conferência semanal"></label><div class="inventory-lines-head"><strong>Itens ajustados</strong><button type="button" class="action-button" data-add-inventory-line>＋ Adicionar item</button></div><div id="inventoryLines">${inventoryLineHtml()}</div>`;document.getElementById('recordForm').onsubmit=saveInventoryRecord;document.getElementById('modalCancel').onclick=()=>{document.getElementById('recordForm').onsubmit=submitForm;closeModal()};document.getElementById('modalClose').onclick=()=>{document.getElementById('recordForm').onsubmit=submitForm;closeModal()};document.getElementById('formFields').onclick=event=>{if(event.target.closest('[data-add-inventory-line]'))document.getElementById('inventoryLines').insertAdjacentHTML('beforeend',inventoryLineHtml());if(event.target.closest('[data-remove-inventory-line]')&&document.querySelectorAll('.inventory-line').length>1)event.target.closest('.inventory-line').remove()};openModal(); }
function saveInventoryRecord(event) { event.preventDefault();const reason=event.currentTarget.elements.inventoryReason.value.trim();const items=[...document.querySelectorAll('.inventory-line')].map(line=>{const product=db.produtos.find(item=>item.id===Number(line.querySelector('[name="inventoryProduct"]').value));return product?{produtoId:product.id,antes:Number(product.estoque),depois:Number(line.querySelector('[name="inventoryStock"]').value)}:null}).filter(Boolean);if(!reason||!items.length){document.getElementById('modalError').textContent='Informe o motivo e pelo menos um item.';return}checkpoint();items.forEach(item=>{const product=db.produtos.find(product=>product.id===item.produtoId);product.estoque=item.depois;});db.inventario.unshift({id:Math.max(0,...db.inventario.map(item=>item.id))+1,data:new Date().toISOString().slice(0,10),motivo:reason,usuario:'Lucas Almeida',itens:items});saveData();document.getElementById('recordForm').onsubmit=submitForm;closeModal();showToast('Verificação de inventário registrada.');productsSection='inventario';render('produtos'); }

function productsPage() {
  return `<div class="page-head"><div><div class="eyebrow">Gestão de produtos</div><h1>Produtos</h1><p>Controle o estoque atual e acompanhe seus pedidos de compra.</p></div><button class="btn primary" data-add="produtos">＋ Novo produto</button></div><div class="product-tabs" role="tablist"><button class="product-tab ${productsSection === 'estoque' ? 'active' : ''}" data-product-section="estoque">Estoque</button><button class="product-tab ${productsSection === 'compras' ? 'active' : ''}" data-product-section="compras">Pedido de compras</button><button class="product-tab ${productsSection === 'inventario' ? 'active' : ''}" data-product-section="inventario">Inventário</button></div>${productsSection === 'estoque' ? productsStockPage() : productsSection === 'compras' ? purchaseOrdersPage() : inventoryPage()}`;
}

function saveInventoryProduct(id){const row=document.querySelector(`[data-inventory-product="${id}"]`);const product=db.produtos.find(item=>Number(item.id)===Number(id));if(!row||!product)return;const next={nome:row.querySelector('[data-inventory-name]').value.trim(),categoria:row.querySelector('[data-inventory-category]').value.trim(),estoque:Number(row.querySelector('[data-inventory-stock]').value),valorCompra:Number(row.querySelector('[data-inventory-cost]').value),valorVenda:Number(row.querySelector('[data-inventory-sale]').value)};if(!next.nome||[next.estoque,next.valorCompra,next.valorVenda].some(value=>!Number.isFinite(value))){showToast('Preencha os dados do produto corretamente.');return}checkpoint();Object.assign(product,next);saveData();showToast('Produto atualizado pelo inventário.');render('produtos')}
function inventoryPage(){const records=[...(db.inventario||[])].sort((a,b)=>b.data.localeCompare(a.data));const productName=id=>db.produtos.find(product=>Number(product.id)===Number(id))?.nome||'Produto removido';return `<div class="inventory-head"><div><div class="eyebrow">Controle de estoque</div><h2>Inventário</h2><p>Altere dados de produtos somente durante a conferência de inventário.</p></div></div><section class="card table-card inventory-editor"><div class="panel-head"><div><h2>Conferência e ajustes de produtos</h2><small>Edite nome, categoria, estoque e valores nesta seção.</small></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Compra</th><th>Venda</th><th></th></tr></thead><tbody>${db.produtos.map(product=>`<tr data-inventory-product="${product.id}"><td><input data-inventory-name value="${escapeHtml(product.nome)}"></td><td><input data-inventory-category value="${escapeHtml(product.categoria||'')}"></td><td><input data-inventory-stock type="number" value="${product.estoque}"></td><td><input data-inventory-cost type="number" step="0.01" value="${product.valorCompra}"></td><td><input data-inventory-sale type="number" step="0.01" value="${product.valorVenda}"></td><td><button class="action-button" data-save-inventory-product="${product.id}">Salvar</button></td></tr>`).join('')}</tbody></table></div></section><section class="card table-card" style="margin-top:16px"><div class="panel-head"><div><h2>Histórico de verificações</h2><small>Motivo, data e itens corrigidos.</small></div></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Data</th><th>Motivo</th><th>Itens ajustados</th><th>Alterações</th><th>Responsável</th></tr></thead><tbody>${records.length?records.map(record=>`<tr><td>${datePt(record.data)}</td><td><strong>${escapeHtml(record.motivo)}</strong></td><td>${record.itens.length} item(ns)</td><td>${record.itens.map(item=>`<span class="inventory-change">${escapeHtml(productName(item.produtoId))}: ${item.antes} → ${item.depois}</span>`).join('')}</td><td>${escapeHtml(record.usuario||'Usuário atual')}</td></tr>`).join(''):'<tr><td colspan="5"><div class="filter-empty">Nenhuma verificação registrada.</div></td></tr>'}</tbody></table></div></section>`}

function suggestionPageLegacy() {
  const rows = suggestionRows();
  return `<div class="suggestion-head"><div><div class="eyebrow">Reposição de estoque</div><h2>Pedido sugestão</h2><p>Itens abaixo do estoque mínimo ou sem estoque. A quantidade sugerida repõe até duas vezes o mínimo.</p></div><button class="btn secondary" data-suggestion-cancel>Voltar para estoque</button></div><div class="card table-card suggestion-card"><div class="table-scroll"><table class="data-table"><thead><tr><th>Produto</th><th>Estoque</th><th>Mínimo</th><th>Quantidade sugerida</th><th>Fornecedor recente</th></tr></thead><tbody>${rows.length ? rows.map(row => `<tr><td><strong>${escapeHtml(row.product.nome)}</strong><small class="table-subtitle">${escapeHtml(row.product.sku)}</small></td><td><span class="badge red">${row.product.estoque} un.</span></td><td>${row.product.estoqueMinimo ?? '—'} un.</td><td><input class="suggestion-quantity" type="number" min="1" value="${row.quantity}" data-suggestion-quantity="${row.product.id}"></td><td><select class="suggestion-supplier" data-suggestion-supplier="${row.product.id}">${supplierOptions(row.supplierId)}</select></td></tr>`).join('') : '<tr><td colspan="5"><div class="filter-empty">Nenhum item precisa de reposição.</div></td></tr>'}</tbody></table></div><div class="suggestion-footer"><span>${rows.length} item(ns) selecionado(s)</span><button class="btn primary" data-generate-suggestion ${rows.length ? '' : 'disabled'}>Gerar pedido de compra</button></div></div>`;
}

function suggestionPageBase() {
  const rows = suggestionRows();
  const suppliers = db.fornecedores.filter(supplier => supplier.status === 'Ativo');
  const periodOptions = [[30, 'Últimos 30 dias'], [90, 'Últimos 90 dias'], [180, 'Últimos 180 dias'], [365, 'Últimos 12 meses']];
  return `<div class="suggestion-head"><div><div class="eyebrow">Reposição de estoque</div><h2>Pedido sugestão</h2><p>Itens abaixo do estoque mínimo ou sem estoque, considerando o consumo do período selecionado.</p></div><button class="btn secondary" data-suggestion-cancel>Voltar para estoque</button></div><div class="card suggestion-filters"><label>Período de consumo<select data-suggestion-period>${periodOptions.map(([value, label]) => `<option value="${value}" ${suggestionPeriodDays === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>Fornecedor<select data-suggestion-supplier-filter><option value="all" ${suggestionSupplierFilter === 'all' ? 'selected' : ''}>Todos os fornecedores</option>${suppliers.map(supplier => `<option value="${supplier.id}" ${Number(suggestionSupplierFilter) === Number(supplier.id) ? 'selected' : ''}>${escapeHtml(supplier.nome)}</option>`).join('')}</select></label></div><div class="card table-card suggestion-card"><div class="table-scroll"><table class="data-table"><thead><tr><th>Produto</th><th>Estoque</th><th>Consumo no período</th><th>Média mensal</th><th>Quantidade sugerida</th><th>Fornecedor</th></tr></thead><tbody>${rows.length ? rows.map(row => `<tr><td><strong>${escapeHtml(row.product.nome)}</strong><small class="table-subtitle">${escapeHtml(row.product.sku)}</small></td><td><span class="badge red">${row.product.estoque} un.</span></td><td>${row.consumed} un.</td><td>${row.averageMonthly.toFixed(1).replace('.', ',')} un.</td><td><input class="suggestion-quantity" type="number" min="1" value="${row.quantity}" data-suggestion-quantity="${row.product.id}"></td><td><select class="suggestion-supplier" data-suggestion-supplier="${row.product.id}">${supplierOptions(row.supplierId)}</select></td></tr>`).join('') : '<tr><td colspan="6"><div class="filter-empty">Nenhum item precisa de reposição.</div></td></tr>'}</tbody></table></div><div class="suggestion-footer"><span>${rows.length} item(ns) selecionado(s)</span><button class="btn primary" data-generate-suggestion ${rows.length ? '' : 'disabled'}>Gerar pedido de compra</button></div></div>`;
}

function suggestionSupplierGroups(rows) {
  return rows.reduce((groups, row) => {
    const key = String(row.supplierId || 'none');
    (groups[key] ||= { supplierId: row.supplierId, count: 0, units: 0 }).count += 1;
    groups[key].units += Number(row.quantity || 0);
    return groups;
  }, {});
}

function suggestionPage() {
  const rows = suggestionRows();
  const suppliers = db.fornecedores.filter(supplier => supplier.status === 'Ativo');
  const categories = [...new Set(rows.map(row => row.product.categoria || 'Sem categoria'))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const periodOptions = [[30, 'Últimos 30 dias'], [90, 'Últimos 90 dias'], [180, 'Últimos 6 meses'], [365, 'Último ano']];
  const groups = suggestionSupplierGroups(rows);
  const supplierName = supplierId => db.fornecedores.find(supplier => Number(supplier.id) === Number(supplierId))?.nome || 'Fornecedor não definido';
  const groupSummary = Object.values(groups).map(group => `<span class="suggestion-order-group"><strong>${escapeHtml(supplierName(group.supplierId))}</strong><small>${group.count} produto(s) · ${group.units} un.</small></span>`).join('');
  const categoryControls = categories.map(category => `<label>${escapeHtml(category)}<select data-suggestion-category-supplier="${escapeHtml(category)}"><option value="">Manter fornecedor de cada produto</option>${suppliers.map(supplier => `<option value="${supplier.id}">${escapeHtml(supplier.nome)}</option>`).join('')}</select></label>`).join('');
  return `<div class="suggestion-head"><div><div class="eyebrow">Reposição de estoque</div><h2>Pedido sugestão</h2><p>Altere o fornecedor por produto ou aplique um fornecedor para todos os produtos de uma categoria.</p></div><button class="btn secondary" data-suggestion-cancel>Voltar para estoque</button></div><div class="card suggestion-filters"><label>Período de consumo<select data-suggestion-period>${periodOptions.map(([value, label]) => `<option value="${value}" ${suggestionPeriodDays === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label>Filtrar consumo por fornecedor<select data-suggestion-supplier-filter><option value="all" ${suggestionSupplierFilter === 'all' ? 'selected' : ''}>Todos os fornecedores</option>${suppliers.map(supplier => `<option value="${supplier.id}" ${Number(suggestionSupplierFilter) === Number(supplier.id) ? 'selected' : ''}>${escapeHtml(supplier.nome)}</option>`).join('')}</select></label></div>${categories.length ? `<div class="card suggestion-category-controls"><div><strong>Aplicar fornecedor por categoria</strong><small>Essa alteração atualiza todos os produtos da categoria.</small></div><div class="suggestion-category-grid">${categoryControls}</div></div>` : ''}<div class="card suggestion-order-preview"><strong>Pedidos que serão gerados</strong><small>Os produtos serão agrupados e separados automaticamente por fornecedor.</small><div class="suggestion-order-groups">${groupSummary || '<span class="suggestion-order-group"><strong>Nenhum fornecedor</strong><small>Nenhum item para reposição</small></span>'}</div></div><div class="card table-card suggestion-card"><div class="table-scroll"><table class="data-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Estoque</th><th>Consumo no período</th><th>Média mensal</th><th>Quantidade sugerida</th><th>Fornecedor</th></tr></thead><tbody>${rows.length ? rows.map(row => `<tr><td><strong>${escapeHtml(row.product.nome)}</strong><small class="table-subtitle">${escapeHtml(row.product.sku)}</small></td><td>${escapeHtml(row.product.categoria || 'Sem categoria')}</td><td><span class="badge red">${row.product.estoque} un.</span></td><td>${row.consumed} un.</td><td>${row.averageMonthly.toFixed(1).replace('.', ',')} un.</td><td><input class="suggestion-quantity" type="number" min="1" value="${row.quantity}" data-suggestion-quantity="${row.product.id}"></td><td><select class="suggestion-supplier" data-suggestion-supplier="${row.product.id}">${supplierOptions(row.supplierId)}</select></td></tr>`).join('') : '<tr><td colspan="7"><div class="filter-empty">Nenhum item precisa de reposição.</div></td></tr>'}</tbody></table></div><div class="suggestion-footer"><span>${rows.length} item(ns) selecionado(s)</span><button class="btn primary" data-generate-suggestion ${rows.length ? '' : 'disabled'}>Gerar pedidos separados</button></div></div>`;
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
  document.querySelectorAll('[data-new-purchase-order]').forEach(button => button.onclick = openPurchaseOrderForm);
  document.querySelectorAll('[data-new-inventory]').forEach(button => button.onclick = openInventoryForm);
  document.querySelectorAll('[data-save-inventory-product]').forEach(button => button.onclick = () => saveInventoryProduct(button.dataset.saveInventoryProduct));
  if (productsSection !== 'inventario') document.querySelectorAll('[data-row-edit^="produtos:"]').forEach(row => { row.removeAttribute('data-row-edit'); row.removeAttribute('tabindex'); row.onclick = null; row.onkeydown = null; });
  document.querySelectorAll('[data-purchase-view]').forEach(button => button.onclick = () => showPurchaseDetail(button.dataset.purchaseView));
  document.querySelectorAll('[data-purchase-reorder]').forEach(button => button.onclick = () => { const order = db.pedidosCompra.find(x => x.id === Number(button.dataset.purchaseReorder)); if (!order) return; checkpoint(); db.pedidosCompra.unshift({ ...clone(order), id: Math.max(3000, ...db.pedidosCompra.map(x => x.id)) + 1, data: new Date().toISOString().slice(0, 10), status: 'Rascunho' }); saveData(); showToast('Pedido de compra duplicado para revisão.'); render('produtos'); });
  const search = document.getElementById('tableSearch'); if (search) search.oninput = event => { filterState.query = event.target.value; const position = search.selectionStart; document.getElementById('content').innerHTML = productsPage(); bindProductsPage(); const next = document.getElementById('tableSearch'); next.focus(); next.setSelectionRange(position, position); };
  const purchaseInput = document.getElementById('purchaseSearch'); if (purchaseInput) purchaseInput.oninput = event => { purchaseSearch = event.target.value; const position = purchaseInput.selectionStart; document.getElementById('content').innerHTML = productsPage(); bindProductsPage(); const next = document.getElementById('purchaseSearch'); next?.focus(); next?.setSelectionRange(position, position); };
  document.getElementById('statusFilter')?.addEventListener('change', event => { filterState.status = event.target.value; document.getElementById('content').innerHTML = productsPage(); bindProductsPage(); });
}

function rerenderSuggestion() { document.getElementById('content').innerHTML = suggestionPage(); bindSuggestionPage(); }
function bindSuggestionPage() { document.querySelector('[data-suggestion-cancel]')?.addEventListener('click', () => render('produtos')); document.querySelector('[data-generate-suggestion]')?.addEventListener('click', generateSuggestedOrders); document.querySelector('[data-suggestion-period]')?.addEventListener('change', event => { suggestionPeriodDays = Number(event.target.value) || 90; rerenderSuggestion(); }); document.querySelector('[data-suggestion-supplier-filter]')?.addEventListener('change', event => { suggestionSupplierFilter = event.target.value || 'all'; rerenderSuggestion(); }); document.querySelectorAll('[data-suggestion-supplier]').forEach(select => select.addEventListener('change', event => { suggestionSuppliers[event.target.dataset.suggestionSupplier] = Number(event.target.value); rerenderSuggestion(); })); document.querySelectorAll('[data-suggestion-category-supplier]').forEach(select => select.addEventListener('change', event => { const category = event.target.dataset.suggestionCategorySupplier; const supplierId = event.target.value; suggestionRows().filter(row => (row.product.categoria || 'Sem categoria') === category).forEach(row => { if (supplierId) suggestionSuppliers[row.product.id] = Number(supplierId); }); rerenderSuggestion(); })); }

document.getElementById('modalCancel').addEventListener('click', () => { document.getElementById('modalSubmit').hidden = false; document.getElementById('modalCancel').textContent = 'Cancelar'; });
