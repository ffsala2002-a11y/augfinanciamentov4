const btnFechar = document.querySelector(".close");
const popup = document.querySelector(".popup");
const bottomBar = document.querySelector(".bottom-bar");
const timerResult = document.getElementById("timer");
const btnLateral = document.getElementById("btn-lateral");

let intervalId;
let time = 1000;


export function popupMobile() {

  let seconds = 8;

  timerResult.textContent = "";

  clearInterval(intervalId);

  //btnFechar.classList.add("active");

  bottomBar.classList.add("event");

  btnLateral.classList.add("event");

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
  })
}