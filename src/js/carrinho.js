// Imports principais do sistema
import { fmt } from './util.js';
import { pegarImagens } from './imagens.js';
import { renderFinanciamento } from './financiamento.js';
import { renderCartao } from './cartao.js';
import {
  isCelular,
  iniciarSeguro,
  abrirSeguro,
  valorSeguro,
  nomeSeguro
} from './seguro.js';

// Inicia modal de seguro
iniciarSeguro();

// Carrinho salvo no localStorage
export let carrinho =
  JSON.parse(localStorage.getItem('carrinho')) || [];

// Imagem padrão caso não exista imagem do produto
const placeholder =
  "https://raw.githubusercontent.com/ffsala2002-a11y/produtos-imagens/main/img-produtos/sem_img.png";

// Cache das imagens já carregadas
const cacheImagens = {};

// Busca imagem do produto
async function getImagem(nce) {

  if (cacheImagens[nce]) {
    return cacheImagens[nce];
  }

  const imgs = await pegarImagens(nce);

  cacheImagens[nce] = imgs;

  return imgs;
}

// Salva carrinho no localStorage
export function salvarCarrinho() {

  localStorage.setItem(
    'carrinho',
    JSON.stringify(carrinho)
  );
}

// Adiciona produto ao carrinho
export function adicionarCarrinho(produto) {

  const produtoPadrao = {
    descricao: produto.descricao || "",
    nce: produto.nce || "",
    grupo: produto.grupo || "",
    saldo: Number(produto.saldo || 0),
    cor: produto.cor || "",
    preco: Number(produto.preco) || 0
  };

  const produtoExistente =
    carrinho.find(
      p => p.nce === produtoPadrao.nce
    );

  if (produtoExistente) {

    produtoExistente.quantidade += 1;

  } else {

    carrinho.push({
      ...produtoPadrao,
      quantidade: 1,
      garantia: 0,
      seguro: null // ← campo seguro
    });
  }

  salvarCarrinho();
  render();
  renderFinanciamento();
}

// Limpa todo carrinho
export function limparCarrinho() {

  carrinho.length = 0;
  salvarCarrinho();
  render();
  renderFinanciamento();
}

// Timeout do render
let renderTimeout;

// Renderização segura
function renderSafe() {

  clearTimeout(renderTimeout);

  renderTimeout = setTimeout(() => {
    render();
    renderFinanciamento();
    renderCartao();
  }, 10);
}

// Renderiza carrinho na tela
export function render() {

  const lista =
    document.getElementById('lista');

  if (!lista) return;

  lista.innerHTML = '';

  const garantias =
    JSON.parse(
      localStorage.getItem('garantias') || '[]'
    );

  carrinho.forEach((p, index) => {

    const div =
      document.createElement('div');

    div.classList.add('item');

    const g =
      garantias.find(k => k.nce === p.nce);

    const valorG1 =
      g ? (g.g1 || 0) * p.quantidade : 0;

    const valorG2 =
      g ? (g.g2 || 0) * p.quantidade : 0;

    // Total do item incluindo seguro
    const totalItem =
      (Number(p.preco) * Number(p.quantidade)) /*+
      valorSeguro(p);*/

    // Label do botão seguro
    const labelSeguro = p.seguro
      ? `✓ ${nomeSeguro(p)}`
      : '🛡️ Opções de Seguro';

    div.innerHTML = `
      <div>
    
        <div class="box-img-card">

          <img
            class="img-produto"
            src="${placeholder}"
            data-nce="${p.nce}"
            onerror="this.src='${placeholder}'">

        </div>

        <div class="box-descricao">

          <p class="descricao">
            ${p.descricao}
          </p>

        </div>

        <div class="info-produto">

          <small class="NCE">
            NCE: <span>${p.nce}</span>
          </small>

          <small class="grupo">
            Grupo:
            <strong>${p.grupo || "-"}</strong>
          </small>

          <small class="saldo">
            Saldo:
            <strong>${p.saldo ?? "-"}</strong>
          </small>

          <small class="cor">
            🎨: ${p.cor || "-"}
          </small>

        </div>

        <div class="box-quantidade">

          <div class="quantidade">
            Quantidade:
            <span>${p.quantidade}</span>
          </div>

          <div class="buttons">
            <button class="btn-minus">−</button>
            <button class="btn-plus">+</button>
          </div>

        </div>

        <div class="garantia-item">

          <button
            class="btn-garantia ${p.garantia === 1 ? 'ativo' : ''}"
            data-valor="1">
            <span class="description">🛡️ GE 1</span>
            <span>${fmt(valorG1)}</span>
          </button>

          <button
            class="btn-garantia ${p.garantia === 2 ? 'ativo' : ''}"
            data-valor="2">
            <span class="description">🛡️ GE 2</span>
            <span>${fmt(valorG2)}</span>
          </button>

        </div>

        ${isCelular(p) ? `
          <button class="btn-seguro-celular ${p.seguro ? 'selecionado' : ''}">
            ${labelSeguro}
            ${p.seguro
          ? `<span style="font-size:11px;opacity:0.85;margin-left:4px;">${fmt(valorSeguro(p))}</span>`
          : ''}
          </button>
        ` : ''}

        <div>

          <strong class="valor-total">

            <span>Preço</span>

            ${totalItem.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          })}

          </strong>

        </div>

      </div>
    `;

    // Carrega imagem do produto
    setTimeout(async () => {

      const imgEl =
        div.querySelector('.img-produto');

      if (!imgEl) return;

      try {
        const imgs = await getImagem(p.nce);
        imgEl.src = imgs[0] || placeholder;
      } catch {
        imgEl.src = placeholder;
      }

    }, 0);

    // Botão aumentar quantidade
    div.querySelector('.btn-plus').onclick = () => {
      p.quantidade++;
      salvarCarrinho();
      renderSafe();
    };

    // Botão diminuir quantidade
    div.querySelector('.btn-minus').onclick = () => {
      if (p.quantidade > 1) {
        p.quantidade--;
      } else {
        carrinho.splice(index, 1);
      }
      salvarCarrinho();
      renderSafe();
    };

    // Botões de garantia
    div
      .querySelectorAll('.btn-garantia')
      .forEach(btn => {
        btn.addEventListener('click', () => {
          const val = Number(btn.dataset.valor);
          p.garantia = p.garantia === val ? 0 : val;
          salvarCarrinho();
          renderSafe();
        });
      });

    // Botão seguro celular
    div.querySelector('.btn-seguro-celular')
      ?.addEventListener('click', () => {
        abrirSeguro(p, (idSelecionado) => {
          p.seguro = idSelecionado || null;
          salvarCarrinho();
          renderSafe();
        });
      });

    // Botão apagar
    const btnApagar =
      document.createElement('button');

    btnApagar.className = 'btn-apagar';

    btnApagar.innerHTML =
      `<i class="fa-solid fa-trash"></i>`;

    btnApagar.onclick = () => {
      carrinho.splice(index, 1);
      salvarCarrinho();
      renderSafe();
    };

    div.appendChild(btnApagar);
    lista.appendChild(div);
  });
}

// ===== CARROSSEL =====
let carrosselIndex = 0;
let carrosselImagens = [];
let carrosselStartX = 0;
let carrosselDragging = false;

document.addEventListener('click', async e => {
  if (!e.target.classList.contains('img-produto')) return;

  const nce = e.target.dataset.nce;
  const nome = e.target.closest('.item')?.querySelector('.descricao')?.textContent?.trim() || '';

  const imgs = await getImagem(nce);
  if (!imgs.length) return;

  carrosselImagens = imgs.filter(s => s && s !== placeholder);
  if (!carrosselImagens.length) return;

  const modal = document.getElementById('modalCarrossel');
  const track = document.getElementById('carrosselTrack');
  const indicadores = document.getElementById('indicadores');
  const contador = document.getElementById('carrosselContador');
  const nomeEl = document.getElementById('carrosselNome');
  const setaEsq = document.getElementById('setaEsq');
  const setaDir = document.getElementById('setaDir');

  if (!modal || !track) return;

  if (nomeEl) nomeEl.textContent = nome;

  track.innerHTML = '';
  carrosselImagens.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.onerror = () => img.src = placeholder;
    img.classList.add('img-carrossel');
    track.appendChild(img);
  });

  if (indicadores) {
    indicadores.innerHTML = '';
    carrosselImagens.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = 'indicador' + (i === 0 ? ' ativo' : '');
      indicadores.appendChild(dot);
    });
  }

  if (setaEsq) setaEsq.style.display = carrosselImagens.length > 1 ? 'flex' : 'none';
  if (setaDir) setaDir.style.display = carrosselImagens.length > 1 ? 'flex' : 'none';

  carrosselIndex = 0;
  atualizarCarrossel();
  modal.style.display = 'flex';

  if (setaEsq) setaEsq.onclick = () => {
    carrosselIndex = (carrosselIndex - 1 + carrosselImagens.length) % carrosselImagens.length;
    atualizarCarrossel();
  };
  if (setaDir) setaDir.onclick = () => {
    carrosselIndex = (carrosselIndex + 1) % carrosselImagens.length;
    atualizarCarrossel();
  };

  track.ontouchstart = ev => {
    carrosselStartX = ev.touches[0].clientX;
    carrosselDragging = true;
  };

  track.ontouchmove = ev => {
    if (!carrosselDragging) return;
    const dx = ev.touches[0].clientX - carrosselStartX;
    const offset = carrosselIndex * 100 - (dx / track.parentElement.offsetWidth) * 100;
    track.style.transition = 'none';
    track.style.transform = `translateX(-${offset}%)`;
  };

  track.ontouchend = ev => {
    if (!carrosselDragging) return;
    carrosselDragging = false;
    const diff = carrosselStartX - ev.changedTouches[0].clientX;
    if (diff > 50 && carrosselIndex < carrosselImagens.length - 1) carrosselIndex++;
    else if (diff < -50 && carrosselIndex > 0) carrosselIndex--;
    atualizarCarrossel();
  };
});

function atualizarCarrossel() {
  const track = document.getElementById('carrosselTrack');
  const contador = document.getElementById('carrosselContador');
  const dots = document.querySelectorAll('.indicadores-galeria .indicador');

  if (track) {
    track.style.transition = 'transform 0.3s ease';
    track.style.transform = `translateX(-${carrosselIndex * 100}%)`;
  }

  if (contador) contador.textContent = `${carrosselIndex + 1} / ${carrosselImagens.length}`;

  dots.forEach((d, i) => d.classList.toggle('ativo', i === carrosselIndex));
}

document.getElementById('fecharModal')?.addEventListener('click', () => {
  const modal = document.getElementById('modalCarrossel');
  if (modal) modal.style.display = 'none';
  carrosselDragging = false;
});

document.addEventListener('DOMContentLoaded', () => {
  render();
  renderFinanciamento();
});
