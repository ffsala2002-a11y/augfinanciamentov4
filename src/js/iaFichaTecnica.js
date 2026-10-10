// BUILD: FICHA-IA-v5-CACHE
// ============================================================
// FICHA TÉCNICA IA
// ✅ Fixes aplicados:
//   1. Endpoint corrigido → ficha-tecnica-ia
//   2. Header Authorization: Bearer adicionado
//   3. setState() usa style.display (fix especificidade CSS)
//   4. Cache por NCE: consulta banco antes de chamar Groq
//   5. inicializarBotoesFicha() — atualiza botões ao carregar
// ============================================================

import { SUPABASE_ANON_KEY } from './supabase.js';

const SUPABASE_URL  = 'https://fkykscrjucytptwfgvrd.supabase.co';
const IA_ENDPOINT   =
  window.AUG_IA_CONFIG?.endpoint ||
  `${SUPABASE_URL}/functions/v1/ficha-tecnica-ia`;

const FICHAS_REST = `${SUPABASE_URL}/rest/v1/fichas_tecnicas`;

const HEADERS_ANON = {
  'apikey':        SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
};

let produtoAtualIA = null;
let imagemAtualIA  = '';

const $ = id => document.getElementById(id);

// ─── Helpers ─────────────────────────────────────────────────

function escapeHtml(v) {
  return String(v ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function asArray(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (v == null || v === '') return [];
  return [String(v)];
}

// ─── Modal ───────────────────────────────────────────────────

function openModal() {
  const modal = $('modalFichaTecnicaIA');
  if (!modal) return;
  modal.removeAttribute('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('ia-modal-open');
}

function closeModal() {
  const modal = $('modalFichaTecnicaIA');
  if (!modal) return;
  modal.setAttribute('hidden', '');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('ia-modal-open');
}

// ✅ style.display evita conflito com .ia-state { display: flex }
function setState(state) {
  $('iaFichaLoading').style.display  = state === 'loading' ? 'flex'  : 'none';
  $('iaFichaErro').style.display     = state === 'error'   ? 'flex'  : 'none';
  $('iaFichaConteudo').style.display = state === 'content' ? 'block' : 'none';
}

function resetContent() {
  ['iaFichaProduto','iaFichaResumo','iaFichaConfianca'].forEach(id => {
    const el = $(id); if (el) el.textContent = '';
  });
  ['iaFichaBadges','iaFichaMeta','iaFichaDestaques','iaFichaSpecs',
   'iaFichaConteudoEmbalagem','iaFichaCompatibilidade',
   'iaFichaObservacoes','iaFichaFontes'].forEach(id => {
    const el = $(id); if (el) el.innerHTML = '';
  });
}

// ─── Render ──────────────────────────────────────────────────

function renderList(targetId, values, emptyText = 'Não informado') {
  const el   = $(targetId);
  if (!el) return;
  const list = asArray(values);
  el.innerHTML = list.length
    ? list.map(item => `<li>${escapeHtml(item)}</li>`).join('')
    : `<li class="ia-empty">${escapeHtml(emptyText)}</li>`;
}

function renderFicha(data, produto, imagem, fromCache = false) {
  resetContent();

  const nome = data.nome || produto.descricao || 'Produto';

  if ($('iaFichaTitulo'))  $('iaFichaTitulo').textContent  = 'Ficha técnica';
  if ($('iaFichaProduto')) $('iaFichaProduto').textContent = nome;
  if ($('iaFichaResumo'))  $('iaFichaResumo').textContent  = data.resumo || '';

  const img = $('iaFichaImagem');
  if (img) {
    img.src           = imagem || '';
    img.alt           = nome;
    img.style.display = imagem ? 'block' : 'none';
  }

  // Badge: ficha do banco vs gerada agora
  const badge = $('iaFichaCacheBadge');
  if (badge) {
    badge.style.display = fromCache ? 'inline-flex' : 'none';
    badge.textContent   = '✓ Ficha salva';
    badge.title         = 'Carregada do banco — sem consumo de tokens. Clique em "Atualizar ficha" para regenerar.';
  }

  // Badges categoria/marca/modelo
  const badges = [];
  if (data.categoria) badges.push(`<span>${escapeHtml(data.categoria)}</span>`);
  if (data.marca)     badges.push(`<span>${escapeHtml(data.marca)}</span>`);
  if (data.modelo)    badges.push(`<span>${escapeHtml(data.modelo)}</span>`);
  if ($('iaFichaBadges')) $('iaFichaBadges').innerHTML = badges.join('');

  // Meta
  const meta = [
    ['NCE',     produto.nce   || '—'],
    ['Grupo',   produto.grupo || '—'],
    ['Cor',     produto.cor   || '—'],
    ['Estoque', produto.saldo ?? '—'],
  ];
  if ($('iaFichaMeta'))
    $('iaFichaMeta').innerHTML = meta.map(([l, v]) => `
      <div class="ia-meta-item">
        <span>${escapeHtml(l)}</span>
        <strong>${escapeHtml(v)}</strong>
      </div>`).join('');

  // Destaques
  const destaques = asArray(data.destaques);
  if ($('iaFichaDestaques'))
    $('iaFichaDestaques').innerHTML = destaques.length
      ? destaques.map(d => `
          <div class="ia-highlight">
            <i class="fa-solid fa-check"></i>
            <span>${escapeHtml(d)}</span>
          </div>`).join('')
      : '<div class="ia-highlight ia-empty"><i class="fa-solid fa-minus"></i><span>Não informado</span></div>';

  // Especificações
  const specs       = data.especificacoes || {};
  const specEntries = Object.entries(specs)
    .filter(([, v]) => v != null && String(v).trim() !== '' && String(v) !== 'Não informado');
  if ($('iaFichaSpecs'))
    $('iaFichaSpecs').innerHTML = specEntries.length
      ? specEntries.map(([k, v]) => `
          <div class="ia-spec">
            <span>${escapeHtml(k)}</span>
            <strong>${escapeHtml(v)}</strong>
          </div>`).join('')
      : '<div class="ia-spec ia-empty"><span>Especificações</span><strong>Não informado</strong></div>';

  renderList('iaFichaConteudoEmbalagem', data.conteudo_embalagem);
  renderList('iaFichaCompatibilidade',   data.compatibilidade);
  renderList('iaFichaObservacoes',       data.observacoes);

  // Fontes
  const fontes = Array.isArray(data.fontes) ? data.fontes : [];
  if ($('iaFichaFontes'))
    $('iaFichaFontes').innerHTML = fontes.length
      ? fontes.map(f => `
          <a href="${escapeHtml(f.url)}" target="_blank" rel="noopener noreferrer">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
            <span>${escapeHtml(f.titulo || f.url)}</span>
          </a>`).join('')
      : '<span class="ia-empty">Nenhuma fonte externa registrada.</span>';

  if ($('iaFichaConfianca'))
    $('iaFichaConfianca').textContent =
      `${data.confianca || 'Não avaliada'}. Confirme dados críticos com o fabricante.`;
}

// ─── Banco de dados (leitura anon) ───────────────────────────

/**
 * Retorna Set com os NCEs que já têm ficha salva no banco.
 */
async function buscarNcesComFicha(nces) {
  const validos = nces.filter(Boolean);
  if (!validos.length) return new Set();
  try {
    const query = `select=nce&nce=in.(${validos.map(encodeURIComponent).join(',')})`;
    const res   = await fetch(`${FICHAS_REST}?${query}`, { headers: HEADERS_ANON });
    if (!res.ok) return new Set();
    const rows = await res.json();
    return new Set((rows || []).map(r => String(r.nce)));
  } catch {
    return new Set();
  }
}

/**
 * Lê a ficha de um NCE específico direto do banco.
 */
async function lerFichaDoCache(nce) {
  const res = await fetch(
    `${FICHAS_REST}?nce=eq.${encodeURIComponent(nce)}&select=ficha&limit=1`,
    { headers: HEADERS_ANON }
  );
  if (!res.ok) throw new Error('Erro ao ler ficha do banco.');
  const rows = await res.json();
  if (!rows?.length || !rows[0].ficha) throw new Error('Ficha não encontrada no banco.');
  return rows[0].ficha;
}

// ─── Botões do carrinho ──────────────────────────────────────

/**
 * Chame após renderizar os cards do carrinho.
 * Consulta o banco em lote e atualiza o visual de cada botão.
 */
export async function inicializarBotoesFicha() {
  const cards = document.querySelectorAll('.item[data-nce]');
  if (!cards.length) return;

  const nces     = [...cards].map(c => c.dataset.nce).filter(Boolean);
  const comFicha = await buscarNcesComFicha(nces);

  cards.forEach(card => {
    const nce = card.dataset.nce;
    const btn = card.querySelector('.btn-ficha-ia');
    if (!btn) return;

    if (nce && comFicha.has(nce)) {
      btn.dataset.modo = 'cache';
      btn.title        = 'Ver ficha técnica salva';
      btn.setAttribute('aria-label', 'Ver ficha técnica');

      const label = btn.querySelector('.btn-ficha-label');
      if (label) label.textContent = 'Ver Ficha';

      const icon = btn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-file-lines';

    } else {
      btn.dataset.modo = 'gerar';
      btn.title        = 'Gerar ficha técnica com IA';
      btn.setAttribute('aria-label', 'Gerar ficha técnica com IA');

      const label = btn.querySelector('.btn-ficha-label');
      if (label) label.textContent = 'Ficha IA';

      const icon = btn.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-wand-magic-sparkles';
    }
  });
}

// ─── Geração via Edge Function ───────────────────────────────

async function gerarFichaTecnica(produto, imagem = '', forceRefresh = false) {
  produtoAtualIA = produto;
  imagemAtualIA  = imagem || '';

  openModal();
  setState('loading');

  try {
    const response = await fetch(IA_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...HEADERS_ANON },
      body: JSON.stringify({
        produto: {
          descricao: produto.descricao || '',
          nce:       produto.nce       || '',
          grupo:     produto.grupo     || '',
          cor:       produto.cor       || '',
          saldo:     produto.saldo     ?? null,
        },
        forceRefresh,
      }),
    });

    let payload = {};
    try   { payload = await response.json(); }
    catch { throw new Error('O servidor retornou uma resposta inválida.'); }

    if (!response.ok)
      throw new Error(payload.error || `Erro ${response.status} ao consultar a IA.`);

    const ficha = payload.ficha ?? (payload.nome ? payload : null);
    if (!ficha) throw new Error('Resposta da IA sem ficha técnica.');

    renderFicha(ficha, produto, imagemAtualIA, payload.cache === true);
    setState('content');

    // Após gerar e salvar, atualiza o botão do card para "Ver Ficha"
    if (!payload.cache && produto.nce) {
      const card = document.querySelector(`.item[data-nce="${CSS.escape(produto.nce)}"]`);
      const btn  = card?.querySelector('.btn-ficha-ia');
      if (btn) {
        btn.dataset.modo = 'cache';
        const label = btn.querySelector('.btn-ficha-label');
        if (label) label.textContent = 'Ver Ficha';
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-file-lines';
      }
    }

  } catch (error) {
    console.error('[Ficha IA]', error);
    if ($('iaFichaErroTexto'))
      $('iaFichaErroTexto').textContent =
        error?.message || 'Não foi possível gerar a ficha técnica.';
    setState('error');
  }
}

// ─── Abre ficha a partir de um card ──────────────────────────

async function abrirFichaDoCard(card, forceRefresh = false) {
  const nce  = card?.dataset.nce || '';
  const btn  = card?.querySelector('.btn-ficha-ia');
  const modo = btn?.dataset.modo || 'gerar';

  const modulo  = await import('./carrinho.js');
  const produto = modulo.carrinho.find(p => String(p.nce) === String(nce));
  if (!produto) throw new Error('Produto não encontrado no carrinho.');

  const img = card.querySelector('.img-produto')?.src || '';

  if (modo === 'cache' && !forceRefresh) {
    // Tem ficha → lê direto do banco sem chamar Groq
    openModal();
    setState('loading');
    try {
      const ficha = await lerFichaDoCache(nce);
      produtoAtualIA = produto;
      imagemAtualIA  = img;
      renderFicha(ficha, produto, img, true);
      setState('content');
    } catch {
      // Cache falhou → gera normalmente
      await gerarFichaTecnica(produto, img);
    }
  } else {
    await gerarFichaTecnica({ ...produto }, img, forceRefresh);
  }
}

// ─── Listeners globais ────────────────────────────────────────

document.addEventListener('click', async event => {

  // Botão de ficha nos cards
  const btnFicha = event.target.closest('.btn-ficha-ia');
  if (btnFicha) {
    event.preventDefault();
    event.stopPropagation();

    const card = btnFicha.closest('.item');
    if (!card) return;

    btnFicha.disabled = true;
    btnFicha.classList.add('loading');

    try {
      await abrirFichaDoCard(card);
    } catch (error) {
      console.error('[Ficha IA]', error);
      openModal();
      if ($('iaFichaErroTexto'))
        $('iaFichaErroTexto').textContent = error.message || 'Erro ao abrir a ficha.';
      setState('error');
    } finally {
      btnFicha.disabled = false;
      btnFicha.classList.remove('loading');
    }
    return;
  }

  // Botão "Atualizar ficha" (forceRefresh)
  if (event.target.closest('#iaFichaAtualizar')) {
    event.preventDefault();
    if (produtoAtualIA) await gerarFichaTecnica(produtoAtualIA, imagemAtualIA, true);
    return;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  $('fecharFichaTecnicaIA')?.addEventListener('click', closeModal);
  document.querySelector('[data-ia-close]')?.addEventListener('click', closeModal);

  $('iaFichaTentarNovamente')?.addEventListener('click', () => {
    if (produtoAtualIA) gerarFichaTecnica(produtoAtualIA, imagemAtualIA);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('modalFichaTecnicaIA')?.hasAttribute('hidden'))
      closeModal();
  });
});

export { gerarFichaTecnica };
