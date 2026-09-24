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

/* ==========================================================================
   SISTEMA DI NAVIGAZIONE E ROUTING (ALLINEAMENTO CORRIDOI)
   ========================================================================== */

const nodiMappa = {
  // --- PORTE E INGRESSI ---
  "area-ingresso": { x: 480, y: 500 },

  // --- CORRIDOIO VERTICALE CENTRALE (Asse X = 500) ---
  "node-corrid-centrale": { x: 500, y: 500 },
  "node-incrocio-t-nord": { x: 500, y: 320 },     // Snodo principale nel corridoio orizzontale

  // --- CORRIDOIO ORIZZONTALE NORD-EST (Asse Y = 320, passa sopra Lab Gerosa e sotto i Bagni) ---
  "node-corrid-nord-est": { x: 880, y: 320 },     // Punto di svolta davanti all'Aula 3.0

  // --- ANCORAGGI PERCORSO (Ingresso nelle stanze) ---
  "aula-3-0": { x: 880, y: 450 },
  "centro-sistemi": { x: 485, y: 840 }
};

const grafoCorridoi = {
  // 1. Dall'ingresso ci si immette al centro del corridoio verticale
  "area-ingresso": {
    "node-corrid-centrale": 20
  },
  "node-corrid-centrale": {
    "area-ingresso": 20,
    "node-incrocio-t-nord": 180
  },

  // 2. Dal corridoio verticale si sale fino allo snodo e si svolta a destra nel corridoio orizzontale
  "node-incrocio-t-nord": {
    "node-corrid-centrale": 180,
    "node-corrid-nord-est": 380
  },

  // 3. Dal corridoio orizzontale si scende ortogonalmente dentro l'Aula 3.0
  "node-corrid-nord-est": {
    "node-incrocio-t-nord": 380,
    "aula-3-0": 130
  },
  "aula-3-0": {
    "node-corrid-nord-est": 130
  }
};

/* Calcolo del percorso minimo tra due nodi (Dijkstra) */
function calcolaPercorsoBreve(startNode, endNode) {
  if (!nodiMappa[startNode] || !nodiMappa[endNode]) return [];

  const distanze = {};
  const precedenti = {};
  const nodiDaVisitare = new Set(Object.keys(nodiMappa));

  Object.keys(nodiMappa).forEach((nodo) => {
    distanze[nodo] = Infinity;
    precedenti[nodo] = null;
  });
  distanze[startNode] = 0;

  while (nodiDaVisitare.size > 0) {
    // Trova il nodo non visitato con la distanza minore
    let nodoCorrente = null;
    nodiDaVisitare.forEach((nodo) => {
      if (nodoCorrente === null || distanze[nodo] < distanze[nodoCorrente]) {
        nodoCorrente = nodo;
      }
    });

    if (distanze[nodoCorrente] === Infinity || nodoCorrente === endNode) {
      break;
    }

    nodiDaVisitare.delete(nodoCorrente);

    // Controlla i vicini collegati nel grafo
    const vicini = grafoCorridoi[nodoCorrente] || {};
    Object.entries(vicini).forEach(([vicino, peso]) => {
      if (nodiDaVisitare.has(vicino)) {
        const nuovaDistanza = distanze[nodoCorrente] + peso;
        if (nuovaDistanza < distanze[vicino]) {
          distanze[vicino] = nuovaDistanza;
          precedenti[vicino] = nodoCorrente;
        }
      }
    });
  }

  // Ricostruisci il percorso al contrario
  const percorso = [];
  let at = endNode;
  while (at !== null) {
    percorso.push(at);
    at = precedenti[at];
  }

  return percorso.reverse()[0] === startNode ? percorso : [];
}

/* Disegna la linea del percorso sull'SVG */
function mostraPercorsoMappa() {
  const pathEl = document.getElementById("route-path");
  if (!pathEl) return;

  if (!partenzaId || !destinazioneId || partenzaId === destinazioneId) {
    pathEl.setAttribute("d", "");
    return;
  }

  const sequenzaNodi = calcolaPercorsoBreve(partenzaId, destinazioneId);

  if (sequenzaNodi.length < 2) {
    pathEl.setAttribute("d", "");
    return;
  }

  // Costruisci il comando SVG 'd' (M x y L x y ...)
  const pathData = sequenzaNodi.reduce((acc, nodeId, index) => {
    const coords = nodiMappa[nodeId];
    if (!coords) return acc;
    return index === 0
      ? `M ${coords.x} ${coords.y}`
      : `${acc} L ${coords.x} ${coords.y}`;
  }, "");

  pathEl.setAttribute("d", pathData);
}

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
  mostraPercorsoMappa();
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

/* Inquadra la partenza, la destinazione E il percorso calcolato in modo dinamico */
function autoFitCamera() {
  const svg = document.getElementById("school-map");
  if (!svg) return;

  const elFrom = document.getElementById(partenzaId);
  const elTo = document.getElementById(destinazioneId);

  // Se nessuna delle due è selezionata, ripristina la vista completa originale
  if (!elFrom && !elTo) {
    svg.setAttribute("viewBox", initialViewBox);
    return;
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  // 1. Considera le coordinate dei rettangoli delle stanze selezionate
  [elFrom, elTo].forEach((el) => {
    if (el) {
      const rect = el.querySelector("rect");
      if (rect) {
        const rx = parseFloat(rect.getAttribute("x"));
        const ry = parseFloat(rect.getAttribute("y"));
        const rw = parseFloat(rect.getAttribute("width"));
        const rh = parseFloat(rect.getAttribute("height"));

        minX = Math.min(minX, rx);
        minY = Math.min(minY, ry);
        maxX = Math.max(maxX, rx + rw);
        maxY = Math.max(maxY, ry + rh);
      }
    }
  });

  // 2. Considera anche tutti i nodi del percorso per non tagliare la linea blu
  if (partenzaId && destinazioneId) {
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

 // Calcolo margini d'inquadratura (padding più ampio)
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  // Aumentiamo il padding minimo a 250px per un panorama più largo
  const paddingX = Math.max(250, contentWidth * 0.4);
  const paddingY = Math.max(250, contentHeight * 0.4);

  let vX = minX - paddingX;
  let vY = minY - paddingY;
  let vW = contentWidth + paddingX * 2;
  let vH = contentHeight + paddingY * 2;

  // Garantisce un'area visiva minima per non stringere mai troppo
  vW = Math.max(vW, 700);
  vH = Math.max(vH, 600);

  // Impedisce di uscire dalle coordinate dell'SVG
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
