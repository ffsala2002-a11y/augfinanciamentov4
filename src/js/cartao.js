// ================= CARTÃO DE CRÉDITO =================
import { carrinho } from './carrinho.js';
import { calcularGarantiaTotal } from './garantias.js';

const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Taxa mensal a partir de 7x
const TAXA_JUROS = 2.94; // %

let itemExpandido = -1;

export function iniciarCartao() {
  // Ao entrar na aba Cartão, recalcula com o carrinho/entrada atuais
  document.getElementById('btnRotaCartao')?.addEventListener('click', () => {
    itemExpandido = -1;
    renderCartao();
  });
  
  // Render inicial
  renderCartao();
}

export function renderCartao() {
  
  const lista = document.getElementById('cartaoParcelasList');
  const totalEl = document.getElementById('cartaoTotalValor');
  
  if (!lista) return;
  
  
  // Calcula total dos produtos
  const totalProdutos = carrinho.reduce(
    (acc, p) => acc + (p.preco * p.quantidade),
    0
  );
  
  
  const totalGarantia = calcularGarantiaTotal(carrinho);
  
  const total = totalProdutos + totalGarantia;
  
  
  
  // Entrada do simulador
  const entradaStr =
    document.getElementById('entrada')?.value || 'R$ 0,00';
  
  
  const entradaNum =
    Number(entradaStr.replace(/\D/g, '')) / 100 || 0;
  
  
  
  // Valor que realmente será financiado
  const financiado = Math.max(
    total - entradaNum,
    0
  );
  
  
  
  if (totalEl) {
    totalEl.textContent = fmt(total);
  }
  
  
  
  
  // Carrinho vazio
  if (!carrinho.length || total === 0) {
    
    lista.innerHTML = `

      <div class="cartao-empty">

        <div class="cartao-empty-icon">
          🛒
        </div>

        <p>
          Adicione produtos ao carrinho para simular
        </p>

      </div>

    `;
    
    return;
  }
  
  
  
  lista.innerHTML = '';
  
  
  
  
  for (let n = 1; n <= 12; n++) {
    
    
    // 1x até 6x sem juros
    // 7x até 12x com juros
    
    const isSemJuros = n <= 6;
    
    
    const taxa = isSemJuros ?
      0 :
      TAXA_JUROS / 100;
    
    
    
    let valorParcela;
    
    
    
    // Sem juros
    if (taxa === 0) {
      
      valorParcela = financiado / n;
      
    }
    
    
    // Com juros composto
    else {
      
      const coeficiente =
        (
          taxa *
          Math.pow(1 + taxa, n)
        ) /
        (
          Math.pow(1 + taxa, n) - 1
        );
      
      
      valorParcela =
        financiado * coeficiente;
      
    }
    
    
    
    const totalComJuros =
      valorParcela * n;
    
    
    
    const juros =
      totalComJuros - financiado;
    
    
    
    const item =
      document.createElement('div');
    
    
    item.className =
      'cartao-parcela-item';
    
    
    
    const expandido =
      itemExpandido === n;
    
    
    
    item.innerHTML = `

      <div class="cartao-parcela-row">
      
      ${
      !expandido
        ? '<span class="text-info">Clique aqui pra mais detalhes</span>'
        : ''
    }


        <div class="
          cartao-num
          ${isSemJuros ? 'sem-juros' : 'com-juros'}
        ">

          ${n}x

        </div>



        <div class="cartao-parcela-valores">


          <span class="cartao-parcela-valor">

            ${fmt(valorParcela)}

          </span>



          <span class="cartao-parcela-sub">

            ${
              isSemJuros
              ? 'sem juros'
              : `${TAXA_JUROS}% a.m.`
            }

          </span>


        </div>




        <div class="cartao-parcela-direita">


          <span class="cartao-parcela-total">

            ${fmt(totalComJuros)}

          </span>



          <span class="
            cartao-parcela-juros-tag
            ${isSemJuros ? 'sem' : 'com'}
          ">


            ${
              isSemJuros
              ? '✓ sem juros'
              : `+ ${fmt(juros)}`
            }


          </span>



        </div>


      </div>





      <div class="
        cartao-detalhe
        ${expandido ? 'ativo' : ''}
      ">


        Valor do produto:
        <strong>${fmt(total)}</strong>


        <br>



        Entrada:
        <strong>${fmt(entradaNum)}</strong>


        <br>



        Financiado:
        <strong>${fmt(financiado)}</strong>


        <br>




        ${
          n === 1

          ?

          `
          À vista no cartão:
          <strong>
            ${fmt(valorParcela)}
          </strong>
          `


          :

          `
          ${n}x de
          <strong>
            ${fmt(valorParcela)}
          </strong>
          `

        }



        <br>



        Total a pagar:
        <strong>
          ${fmt(totalComJuros)}
        </strong>



        ${
          juros > 0

          ?

          `
          <br>

          Juros cobrados:
          <strong>
            ${fmt(juros)}
          </strong>
          `

          :

          ''

        }



      </div>

    `;
    
    
    
    // Abrir / fechar detalhes
    item.addEventListener(
      'click',
      () => {
        
        itemExpandido =
          itemExpandido === n ?
          -1 :
          n;
        
        
        renderCartao();
        
      }
    );
    
    
    
    lista.appendChild(item);
    
  }
  
}
