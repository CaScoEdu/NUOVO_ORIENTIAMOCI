import { getCentroideNodo } from "./pathfinder.js";
import { configurazioneAttiva, getColoreCategoria } from "./config.js";

export function disegnaPercorsoSVG(percorsoNodi, isEvacuazione = false) {
  const targetContainer =
    document.getElementById("layer-percorso") ||
    document.getElementById("school-map") ||
    document.querySelector("svg");

  if (!targetContainer) return;

  let polyline = document.getElementById("path-percorso");
  if (!polyline) {
    polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.setAttribute("id", "path-percorso");
    targetContainer.appendChild(polyline);
  }

  if (isEvacuazione) {
    polyline.classList.add("evacuazione");
  } else {
    polyline.classList.remove("evacuazione");
  }

  if (!percorsoNodi || percorsoNodi.length < 2) {
    polyline.setAttribute("points", "");
    return;
  }

  const punti = percorsoNodi
    .map((nodoId) => {
      const pos = getCentroideNodo(nodoId);
      return pos ? `${pos.x},${pos.y}` : null;
    })
    .filter((p) => p !== null)
    .join(" ");

  polyline.setAttribute("points", punti);
}

export function applicaEtichetteMappa() {
  const elementi = document.querySelectorAll(".room, #ingresso-principale");

  elementi.forEach((el) => {
    const id = el.getAttribute("id");
    if (!id) return;

    const stanza = configurazioneAttiva?.stanze?.[id];

    if (stanza && stanza.categoria) {
      el.dataset.category = stanza.categoria.toLowerCase();
      el.style.fill = getColoreCategoria(stanza.categoria);
    } else {
      delete el.dataset.category;
    }

    if (stanza && stanza.attivaInEvento === false) {
      el.classList.add("room-disabled");
      el.classList.remove("room-enabled");
    } else {
      el.classList.add("room-enabled");
      el.classList.remove("room-disabled");
    }

    let testoVisibile = stanza
      ? stanza.etichettaMappa || stanza["etichetta-mappa"]
      : id.replace(/-/g, " ");

    const pos = getCentroideNodo(id);
    const centerX = pos ? pos.x : 0;
    const centerY = pos ? pos.y : 0;

    let textEl = document.getElementById(`label-${id}`);
    if (!textEl) {
      textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      textEl.setAttribute("id", `label-${id}`);
      textEl.setAttribute("class", "room-label");
      el.parentElement.appendChild(textEl);
    }

    textEl.setAttribute("x", centerX);
    textEl.setAttribute("y", centerY);

    creaTestoMultiriga(textEl, testoVisibile, centerX, centerY);
  });
}

function creaTestoMultiriga(textEl, testo, centerX, centerY) {
  textEl.innerHTML = "";
  const righe = testo.split("\n");

  if (righe.length === 1) {
    textEl.textContent = testo;
    return;
  }

  const lineHeight = 13;
  const totalLines = righe.length;
  const startY = centerY - ((totalLines - 1) * lineHeight) / 2;

  righe.forEach((linea, index) => {
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    tspan.setAttribute("x", centerX);
    if (index === 0) {
      tspan.setAttribute("y", startY);
    } else {
      tspan.setAttribute("dy", `${lineHeight}px`);
    }
    tspan.textContent = linea;
    textEl.appendChild(tspan);
  });
}