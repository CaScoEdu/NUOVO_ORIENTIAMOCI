import {
  calcolaPercorsoMinimo,
  getCentroideNodo,
} from "../navigation/pathfinder.js";

/* ==========================================================================
   CONFIGURAZIONE E VARIABILI GLOBALI
   ========================================================================== */

let partenzaId = "ingresso-principale";
let destinazioneId = "evacuazione";

// ViewBox completo della mappa originale
let initialViewBox = "0 0 2143 2500";

let configurazioneBase = {}; // Dati fisici da config/school-day.json
let configurazioneAttiva = {}; // Eventuale evento unito a school-day.json
let mappaSicurezza = {}; // Mappa indipendente delle uscite/punti di raccolta da sicurezza/punti-raccolta.json
let grafoDati = null; // Struttura del grafo caricata da navigation/grafo.json

/* ==========================================================================
   CARICAMENTO CONFIGURAZIONI, SICUREZZA, GRAFO ED EVENTI
   ========================================================================== */

async function caricaGrafo() {
  try {
    const res = await fetch("navigation/grafo.json");
    if (res.ok) {
      grafoDati = await res.json();
      console.log("Grafo di navigazione caricato con successo:", grafoDati);
    }
  } catch (err) {
    console.warn("Impossibile caricare navigation/grafo.json:", err);
  }
}

async function caricaMappaSicurezza() {
  try {
    const res = await fetch("sicurezza/punti-raccolta.json");
    if (res.ok) {
      const data = await res.json();
      mappaSicurezza = data.puntiRaccolta || {};
    }
  } catch (err) {
    console.warn("Impossibile caricare sicurezza/punti-raccolta.json:", err);
  }
}

async function caricaConfigurazioneDaURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const configFile = urlParams.get("config");

  // Carica le associazioni di sicurezza e il grafo di navigazione
  await Promise.all([caricaMappaSicurezza(), caricaGrafo()]);

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
      if (!resEvento.ok)
        throw new Error(`Impossibile caricare config/${configFile}.json`);
      const configurazioneEvento = await resEvento.json();

      configurazioneAttiva = {
        titoloEvento:
          configurazioneEvento.titoloEvento || configurazioneBase.titoloEvento,
        stanze: {},
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
            etichetta:
              stanzaEvento.etichetta ||
              stanzaEvento.nome ||
              stanzaBase.etichetta,
            aulaOriginale: stanzaBase.etichetta,
            attivaInEvento: true, // Cliccabile ed elencabile
          };
        } else {
          // Stanza base mantenuta per la mappa, ma disabilitata durante l'evento
          configurazioneAttiva.stanze[roomId] = {
            ...stanzaBase,
            attivaInEvento: false,
          };
        }
      });
    }

    if (configurazioneAttiva.titoloEvento) {
      const headerTitle = document.querySelector(".app-header h1");
      if (headerTitle)
        headerTitle.textContent = configurazioneAttiva.titoloEvento;
    }
  } catch (err) {
    console.error("Errore durante il caricamento delle configurazioni:", err);
  }
}

/* ==========================================================================
   FUNZIONI DI SUPPORTO E UTILITY
   ========================================================================== */

function getSettorePuntoRaccolta(idStanza) {
  const settore =
    mappaSicurezza[idStanza] ||
    configurazioneAttiva?.stanze?.[idStanza]?.puntoRaccolta ||
    configurazioneAttiva?.stanze?.[idStanza]?.settoreEvacuazione ||
    "e";

  return settore.toLowerCase();
}

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
    document.querySelectorAll(".room, #ingresso-principale"),
  );

  const gruppiPerCategoria = {};

  elementiSelezionabili.forEach((el) => {
    const id = el.getAttribute("id");
    if (!id) return;

    const eIngresso = id === "ingresso-principale";
    const stanza = configurazioneAttiva?.stanze?.[id];

    if (!eIngresso && stanza?.attivaInEvento === false) {
      return;
    }

    const categoria = stanza?.categoria || (eIngresso ? "Accesso" : "Altro");
    const titolo = getTitoloFormattatoStanza(id);

    if (!gruppiPerCategoria[categoria]) {
      gruppiPerCategoria[categoria] = [];
    }

    gruppiPerCategoria[categoria].push({ id, titolo });
  });

  Object.keys(gruppiPerCategoria).forEach((cat) => {
    gruppiPerCategoria[cat].sort((a, b) => {
      if (a.id === "ingresso-principale") return -1;
      if (b.id === "ingresso-principale") return 1;

      return a.titolo.localeCompare(b.titolo, "it", {
        numeric: true,
        sensitivity: "base",
      });
    });
  });

  const ordineCategorie = [
    "Accesso",
    "Aule Didattiche",
    "Direzione & Uffici",
    "Laboratori",
    "Servizi",
    "Sport",
  ];

  const categorieOrdinate = Object.keys(gruppiPerCategoria).sort((a, b) => {
    const indexA = ordineCategorie.indexOf(a);
    const indexB = ordineCategorie.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b, "it");
  });

  function generaHTMLGruppi(escludiIngresso = false) {
    let html = "";
    categorieOrdinate.forEach((cat) => {
      const opzioniFiltrare = gruppiPerCategoria[cat].filter(
        (opt) => !(escludiIngresso && opt.id === "ingresso-principale"),
      );

      if (opzioniFiltrare.length > 0) {
        html += `<optgroup label="── ${cat.toUpperCase()} ──">`;
        opzioniFiltrare.forEach((opt) => {
          html += `<option value="${opt.id}">${opt.titolo}</option>`;
        });
        html += `</optgroup>`;
      }
    });
    return html;
  }

  let optionsFromHTML = generaHTMLGruppi(false);
  let optionsToHTML = `<option value="evacuazione" style="background-color: #10b981; color: white; font-weight: bold;">🚨 EVACUAZIONE / SICUREZZA</option>`;
  optionsToHTML += `<option value="ingresso-principale">📍 INGRESSO</option>`;
  optionsToHTML += generaHTMLGruppi(true);

  selectFrom.innerHTML = optionsFromHTML;
  selectTo.innerHTML = optionsToHTML;

  const tutteLeOpzioni = Object.values(gruppiPerCategoria).flat();
  if (tutteLeOpzioni.some((opt) => opt.id === partenzaId)) {
    selectFrom.value = partenzaId;
  } else if (tutteLeOpzioni.length > 0) {
    partenzaId = tutteLeOpzioni[0].id;
    selectFrom.value = partenzaId;
  }

  selectTo.value = destinazioneId;
  gestisciStileSelettoreArrivo();
}

function gestisciStileSelettoreArrivo() {
  const selectTo = document.getElementById("select-to");
  if (selectTo) {
    selectTo.classList.toggle(
      "mode-evacuazione",
      destinazioneId === "evacuazione",
    );
  }
}

function scambiaOrigineDestinazione() {
  if (destinazioneId === "evacuazione") return;

  const temp = partenzaId;
  partenzaId = destinazioneId;
  destinazioneId = temp;

  aggiornaMappa(true);
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

/* ==========================================================================
   TRACCIAMENTO GRAFICO DEL PERCORSO SULL'SVG
   ========================================================================== */
function disegnaPercorsoSVG(percorsoNodi) {
  // Cerca il layer dedicato al percorso, altrimenti fa il fallback sul tag <svg>
  const targetContainer =
    document.getElementById("layer-percorso") ||
    document.getElementById("school-map") ||
    document.querySelector("svg");

  if (!targetContainer) return;

  let polyline = document.getElementById("path-percorso");

  if (!polyline) {
    polyline = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polyline",
    );
    polyline.setAttribute("id", "path-percorso");
    targetContainer.appendChild(polyline);
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

/* ==========================================================================
   AGGIORNAMENTO MAPPA ED EVIDENZIAZIONE
   ========================================================================== */

/* ==========================================================================
   AGGIORNAMENTO MAPPA ED EVIDENZIAZIONE
   ========================================================================== */

function aggiornaMappa(focusActive = false) {
  const selectFrom = document.getElementById("select-from");
  const selectTo = document.getElementById("select-to");
  if (selectFrom) selectFrom.value = partenzaId;
  if (selectTo) selectTo.value = destinazioneId;

  // 1. Pulisce le selezioni visive e il percorso precedente
  document
    .querySelectorAll(".room, .area-aperta, #ingresso-principale, .room-label")
    .forEach((r) => r.classList.remove("state-from", "state-to"));

  document.querySelectorAll(".evacuazione-visibile").forEach((el) => {
    el.classList.remove("evacuazione-visibile");
  });

  disegnaPercorsoSVG([]);

  // 2. Evidenzia l'origine
  if (partenzaId) {
    evidenziaElemento(partenzaId, "state-from");
  }

  // 3. Gestisce Destinazione Standard oppure Evacuazione
  if (destinazioneId && destinazioneId !== "evacuazione") {
    evidenziaElemento(destinazioneId, "state-to");

    // Calcolo percorso standard
    if (grafoDati && partenzaId) {
      const percorso = calcolaPercorsoMinimo(
        grafoDati,
        partenzaId,
        destinazioneId,
      );
      disegnaPercorsoSVG(percorso);
    }
  } else if (destinazioneId === "evacuazione") {
    // Modalità Evacuazione: Mostra segnali e traccia percorso fino al punto di raccolta del settore
    mostraPianoEvacuazionePerStanza(partenzaId);
  }

  if (focusActive) {
    autoFitCamera();
  }
}

function mostraPianoEvacuazionePerStanza(idPartenza) {
  const settore = getSettorePuntoRaccolta(idPartenza);

  // 1. PRIMA rendi visibili gli elementi nell'SVG
  const layerEvacuazione = document.getElementById("layer-evacuazione");
  if (layerEvacuazione) {
    layerEvacuazione.classList.add("evacuazione-visibile");
  }

  const idPuntoRaccolta = `punto-raccolta-${settore}`;
  const elPuntoRaccolta = document.getElementById(idPuntoRaccolta);
  if (elPuntoRaccolta) {
    elPuntoRaccolta.classList.add("evacuazione-visibile");
  }

  const elUscita =
    document.getElementById(`uscita-sicurezza-${settore}`) ||
    document.getElementById(`uscita-${settore}`);

  if (elUscita) {
    elUscita.classList.add("evacuazione-visibile");
  }

  // 2. POI calcola e disegna il percorso (così getBBox non legge display:none)
  if (grafoDati && idPartenza && idPuntoRaccolta) {
    const percorsoEvacuazione = calcolaPercorsoMinimo(grafoDati, idPartenza, idPuntoRaccolta);
    disegnaPercorsoSVG(percorsoEvacuazione);
  }
}

/* ==========================================================================
   GESTIONE FOCUS E CAMERA (ZOOM CIRCOSCRITTO)
   ========================================================================== */
function autoFitCamera() {
  const svg = document.getElementById("school-map");
  if (!svg) return;

  const elementiInquadratura = [];

  const elFrom = document.getElementById(partenzaId);
  if (elFrom) elementiInquadratura.push(elFrom);

  if (destinazioneId === "evacuazione") {
    const settore = getSettorePuntoRaccolta(partenzaId);

    const elRaccolta = document.getElementById(`punto-raccolta-${settore}`);
    const elUscita =
      document.getElementById(`uscita-sicurezza-${settore}`) ||
      document.getElementById(`uscita-${settore}`);

    if (elRaccolta) elementiInquadratura.push(elRaccolta);
    if (elUscita) elementiInquadratura.push(elUscita);
  } else if (destinazioneId) {
    const elTo = document.getElementById(destinazioneId);
    if (elTo) elementiInquadratura.push(elTo);
  }

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  elementiInquadratura.forEach((el) => {
    let rx = 0,
      ry = 0,
      rw = 0,
      rh = 0;

    try {
      const bbox = el.getBBox();
      rx = bbox.x;
      ry = bbox.y;
      rw = bbox.width;
      rh = bbox.height;

      const transformAttr = el.getAttribute("transform");
      if (transformAttr) {
        const translateMatch =
          /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(transformAttr);
        if (translateMatch) {
          rx += parseFloat(translateMatch[1]);
          ry += parseFloat(translateMatch[2]);
        }

        const scaleMatch = /scale\(\s*([-\d.]+)[,\s]*([-\d.]*)\s*\)/.exec(
          transformAttr,
        );
        if (scaleMatch) {
          const scaleX = parseFloat(scaleMatch[1]);
          const scaleY = scaleMatch[2] ? parseFloat(scaleMatch[2]) : scaleX;
          rw *= scaleX;
          rh *= scaleY;
        }
      }
    } catch (e) {
      rx = parseFloat(el.getAttribute("x")) || 0;
      ry = parseFloat(el.getAttribute("y")) || 0;
      rw = parseFloat(el.getAttribute("width")) || 0;
      rh = parseFloat(el.getAttribute("height")) || 0;
    }

    minX = Math.min(minX, rx);
    minY = Math.min(minY, ry);
    maxX = Math.max(maxX, rx + rw);
    maxY = Math.max(maxY, ry + rh);
  });

  if (minX === Infinity) return;

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  const paddingX = Math.max(120, contentWidth * 0.25);
  const paddingY = Math.max(120, contentHeight * 0.25);

  const vX = minX - paddingX;
  const vY = minY - paddingY;
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
    descrizione:
      stanza?.descrizione ||
      "Nessuna descrizione aggiuntiva per questo locale.",
    aulaOriginale: stanza?.aulaOriginale || null,
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
   ETICHETTE DINAMICHE MAPPA (MULTIRIGA) E COLORAZIONE CATEGORIE
   ========================================================================== */

function applicaEtichetteMappa() {
  const elementi = document.querySelectorAll(".room, #ingresso-principale");

  elementi.forEach((el) => {
    const id = el.getAttribute("id");
    if (!id) return;

    const stanza = configurazioneAttiva?.stanze?.[id];

    if (stanza && stanza.categoria) {
      el.dataset.category = stanza.categoria.toLowerCase();
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

    let testoVisibile = stanza ? stanza.etichetta : id.replace(/-/g, " ");
    let tooltipText = testoVisibile;

    if (stanza?.aulaOriginale && stanza.aulaOriginale !== stanza.etichetta) {
      testoVisibile += `\n(${stanza.aulaOriginale})`;
      tooltipText = `${stanza.etichetta} - Ubicazione: ${stanza.aulaOriginale}`;
    }

    const pos = getCentroideNodo(id);
    const centerX = pos ? pos.x : 0;
    const centerY = pos ? pos.y : 0;

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
    const tspan = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan",
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
  document
    .getElementById("modal-close")
    ?.addEventListener("click", chiudiPopUp);
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

    const response = await fetch("assets/mappa.svg");
    if (!response.ok) throw new Error("Impossibile caricare mappa.svg");

    const svgText = await response.text();
    container.innerHTML = svgText;

    const svg =
      document.getElementById("school-map") || container.querySelector("svg");
    if (svg) {
      svg.setAttribute("viewBox", initialViewBox);
      svg.removeAttribute("preserveAspectRatio");
    }
    applicaEtichetteMappa();
    popolaDropdowns();
    setupEventListeners();

    // Attiva lo zoom automatico sul caricamento iniziale
    aggiornaMappa(true);
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
