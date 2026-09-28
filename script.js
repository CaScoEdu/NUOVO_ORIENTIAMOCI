/* ==========================================================================
   IMPORTAZIONE DATI E CONFIGURAZIONE GLOBALE
   ========================================================================== */
import { mapData, GRID } from "./map-data.js";

let partenzaId = "area-ingresso";
let destinazioneId = null;

// Costruzione automatica e dinamica della ViewBox di partenza da GRID
let initialViewBox = `${GRID.VIEWBOX_ORIGIN_X} ${GRID.VIEWBOX_ORIGIN_Y} ${GRID.VIEWBOX_WIDTH} ${GRID.VIEWBOX_HEIGHT}`;

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
    "lab-preparazione": { titolo: "Prep." },
    "lab-chimica-organica": { titolo: "Lab Chimica Organica" },
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
   FUNZIONI HELPER PER LA CREAZIONE DEGLI ELEMENTI SVG
   ========================================================================== */

function creaGruppoSVG(id) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("id", id);
  return g;
}

function creaRettangoloSVG(id, className, x, y, w, h) {
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  if (id) rect.setAttribute("id", id);
  if (className) rect.setAttribute("class", className);
  rect.setAttribute("x", Math.round(x));
  rect.setAttribute("y", Math.round(y));
  rect.setAttribute("width", Math.round(w));
  rect.setAttribute("height", Math.round(h));
  return rect;
}

function getTitoloStanza(id) {
  let titolo = "";
  Object.values(stanzeConfig).forEach((categoria) => {
    if (categoria[id]) titolo = categoria[id].titolo;
  });
  return titolo;
}

/* ==========================================================================
   GENERATORE DINAMICO MAPPA (SISTEMA A LAYER Z-INDEX)
   ========================================================================== */

function generaMappaDinamica() {
  const container = document.getElementById("map-container");
  if (!container) return;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("id", "school-map");
  svg.setAttribute("viewBox", initialViewBox);

  // 1. Layer Outdoor / Terreno
  const layerOutdoor = creaGruppoSVG("layer-outdoor");
  mapData.baseLayout?.forEach((item) => {
    layerOutdoor.appendChild(
      creaRettangoloSVG(item.id, item.type, item.x, item.y, item.w, item.h),
    );
  });
  svg.appendChild(layerOutdoor);

  // 2. Layer Elementi Esterni / Forme Generiche (Parcheggi, Poligoni)
  const layerEsterni = creaGruppoSVG("layer-esterni");
  mapData.elementiEsterni?.forEach((item) => {
    const g = creaGruppoSVG(item.id);
    let shape;

    if (item.type === "polygon") {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      shape.setAttribute("points", item.points);
    } else if (item.type === "rect") {
      shape = creaRettangoloSVG(null, null, item.x, item.y, item.w, item.h);
    }

    if (shape) {
      if (item.className) shape.setAttribute("class", item.className);
      g.appendChild(shape);
    }

    if (item.label && item.textX && item.textY) {
      const text = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text",
      );
      text.setAttribute("x", item.textX);
      text.setAttribute("y", item.textY);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("dominant-baseline", "central");
      text.setAttribute("class", "room-label");
      text.textContent = item.label;
      g.appendChild(text);
    }

    layerEsterni.appendChild(g);
  });
  svg.appendChild(layerEsterni);

  // --------------------------------------------------------------------------
// Layer 3 (o 4): Struttura Muraria ed Edificio (layer-edificio)
// --------------------------------------------------------------------------
const layerEdificio = creaGruppoSVG("layer-edificio");
mapData.edifici?.forEach((item) => {
  const g = creaGruppoSVG(item.id);
  let shape;

  if (item.type === "polygon") {
    shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    shape.setAttribute("points", item.points);
  } else {
    // Default a rettangolo
    shape = creaRettangoloSVG(null, null, item.x, item.y, item.w, item.h);
  }

  // Classe CSS per lo stile dei muri/sagoma (es. bordo spesso, sfondo struttura)
  shape.setAttribute("class", item.className || "struttura-edificio");
  g.appendChild(shape);

  layerEdificio.appendChild(g);
});
svg.appendChild(layerEdificio);

  // 3. Layer Punti di Raccolta Esterni
  const layerPuntiRaccolta = creaGruppoSVG("layer-punti-raccolta");
  mapData.puntiRaccolta?.forEach((item) => {
    const g = creaGruppoSVG(item.id);
    const rect = creaRettangoloSVG(
      null,
      "evacuazione",
      item.x,
      item.y,
      item.w,
      item.h,
    );
    rect.setAttribute("rx", "8");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", item.x + item.w / 2);
    text.setAttribute("y", item.y + item.h / 2);
    text.setAttribute("class", "evacuazione-text");
    text.textContent = item.codice;

    const title = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "title",
    );
    title.textContent = item.label;

    g.appendChild(rect);
    g.appendChild(text);
    g.appendChild(title);
    layerPuntiRaccolta.appendChild(g);
  });
  svg.appendChild(layerPuntiRaccolta);

  // 4. Layer Corridoi
  const layerCorridoi = creaGruppoSVG("layer-corridoi");
  mapData.corridoi?.forEach((item) => {
    layerCorridoi.appendChild(
      creaRettangoloSVG(item.id, "corridoio", item.x, item.y, item.w, item.h),
    );
  });
  svg.appendChild(layerCorridoi);

  // 5. Layer Stanze e Aule
  const layerStanze = creaGruppoSVG("layer-stanze");
  mapData.stanze?.forEach((room) => {
    const rect = creaRettangoloSVG(
      room.id,
      "room",
      room.x,
      room.y,
      room.w,
      room.h,
    );
    const labelText = getTitoloStanza(room.id);

    if (labelText) {
      const title = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "title",
      );
      title.textContent = labelText;
      rect.appendChild(title);
    }

    layerStanze.appendChild(rect);
  });
  svg.appendChild(layerStanze);

  // 6. Layer Uscite di Sicurezza
  const layerUscite = creaGruppoSVG("layer-uscite-sicurezza");
  mapData.usciteSicurezza?.forEach((item) => {
    const rect = creaRettangoloSVG(
      item.id,
      "evacuazione",
      item.x,
      item.y,
      item.w,
      item.h,
    );
    rect.setAttribute("rx", "2");

    const title = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "title",
    );
    title.textContent = item.label || "Uscita di Sicurezza";
    rect.appendChild(title);

    layerUscite.appendChild(rect);
  });
  svg.appendChild(layerUscite);

  // 7. Layer Etichette Responsive (ForeignObject)
  const layerLabels = creaGruppoSVG("layer-labels");
  mapData.stanze?.forEach((room) => {
    const labelText = getTitoloStanza(room.id);
    if (labelText) {
      const foreignObj = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "foreignObject",
      );
      foreignObj.setAttribute("x", Math.round(room.x));
      foreignObj.setAttribute("y", Math.round(room.y));
      foreignObj.setAttribute("width", Math.round(room.w));
      foreignObj.setAttribute("height", Math.round(room.h));

      foreignObj.innerHTML = `
        <div class="room-label-container">
          <span class="room-label-text">${labelText}</span>
        </div>
      `;
      layerLabels.appendChild(foreignObj);
    }
  });
  svg.appendChild(layerLabels);

  // 8. Layer Overlay Percorsi Navigazione
  const layerNavigation = creaGruppoSVG("layer-navigation");
  svg.appendChild(layerNavigation);

  // Inserimento finale nel DOM
  container.innerHTML = "";
  container.appendChild(svg);
}

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
  const rect = document.getElementById(id);
  if (rect) {
    // Porta l'elemento in cima al suo layer per non coprire gli stili di selezione
    rect.parentElement.appendChild(rect);
    rect.classList.add(cssClass);
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

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  [elFrom, elTo].forEach((rect) => {
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
  });

  if (
    typeof calcolaPercorsoBreve === "function" &&
    typeof nodiMappa !== "undefined" &&
    partenzaId &&
    destinazioneId
  ) {
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
  document.querySelectorAll(".room").forEach((rect) => {
    rect.addEventListener("click", (e) => {
      e.stopPropagation();
      const clickedId = rect.getAttribute("id");

      if (clickedId === partenzaId) return;

      destinazioneId = clickedId;
      aggiornaMappa(true);
    });
  });
}

/* ==========================================================================
   INIZIALIZZAZIONE APPLICAZIONE
   ========================================================================== */

function inizializzaApplicazione() {
  generaMappaDinamica();
  popolaDropdowns();
  setupMapClicks();
  aggiornaMappa(false);
}

document.addEventListener("DOMContentLoaded", inizializzaApplicazione);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.log("Service Worker registrato correttamente."))
      .catch((err) => console.log("Errore registrazione Service Worker:", err));
  });
}
