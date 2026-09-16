import { valorSeguro } from './seguro.js'; // ← seguro celular

// Calcula o valor total das garantias
export function calcularGarantiaTotal(carrinho) {
  
  // Busca garantias salvas no localStorage
  const garantias = JSON.parse(
    localStorage.getItem("garantias") || "[]"
  );
  
  let total = 0;
  
  // Percorre produtos do carrinho
  carrinho.forEach(p => {
    
    // Procura garantia do produto pelo NCE
    const g = garantias.find(
      k => k.nce === p.nce
    );
    
    // Garantia GE 1 / GE 2
    if (g) {
      if (p.garantia === 1) {
        total += (g.g1 || 0) * p.quantidade;
      }
      if (p.garantia === 2) {
        total += (g.g2 || 0) * p.quantidade;
      }
    }

    // Seguro celular (30% do preço à vista)
    total += valorSeguro(p);
  });
  
  // Retorna total das garantias + seguro
  return total;
}
