/* ==========================================================================
   CONFIGURAZIONE E VARIABILI GLOBALI
   ========================================================================== */

let partenzaId = "ingresso-principale";
let destinazioneId = "evacuazione";
let initialViewBox = "0 0 2143 2500";
let configurazioneAttiva = null; // Memorizza i dati caricati dal file JSON esterno

// Mappatura Nomi Amichevoli per gli elementi selezionabili (Fallback Standard)
const etichetteStanze = {
  // Punti di Accesso / Ingressi
  "ingresso-principale": "📍 INGRESSO",

  // Uffici & Direzione
  presidenza: "Presidenza",
  vicepresidenza: "Vicepresidenza",
  "ufficio-protocollo": "Ufficio Protocollo",
  "ufficio-segreteria": "Segreteria",
  "ufficio-dsga": "Ufficio DSGA",
  "ufficio-tecnico": "Ufficio Tecnico",
  "aula-commissioni": "Sala Commissioni",
  "sala-docenti": "Sala Docenti",
  "spogliatoio-ata": "Spogliatoio ATA",

  // Laboratori
  "lab-informatica": "Lab. Informatica",
  "lab-sistemi-1": "Lab. Sistemi 1",
  "lab-sistemi-2": "Lab. Sistemi 2",
  "lab-cisco": "Lab. Cisco",
  tpsee: "Lab. TPSEE",
  "ele-tele": "Lab. Elettronica",
  "centro-sistemi": "Centro Sistemi",
  "lab-chimica": "Lab. Chimica",
  "lab-preparazione": "Prep. Chimica",
  "lab-chimica-organica": "Lab. Chimica Organica",
  "lab-chimica-fisica": "Lab. Chimica Fisica",
  "lab-strumentale": "Lab. Analisi Strum.",
  "lab-fisica": "Lab. Fisica",
  "lab-biologia": "Lab. Biologia",
  "lab-microbiologia": "Lab. Microbiologia",
  "lab-disegno-1": "Lab. Disegno Tecnico",
  "lab-arti-pittoriche": "Lab. Arti Pittoriche",
  "lab-arti-plastiche": "Lab. Arti Plastiche",
  "lab-design": "Lab. Design",
  "lab-gerosa": "Lab. Gerosa",
  "lab-cic": "Sportello CIC",

  // Aule Didattiche & Speciali
  "aula-3-0": "Aula 3.0",
  "aula-polifunzionale": "Aula Polifunzionale",
  "aula-pcto": "Aula PCTO",
  biblioteca: "Biblioteca",
  "ex-biblioteca": "Ex Biblioteca",
  "aula-design": "Aula Design",
  "ex-in-rete-1": "Ex In Rete 1",
  "ex-in-rete-2": "Ex In Rete 2",
  "palestra-M": "Palestra M",
  "aule-palazzina-distaccata": "Palazzina Distaccata",
  "palestre-ABCDE": "Palestre A-B-C-D-E",
  tensostruttura: "Tensostruttura",

  // Servizi
  "spazio-ristoro": "Spazio Ristoro",
  "break-bagni": "Area Break",
  infermeria: "Infermeria",
  "sala-stampa": "Sala Stampa",
  "centro-stella": "Centro Stella",
  audiovisivi: "Audiovisivi",
  deposito: "Deposito",
  "ufficio-magazzino": "Magazzino",
};

/* ==========================================================================
   CARICAMENTO CONFIGURAZIONI ED EVENTI SPECIALI (URL PARAM & JSON)
   ========================================================================== */

async function caricaConfigurazioneDaURL() {
  const urlParams = new URLSearchParams(window.location.search);
  // Se non specificato nell'URL, usa la configurazione standard 'school-day'
  const configFile = urlParams.get("config") || "school-day";

  try {
    const response = await fetch(`config/${configFile}.json`);
    if (!response.ok) throw new Error(`Impossibile caricare config/${configFile}.json`);

    configurazioneAttiva = await response.json();

    // Sostituisce il titolo principale dell'app se specificato nel file JSON
    if (configurazioneAttiva.titoloEvento) {
      const headerTitle = document.querySelector(".app-header h1");
      if (headerTitle) headerTitle.textContent = configurazioneAttiva.titoloEvento;
    }
  } catch (err) {
    console.error(`Errore nel caricamento del file di configurazione 'config/${configFile}.json'`, err);
  }
}

/* ==========================================================================
   INIZIALIZZAZIONE SELETTORI (DROPDOWN & SWAP)
   ========================================================================== */

function popolaDropdowns() {
  const selectFrom = document.getElementById("select-from");
  const selectTo = document.getElementById("select-to");
  const btnSwap = document.getElementById("btn-swap");

  if (!selectFrom || !selectTo) return;

  const elementiSelezionabili = Array.from(
    document.querySelectorAll(".room, #ingresso-principale")
  );

  let listaOpzioni = [];

  elementiSelezionabili.forEach((el) => {
    const id = el.getAttribute("id");
    if (!id) return;

    // Se c'è un evento attivo, considera solo le stanze incluse nel file JSON
    if (configurazioneAttiva && configurazioneAttiva.stanze && !configurazioneAttiva.stanze[id]) {
      return;
    }

    let titolo = "";
    if (configurazioneAttiva && configurazioneAttiva.stanze[id]) {
      titolo = configurazioneAttiva.stanze[id].etichetta;
    } else {
      titolo = etichetteStanze[id];
      if (!titolo) {
        if (id.startsWith("aula-")) {
          const num = id.replace("aula-", "");
          titolo = `Aula ${num}`;
        } else {
          titolo = id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        }
      }
    }

    listaOpzioni.push({ id, titolo });
  });

  // Ordina le opzioni per le aule in sequenza numerica e alfabeticamente per gli altri locali
  listaOpzioni.sort((a, b) => {
    // L'INGRESSO rimane sempre in prima posizione
    if (a.id === "ingresso-principale") return -1;
    if (b.id === "ingresso-principale") return 1;

    // Se sono entrambe aule, estrae i numeri/stringhe e applica l'ordinamento numerico
    const isAulaA = a.id.startsWith("aula-");
    const isAulaB = b.id.startsWith("aula-");

    if (isAulaA && isAulaB) {
      return a.titolo.localeCompare(b.titolo, "it", {
        numeric: true,
        sensitivity: "base",
      });
    }

    // Le aule vengono mostrate prioritariamente subito dopo l'ingresso
    if (isAulaA && !isAulaB) return -1;
    if (!isAulaA && isAulaB) return 1;

    // Ordinamento alfabetico standard per tutti gli altri locali
    return a.titolo.localeCompare(b.titolo, "it");
  });

  // 1. Genera le opzioni per "DA:"
  let optionsFromHTML = "";
  listaOpzioni.forEach((opt) => {
    optionsFromHTML += `<option value="${opt.id}">${opt.titolo}</option>`;
  });

  // 2. Genera le opzioni per "A:"
  let optionsToHTML = `<option value="evacuazione" style="background-color: #ef4444; color: white; font-weight: bold;">🚨 EVACUAZIONE / SICUREZZA</option>`;
  optionsToHTML += `<option value="ingresso-principale">📍 INGRESSO</option>`;
  optionsToHTML += `<option disabled>──────────────────</option>`;

  listaOpzioni.forEach((opt) => {
    if (opt.id !== "ingresso-principale") {
      optionsToHTML += `<option value="${opt.id}">${opt.titolo}</option>`;
    }
  });

  selectFrom.innerHTML = optionsFromHTML;
  selectTo.innerHTML = optionsToHTML;

  selectFrom.value = partenzaId;
  selectTo.value = destinazioneId;

  // Event Listeners
  selectFrom.addEventListener("change", (e) => {
    partenzaId = e.target.value;
    aggiornaMappa(true);
  });

  selectTo.addEventListener("change", (e) => {
    destinazioneId = e.target.value;
    gestisciStileSelettoreArrivo();
    aggiornaMappa(true);
  });

  btnSwap?.addEventListener("click", scambiaOrigineDestinazione);

  gestisciStileSelettoreArrivo();
}

function gestisciStileSelettoreArrivo() {
  const selectTo = document.getElementById("select-to");
  if (!selectTo) return;

  if (destinazioneId === "evacuazione") {
    selectTo.classList.add("mode-evacuazione");
  } else {
    selectTo.classList.remove("mode-evacuazione");
  }
}

function scambiaOrigineDestinazione() {
  if (destinazioneId === "evacuazione") return;

  const temp = partenzaId;
  partenzaId = destinazioneId;
  destinazioneId = temp;

  aggiornaMappa(true);
}

/* ==========================================================================
   AGGIORNAMENTO MAPPA ED EVIDENZIAZIONE
   ========================================================================== */

function aggiornaMappa(focusActive = false) {
  const selectFrom = document.getElementById("select-from");
  const selectTo = document.getElementById("select-to");
  if (selectFrom) selectFrom.value = partenzaId;
  if (selectTo) selectTo.value = destinazioneId;

  document
    .querySelectorAll(".room, .area-aperta, #ingresso-principale, .room-label")
    .forEach((r) => {
      r.classList.remove("state-from", "state-to");
    });

  if (partenzaId) {
    evidenziaElemento(partenzaId, "state-from");
  }

  if (destinazioneId && destinazioneId !== "evacuazione") {
    evidenziaElemento(destinazioneId, "state-to");
  } else if (destinazioneId === "evacuazione") {
    mostraPianoEvacuazione();
  }

  if (focusActive) {
    autoFitCamera();
  }
}

function evidenziaElemento(id, cssClass) {
  const el = document.getElementById(id);
  if (el) {
    const parent = el.parentElement;

    parent.appendChild(el);
    el.classList.add(cssClass);

    const textEl = document.getElementById(`label-${id}`);
    if (textEl) {
      textEl.classList.add(cssClass);
      parent.appendChild(textEl);
    }
  }
}

function mostraPianoEvacuazione() {
  const layerEvacuazione = document.getElementById("layer-evacuazione");
  if (layerEvacuazione) {
    layerEvacuazione.style.display = "block";
  }
}

/* ==========================================================================
   GESTIONE FOCUS E CAMERA (ZOOM CIRCOSCRITTO)
   ========================================================================== */

function autoFitCamera() {
  const svg = document.getElementById("school-map");
  if (!svg) return;

  if (destinazioneId === "evacuazione" || (!partenzaId && !destinazioneId)) {
    svg.setAttribute("viewBox", initialViewBox);
    return;
  }

  const elFrom = document.getElementById(partenzaId);
  const elTo = document.getElementById(destinazioneId);

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  [elFrom, elTo].forEach((el) => {
    if (el) {
      const rx = parseFloat(el.getAttribute("x")) || 0;
      const ry = parseFloat(el.getAttribute("y")) || 0;
      const rw = parseFloat(el.getAttribute("width")) || 0;
      const rh = parseFloat(el.getAttribute("height")) || 0;

      minX = Math.min(minX, rx);
      minY = Math.min(minY, ry);
      maxX = Math.max(maxX, rx + rw);
      maxY = Math.max(maxY, ry + rh);
    }
  });

  if (minX === Infinity) {
    svg.setAttribute("viewBox", initialViewBox);
    return;
  }

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  const paddingX = Math.max(80, contentWidth * 0.15);
  const paddingY = Math.max(80, contentHeight * 0.15);

  let vX = minX - paddingX;
  let vY = minY - paddingY;
  let vW = contentWidth + paddingX * 2;
  let vH = contentHeight + paddingY * 2;

  vX = Math.max(0, vX);
  vY = Math.max(0, vY);

  svg.setAttribute("viewBox", `${vX} ${vY} ${vW} ${vH}`);
}

/* ==========================================================================
   INTERAZIONE CLICK DIRETTO E POP-UP MODAL
   ========================================================================== */

function setupMapClicks() {
  document.querySelectorAll(".room, #ingresso-principale").forEach((roomEl) => {
    roomEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const clickedId = roomEl.getAttribute("id");
      if (!clickedId) return;

      // Se c'è una configurazione speciale e la stanza non è abilitata, ignorala
      if (configurazioneAttiva && configurazioneAttiva.stanze && !configurazioneAttiva.stanze[clickedId]) {
        return;
      }

      mostraPopUpStanza(clickedId);
    });
  });

  // Gestione chiusura della finestra modale
  document.getElementById("modal-close")?.addEventListener("click", chiudiPopUp);
  document.getElementById("room-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "room-modal") chiudiPopUp();
  });
}

function mostraPopUpStanza(id) {
  const modal = document.getElementById("room-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalCategory = document.getElementById("modal-category");
  const modalDesc = document.getElementById("modal-description");
  const btnSetDest = document.getElementById("btn-set-destination");

  if (!modal) return;

  let info = {
    titolo: etichetteStanze[id] || id.replace(/-/g, " "),
    categoria: "Generale",
    descrizione: "Nessuna descrizione aggiuntiva per questo locale."
  };

  // Se c'è una configurazione attiva, recupera le informazioni estese dal JSON
  if (configurazioneAttiva && configurazioneAttiva.stanze[id]) {
    const data = configurazioneAttiva.stanze[id];
    info.titolo = data.etichetta || info.titolo;
    info.categoria = data.categoria || "Generale";
    info.descrizione = data.descrizione || "";
  }

  if (modalTitle) modalTitle.textContent = info.titolo;
  if (modalCategory) modalCategory.textContent = info.categoria;
  if (modalDesc) modalDesc.textContent = info.descrizione;

  if (btnSetDest) {
    btnSetDest.onclick = () => {
      destinazioneId = id;
      gestisciStileSelettoreArrivo();
      aggiornaMappa(true);
      chiudiPopUp();
    };
  }

  modal.classList.remove("hidden");
}

function chiudiPopUp() {
  const modal = document.getElementById("room-modal");
  if (modal) modal.classList.add("hidden");
}

/* ==========================================================================
   GENERA ETICHETTE DINAMICHE / VISIBILI SULLA MAPPA (MULTIRIGA)
   ========================================================================== */

function applicaEtichetteMappa() {
  const elementi = document.querySelectorAll(".room, #ingresso-principale");

  elementi.forEach((el) => {
    const id = el.getAttribute("id");
    if (!id) return;

    // Se c'è una configurazione attiva, marca e disabilita le stanze non presenti
    if (configurazioneAttiva && configurazioneAttiva.stanze) {
      if (!configurazioneAttiva.stanze[id]) {
        el.classList.add("room-disabled");
        el.classList.remove("room-enabled");
        return;
      }
    }

    el.classList.add("room-enabled");
    el.classList.remove("room-disabled");

    let testoVisibile = "";

    if (configurazioneAttiva && configurazioneAttiva.stanze[id]) {
      testoVisibile = configurazioneAttiva.stanze[id].etichetta;
    } else if (id.startsWith("aula-")) {
      testoVisibile = id.replace("aula-", "").replace(/-/g, ".");
    } else if (id === "ingresso-principale") {
      testoVisibile = "INGRESSO";
    } else {
      const nomeCompleto = etichetteStanze[id] || id.replace(/-/g, " ");
      testoVisibile = abbreviaNomeStanza(nomeCompleto);
    }

    const x = parseFloat(el.getAttribute("x")) || 0;
    const y = parseFloat(el.getAttribute("y")) || 0;
    const width = parseFloat(el.getAttribute("width")) || 0;
    const height = parseFloat(el.getAttribute("height")) || 0;

    const centerX = x + width / 2;
    const centerY = y + height / 2;

    let titleEl = el.querySelector("title");
    if (!titleEl) {
      titleEl = document.createElementNS("http://www.w3.org/2000/svg", "title");
      el.appendChild(titleEl);
    }
    titleEl.textContent = etichetteStanze[id] || testoVisibile;

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

  const parole = testo.split(" ");

  if (parole.length === 1) {
    textEl.textContent = testo;
    return;
  }

  const lineHeight = 13;
  const totalLines = parole.length;
  const startY = centerY - ((totalLines - 1) * lineHeight) / 2;

  parole.forEach((parola, index) => {
    const tspan = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan"
    );
    tspan.setAttribute("x", centerX);

    if (index === 0) {
      tspan.setAttribute("y", startY);
    } else {
      tspan.setAttribute("dy", `${lineHeight}px`);
    }

    tspan.textContent = parola;
    textEl.appendChild(tspan);
  });
}

function abbreviaNomeStanza(nome) {
  return nome
    .replace("Lab. ", "L. ")
    .replace("Ufficio ", "Uff. ")
    .replace("Presidenza", "PRES.")
    .replace("Vicepresidenza", "VICEPR.")
    .replace("Biblioteca", "BIBL")
    .replace("Spazio Ristoro", "Ristoro")
    .replace("📍 ", "");
}

/* ==========================================================================
   CARICAMENTO SVG ESTERNO ED INIZIALIZZAZIONE
   ========================================================================== */

async function caricaMappaSVG() {
  const container = document.getElementById("map-container");
  if (!container) return;

  try {
    // 1. Legge eventuale ?config= dall'URL prima di configurare la mappa
    await caricaConfigurazioneDaURL();

    const response = await fetch("mappa.svg");
    if (!response.ok) throw new Error("Impossibile caricare mappa.svg");

    const svgText = await response.text();
    container.innerHTML = svgText;

    const svg =
      document.getElementById("school-map") || container.querySelector("svg");
    if (svg && svg.getAttribute("viewBox")) {
      initialViewBox = svg.getAttribute("viewBox");
    }

    applicaEtichetteMappa();
    popolaDropdowns();
    setupMapClicks();
    aggiornaMappa(false);
  } catch (error) {
    console.error("Errore durante il caricamento della mappa:", error);
    container.innerHTML =
      "<p style='color: white; padding: 20px;'>Errore nel caricamento della mappa dell'istituto.</p>";
  }
}

document.addEventListener("DOMContentLoaded", caricaMappaSVG);

// Registrazione Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.log("Service Worker registrato correttamente."))
      .catch((err) => console.log("Errore registrazione Service Worker:", err));
  });
}