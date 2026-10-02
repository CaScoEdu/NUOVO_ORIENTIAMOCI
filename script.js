/* ==========================================================================
   CONFIGURAZIONE E VARIABILI GLOBALI
   ========================================================================== */

let partenzaId = "ingresso-principale";
let destinazioneId = "evacuazione";
let initialViewBox = "0 0 2143 2500";

let configurazioneBase = {}; // Dati fisici da config/school-day.json
let configurazioneAttiva = {}; // Eventuale evento unito a school-day.json

/* ==========================================================================
   CARICAMENTO CONFIGURAZIONI ED EVENTI
   ========================================================================== */

async function caricaConfigurazioneDaURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const configFile = urlParams.get("config");

  try {
    // 1. Carica SEMPRE la mappa base dell'istituto
    const resBase = await fetch("config/school-day.json");
    if (!resBase.ok) throw new Error("Impossibile caricare school-day.json");
    configurazioneBase = await resBase.json();

    if (!configFile || configFile === "school-day") {
      configurazioneAttiva = configurazioneBase;
    } else {
      // 2. Carica il file dell'evento (es. career-day.json)
      const resEvento = await fetch(`config/${configFile}.json`);
      if (!resEvento.ok) throw new Error(`Impossibile caricare config/${configFile}.json`);
      const configurazioneEvento = await resEvento.json();

      configurazioneAttiva = {
        titoloEvento: configurazioneEvento.titoloEvento || configurazioneBase.titoloEvento,
        stanze: {}
      };

      // Mappa di supporto per identificare le aule usate nell'evento
      const mappaEventoPerAula = {};
      if (configurazioneEvento.stanze) {
        Object.entries(configurazioneEvento.stanze).forEach(([key, item]) => {
          const aulaTargetId = item.aula || item.id || key;
          mappaEventoPerAula[aulaTargetId] = item;
        });
      }

      // 3. Fonde TUTTE le stanze di base mantenendo la visibilità, ma contrassegna quelle dell'evento
      Object.keys(configurazioneBase.stanze).forEach((roomId) => {
        const stanzaBase = configurazioneBase.stanze[roomId];
        const stanzaEvento = mappaEventoPerAula[roomId];

        if (stanzaEvento) {
          configurazioneAttiva.stanze[roomId] = {
            ...stanzaEvento,
            etichetta: stanzaEvento.etichetta || stanzaEvento.nome || stanzaBase.etichetta,
            aulaOriginale: stanzaBase.etichetta,
            attivaInEvento: true // Cliccabile ed elencabile
          };
        } else {
          // Stanza base mantenuta per la mappa, ma disabilitata durante l'evento
          configurazioneAttiva.stanze[roomId] = {
            ...stanzaBase,
            attivaInEvento: false
          };
        }
      });
    }

    if (configurazioneAttiva.titoloEvento) {
      const headerTitle = document.querySelector(".app-header h1");
      if (headerTitle) headerTitle.textContent = configurazioneAttiva.titoloEvento;
    }

  } catch (err) {
    console.error("Errore durante il caricamento delle configurazioni:", err);
  }
}

/* ==========================================================================
   FUNZIONI DI SUPPORTO E UTILITY
   ========================================================================== */

function getTitoloFormattatoStanza(id) {
  if (id === "ingresso-principale") return "📍 INGRESSO";
  
  const stanza = configurazioneAttiva?.stanze?.[id];
  if (stanza) {
    if (stanza.aulaOriginale && stanza.aulaOriginale !== stanza.etichetta) {
      return `${stanza.etichetta} (${stanza.aulaOriginale})`;
    }
    return stanza.etichetta;
  }
  
  return id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/* ==========================================================================
   INIZIALIZZAZIONE SELETTORI (DROPDOWNS)
   ========================================================================== */

function popolaDropdowns() {
  const selectFrom = document.getElementById("select-from");
  const selectTo = document.getElementById("select-to");
  if (!selectFrom || !selectTo) return;

  const elementiSelezionabili = Array.from(
    document.querySelectorAll(".room, #ingresso-principale")
  );

  let listaOpzioni = [];

  elementiSelezionabili.forEach((el) => {
    const id = el.getAttribute("id");
    if (!id) return;

    const eIngresso = (id === "ingresso-principale");
    const stanza = configurazioneAttiva?.stanze?.[id];

    // Se c'è un evento attivo, escludi le stanze marcate come non attive
    if (!eIngresso && stanza?.attivaInEvento === false) {
      return;
    }

    listaOpzioni.push({ id, titolo: getTitoloFormattatoStanza(id) });
  });

  // Ordina le opzioni (Ingresso in cima, aule in ordine numerico/alfabetico)
  listaOpzioni.sort((a, b) => {
    if (a.id === "ingresso-principale") return -1;
    if (b.id === "ingresso-principale") return 1;

    const isAulaA = a.id.startsWith("aula-");
    const isAulaB = b.id.startsWith("aula-");

    if (isAulaA && isAulaB) {
      return a.titolo.localeCompare(b.titolo, "it", { numeric: true, sensitivity: "base" });
    }
    if (isAulaA && !isAulaB) return -1;
    if (!isAulaA && isAulaB) return 1;

    return a.titolo.localeCompare(b.titolo, "it");
  });

  // Genera HTML opzioni DA:
  let optionsFromHTML = listaOpzioni.map((opt) => `<option value="${opt.id}">${opt.titolo}</option>`).join("");

  // Genera HTML opzioni A:
  let optionsToHTML = `<option value="evacuazione" style="background-color: #ef4444; color: white; font-weight: bold;">🚨 EVACUAZIONE / SICUREZZA</option>`;
  optionsToHTML += `<option value="ingresso-principale">📍 INGRESSO</option>`;
  optionsToHTML += `<option disabled>──────────────────</option>`;
  optionsToHTML += listaOpzioni
    .filter((opt) => opt.id !== "ingresso-principale")
    .map((opt) => `<option value="${opt.id}">${opt.titolo}</option>`)
    .join("");

  selectFrom.innerHTML = optionsFromHTML;
  selectTo.innerHTML = optionsToHTML;

  // Ripristina o imposta valori di default
  if (listaOpzioni.some((opt) => opt.id === partenzaId)) {
    selectFrom.value = partenzaId;
  } else if (listaOpzioni.length > 0) {
    partenzaId = listaOpzioni[0].id;
    selectFrom.value = partenzaId;
  }

  selectTo.value = destinazioneId;
  gestisciStileSelettoreArrivo();
}

function gestisciStileSelettoreArrivo() {
  const selectTo = document.getElementById("select-to");
  if (selectTo) {
    selectTo.classList.toggle("mode-evacuazione", destinazioneId === "evacuazione");
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
    .forEach((r) => r.classList.remove("state-from", "state-to"));

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

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

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

  const vX = Math.max(0, minX - paddingX);
  const vY = Math.max(0, minY - paddingY);
  const vW = contentWidth + paddingX * 2;
  const vH = contentHeight + paddingY * 2;

  svg.setAttribute("viewBox", `${vX} ${vY} ${vW} ${vH}`);
}

/* ==========================================================================
   INTERAZIONE CLICK DIRETTO E POP-UP MODAL
   ========================================================================== */

function mostraPopUpStanza(id) {
  const modal = document.getElementById("room-modal");
  if (!modal) return;

  const stanza = configurazioneAttiva?.stanze?.[id];

  const info = {
    titolo: stanza?.etichetta || id.replace(/-/g, " "),
    categoria: stanza?.categoria || "Generale",
    descrizione: stanza?.descrizione || "Nessuna descrizione aggiuntiva per questo locale.",
    aulaOriginale: stanza?.aulaOriginale || null
  };

  const modalTitle = document.getElementById("modal-title");
  const modalCategory = document.getElementById("modal-category");
  const modalDesc = document.getElementById("modal-description");
  const btnSetDest = document.getElementById("btn-set-destination");
  const refElement = document.getElementById("modal-room-reference");

  if (modalTitle) modalTitle.textContent = info.titolo;
  if (modalCategory) modalCategory.textContent = info.categoria;
  if (modalDesc) modalDesc.textContent = info.descrizione;

  if (refElement) {
    if (info.aulaOriginale && info.aulaOriginale !== info.titolo) {
      refElement.textContent = `📍 Ubicazione: ${info.aulaOriginale}`;
      refElement.style.display = "block";
    } else {
      refElement.style.display = "none";
    }
  }

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
   ETICHETTE DINAMICHE MAPPA (MULTIRIGA)
   ========================================================================== */

function applicaEtichetteMappa() {
  const elementi = document.querySelectorAll(".room, #ingresso-principale");

  elementi.forEach((el) => {
    const id = el.getAttribute("id");
    if (!id) return;

    const stanza = configurazioneAttiva?.stanze?.[id];

    // Gestione stato abilitata / disabilitata
    if (stanza && stanza.attivaInEvento === false) {
      el.classList.add("room-disabled");
      el.classList.remove("room-enabled");
    } else {
      el.classList.add("room-enabled");
      el.classList.remove("room-disabled");
    }

    let testoVisibile = stanza ? stanza.etichetta : id.replace(/-/g, " ");
    let tooltipText = testoVisibile;

    if (stanza?.aulaOriginale && stanza.aulaOriginale !== stanza.etichetta) {
      testoVisibile += `\n(${stanza.aulaOriginale})`;
      tooltipText = `${stanza.etichetta} - Ubicazione: ${stanza.aulaOriginale}`;
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
    titleEl.textContent = tooltipText;

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

  const righe = testo.split("\n").flatMap((linea) => linea.split(" "));

  if (righe.length === 1) {
    textEl.textContent = testo;
    return;
  }

  const lineHeight = 13;
  const totalLines = righe.length;
  const startY = centerY - ((totalLines - 1) * lineHeight) / 2;

  righe.forEach((parola, index) => {
    const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
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

/* ==========================================================================
   EVENT LISTENERS & INIZIALIZZAZIONE
   ========================================================================== */

function setupEventListeners() {
  const selectFrom = document.getElementById("select-from");
  const selectTo = document.getElementById("select-to");
  const btnSwap = document.getElementById("btn-swap");

  selectFrom?.addEventListener("change", (e) => {
    partenzaId = e.target.value;
    aggiornaMappa(true);
  });

  selectTo?.addEventListener("change", (e) => {
    destinazioneId = e.target.value;
    gestisciStileSelettoreArrivo();
    aggiornaMappa(true);
  });

  btnSwap?.addEventListener("click", scambiaOrigineDestinazione);

  // Modal listeners
  document.getElementById("modal-close")?.addEventListener("click", chiudiPopUp);
  document.getElementById("room-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "room-modal") chiudiPopUp();
  });

  // Click su aule SVG
  document.querySelectorAll(".room, #ingresso-principale").forEach((roomEl) => {
    roomEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const clickedId = roomEl.getAttribute("id");
      if (!clickedId) return;

      const stanza = configurazioneAttiva?.stanze?.[clickedId];
      if (stanza?.attivaInEvento === false) return;

      mostraPopUpStanza(clickedId);
    });
  });
}

async function caricaMappaSVG() {
  const container = document.getElementById("map-container");
  if (!container) return;

  try {
    await caricaConfigurazioneDaURL();

    const response = await fetch("mappa.svg");
    if (!response.ok) throw new Error("Impossibile caricare mappa.svg");

    const svgText = await response.text();
    container.innerHTML = svgText;

    const svg = document.getElementById("school-map") || container.querySelector("svg");
    if (svg && svg.getAttribute("viewBox")) {
      initialViewBox = svg.getAttribute("viewBox");
    }

    applicaEtichetteMappa();
    popolaDropdowns();
    setupEventListeners();
    aggiornaMappa(false);
  } catch (error) {
    console.error("Errore durante il caricamento della mappa:", error);
    container.innerHTML =
      "<p style='color: white; padding: 20px;'>Errore nel caricamento della mappa dell'istituto.</p>";
  }
}

document.addEventListener("DOMContentLoaded", caricaMappaSVG);

// Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.log("Service Worker registrato correttamente."))
      .catch((err) => console.log("Errore registrazione Service Worker:", err));
  });
}