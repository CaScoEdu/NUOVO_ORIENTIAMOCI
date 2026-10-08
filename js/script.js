import { calcolaPercorsoMinimo, getCentroideNodo } from "./pathfinder.js";

/* ==========================================================================
   CONFIGURAZIONE E VARIABILI GLOBALI
   ========================================================================== */

let partenzaId = "ingresso-principale";
let destinazioneId = "evacuazione";

// ViewBox completo della mappa originale
let initialViewBox = "0 0 2143 2500";

let configurazioneAttiva = {}; // Configurazione finale unita (Base + Custom)
let mappaSicurezza = {}; // Mappa uscite/punti di raccolta da sicurezza/punti-raccolta.json
let grafoDati = null; // Struttura del grafo caricata da navigation/grafo.json

/* ==========================================================================
   CARICAMENTO CONFIGURAZIONI, SICUREZZA, GRAFO ED EVENTI
   ========================================================================== */

async function caricaGrafo() {
  try {
    const res = await fetch("config/navigation/grafo.json");
    if (res.ok) {
      grafoDati = await res.json();
      console.log("Grafo di navigazione caricato con successo:", grafoDati);
    }
  } catch (err) {
    console.warn("Impossibile caricare config/navigation/grafo.json:", err);
  }
}

async function caricaMappaSicurezza() {
  try {
    const res = await fetch("config/sicurezza/punti-raccolta.json");
    if (res.ok) {
      const data = await res.json();
      mappaSicurezza = data.puntiRaccolta || {};
    }
  } catch (err) {
    console.warn(
      "Impossibile caricare config/sicurezza/punti-raccolta.json:",
      err,
    );
  }
}

async function caricaConfigurazioneDaURL() {
  const urlParams = new URLSearchParams(window.location.search);
  // Se manca ?config=, il valore predefinito è sempre "school-day"
  const configFile = urlParams.get("config") || "school-day";

  await Promise.all([caricaMappaSicurezza(), caricaGrafo()]);

  try {
    // 1. CARICAMENTO INIZIALE BASE: config/base/stanze.json
    const resBase = await fetch("config/base/stanze.json");
    if (!resBase.ok)
      throw new Error("Impossibile caricare config/base/stanze.json");
    const datiBase = await resBase.json();

    // 2. CARICAMENTO OVERRIDE CUSTOM: config/custom/[configFile].json
    let configurazioneCustom = {};
    try {
      const resCustom = await fetch(`config/custom/${configFile}.json`);
      if (resCustom.ok) {
        configurazioneCustom = await resCustom.json();
      } else if (configFile !== "school-day") {
        // Fallback a school-day se il file custom richiesto non esiste
        const resFallback = await fetch("config/custom/school-day.json");
        if (resFallback.ok) configurazioneCustom = await resFallback.json();
      }
    } catch (errCustom) {
      console.warn(
        `Impossibile caricare config/custom/${configFile}.json, utilizzo fallback.`,
        errCustom,
      );
    }

    configurazioneAttiva = {
      titoloEvento:
        configurazioneCustom.titoloEvento ||
        datiBase.titoloEvento ||
        "Mappa dell'Istituto",
      stanze: {},
    };

    const stanzeCustom = configurazioneCustom.stanze || {};

    // 3. MERGE: Inizializza tutte le stanze da stanze.json e applica le personalizzazioni custom
    Object.keys(datiBase.stanze).forEach((roomId) => {
      const stanzaBase = datiBase.stanze[roomId];
      const stanzaCustom = stanzeCustom[roomId];

      // Il custom ha la precedenza assoluta sul base per etichetta-mappa ed etichetta-elenco
      const etichettaMappa =
        stanzaCustom?.["etichetta-mappa"] ||
        stanzaCustom?.etichettaMappa ||
        stanzaBase?.["etichetta-mappa"] ||
        stanzaBase?.etichettaMappa ||
        roomId;

      const etichettaElenco =
        stanzaCustom?.["etichetta-elenco"] ||
        stanzaCustom?.etichettaElenco ||
        stanzaCustom?.etichetta ||
        stanzaBase?.["etichetta-elenco"] ||
        stanzaBase?.etichettaElenco ||
        stanzaBase?.etichetta ||
        etichettaMappa;

      if (configFile === "school-day") {
        // Modalità School-Day standard: tutte le stanze visibili ed attive
        configurazioneAttiva.stanze[roomId] = {
          ...stanzaBase,
          ...(stanzaCustom || {}),
          etichettaMappa,
          etichettaElenco,
          categoria:
            stanzaCustom?.categoria ||
            stanzaBase?.categoria ||
            "Aule Didattiche",
          puntoRaccolta:
            stanzaCustom?.["punto-raccolta"] ||
            stanzaCustom?.puntoRaccolta ||
            stanzaBase?.["punto-raccolta"] ||
            stanzaBase?.puntoRaccolta,
          attivaInEvento: true,
        };
      } else {
        // Modalità Evento Specifico (es. career-day)
        if (stanzaCustom) {
          configurazioneAttiva.stanze[roomId] = {
            ...stanzaBase,
            ...stanzaCustom,
            etichettaMappa,
            etichettaElenco,
            categoria:
              stanzaCustom.categoria || stanzaBase?.categoria || "Evento",
            aulaOriginale:
              stanzaBase?.["etichetta-mappa"] ||
              stanzaBase?.etichettaMappa ||
              stanzaBase?.etichetta,
            puntoRaccolta:
              stanzaCustom["punto-raccolta"] ||
              stanzaCustom.puntoRaccolta ||
              stanzaBase?.["punto-raccolta"] ||
              stanzaBase?.puntoRaccolta,
            attivaInEvento: true,
          };
        } else {
          // Stanza non attiva nell'evento: presente in mappa ma disabilitata
          configurazioneAttiva.stanze[roomId] = {
            ...stanzaBase,
            etichettaMappa,
            etichettaElenco,
            attivaInEvento: false,
          };
        }
      }
    });

    if (configurazioneAttiva.titoloEvento) {
      const headerTitle = document.querySelector(".app-header h1");
      if (headerTitle) {
        headerTitle.textContent = configurazioneAttiva.titoloEvento;
      }
    }
  } catch (err) {
    console.error(
      "Errore durante il caricamento e merge delle configurazioni:",
      err,
    );
  }
}

/* ==========================================================================
   FUNZIONI DI SUPPORTO E UTILITY
   ========================================================================== */

function getSettorePuntoRaccolta(idStanza) {
  const settore =
    configurazioneAttiva?.stanze?.[idStanza]?.puntoRaccolta ||
    configurazioneAttiva?.stanze?.[idStanza]?.["punto-raccolta"] ||
    mappaSicurezza[idStanza] ||
    "e";

  return settore.toLowerCase();
}

function getTitoloFormattatoStanza(id) {
  if (id === "ingresso-principale") return "📍 INGRESSO";

  const stanza = configurazioneAttiva?.stanze?.[id];
  if (stanza) {
    const etichetta =
      stanza.etichettaElenco || stanza["etichetta-elenco"] || stanza.etichetta;
    if (stanza.aulaOriginale && stanza.aulaOriginale !== etichetta) {
      return `${etichetta} (${stanza.aulaOriginale})`;
    }
    return etichetta;
  }

  return id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

/* ==========================================================================
   INIZIALIZZAZIONE SELETTORI (DROPDOWNS DALLA CONFIGURAZIONE CUSTOM)
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

    // Se non è l'ingresso ed è disabilitata per l'evento, la escludiamo dal menu
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

  // Ordina alfabeticamente le stanze dentro ciascuna categoria
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

  const ordinePredefinitoCategorie = [
    "Accesso",
    "Aule Didattiche",
    "Direzione & Uffici",
    "Laboratori",
    "Servizi",
    "Sport",
  ];

  // Ordina le categorie
  const categorieOrdinate = Object.keys(gruppiPerCategoria).sort((a, b) => {
    const indexA = ordinePredefinitoCategorie.indexOf(a);
    const indexB = ordinePredefinitoCategorie.indexOf(b);

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
function disegnaPercorsoSVG(percorsoNodi, isEvacuazione = false) {
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

  document.querySelectorAll(".evacuazione-visibile").forEach((el) => {
    el.classList.remove("evacuazione-visibile");
  });

  disegnaPercorsoSVG([], false);

  if (partenzaId) {
    evidenziaElemento(partenzaId, "state-from");
  }

  if (destinazioneId && destinazioneId !== "evacuazione") {
    evidenziaElemento(destinazioneId, "state-to");

    if (grafoDati && partenzaId) {
      const percorso = calcolaPercorsoMinimo(
        grafoDati,
        partenzaId,
        destinazioneId,
      );
      disegnaPercorsoSVG(percorso, false);
    }
  } else if (destinazioneId === "evacuazione") {
    mostraPianoEvacuazionePerStanza(partenzaId);
  }

  if (focusActive) {
    autoFitCamera();
  }
}

function mostraPianoEvacuazionePerStanza(idPartenza) {
  const settore = getSettorePuntoRaccolta(idPartenza);

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

  if (grafoDati && idPartenza && idPuntoRaccolta) {
    const percorsoEvacuazione = calcolaPercorsoMinimo(
      grafoDati,
      idPartenza,
      idPuntoRaccolta,
    );
    disegnaPercorsoSVG(percorsoEvacuazione, true);
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
    titolo:
      stanza?.etichettaElenco ||
      stanza?.etichettaMappa ||
      id.replace(/-/g, " "),
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

    // 1. Prende etichettaMappa (o etichetta-mappa)
    let testoMappa = stanza
      ? stanza.etichettaMappa ||
        stanza["etichetta-mappa"] ||
        stanza.etichettaElenco
      : id.replace(/-/g, " ");

    // 2. Se in un evento ha un'aula originale diversa, aggiunge la seconda riga tra parentesi
    if (stanza?.aulaOriginale && stanza.aulaOriginale !== testoMappa) {
      testoMappa += `\n(${stanza.aulaOriginale})`;
    }

    // Tooltip per l'hover del mouse (mostra sia l'etichetta elenco che l'aula originale)
    let tooltipText = stanza?.etichettaElenco || testoMappa.replace(/\n/g, " ");
    if (
      stanza?.aulaOriginale &&
      stanza.aulaOriginale !== stanza.etichettaElenco
    ) {
      tooltipText = `${stanza.etichettaElenco} - Ubicazione: ${stanza.aulaOriginale}`;
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

    // Renderizza il testo gestendo correttamente le righe multiple con <tspan>
    creaTestoMultiriga(textEl, testoMappa, centerX, centerY);
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

    tspan.textContent = linea;
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

  document
    .getElementById("modal-close")
    ?.addEventListener("click", chiudiPopUp);
  document.getElementById("room-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "room-modal") chiudiPopUp();
  });

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

    aggiornaMappa(true);
  } catch (error) {
    console.error("Errore durante il caricamento della mappa:", error);
    container.innerHTML =
      "<p style='color: white; padding: 20px;'>Errore nel caricamento della mappa dell'istituto.</p>";
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
