const btnFechar = document.querySelector(".close");
const popup = document.querySelector(".popup");
const bottomBar = document.querySelector(".bottom-bar");
const timerResult = document.getElementById("timer");
const btnLateral = document.getElementById("btn-lateral");
const fundo = document.querySelector(".fundo-popup");
const btnScan = document.querySelector(".btn-scan");

let intervalId;
let time = 1000;


export function popupMobile() {

  let seconds = 8;

  timerResult.textContent = "";

  clearInterval(intervalId);

  //btnFechar.classList.add("active");

  bottomBar.classList.add("event");

  btnLateral.classList.add("event");

  fundo.classList.add("active");

  btnScan.style.cssText = `pointer-events: none;`;

  /*intervalId = setInterval(() => {
    seconds--;

    timerResult.textContent = `0${seconds}`;

    if (seconds < 0) {
      clearInterval(intervalId);
      btnFechar.classList.remove("active");
      timerResult.textContent = "";

      return false
    }
  }, 1000)*/

  btnFechar.addEventListener('click', () => {
    popup.classList.remove("show");
    bottomBar.classList.remove("event");
    btnLateral.classList.remove("event");
    fundo.classList.remove("active");

    btnScan.style.cssText = `pointer-events: auto;`;
  })
}