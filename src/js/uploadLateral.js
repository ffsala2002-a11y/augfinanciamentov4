export default function uploadLateral() {

    // botão do menu lateral
    const btnLateral = document.getElementById('btn-lateral');
    const btnCloseLateral = document.getElementById("btnCloseLateral");

    // menu lateral e overlay
    const uploadLateral = document.querySelector('.menu-lateral');
    const fundoAtivo = document.querySelector('.fundo');

    // barra inferior
    const bottomBar = document.querySelector(".bottom-bar");

    // abre menu lateral
    btnLateral.addEventListener('click', () => {

        uploadLateral.classList.add('active-lateral');
        fundoAtivo.classList.add('active-fundo');
        btnLateral.classList.add('active-lateral');
        bottomBar.classList.add('active-bar');

    });

    // Botão que fecha meu menu lateral
    btnCloseLateral.addEventListener('click', () => {

        uploadLateral.classList.remove('active-lateral');
        fundoAtivo.classList.remove('active-fundo');
        btnLateral.classList.remove('active-lateral');
        bottomBar.classList.remove('active-bar');

    })

    // fecha ao clicar no fundo
    fundoAtivo.addEventListener('click', () => {

        uploadLateral.classList.remove('active-lateral');
        fundoAtivo.classList.remove('active-fundo');
        btnLateral.classList.remove('active-lateral');
        bottomBar.classList.remove('active-bar');

    });

}