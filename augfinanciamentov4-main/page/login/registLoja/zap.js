const form = document.getElementById("form");
const erroInput = document.querySelector(".erro-input");
const erroTextArea = document.querySelector(".erro-textArea");
const tempo = 600;
const tempoInput = 2000;
const tempoTextArea = 2000;
let timeId;
let timeIdInput;
let timeTextArea;


/* REFATORAR ESSE CÓDICO */

form.addEventListener('submit', (e) => {
    e.preventDefault();

    clearTimeout(timeId);

    timeId = setTimeout(() => {
        const nome = document.querySelector(".campo").value;
        const mensagem = document.getElementById("textArea").value;
        const tel = 5563999789035;

        if (!nome) {
            mostrarAlerta("Campo obrigatório", "erroInput");
        };

        if (!mensagem) {
            mostrarAlerta("Campo obrigatório", "erroTextArea");
        }

        if (!nome || !mensagem) return;

        const texto = `Olá, me chamo ${nome}, ${mensagem}`;
        const textoFormatado = encodeURIComponent(texto);

        const url = `https://wa.me/${tel}/?text=${textoFormatado}`;

        window.open(url, '_blank')
    }, tempo)
});


function mostrarAlerta(mensagem, tipo) {

    if (tipo === "erroInput") {
        erroInput.textContent = mensagem;

        erroInput.classList.add("active");

        navigator.vibrate(80);

        clearTimeout(timeIdInput);

        timeIdInput = setTimeout(() => {
            erroInput.classList.remove("active")
        }, tempoInput)
    };

    if (tipo === "erroTextArea") {
        erroTextArea.textContent = mensagem;

        erroTextArea.classList.add("active");

        navigator.vibrate(80);

        clearTimeout(timeTextArea);

        timeTextArea = setTimeout(() => {
            erroTextArea.classList.remove("active")
        }, tempoTextArea)
    }
}