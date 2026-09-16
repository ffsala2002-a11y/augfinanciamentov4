// ================= SEGURO CELULAR =================

const OPCOES_SEGURO = [
  {
    id: 'quebra',
    icone: '📱',
    nome: 'Quebra Acidental + Oxidação',
    descricao: 'Proteção contra danos físicos e oxidação',
    percentual: 0.17 // 17%
  },
  {
    id: 'roubo',
    icone: '🛡️',
    nome: 'Roubo e Furto',
    descricao: 'Proteção contra roubo e furto qualificado',
    percentual: 0.23 // 23%
  },
  {
    id: 'combo',
    icone: '✅',
    nome: 'Combo Completo',
    descricao: 'Roubo, furto, quebra e oxidação',
    percentual: 0.27 // 27%
  }
];

const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ===== VERIFICA SE É CELULAR =====
export function isCelular(produto) {
  if (!produto) return false;
  const grupo = String(produto.grupo || '').trim();
  const desc  = String(produto.descricao || '').toUpperCase();
  return grupo === '13' || desc.includes('TEL. CEL') || desc.includes('TEL.CEL');
}

// ===== CALCULA VALOR DO SEGURO (considera quantidade) =====
export function valorSeguro(produto) {
  if (!produto?.seguro) return 0;
  const opcao = OPCOES_SEGURO.find(s => s.id === produto.seguro);
  if (!opcao) return 0;
  const preco     = Number(produto.preco)     || 0;
  const quantidade = Number(produto.quantidade) || 1;
  return preco * quantidade * opcao.percentual;
}

// ===== NOME DO SEGURO SELECIONADO =====
export function nomeSeguro(produto) {
  if (!produto?.seguro) return '';
  const s = OPCOES_SEGURO.find(s => s.id === produto.seguro);
  return s ? s.nome : '';
}

// ===== INICIALIZAR MODAL =====
export function iniciarSeguro() {
  if (document.getElementById('modalSeguro')) return;

  const modal = document.createElement('div');
  modal.id = 'modalSeguro';
  modal.className = 'modal-seguro';
  modal.innerHTML = `
    <div class="seguro-box">
      <div class="seguro-handle"></div>
      <div class="seguro-header">
        <div class="seguro-header-left">
          <span class="seguro-header-icon">🛡️</span>
          <h2 class="seguro-header-titulo">Opções de Seguro</h2>
        </div>
        <button class="seguro-remover" id="btnRemoverSeguro">Remover</button>
      </div>
      <div class="seguro-lista" id="seguroLista"></div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', e => {
    if (e.target === modal) fecharSeguro();
  });

  document.getElementById('btnRemoverSeguro').onclick = () => {
    const modal = document.getElementById('modalSeguro');
    if (modal._onSelect) modal._onSelect(null);
    fecharSeguro();
  };
}

// ===== ABRIR MODAL =====
export function abrirSeguro(produto, onSelect) {
  const modal = document.getElementById('modalSeguro');
  if (!modal) return;

  modal._onSelect = onSelect;

  const seguroAtual = produto.seguro || null;
  const preco       = Number(produto.preco)      || 0;
  const quantidade  = Number(produto.quantidade) || 1;

  const lista = document.getElementById('seguroLista');

  lista.innerHTML = OPCOES_SEGURO.map(s => {
    const ativo      = seguroAtual === s.id;
    // Valor já considera a quantidade do produto
    const valorCalc  = preco * quantidade * s.percentual;

    return `
      <div class="seguro-item ${ativo ? 'ativo' : ''}" data-id="${s.id}">
        <div class="seguro-item-icon ${ativo ? 'ativo' : ''}">${s.icone}</div>
        <div class="seguro-item-info">
          <span class="seguro-item-nome ${ativo ? 'ativo' : ''}">${s.nome}</span>
          <span class="seguro-item-desc">${s.descricao}</span>
          <span class="seguro-item-valor ${ativo ? 'ativo' : ''}">${fmt(valorCalc)}</span>
        </div>
        ${ativo ? '<div class="seguro-check">✓</div>' : ''}
      </div>
    `;
  }).join('');

  lista.querySelectorAll('.seguro-item').forEach(item => {
    item.addEventListener('click', () => {
      if (modal._onSelect) modal._onSelect(item.dataset.id);
      fecharSeguro();
    });
  });

  modal.classList.add('active');
}

// ===== FECHAR MODAL =====
export function fecharSeguro() {
  document.getElementById('modalSeguro')?.classList.remove('active');
}
