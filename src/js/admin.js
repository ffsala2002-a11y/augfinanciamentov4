import { supabase } from './supabase.js';
import { parseProdutos, parseGarantias } from './parser.js';

// ================= STATUS =================
function mostrarStatus(elId, msg, tipo = 'info') {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.className = `status-msg show ${tipo}`;
  setTimeout(() => el.classList.remove('show'), 5000);
}

// ================= LOGIN ADMIN =================
document.getElementById('btnLoginAdmin').addEventListener('click', async () => {
  const email  = document.getElementById('emailAdmin').value.trim();
  const senha  = document.getElementById('senhaAdmin').value;
  const erroEl = document.getElementById('erroAdmin');

  erroEl.innerText = '';

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error || !data.user) {
    erroEl.innerText = '❌ Email ou senha incorretos.';
    return;
  }

  if (data.user.email !== 'admin@augfinanceira.com') {
    await supabase.auth.signOut();
    erroEl.innerText = '❌ Acesso negado.';
    return;
  }

  document.getElementById('telaLoginAdmin').style.display = 'none';
  document.getElementById('telaAdmin').style.display = 'flex';
  carregarLojas();
  carregarTokens();
});

// ================= LOGOUT =================
document.getElementById('btnLogoutAdmin')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.reload();
});

// ================= SESSÃO =================
window.addEventListener('load', async () => {
  const { data } = await supabase.auth.getSession();
  const user = data?.session?.user;
  if (user && user.email === 'admin@augfinanceira.com') {
    document.getElementById('telaLoginAdmin').style.display = 'none';
    document.getElementById('telaAdmin').style.display = 'flex';
    carregarLojas();
    carregarTokens();
  }
});

// ================= LOJAS =================
let lojasData = [];

async function carregarLojas() {
  const { data } = await supabase.from('lojas').select('*');
  lojasData = data || [];

  const select        = document.getElementById('selectLoja');
  const selectApagar  = document.getElementById('selectLojaApagar');
  const selectRemover = document.getElementById('selectLojaRemover');
  const selectSenha   = document.getElementById('selectLojaSenha');
  const listaEl       = document.getElementById('listaLojas');

  [select, selectApagar, selectRemover, selectSenha].forEach(el => {
    if (el) el.innerHTML = '';
  });
  if (listaEl) listaEl.innerHTML = '';

  lojasData.forEach(loja => {
    const option = `<option value="${loja.sigla}">${loja.nome} (${loja.sigla})</option>`;
    if (select)        select.innerHTML        += option;
    if (selectApagar)  selectApagar.innerHTML  += option;
    if (selectRemover) selectRemover.innerHTML += option;
    if (selectSenha)   selectSenha.innerHTML   += option;

    const temSenha = !!loja.senha;
    const senhaBadge = temSenha
      ? `<span style="font-size:10px;background:rgba(76,175,125,0.15);color:#4caf7d;border:1px solid rgba(76,175,125,0.3);padding:2px 8px;border-radius:10px;">🔑 Com senha</span>`
      : `<span style="font-size:10px;background:rgba(224,85,85,0.1);color:#e05555;border:1px solid rgba(224,85,85,0.2);padding:2px 8px;border-radius:10px;">⚠️ Sem senha</span>`;

    if (listaEl) listaEl.innerHTML += `
      <div class="loja-card">
        <div class="loja-sigla">${loja.sigla}</div>
        <div class="loja-nome">${loja.nome}</div>
        ${senhaBadge}
        <div class="loja-badge">● Ativa</div>
      </div>
    `;
  });

  atualizarSenhaAtual();
}

function atualizarSenhaAtual() {
  const sigla   = document.getElementById('selectLojaSenha')?.value;
  const wrap    = document.getElementById('senhaAtualWrap');
  const textoEl = document.getElementById('senhaAtualTexto');
  if (!sigla || !wrap || !textoEl) return;
  const loja = lojasData.find(l => l.sigla === sigla);
  if (loja?.senha) {
    textoEl.textContent = loja.senha;
    wrap.style.display = 'block';
  } else {
    textoEl.textContent = '';
    wrap.style.display = 'none';
  }
}

document.getElementById('selectLojaSenha')?.addEventListener('change', atualizarSenhaAtual);

// ================= CRIAR LOJA =================
document.getElementById('btnCriarLoja').addEventListener('click', async () => {
  const nome  = document.getElementById('nomeLoja').value.trim();
  const sigla = document.getElementById('siglaLoja').value.trim().toUpperCase();
  const senha = document.getElementById('senhaLoja').value.trim();

  if (!nome || !sigla || !senha) {
    mostrarStatus('statusCriarLoja', '⚠️ Preencha todos os campos.', 'erro');
    return;
  }

  const { error } = await supabase.from('lojas').insert({ nome, sigla, senha });

  if (error) {
    mostrarStatus('statusCriarLoja', '❌ Erro: ' + error.message, 'erro');
  } else {
    mostrarStatus('statusCriarLoja', `✅ Loja "${sigla}" criada!`, 'sucesso');
    document.getElementById('nomeLoja').value  = '';
    document.getElementById('siglaLoja').value = '';
    document.getElementById('senhaLoja').value = '';
    carregarLojas();
  }
});

// ================= GERENCIAR SENHA =================
document.getElementById('btnSalvarSenha').addEventListener('click', async () => {
  const sigla     = document.getElementById('selectLojaSenha').value;
  const novaSenha = document.getElementById('novaSenha').value.trim();

  if (!sigla || !novaSenha) {
    mostrarStatus('statusSenha', '⚠️ Preencha todos os campos.', 'erro');
    return;
  }

  if (novaSenha.length < 4) {
    mostrarStatus('statusSenha', '⚠️ Senha deve ter pelo menos 4 caracteres.', 'erro');
    return;
  }

  const { error } = await supabase
    .from('lojas').update({ senha: novaSenha }).eq('sigla', sigla);

  if (error) {
    mostrarStatus('statusSenha', '❌ Erro: ' + error.message, 'erro');
  } else {
    mostrarStatus('statusSenha', `✅ Senha da loja "${sigla}" atualizada!`, 'sucesso');
    document.getElementById('novaSenha').value = '';
    carregarLojas();
  }
});

// ================= TOKENS =================

function gerarTokenAleatorio() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) token += '-';
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

async function carregarTokens() {
  const { data } = await supabase
    .from('tokens')
    .select('*')
    .order('criado_em', { ascending: false });

  const lista   = document.getElementById('listaTokens');
  const totalEl = document.getElementById('totalTokens');
  if (!lista) return;

  const tokens = data || [];
  if (totalEl) totalEl.textContent = tokens.length;

  if (!tokens.length) {
    lista.innerHTML = '<p style="font-size:13px;color:#6b7280;padding:8px 0">Nenhum token gerado ainda.</p>';
    return;
  }

  const agora = new Date();

  lista.innerHTML = tokens.map(t => {
    const expirado  = new Date(t.data_expiracao) < agora;
    const dataFmt   = new Date(t.data_expiracao).toLocaleDateString('pt-BR');
    const criadoFmt = new Date(t.criado_em).toLocaleDateString('pt-BR');

    // Badge de status
    let statusBadge = '';
    if (!t.ativo) {
      statusBadge = `<span class="token-badge desativado">⛔ Desativado</span>`;
    } else if (expirado) {
      statusBadge = `<span class="token-badge expirado">⏰ Expirado</span>`;
    } else if (t.session_key) {
      statusBadge = `<span class="token-badge em-uso">🟢 Em uso</span>`;
    } else {
      statusBadge = `<span class="token-badge ativo">✅ Ativo</span>`;
    }

    // Botões de ação
    let botoes = '';

    if (t.ativo && !expirado) {
      botoes += `
        <button class="btn btn-danger btn-sm" onclick="desativarToken('${t.id}')">
          ⛔ Desativar
        </button>
      `;
    }

    // Botão forçar logout — só aparece se token está em uso
    if (t.session_key) {
      botoes += `
        <button class="btn btn-warn btn-sm" onclick="forcarLogout('${t.id}')">
          🔓 Forçar logout
        </button>
      `;
    }

    botoes += `
      <button class="btn btn-outline btn-sm" onclick="deletarToken('${t.id}')">
        🗑️ Remover
      </button>
    `;

    return `
      <div class="token-card ${!t.ativo || expirado ? 'inativo' : ''}">
        <div class="token-card-top">
          <div>
            <div class="token-card-nome">${t.nome_pessoa}</div>
            <div class="token-card-valor">${t.token}</div>
          </div>
          ${statusBadge}
        </div>
        <div class="token-card-info">
          <span>📅 Criado: ${criadoFmt}</span>
          <span>⏳ Expira: ${dataFmt}</span>
        </div>
        <div class="token-card-acoes">
          ${botoes}
        </div>
      </div>
    `;
  }).join('');
}

// Gerar token
document.getElementById('btnGerarToken').addEventListener('click', async () => {
  const nomePessoa = document.getElementById('tokenNomePessoa').value.trim();
  const expiracao  = document.getElementById('tokenExpiracao').value;

  if (!nomePessoa || !expiracao) {
    mostrarStatus('statusGerarToken', '⚠️ Preencha o nome e a data de expiração.', 'erro');
    return;
  }

  const token = gerarTokenAleatorio();

  const { error } = await supabase.from('tokens').insert({
    token,
    nome_pessoa:    nomePessoa,
    ativo:          true,
    data_expiracao: new Date(expiracao + 'T23:59:59').toISOString()
  });

  if (error) {
    mostrarStatus('statusGerarToken', '❌ Erro: ' + error.message, 'erro');
    return;
  }

  document.getElementById('tokenGeradoValor').textContent = token;
  document.getElementById('tokenGerado').style.display = 'block';
  document.getElementById('tokenNomePessoa').value = '';
  document.getElementById('tokenExpiracao').value  = '';

  mostrarStatus('statusGerarToken', `✅ Token gerado para ${nomePessoa}!`, 'sucesso');
  carregarTokens();
});

// Copiar token
document.getElementById('btnCopiarToken')?.addEventListener('click', () => {
  const valor = document.getElementById('tokenGeradoValor').textContent;
  navigator.clipboard.writeText(valor).then(() => {
    document.getElementById('btnCopiarToken').textContent = '✅ Copiado!';
    setTimeout(() => {
      document.getElementById('btnCopiarToken').textContent = '📋 Copiar';
    }, 2000);
  });
});

// Desativar token
window.desativarToken = async (id) => {
  if (!confirm('Desativar este token? O usuário perderá o acesso imediatamente.')) return;

  const { error } = await supabase
    .from('tokens')
    .update({ ativo: false, session_key: null })
    .eq('id', id);

  if (error) {
    alert('Erro ao desativar: ' + error.message);
  } else {
    carregarTokens();
  }
};

// Forçar logout — limpa session_key sem desativar o token
window.forcarLogout = async (id) => {
  if (!confirm('Forçar logout deste usuário? O token continuará ativo e poderá ser usado novamente.')) return;

  const { error } = await supabase
    .from('tokens')
    .update({ session_key: null })
    .eq('id', id);

  if (error) {
    alert('Erro ao forçar logout: ' + error.message);
  } else {
    carregarTokens();
  }
};

// Deletar token
window.deletarToken = async (id) => {
  if (!confirm('Remover este token permanentemente?')) return;

  const { error } = await supabase
    .from('tokens')
    .delete()
    .eq('id', id);

  if (error) {
    alert('Erro ao remover: ' + error.message);
  } else {
    carregarTokens();
  }
};

// ================= APAGAR BANCO =================
document.getElementById('btnApagarBanco').addEventListener('click', async () => {
  const sigla = document.getElementById('selectLojaApagar').value;
  if (!sigla) return;

  if (!confirm(`⚠️ Apagar TODOS os dados da loja "${sigla}"?\n\nEssa ação não pode ser desfeita.`)) return;

  mostrarStatus('statusApagar', '⏳ Apagando...', 'info');

  const { error: e1 } = await supabase.from('produtos').delete().eq('loja_sigla', sigla);
  if (e1) { mostrarStatus('statusApagar', '❌ Erro produtos: ' + e1.message, 'erro'); return; }

  const { error: e2 } = await supabase.from('garantias').delete().eq('loja_sigla', sigla);
  if (e2) { mostrarStatus('statusApagar', '❌ Erro garantias: ' + e2.message, 'erro'); return; }

  mostrarStatus('statusApagar', `✅ Banco da loja "${sigla}" apagado!`, 'sucesso');
});

// ================= APAGAR LOJA =================
document.getElementById('btnApagarLoja').addEventListener('click', async () => {
  const sigla = document.getElementById('selectLojaRemover').value;
  if (!sigla) return;

  if (!confirm(`⚠️ Apagar a loja "${sigla}" e todos os seus dados?\n\nEssa ação não pode ser desfeita.`)) return;

  mostrarStatus('statusApagarLoja', '⏳ Apagando...', 'info');

  const { error: e1 } = await supabase.from('produtos').delete().eq('loja_sigla', sigla);
  if (e1) { mostrarStatus('statusApagarLoja', '❌ Erro: ' + e1.message, 'erro'); return; }

  const { error: e2 } = await supabase.from('garantias').delete().eq('loja_sigla', sigla);
  if (e2) { mostrarStatus('statusApagarLoja', '❌ Erro: ' + e2.message, 'erro'); return; }

  const { error: e3 } = await supabase.from('lojas').delete().eq('sigla', sigla);
  if (e3) { mostrarStatus('statusApagarLoja', '❌ Erro: ' + e3.message, 'erro'); return; }

  mostrarStatus('statusApagarLoja', `✅ Loja "${sigla}" apagada!`, 'sucesso');
  carregarLojas();
});

// ================= IMPORTAR BASE =================
document.getElementById('btnImportar').addEventListener('click', async () => {
  const sigla    = document.getElementById('selectLoja').value;
  const fileProd = document.getElementById('fileProd').files[0];
  const fileGar  = document.getElementById('fileGar').files[0];

  if (!fileProd || !fileGar) {
    mostrarStatus('statusImport', '⚠️ Selecione os dois arquivos.', 'erro');
    return;
  }

  mostrarStatus('statusImport', '⏳ Processando...', 'info');

  const lerArquivo = f => new Promise(res => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.readAsText(f);
  });

  const txtProd = await lerArquivo(fileProd);
  const txtGar  = await lerArquivo(fileGar);

  const produtos  = parseProdutos(txtProd).map(p => ({ ...p, loja_sigla: sigla }));
  const garantias = parseGarantias(txtGar).map(g => ({ ...g, loja_sigla: sigla }));

  await supabase.from('produtos').delete().eq('loja_sigla', sigla);
  await supabase.from('garantias').delete().eq('loja_sigla', sigla);

  const chunk = (arr, n) => Array.from(
    { length: Math.ceil(arr.length / n) },
    (_, i) => arr.slice(i * n, i * n + n)
  );

  for (const lote of chunk(produtos, 500)) {
    const { error } = await supabase.from('produtos').insert(lote);
    if (error) { mostrarStatus('statusImport', '❌ Erro: ' + error.message, 'erro'); return; }
  }

  for (const lote of chunk(garantias, 500)) {
    const { error } = await supabase.from('garantias').insert(lote);
    if (error) { mostrarStatus('statusImport', '❌ Erro: ' + error.message, 'erro'); return; }
  }

  const agora = new Date().toISOString();
  await supabase.from('lojas').update({ ultima_importacao: agora }).eq('sigla', sigla);

  mostrarStatus('statusImport', `✅ ${produtos.length} produtos e ${garantias.length} garantias importados!`, 'sucesso');
});
