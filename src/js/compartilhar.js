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
  "https://augfinance.vercel.app";


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

        <p class="comp-pergunta">Como enviar as fotos?</p>

        <div class="comp-toggle-row">

          <button id="compModoLink" class="comp-toggle ativo">
            <span class="comp-toggle-icon"><i class="fa-solid fa-link"></i></span>
            <span>Link da galeria</span>
          </button>

          <button id="compModoFotos" class="comp-toggle">
            <span class="comp-toggle-icon"><i class="fa-solid fa-images"></i></span>
            <span>Fotos baixadas</span>
          </button>

        </div>

      </div>

      <div class="comp-opcao-section">

        <p class="comp-pergunta">Incluir plano de pagamento?</p>

        <div class="comp-toggle-row">

          <button id="compSemPlano" class="comp-toggle ativo">
            <span class="comp-toggle-icon"><i class="fa-solid fa-box"></i></span>
            <span>Só os produtos</span>
          </button>

          <button id="compComPlano" class="comp-toggle">
            <span class="comp-toggle-icon"><i class="fa-solid fa-calculator"></i></span>
            <span>Crediário</span>
          </button>

          <button id="compComCartao" class="comp-toggle">
            <span class="comp-toggle-icon"><i class="fa-solid fa-credit-card"></i></span>
            <span>Cartão</span>
          </button>

        </div>

      </div>

      <div id="compPreviewPlano" class="comp-preview-plano" style="display:none">
        <div class="comp-plano-titulo">📋 Plano atual</div>
        <div id="compPlanoInfo" class="comp-plano-info"></div>
      </div>

      <!-- botão "enviar todos" (só no modo link) -->
      <div id="compEnviarTodosWrap" class="comp-enviar-todos-wrap" style="display:none"></div>

    </div>
  `;
  
  document.body.appendChild(modal);
  
  let comPlano = false;
  let comCartao = false;
  let modoFotos = false; // false = link, true = fotos baixadas
  
  document.getElementById('fecharCompartilhar').onclick = fecharModal;
  
  modal.addEventListener('click', e => {
    if (e.target === modal) fecharModal();
  });
  
  // ===== MODO LINK =====
  document.getElementById('compModoLink').onclick = () => {
    modoFotos = false;
    ativarToggleGrupo('compModoLink', ['compModoLink', 'compModoFotos']);
    atualizarBotoesEnviarProduto(modal._imagensCache, comPlano, comCartao, false);
  };
  
  // ===== MODO FOTOS =====
  document.getElementById('compModoFotos').onclick = () => {
    modoFotos = true;
    ativarToggleGrupo('compModoFotos', ['compModoLink', 'compModoFotos']);
    atualizarBotoesEnviarProduto(modal._imagensCache, comPlano, comCartao, true);
  };
  
  // ===== SEM PLANO =====
  document.getElementById('compSemPlano').onclick = () => {
    comPlano = false;
    comCartao = false;
    ativarToggle('compSemPlano');
    document.getElementById('compPreviewPlano').style.display = 'none';
    atualizarBotoesEnviarProduto(modal._imagensCache, false, false, modoFotos);
  };
  
  // ===== CREDIÁRIO =====
  document.getElementById('compComPlano').onclick = () => {
    comPlano = true;
    comCartao = false;
    ativarToggle('compComPlano');
    document.getElementById('compPreviewPlano').style.display = 'block';
    atualizarPreviewPlano();
    atualizarBotoesEnviarProduto(modal._imagensCache, true, false, modoFotos);
  };
  
  // ===== CARTÃO =====
  document.getElementById('compComCartao').onclick = () => {
    comPlano = false;
    comCartao = true;
    ativarToggle('compComCartao');
    document.getElementById('compPreviewPlano').style.display = 'block';
    atualizarPreviewCartao();
    atualizarBotoesEnviarProduto(modal._imagensCache, false, true, modoFotos);
  };
  
  function fecharModal() {
    modal.classList.remove('active');
    comPlano = false;
    comCartao = false;
    modoFotos = false;
    ativarToggle('compSemPlano');
    ativarToggleGrupo('compModoLink', ['compModoLink', 'compModoFotos']);
    document.getElementById('compPreviewPlano').style.display = 'none';
  }
  
  document.addEventListener('click', e => {
    if (e.target.closest('#btnCompartilharFinanc')) {
      abrirCompartilharGeral();
    }
  });
}

// Ativa toggle dentro de um grupo específico
function ativarToggleGrupo(idAtivo, grupo) {
  grupo.forEach(id => {
    document.getElementById(id)?.classList.toggle('ativo', id === idAtivo);
  });
}

// Ativa toggle do plano (grupo fixo)
function ativarToggle(idAtivo) {
  ativarToggleGrupo(idAtivo, ['compSemPlano', 'compComPlano', 'compComCartao']);
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
  
  renderizarProdutos(lista, imagensCache, false, false, false);
}

// ── Renderiza lista de produtos com botão por item ────────────────────────────
function renderizarProdutos(lista, imagensCache, comPlano, comCartao, modoFotos) {
  lista.innerHTML = '';
  
  carrinho.forEach((p) => {
    const imgs = imagensCache?.[p.nce] || [placeholder];
    
    const item = document.createElement('div');
    item.className = 'comp-produto-item';
    item.dataset.nce = p.nce;
    
    const imgEl = document.createElement('img');
    imgEl.src = imgs[0];
    imgEl.onerror = () => { imgEl.src = placeholder; };
    
    const info = document.createElement('div');
    info.className = 'comp-produto-info';
    info.innerHTML = `
      <span class="comp-prod-nome">${p.descricao}</span>
      <span class="comp-prod-preco">${(p.preco * p.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
    `;
    
    item.appendChild(imgEl);
    item.appendChild(info);
    
    if (modoFotos) {
      // Modo fotos: botão individual por produto (async share precisa de button)
      const enviarEl = document.createElement('button');
      enviarEl.className = 'btn-enviar-prod';
      enviarEl.innerHTML = '<i class="fa-regular fa-images"></i> Enviar fotos';
      enviarEl.title = 'Enviar foto';
      enviarEl.addEventListener('click', () => {
        enviarProdutoComFoto(p, imagensCache, comPlano, comCartao, enviarEl);
      });
      item.appendChild(enviarEl);
    }
    
    lista.appendChild(item);
  });
  
  // Modo link: um único botão envia todos os produtos de uma vez
  renderizarBotaoEnviarTodos(imagensCache, comPlano, comCartao, modoFotos);
}

// Botão fixo "Enviar todos" — só aparece no modo link
function renderizarBotaoEnviarTodos(imagensCache, comPlano, comCartao, modoFotos) {
  const wrap = document.getElementById('compEnviarTodosWrap');
  if (!wrap) return;
  
  wrap.innerHTML = '';
  
  if (modoFotos || !carrinho.length) {
    wrap.style.display = 'none';
    return;
  }
  
  // <a href> direto: o toque é o gesto do usuário, sem bloqueio de popup
  const msg = montarMsgTodos(imagensCache, comPlano, comCartao);
  const a = document.createElement('a');
  a.className = 'btn-enviar-todos';
  a.href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.innerHTML = `<i class="fa-brands fa-whatsapp"></i> Enviar todos (${carrinho.length})`;
  
  wrap.appendChild(a);
  wrap.style.display = 'block';
}

// Atualiza os botões quando troca o modo ou o plano
function atualizarBotoesEnviarProduto(imagensCache, comPlano, comCartao, modoFotos) {
  const lista = document.getElementById('compProdutosList');
  if (!lista || !imagensCache) return;
  renderizarProdutos(lista, imagensCache, comPlano, comCartao, modoFotos);
}


// ================= PREVIEW CREDIÁRIO =================

function atualizarPreviewPlano() {
  
  const infoEl = document.getElementById('compPlanoInfo');
  
  try {
    const entrada = document.getElementById('entrada')?.value || 'R$0,00';
    const taxa = Number(document.getElementById('taxa')?.value || 9.9);
    const semJuros = document.getElementById('semJuros3x')?.checked || false;
    const parc18 = document.getElementById('parc18x')?.checked || false;
    const entradaNum = Number(entrada.replace(/\D/g, '')) / 100 || 0;
    const financiado = Math.max(pegarTotalFinanciamento() - entradaNum, 0);
    const maxParcelas = parc18 ? 18 : 12;
    
    let html = '';
    
    for (let n = 1; n <= maxParcelas; n++) {
      const sem = semJuros && n <= 3;
      const i = sem ? 0 : taxa / 100;
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
  const total = pegarTotalFinanciamento();
  
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
    const taxa = 2.94 / 100;
    const coef = (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1);
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


// ================= MONTAR MENSAGEM DE UM PRODUTO =================

function montarMsgProduto(p, imagensCache, comPlano, comCartao, incluirLink = true) {
  const garantias = JSON.parse(localStorage.getItem('garantias') || '[]');
  
  let msg = `🛒 *${p.descricao}*\n`;
  msg += p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  if (p.quantidade > 1) msg += ` × ${p.quantidade}`;
  msg += `\n`;
  
  if (p.garantia === 1 || p.garantia === 2) {
    const g = garantias.find(k => k.nce === p.nce);
    if (g) {
      const valorG = p.garantia === 1 ?
        (g.g1 || 0) * p.quantidade :
        (g.g2 || 0) * p.quantidade;
      msg += `🛡️ GE ${p.garantia}: ${valorG.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    }
  }
  
  if (incluirLink) {
    const imgs = (imagensCache?.[p.nce] || []).filter(u => u !== placeholder);
    if (imgs.length) {
      const galeriaUrl = `${BASE_URL}/page/galeria/galeria.html?nce=${p.nce}&desc=${encodeURIComponent(p.descricao)}`;
      msg += `🖼️ Ver fotos: ${galeriaUrl}\n`;
    }
  }
  
  if (comPlano) {
    const entrada = document.getElementById('entrada')?.value || 'R$0,00';
    const entradaNum = Number(entrada.replace(/\D/g, '')) / 100 || 0;
    const financiado = Math.max((p.preco * p.quantidade) - entradaNum, 0);
    const taxa = Number(document.getElementById('taxa')?.value || 9.9);
    const max = document.getElementById('parc18x')?.checked ? 18 : 12;
    const semJuros = document.getElementById('semJuros3x')?.checked || false;
    
    msg += `\n━━━━━━━━━━━━━━━━\n💳 *Crediário*\n`;
    if (entradaNum > 0) msg += `💵 Entrada: ${entradaNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    
    for (let n = 1; n <= max; n++) {
      const sem = semJuros && n <= 3;
      const i = sem ? 0 : taxa / 100;
      const coef = i === 0 ? 1 / n : (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
      msg += `${n}x de ${(financiado * coef).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${sem ? ' (sem juros)' : ''}\n`;
    }
  }
  
  if (comCartao) {
    const total = p.preco * p.quantidade;
    msg += `\n━━━━━━━━━━━━━━━━\n🏦 *Cartão*\n🟢 Sem juros:\n`;
    for (let n = 1; n <= 6; n++) {
      msg += `  ${n}x de ${(total / n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${n === 1 ? ' (à vista)' : ''}\n`;
    }
    msg += `🔴 Com juros:\n`;
    for (let n = 7; n <= 12; n++) {
      const taxa = 2.94 / 100;
      const coef = (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1);
      msg += `  ${n}x de ${(total * coef).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    }
  }
  
  msg += `\n_AUG Finance_ ✨`;
  return msg;
}


// ================= ENVIAR PRODUTO INDIVIDUAL — LINK =================

function enviarProdutoLink(p, imagensCache, comPlano, comCartao) {
  const msg = montarMsgProduto(p, imagensCache, comPlano, comCartao, true);
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}


// ================= ENVIAR PRODUTO INDIVIDUAL — FOTO =================

async function enviarProdutoComFoto(p, imagensCache, comPlano, comCartao, btn) {
  if (!navigator.canShare) {
    mostrarAlerta('Navegador não suporta compartilhamento de fotos.', 'erro', 3000);
    return;
  }
  
  const textoOriginal = btn.textContent;
  btn.textContent = '⏳';
  btn.disabled = true;
  
  try {
    const urls = (imagensCache?.[p.nce] || []).filter(u => u !== placeholder);
    const arquivos = [];
    
    for (const url of urls) {
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const ext = blob.type.includes('png') ? 'png' : 'jpg';
        arquivos.push(new File([blob], `${p.nce}_${arquivos.length + 1}.${ext}`, { type: blob.type }));
      } catch { /* ignora foto que falhar */ }
    }
    
    const msg = montarMsgProduto(p, imagensCache, comPlano, comCartao, false);
    const shareData = arquivos.length ? { text: msg, files: arquivos } : { text: msg };
    
    if (!navigator.canShare(shareData)) {
      mostrarAlerta('Não foi possível compartilhar neste dispositivo.', 'erro', 3000);
      return;
    }
    
    await navigator.share(shareData);
    btn.textContent = '✅';
    setTimeout(() => { btn.textContent = textoOriginal; }, 2000);
    
  } catch (err) {
    if (err.name !== 'AbortError') {
      mostrarAlerta('Erro ao compartilhar. Tente o modo link.', 'erro', 3000);
    }
    btn.textContent = textoOriginal;
  } finally {
    btn.disabled = false;
  }
}


// ================= ENVIAR TODOS (sequencial) =================

async function enviarTodos(imagensCache, comPlano, comCartao, modoFotos) {
  if (!carrinho.length) return;
  
  if (modoFotos && carrinho.length > 2) {
    mostrarAlerta(
      '⚠️ Envio de fotos pelo botão geral é limitado a 2 produtos por vez. Use o botão 📸 individual de cada produto.',
      'erro',
      5000
    );
    return;
  }
  
  if (modoFotos) {
    // Fotos: dispara um por um via share (precisa de interação do usuário por produto)
    const btns = document.querySelectorAll('#compProdutosList .btn-enviar-prod');
    for (const btn of btns) btn.click();
  } else {
    // Links: cada botão 📲 já é um <a href> direto — basta orientar o usuário a tocar em cada um
    mostrarAlerta(
      `Toque no botão 📲 de cada produto para enviar — ${carrinho.length} produto${carrinho.length > 1 ? 's' : ''}`,
      'info',
      4000
    );
    // Destaca visualmente os botões de envio
    document.querySelectorAll('#compProdutosList .btn-enviar-prod').forEach(el => {
      el.style.transform = 'scale(1.25)';
      setTimeout(() => { el.style.transform = ''; }, 2000);
    });
  }
}


// ================= WHATSAPP (legado — mantido para compatibilidade) =================

function enviarWhatsApp(imagensCache, comPlano, comCartao) {
  const msg = montarMsgTodos(imagensCache, comPlano, comCartao);
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// Monta UMA mensagem com todos os produtos do carrinho (+ plano/cartão se marcado)
function montarMsgTodos(imagensCache, comPlano, comCartao) {
  
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
        const valorG = p.garantia === 1 ?
          (g.g1 || 0) * p.quantidade :
          (g.g2 || 0) * p.quantidade;
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
    const entrada = document.getElementById('entrada')?.value || 'R$0,00';
    const entradaNum = Number(entrada.replace(/\D/g, '')) / 100 || 0;
    const financiado = Math.max(pegarTotalFinanciamento() - entradaNum, 0);
    const taxa = Number(document.getElementById('taxa')?.value || 9.9);
    const max = document.getElementById('parc18x')?.checked ? 18 : 12;
    const semJuros = document.getElementById('semJuros3x')?.checked || false;
    
    msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💳 *Plano de Pagamento (Crediário)*\n`;
    if (entradaNum > 0) {
      msg += `💵 Entrada: ${entradaNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    }
    
    for (let n = 1; n <= max; n++) {
      const sem = semJuros && n <= 3;
      const i = sem ? 0 : taxa / 100;
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
    
    msg += `\n🔴 Com juros:\n`;
    
    for (let n = 7; n <= 12; n++) {
      const taxa = 2.94 / 100;
      const coef = (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1);
      const parcela = total * coef;
      msg += `  ${n}x de ${parcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}, (com juros)\n`;
    }
  }
  
  msg += `\n_AUG Finance_ ✨`;
  
  return msg;
}


// ================= ENVIAR COM FOTOS BAIXADAS =================

async function enviarComFotos(imagensCache, comPlano, comCartao) {
  
  // Monta o texto igual ao modo link (sem os links de galeria)
  const garantias = JSON.parse(localStorage.getItem('garantias') || '[]');
  let msg = `🛒 *Produtos selecionados*\n`;
  
  carrinho.forEach((p, i) => {
    msg += `\n*${i + 1}. ${p.descricao}*\n`;
    msg += p.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (p.quantidade > 1) msg += ` × ${p.quantidade}`;
    msg += `\n`;
    
    if (p.garantia === 1 || p.garantia === 2) {
      const g = garantias.find(k => k.nce === p.nce);
      if (g) {
        const valorG = p.garantia === 1 ?
          (g.g1 || 0) * p.quantidade :
          (g.g2 || 0) * p.quantidade;
        msg += `🛡️ GE ${p.garantia}: ${valorG.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
      }
    }
  });
  
  if (comPlano) {
    const entrada = document.getElementById('entrada')?.value || 'R$0,00';
    const entradaNum = Number(entrada.replace(/\D/g, '')) / 100 || 0;
    const financiado = Math.max(pegarTotalFinanciamento() - entradaNum, 0);
    const taxa = Number(document.getElementById('taxa')?.value || 9.9);
    const max = document.getElementById('parc18x')?.checked ? 18 : 12;
    const semJuros = document.getElementById('semJuros3x')?.checked || false;
    
    msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n💳 *Plano de Pagamento (Crediário)*\n`;
    if (entradaNum > 0) msg += `💵 Entrada: ${entradaNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    
    for (let n = 1; n <= max; n++) {
      const sem = semJuros && n <= 3;
      const i = sem ? 0 : taxa / 100;
      const coef = i === 0 ? 1 / n : (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
      const parcela = financiado * coef;
      msg += `${n}x de ${parcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${sem ? ' (sem juros)' : ''}\n`;
    }
  }
  
  if (comCartao) {
    const total = pegarTotalFinanciamento();
    msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━\n🏦 *Parcelamento no Cartão*\n\n🟢 Sem juros:\n`;
    for (let n = 1; n <= 6; n++) {
      msg += `  ${n}x de ${(total / n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}${n === 1 ? ' (à vista)' : ''}\n`;
    }
    msg += `\n🔴 Com juros:\n`;
    for (let n = 7; n <= 12; n++) {
      const taxa = 2.94 / 100;
      const coef = (taxa * Math.pow(1 + taxa, n)) / (Math.pow(1 + taxa, n) - 1);
      msg += `  ${n}x de ${(total * coef).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}\n`;
    }
  }
  
  msg += `\n_AUG Finance_ ✨`;
  
  // Verifica suporte à Web Share API com arquivos
  if (!navigator.canShare) {
    mostrarAlerta('Seu navegador não suporta compartilhamento de fotos. Use o modo "Link da galeria".', 'erro', 4000);
    return;
  }
  
  const btn = document.getElementById('btnEnviarWhats');
  const textoOriginal = btn.textContent;
  btn.textContent = '⏳ Baixando fotos...';
  btn.disabled = true;
  
  try {
    // Baixa todas as imagens (primeira foto de cada produto) como File
    const arquivos = await Promise.all(
      carrinho.map(async (p, i) => {
        const urls = (imagensCache?.[p.nce] || []).filter(u => u !== placeholder);
        if (!urls.length) return null;
        
        try {
          const resp = await fetch(urls[0]);
          const blob = await resp.blob();
          const ext = blob.type.includes('png') ? 'png' : 'jpg';
          return new File([blob], `produto_${i + 1}_${p.nce}.${ext}`, { type: blob.type });
        } catch {
          return null;
        }
      })
    );
    
    const fotos = arquivos.filter(Boolean);
    
    if (!fotos.length) {
      mostrarAlerta('Nenhuma foto disponível para compartilhar.', 'erro', 3000);
      return;
    }
    
    const shareData = { text: msg, files: fotos };
    
    if (!navigator.canShare(shareData)) {
      mostrarAlerta('Não foi possível compartilhar as fotos neste dispositivo.', 'erro', 3000);
      return;
    }
    
    await navigator.share(shareData);
    
  } catch (err) {
    if (err.name !== 'AbortError') {
      mostrarAlerta('Erro ao compartilhar fotos. Tente o modo "Link da galeria".', 'erro', 3000);
    }
  } finally {
    btn.textContent = textoOriginal;
    btn.disabled = false;
  }
}