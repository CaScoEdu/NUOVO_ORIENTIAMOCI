/* ==========================================================================
   CONFIGURAZIONE E VARIABILI GLOBALI
   ========================================================================== */

let partenzaId = "area-ingresso";
let destinazioneId = null;
let initialViewBox = "0 0 2142.86 2500";

// Lista aule dismesse o sostituite
const auleRimosse = [
  "aula-5",
  "aula-11",
  "aula-22",
  "aula-30",
  "aula-31",
  "aula-50",
];

// Mappatura automatica per le Aule Didattiche (escludendo le aule dismesse)
const auleDidattiche = {};
for (let i = 1; i <= 54; i++) {
  const idAula = `aula-${i}`;
  if (!auleRimosse.includes(idAula)) {
    auleDidattiche[idAula] = { titolo: `Aula ${i}` };
  }
}

const stanzeConfig = {
  "Punti di Accesso": {
    "area-ingresso": { titolo: "📍 Ingresso Principale" },
  },
  "Uffici & Direzione": {
    presidenza: { titolo: "Presidenza" },
    vicepresidenza: { titolo: "Vicepresidenza" },
    "ufficio-segreteria": { titolo: "Segreteria" },
    "ufficio-dsga": { titolo: "Ufficio DSGA" },
    "ufficio-tecnico": { titolo: "Ufficio Tecnico" },
    "aula-commissioni": { titolo: "Sala Commissioni" },
    "sala-professori": { titolo: "Sala Docenti" },
  },
  Laboratori: {
    "lab-informatica": { titolo: "Lab. Informatica" },
    "lab-sistemi-1": { titolo: "Lab. Sistemi 1" },
    "lab-sistemi-2": { titolo: "Lab. Sistemi 2" },
    "lab-cisco": { titolo: "Lab. Cisco" },
    tpsee: { titolo: "Lab. TPSEE" },
    "ele-tele": { titolo: "Lab. Elettronica" },
    "centro-sistemi": { titolo: "Centro Sistemi" },
    "lab-chimica": { titolo: "Lab. Chimica" },
    "lab-chimica-org": { titolo: "Lab. Chimica Org." },
    "lab-strumentale": { titolo: "Lab. Analisi Strum." },
    "lab-fisica": { titolo: "Lab. Fisica" },
    "lab-biologia": { titolo: "Lab. Biologia" },
    "lab-microbiologia": { titolo: "Lab. Microbiologia" },
    "lab-disegno": { titolo: "Lab. Disegno Tecnico" },
    "lab-arti-pittoriche": { titolo: "Lab. Arti Pittoriche" },
    "lab-arti-plastiche": { titolo: "Lab. Scultura" },
    "lab-design": { titolo: "Lab. Computer Grafica" },
  },
  "Aule Didattiche": {
    "aula-3-0": { titolo: "Aula 3.0" },
    "aula-polifunzionale": { titolo: "Aula Polifunzionale" },
    biblioteca: { titolo: "Biblioteca" },
    ...auleDidattiche,
  },
  "Servizi & Bagni": {
    "spazio-ristoro": { titolo: "Spazio Ristoro" },
    infermeria: { titolo: "Infermeria" },
    "sala-stampa": { titolo: "Sala Stampa" },
    "bagno-1N": { titolo: "Bagni Blocco Nord" },
    "bagno-1S": { titolo: "Bagni Blocco Sud" },
  },
};

/* ==========================================================================
   INIZIALIZZAZIONE SELETTORI (DROPDOWN & SWAP)
   ========================================================================== */

function popolaDropdowns() {
  const selectFrom = document.getElementById("select-from");
  const selectTo = document.getElementById("select-to");
  const btnSwap = document.getElementById("btn-swap");

  if (!selectFrom || !selectTo) return;

  let optionsFrom = "";
  let optionsTo = `<option value="">-- Seleziona Arrivo --</option>`;

  Object.entries(stanzeConfig).forEach(([categoria, stanze]) => {
    let groupFrom = `<optgroup label="${categoria}">`;
    let groupTo = `<optgroup label="${categoria}">`;

    Object.entries(stanze).forEach(([id, info]) => {
      if (!auleRimosse.includes(id)) {
        groupFrom += `<option value="${id}">${info.titolo}</option>`;
        groupTo += `<option value="${id}">${info.titolo}</option>`;
      }
    });

    groupFrom += `</optgroup>`;
    groupTo += `</optgroup>`;

    optionsFrom += groupFrom;
    optionsTo += groupTo;
  });

  selectFrom.innerHTML = optionsFrom;
  selectTo.innerHTML = optionsTo;

  selectFrom.value = partenzaId;

  selectFrom.addEventListener("change", (e) => {
    partenzaId = e.target.value;
    aggiornaMappa(true);
  });

  selectTo.addEventListener("change", (e) => {
    destinazioneId = e.target.value;
    aggiornaMappa(true);
  });

  btnSwap?.addEventListener("click", scambiaOrigineDestinazione);
}

function scambiaOrigineDestinazione() {
  const temp = partenzaId;
  partenzaId = destinazioneId;
  destinazioneId = temp;

  aggiornaMappa(true);
}

/* ==========================================================================
   AGGIORNAMENTO MAPPA E GESTIONE FOCUS
   ========================================================================== */

function aggiornaMappa(focusActive = false) {
  const selectFrom = document.getElementById("select-from");
  const selectTo = document.getElementById("select-to");
  if (selectFrom) selectFrom.value = partenzaId;
  if (selectTo) selectTo.value = destinazioneId;

  document.querySelectorAll(".room").forEach((r) => {
    r.classList.remove("state-from", "state-to");
  });

  if (partenzaId) {
    evidenziaElemento(partenzaId, "state-from");
  }

  if (destinazioneId) {
    evidenziaElemento(destinazioneId, "state-to");
  }

  if (focusActive) {
    autoFitCamera();
  }

  if (typeof mostraPercorsoMappa === "function") {
    mostraPercorsoMappa();
  }
}

function evidenziaElemento(id, cssClass) {
  const group = document.getElementById(id);
  if (group) {
    const rect = group.querySelector(".room");
    if (rect) {
      group.parentElement.appendChild(group);
      rect.classList.add(cssClass);
    }
  }
}

function autoFitCamera() {
  const svg = document.getElementById("school-map");
  if (!svg) return;

  const elFrom = document.getElementById(partenzaId);
  const elTo = document.getElementById(destinazioneId);

  if (!elFrom && !elTo) {
    svg.setAttribute("viewBox", initialViewBox);
    return;
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  [elFrom, elTo].forEach((el) => {
    if (el) {
      const rect = el.querySelector("rect");
      if (rect) {
        const rx = parseFloat(rect.getAttribute("x")) || 0;
        const ry = parseFloat(rect.getAttribute("y")) || 0;
        const rw = parseFloat(rect.getAttribute("width")) || 0;
        const rh = parseFloat(rect.getAttribute("height")) || 0;

        minX = Math.min(minX, rx);
        minY = Math.min(minY, ry);
        maxX = Math.max(maxX, rx + rw);
        maxY = Math.max(maxY, ry + rh);
      }
    }
  });

  if (typeof calcolaPercorsoBreve === "function" && typeof nodiMappa !== "undefined" && partenzaId && destinazioneId) {
    const sequenzaNodi = calcolaPercorsoBreve(partenzaId, destinazioneId);
    sequenzaNodi.forEach((nodeId) => {
      const coords = nodiMappa[nodeId];
      if (coords) {
        minX = Math.min(minX, coords.x);
        minY = Math.min(minY, coords.y);
        maxX = Math.max(maxX, coords.x);
        maxY = Math.max(maxY, coords.y);
      }
    });
  }

  if (minX === Infinity) {
    svg.setAttribute("viewBox", initialViewBox);
    return;
  }

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  const paddingX = Math.max(250, contentWidth * 0.4);
  const paddingY = Math.max(250, contentHeight * 0.4);

  let vX = minX - paddingX;
  let vY = minY - paddingY;
  let vW = contentWidth + paddingX * 2;
  let vH = contentHeight + paddingY * 2;

  vW = Math.max(vW, 700);
  vH = Math.max(vH, 600);

  vX = Math.max(0, vX);
  vY = Math.max(0, vY);

  svg.setAttribute("viewBox", `${vX} ${vY} ${vW} ${vH}`);
}

/* ==========================================================================
   INTERAZIONE CLICK DIRETTO SULLE STANZE DELLA MAPPA
   ========================================================================== */

function setupMapClicks() {
  document.querySelectorAll(".room-group").forEach((group) => {
    group.addEventListener("click", (e) => {
      e.stopPropagation();
      const clickedId = group.getAttribute("id");

      if (clickedId === partenzaId) return;

      destinazioneId = clickedId;
      aggiornaMappa(true);
    });
  });
}

/* ==========================================================================
   CONVERSIONE TESTI SVG IN FOREIGN OBJECT (RESPONSIVE LABELS)
   ========================================================================== */

function autoFitSvgLabels() {
  document.querySelectorAll(".room-group").forEach((group) => {
    const rect = group.querySelector("rect");
    const textEl = group.querySelector("text");

    if (rect && textEl) {
      const x = parseFloat(rect.getAttribute("x")) || 0;
      const y = parseFloat(rect.getAttribute("y")) || 0;
      const width = parseFloat(rect.getAttribute("width")) || 0;
      const height = parseFloat(rect.getAttribute("height")) || 0;
      const labelText = textEl.textContent.trim();

      if (width > 0 && height > 0) {
        const foreignObj = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "foreignObject"
        );
        foreignObj.setAttribute("x", x);
        foreignObj.setAttribute("y", y);
        foreignObj.setAttribute("width", width);
        foreignObj.setAttribute("height", height);

        foreignObj.innerHTML = `
          <div class="room-label-container">
            <span class="room-label-text">${labelText}</span>
          </div>
        `;

        textEl.remove();
        group.appendChild(foreignObj);
      }
    }
  });
}

/* ==========================================================================
   CARICAMENTO SVG ESTERNO ED INIZIALIZZAZIONE APPLICAZIONE
   ========================================================================== */

async function caricaMappaSVG() {
  const container = document.getElementById("map-container");
  if (!container) return;

  try {
    const response = await fetch("mappa.svg");
    if (!response.ok) throw new Error("Impossibile caricare mappa.svg");

    const svgText = await response.text();
    container.innerHTML = svgText;

    const svg = document.getElementById("school-map") || container.querySelector("svg");
    if (svg && svg.getAttribute("viewBox")) {
      initialViewBox = svg.getAttribute("viewBox");
    }

    autoFitSvgLabels();
    popolaDropdowns();
    setupMapClicks();
    aggiornaMappa(false);
  } catch (error) {
    console.error("Errore durante il caricamento della mappa:", error);
    container.innerHTML =
      "<p>Errore nel caricamento della mappa dell'istituto.</p>";
  }
}

document.addEventListener("DOMContentLoaded", caricaMappaSVG);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.log("Service Worker registrato correttamente."))
      .catch((err) => console.log("Errore registrazione Service Worker:", err));
  });
}