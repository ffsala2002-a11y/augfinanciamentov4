// Importa função de cálculo do financiamento
import { calcularTotal } from './calculo.js';

// Importa o carrinho atual
import { carrinho } from './carrinho.js';

// Importa função que busca imagens dos produtos
import { pegarImagens } from './imagens.js';

// Importa cálculo das garantias
import { calcularGarantiaTotal } from './garantias.js';

// Importação da função alerta
import mostrarAlerta from '../../main.js';


// Imagem padrão caso o produto não tenha foto
const placeholder =
  "https://raw.githubusercontent.com/ffsala2002-a11y/produtos-imagens/main/img-produtos/sem_img.png";


// URL base do projeto
const BASE_URL =
  "https://ffsala2002-a11y.github.io/augfinanciamentov4";


// ================= TOTAL COM GARANTIA =================

function pegarTotalFinanciamento() {

  const totalProdutos =
    carrinho.reduce(
      (acc, p) => acc + (p.preco * p.quantidade),
      0
    );

  const totalGarantia =
    calcularGarantiaTotal(carrinho) || 0;

  return totalProdutos + totalGarantia;
}


// ================= MODAL =================

export function iniciarCompartilhar() {

  if (document.getElementById('modalCompartilhar')) return;

  const modal = document.createElement('div');
  modal.id = 'modalCompartilhar';
  modal.className = 'modal-compartilhar';

  modal.innerHTML = `
    <div class="comp-box">

      <div class="comp-handle"></div>

      <button class="comp-fechar" id="fecharCompartilhar">✕</button>

      <p class="comp-titulo">Compartilhar Produtos</p>

      <div id="compProdutosList" class="comp-produtos-list"></div>

      <div class="comp-opcao-section">

        <p class="comp-pergunta">Incluir plano de pagamento?</p>

        <div class="comp-toggle-row">

          <button id="compSemPlano" class="comp-toggle ativo">
            <span class="comp-toggle-icon">📦</span>
            <span>Só os produtos</span>
          </button>

          <button id="compComPlano" class="comp-toggle">
            <span class="comp-toggle-icon">💳</span>
            <span>Crediário</span>
          </button>

          <button id="compComCartao" class="comp-toggle">
            <span class="comp-toggle-icon">🏦</span>
            <span>Cartão</span>
          </button>

        </div>

      </div>

      <div id="compPreviewPlano" class="comp-preview-plano" style="display:none">
        <div class="comp-plano-titulo">📋 Plano atual</div>
        <div id="compPlanoInfo" class="comp-plano-info"></div>
      </div>

      <button id="btnEnviarWhats" class="btn-enviar-whats">
        Enviar no WhatsApp
      </button>

    </div>
  `;

  document.body.appendChild(modal);

  let comPlano  = false;
  let comCartao = false;

  document.getElementById('fecharCompartilhar').onclick = fecharModal;

  modal.addEventListener('click', e => {
    if (e.target === modal) fecharModal();
  });

  // ===== SEM PLANO =====
  document.getElementById('compSemPlano').onclick = () => {
    comPlano  = false;
    comCartao = false;
    ativarToggle('compSemPlano');
    document.getElementById('compPreviewPlano').style.display = 'none';
  };

  // ===== CREDIÁRIO =====
  document.getElementById('compComPlano').onclick = () => {
    comPlano  = true;
    comCartao = false;
    ativarToggle('compComPlano');
    document.getElementById('compPreviewPlano').style.display = 'block';
    atualizarPreviewPlano();
  };

  // ===== CARTÃO =====
  document.getElementById('compComCartao').onclick = () => {
    comPlano  = false;
    comCartao = true;
    ativarToggle('compComCartao');
    document.getElementById('compPreviewPlano').style.display = 'block';
    atualizarPreviewCartao();
  };

  // WhatsApp
  document.getElementById('btnEnviarWhats').onclick = () => {
    enviarWhatsApp(modal._imagensCache, comPlano, comCartao);
  };

  function fecharModal() {
    modal.classList.remove('active');
    comPlano  = false;
    comCartao = false;
    ativarToggle('compSemPlano');
    document.getElementById('compPreviewPlano').style.display = 'none';
  }

  document.addEventListener('click', e => {
    if (e.target.closest('#btnCompartilharFinanc')) {
      abrirCompartilharGeral();
    }
  });
}

// Ativa toggle e desativa os outros
function ativarToggle(idAtivo) {
  ['compSemPlano', 'compComPlano', 'compComCartao'].forEach(id => {
    document.getElementById(id)?.classList.toggle('ativo', id === idAtivo);
  });
}


// ================= ABRIR MODAL =================

async function abrirCompartilharGeral() {

  if (!carrinho.length) {
    mostrarAlerta("Adicione produtos ao carrinho primeiro", "erro", 3000);
    return;
  }

  const modal = document.getElementById('modalCompartilhar');
  const lista = document.getElementById('compProdutosList');

  lista.innerHTML = '<p>Carregando imagens...</p>';
  modal.classList.add('active');

  const imagensCache = {};

  await Promise.all(
    carrinho.map(async p => {
      try {
        const imgs = await pegarImagens(p.nce);
        imagensCache[p.nce] = imgs.length ? imgs : [placeholder];
      } catch {
        imagensCache[p.nce] = [placeholder];
      }
    })
  );

  modal._imagensCache = imagensCache;

  lista.innerHTML = carrinho.map(p => {
    const imgs = imagensCache[p.nce] || [placeholder];
    return `
      <div class="comp-produto-item">
        <img src="${imgs[0]}" onerror="this.src='${placeholder}'">
        <div>
          ${p.descricao}<br>
          ${(p.preco * p.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </div>
      </div>
    `;
  }).join('');
}


// ================= PREVIEW CREDIÁRIO =================

function atualizarPreviewPlano() {

  const infoEl = document.getElementById('compPlanoInfo');

  try {
    const entrada   = document.getElementById('entrada')?.value || 'R$0,00';
    const taxa      = Number(document.getElementById('taxa')?.value || 9.9);
    const semJuros  = document.getElementById('semJuros3x')?.checked || false;
    const parc18    = document.getElementById('parc18x')?.checked || false;
    const entradaNum = Number(entrada.replace(/\D/g, '')) / 100 || 0;
    const financiado = Math.max(pegarTotalFinanciamento() - entradaNum, 0);
    const maxParcelas = parc18 ? 18 : 12;

    let html = '';

    for (let n = 1; n <= maxParcelas; n++) {
      const sem  = semJuros && n <= 3;
      const i    = sem ? 0 : taxa / 100;
      const coef = i === 0 ? 1 / n : (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
      const parcela = financiado * coef;

      html += `
        <div class="plano-row">
          <span>${n}x${sem ? ' (sem juros)' : ''}</span>
          <strong>${parcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
        </div>
      `;
    }

    infoEl.innerHTML = html;

  } catch {
    infoEl.innerHTML = "Configure o simulador";
  }
}


// ================= PREVIEW CARTÃO =================

function atualizarPreviewCartao() {

  const infoEl = document.getElementById('compPlanoInfo');
  const total  = pegarTotalFinanciamento();

  let html = '<div class="comp-plano-titulo" style="margin-bottom:6px">🟢 Sem juros (1x–6x)</div>';

  for (let n = 1; n <= 6; n++) {
    const parcela = total / n;
    html += `
      <div class="plano-row">
        <span>${n}x${n === 1 ? ' (à vista)' : ''}</span>
        <strong>${parcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
      </div>
    `;
  }

  html += '<div class="comp-plano-titulo" style="margin:10px 0 6px">🔴 Com juros 2,94% a.m. (7x–12x)</div>';

  for (let n = 7; n <= 12; n++) {
    const taxa  = 2.94 / 100;
    const coef  = (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1);
    const parcela = total * coef;
    html += `
      <div class="plano-row">
        <span>${n}x</span>
        <strong>${parcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
      </div>
    `;
  }

  infoEl.innerHTML = html;
}


// ================= WHATSAPP =================

function enviarWhatsApp(imagensCache, comPlano, comCartao) {

  const garantias = JSON.parse(localStorage.getItem('garantias') || '[]');

  let msg = `🛒 *Produtos selecionados*\n`;

  carrinho.forEach((p, i) => {

    msg += `\n*${i + 1}. ${p.descricao}*\n`;
    msg += p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (p.quantidade > 1) msg += ` × ${p.quantidade}`;
    msg += `\n`;

    // Garantia selecionada
    if (p.garantia === 1 || p.garantia === 2) {
      const g = garantias.find(k => k.nce === p.nce);
      if (g) {
        const valorG = p.garantia === 1
          ? (g.g1 || 0) * p.quantidade
          : (g.g2 || 0) * p.quantidade;
        msg += `🛡️ GE ${p.garantia}: ${valorG.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
      }
    }

    // Link da galeria
    const imgs = (imagensCache?.[p.nce] || []).filter(u => u !== placeholder);
    if (imgs.length > 0) {
      const descEncoded = encodeURIComponent(p.descricao);
      const galeriaUrl = `${BASE_URL}/page/galeria/galeria.html?nce=${p.nce}&desc=${descEncoded}`;
      msg += `🖼️ Ver fotos: ${galeriaUrl}\n`;
    }
  });

  // ===== CREDIÁRIO =====
  if (comPlano) {
    const entrada    = document.getElementById('entrada')?.value || 'R$0,00';
    const entradaNum = Number(entrada.replace(/\D/g, '')) / 100 || 0;
    const financiado = Math.max(pegarTotalFinanciamento() - entradaNum, 0);
    const taxa       = Number(document.getElementById('taxa')?.value || 9.9);
    const max        = document.getElementById('parc18x')?.checked ? 18 : 12;
    const semJuros   = document.getElementById('semJuros3x')?.checked || false;

    msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💳 *Plano de Pagamento (Crediário)*\n`;
    if (entradaNum > 0) {
      msg += `💵 Entrada: ${entradaNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    }

    for (let n = 1; n <= max; n++) {
      const sem  = semJuros && n <= 3;
      const i    = sem ? 0 : taxa / 100;
      const coef = i === 0 ? 1 / n : (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
      const parcela = financiado * coef;
      msg += `${n}x de ${parcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${sem ? ' (sem juros)' : ''}\n`;
    }
  }

  // ===== CARTÃO =====
  if (comCartao) {
    const total = pegarTotalFinanciamento();

    msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🏦 *Parcelamento no Cartão*\n`;
    msg += `\n🟢 Sem juros:\n`;

    for (let n = 1; n <= 6; n++) {
      const parcela = total / n;
      msg += `  ${n}x de ${parcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${n === 1 ? ' (à vista)' : ''}\n`;
    }

    msg += `\n🔴 Com juros 2,94% a.m.:\n`;

    for (let n = 7; n <= 12; n++) {
      const taxa    = 2.94 / 100;
      const coef    = (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1);
      const parcela = total * coef;
      msg += `  ${n}x de ${parcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    }
  }

  msg += `\n_AUG Financeira_ ✨`;

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}
