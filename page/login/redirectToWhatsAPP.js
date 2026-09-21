const timer = 2000;

let timeId;

function redirectToWhatsAPP(tel) {

    clearTimeout(timeId);

    timeId = setTimeout(() => {

        const texto = `Olá! Quero meu token de acesso`;
        const textoFormatado = encodeURIComponent(texto);

        const url = `https://wa.me/${tel}/?text=${textoFormatado}`;

        window.open(url, '_blank')
    }, timer)
}