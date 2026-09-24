/* ==========================================================================
   CONFIGURAZIONE STANZE EDIFICIO (AULE + LAB + UFFICI)
   ========================================================================== */

// Lista aule dismesse o sostituite (inclusa la vecchia aula-30 per evitare doppioni)
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
    "aula-3-0": { titolo: "Aula 3.0" }, // <--- ID allineato con l'HTML (aula-3-0)
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

/* Stato della navigazione */
let partenzaId = "area-ingresso";
let destinazioneId = "";
let initialViewBox = "0 0 1000 800"; // Memorizza le dimensioni originali dell'SVG

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
      // Filtro di sicurezza aggiuntivo per escludere qualsiasi aula rimossa
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

  // Listener cambio selezione da menu a tendina
  selectFrom.addEventListener("change", (e) => {
    partenzaId = e.target.value;
    aggiornaMappa(true);
  });

  selectTo.addEventListener("change", (e) => {
    destinazioneId = e.target.value;
    aggiornaMappa(true);
  });

  // Event Listener per il pulsante d'inversione DA ⇄ A
  btnSwap?.addEventListener("click", scambiaOrigineDestinazione);
}

/* Funzione per invertire Origine e Destinazione */
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

  // Ripristina tutte le stanze allo stato neutro
  document.querySelectorAll(".room").forEach((r) => {
    r.classList.remove("state-from", "state-to");
  });

  // Evidenzia Partenza (Arancione)
  if (partenzaId) {
    evidenziaElemento(partenzaId, "state-from");
  }

  // Evidenzia Destinazione (Blu)
  if (destinazioneId) {
    evidenziaElemento(destinazioneId, "state-to");
  }

  // Inquadra sia la partenza che la destinazione contemporaneamente
  if (focusActive) {
    autoFitCamera();
  }
}

function evidenziaElemento(id, cssClass) {
  const group = document.getElementById(id);
  if (group) {
    const rect = group.querySelector(".room");
    if (rect) {
      group.parentElement.appendChild(group); // Porta in primo piano il livello
      rect.classList.add(cssClass);
    }
  }
}

/* Inquadra SIA la partenza SIA la destinazione nella mappa in modo fluido */
function autoFitCamera() {
  const svg = document.getElementById("school-map");
  if (!svg) return;

  const elFrom = document.getElementById(partenzaId);
  const elTo = document.getElementById(destinazioneId);

  // Se nessuna delle due è valida, ripristina la vista globale
  if (!elFrom && !elTo) {
    svg.setAttribute("viewBox", initialViewBox);
    return;
  }

  const rects = [];
  if (elFrom) {
    const r = elFrom.querySelector("rect");
    if (r) rects.push(r);
  }
  if (elTo) {
    const r = elTo.querySelector("rect");
    if (r) rects.push(r);
  }

  if (rects.length === 0) {
    svg.setAttribute("viewBox", initialViewBox);
    return;
  }

  // Calcola i limiti min e max per racchiudere TUTTE le stanze selezionate
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  rects.forEach((rect) => {
    const rx = parseFloat(rect.getAttribute("x"));
    const ry = parseFloat(rect.getAttribute("y"));
    const rw = parseFloat(rect.getAttribute("width"));
    const rh = parseFloat(rect.getAttribute("height"));

    minX = Math.min(minX, rx);
    minY = Math.min(minY, ry);
    maxX = Math.max(maxX, rx + rw);
    maxY = Math.max(maxY, ry + rh);
  });

  // Margine d'inquadratura (padding)
  const padding = 150;
  const vX = Math.max(0, minX - padding);
  const vY = Math.max(0, minY - padding);
  const vW = maxX - minX + padding * 2;
  const vH = maxY - minY + padding * 2;

  // Applica la vista panoramica calibrata
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

      // Se clicchi sulla partenza attuale, ignora
      if (clickedId === partenzaId) return;

      // Imposta come nuova destinazione e inquadra
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
      const x = parseFloat(rect.getAttribute("x"));
      const y = parseFloat(rect.getAttribute("y"));
      const width = parseFloat(rect.getAttribute("width"));
      const height = parseFloat(rect.getAttribute("height"));
      const labelText = textEl.textContent.trim();

      const foreignObj = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "foreignObject",
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
  });
}

/* ==========================================================================
   CARICAMENTO SVG ESTERNO ED INIZIALIZZAZIONE APPLICAZIONE
   ========================================================================== */

async function caricaMappaSVG() {
  const container = document.getElementById("map-container");
  if (!container) return;

  try {
    // 1. Scarica il file SVG esterno
    const response = await fetch("mappa.svg");
    if (!response.ok) throw new Error("Impossibile caricare mappa.svg");

    const svgText = await response.text();

    // 2. Inserisce il contenuto SVG nell'HTML
    container.innerHTML = svgText;

    // 3. Inizializza la mappa e i listener solo DOPO che l'SVG è presente nel DOM
    const svg = document.getElementById("school-map");
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

// Avvio dell'app al caricamento della pagina
document.addEventListener("DOMContentLoaded", caricaMappaSVG);

/* Registrazione Service Worker per supporto Offline (PWA) */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.log("Service Worker registrato correttamente."))
      .catch((err) => console.log("Errore registrazione Service Worker:", err));
  });
}
