import { supabase } from './supabase.js';

// Elementos de erro
const dadosErro =
  document.getElementById('erroLogin');

const erroSigla =
  document.querySelector('.erro-sigla');

// Controle do timeout
let timeErroId;

// Função de erro padronizada
function mostrarErro(el, msg) {
  el.textContent = msg;
  el.classList.add("active");
  navigator.vibrate?.(80);
  clearTimeout(timeErroId);
  timeErroId = setTimeout(() => {
    el.classList.remove("active");
  }, 2500);
}

// Evento do botão entrar
document
  .getElementById('btnEntrar')
  .addEventListener('click', async () => {

    const btnEntrar = document.getElementById('btnEntrar');

    btnEntrar.disabled = true;

    const nome =
      document.getElementById('nomeUsuario').value.trim();

    const sigla =
      document.getElementById('siglaLoja').value.trim().toUpperCase();

    const senha =
      document.getElementById('senhaLogin').value.trim();

    // Token: remove espaços e força maiúsculo
    const token =
      document.getElementById('tokenAcesso').value.trim().toUpperCase();

    // Verifica campos vazios
    if (!nome || !sigla || !senha || !token) {
      mostrarErro(dadosErro, 'Preencha todos os campos');
      btnEntrar.disabled = false;
      return;
    }

    // Verifica tamanho da sigla
    if (sigla.length < 3) {
      mostrarErro(erroSigla, 'A sigla deve ter pelo menos 3 caracteres');
      btnEntrar.disabled = false;
      return;
    }

    // ===== VALIDA TOKEN =====
    const agora = new Date().toISOString();

    const { data: tokenData, error: tokenError } =
      await supabase
        .from('tokens')
        .select('*')
        .eq('token', token)
        .eq('ativo', true)
        .gt('data_expiracao', agora)
        .single();

    if (tokenError || !tokenData) {
      mostrarErro(dadosErro, 'Token inválido, expirado ou desativado');
      btnEntrar.disabled = false;
      return;
    }

    // ===== VERIFICA SE TOKEN JÁ ESTÁ EM USO =====
    if (tokenData.session_key) {

      const ultimaAtividade = tokenData.last_activity
        ? new Date(tokenData.last_activity)
        : null;

      // Sessão ativa = atividade no último 1 minuto
      const umMinutoAtras = new Date(Date.now() - 1 * 60 * 1000);

      const sessaoAtiva =
        ultimaAtividade && ultimaAtividade > umMinutoAtras;

      if (sessaoAtiva) {
        mostrarErro(dadosErro, 'Token já está em uso por outro usuário');
        btnEntrar.disabled = false;
        return;
      }

      // Sessão abandonada — limpa e permite entrar
      await supabase
        .from('tokens')
        .update({ session_key: null, last_activity: null })
        .eq('id', tokenData.id);
    }

    // ===== VALIDA LOJA + SENHA =====
    const { data: lojaData, error: lojaError } =
      await supabase
        .from('lojas')
        .select('*')
        .eq('sigla', sigla)
        .eq('senha', senha)
        .single();

    if (lojaError || !lojaData) {
      mostrarErro(dadosErro, 'Sigla ou senha incorretos');
      btnEntrar.disabled = false;
      return;
    }

    // ===== GERA SESSION KEY ÚNICA =====
    const sessionKey = crypto.randomUUID();

    const { error: sessionError } = await supabase
      .from('tokens')
      .update({
        session_key: sessionKey,
        last_activity: new Date().toISOString()
      })
      .eq('id', tokenData.id);

    if (sessionError) {
      mostrarErro(dadosErro, 'Erro ao iniciar sessão');
      btnEntrar.disabled = false;
      return;
    }

    // Salva sessão local
    localStorage.setItem(
      'usuario',
      JSON.stringify({
        nome,
        sigla,
        nomeLoja: lojaData.nome,
        tokenId: tokenData.id,
        sessionKey
      })
    );


    function redirectPage() {

      let timeId;

      const loaderSpin = document.querySelector(".container_SevMini");
      const fundoSpin = document.getElementById("fundoSpin");

      loaderSpin.classList.remove("hidden");
      fundoSpin.classList.remove("hidden");

      clearTimeout(timeId);

      timeId = setTimeout(() => {
        loaderSpin.classList.add("hidden");
        fundoSpin.classList.add("hidden");

        btnEntrar.disabled = false;

        // Redireciona para o app
        window.location.href = '../../index.html';
      }, 3000);
    };

    redirectPage()
  });
