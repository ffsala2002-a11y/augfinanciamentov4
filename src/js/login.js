import { supabase } from './supabase.js';

// Elementos de erro
const dadosErro =
  document.getElementById('erroLogin');

const erroSigla =
  document.querySelector('.erro-sigla');

// Áudios de erro
const vozErroCampo =
  document.querySelector(".vozErroCampo");

const vozErroSigla =
  document.querySelector(".vozErroSigla");

const vozErroLoja =
  document.querySelector(".vozErroLoja");

// Controle do timeout
let timeErroId;

// Função de erro padronizada
function mostrarErro(el, msg, audio) {
  el.textContent = msg;
  el.classList.add("active");
  navigator.vibrate?.(80);
  if (audio) {
    audio.currentTime = 0;
    audio.volume = 0.5;
    audio.play();
  }
  clearTimeout(timeErroId);
  timeErroId = setTimeout(() => {
    el.classList.remove("active");
  }, 1800);
}

// Evento do botão entrar
document
  .getElementById('btnEntrar')
  .addEventListener('click', async () => {

    const nome =
      document.getElementById('nomeUsuario').value.trim();

    const sigla =
      document.getElementById('siglaLoja').value.trim().toUpperCase();

    const senha =
      document.getElementById('senhaLogin').value.trim();

    const token =
      document.getElementById('tokenAcesso').value.trim();

    // Verifica campos vazios
    if (!nome || !sigla || !senha || !token) {
      mostrarErro(dadosErro, 'Preencha todos os campos', vozErroCampo);
      return;
    }

    // Verifica tamanho da sigla
    if (sigla.length < 3) {
      mostrarErro(erroSigla, 'A sigla deve ter pelo menos 3 caracteres', vozErroSigla);
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
      mostrarErro(dadosErro, 'Token inválido, expirado ou desativado', vozErroLoja);
      return;
    }

    // ===== VERIFICA SE TOKEN JÁ ESTÁ EM USO =====
    if (tokenData.session_key) {
      mostrarErro(dadosErro, 'Token já está em uso por outro usuário', vozErroLoja);
      return;
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
      mostrarErro(dadosErro, 'Sigla ou senha incorretos', vozErroLoja);
      return;
    }

    // ===== GERA SESSION KEY ÚNICA =====
    const sessionKey = crypto.randomUUID();

    // Salva session_key no banco
    const { error: sessionError } = await supabase
      .from('tokens')
      .update({ session_key: sessionKey })
      .eq('id', tokenData.id);

    if (sessionError) {
      mostrarErro(dadosErro, 'Erro ao iniciar sessão', vozErroLoja);
      return;
    }

    // Salva sessão local
    localStorage.setItem(
      'usuario',
      JSON.stringify({
        nome,
        sigla,
        nomeLoja: lojaData.nome,
        tokenId:  tokenData.id,
        sessionKey
      })
    );

    // Redireciona para o app
    window.location.href = '../../index.html';
  });
