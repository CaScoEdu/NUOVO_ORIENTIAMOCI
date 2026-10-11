import { calcolaPercorsoMinimo } from "./pathfinder.js";
import grafoDatiStatico from "../config/navigation/grafo.js";
import {
  caricaConfigurazioneDaURL,
  getSettorePuntoRaccolta,
} from "./config.js";
import { autoFitCamera, viewBoxEdificioH } from "./camera.js";
import { disegnaPercorsoSVG, applicaEtichetteMappa } from "./mapRenderer.js";
import {
  popolaDropdowns,
  sincronizzaValoriTomSelect,
  gestisciStileSelettoreArrivo,
  mostraPopUpStanza,
  chiudiPopUp,
} from "./ui.js";

/* ==========================================================================
   STATO GLOBALE DELL'APPLICAZIONE
   ========================================================================== */

let partenzaId = "ingresso-principale";
let destinazioneId = "";

/* ==========================================================================
   AGGIORNAMENTO MAPPA ED EVIDENZIAZIONE
   ========================================================================== */

function aggiornaMappa(focusActive = false) {
  // Sincronizza lo stato visivo di Tom-Select
  sincronizzaValoriTomSelect(partenzaId, destinazioneId);

  // Rimuove gli stati precedenti dagli elementi dell'SVG
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

    if (grafoDatiStatico && partenzaId) {
      const percorso = calcolaPercorsoMinimo(
        grafoDatiStatico,
        partenzaId,
        destinazioneId,
      );
      disegnaPercorsoSVG(percorso, false);
    }
  } else if (destinazioneId === "evacuazione") {
    mostraPianoEvacuazionePerStanza(partenzaId);
  }

  if (focusActive) {
    autoFitCamera(partenzaId, destinazioneId, grafoDatiStatico);
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

function mostraPianoEvacuazionePerStanza(idPartenza) {
  const settore = getSettorePuntoRaccolta(idPartenza);

  const layerEvacuazione = document.getElementById("layer-evacuazione");
  if (layerEvacuazione) layerEvacuazione.classList.add("evacuazione-visibile");

  const idPuntoRaccolta = `punto-raccolta-${settore}`;
  const elPuntoRaccolta = document.getElementById(idPuntoRaccolta);
  if (elPuntoRaccolta) elPuntoRaccolta.classList.add("evacuazione-visibile");

  const elUscita =
    document.getElementById(`uscita-sicurezza-${settore}`) ||
    document.getElementById(`uscita-${settore}`);

  if (elUscita) elUscita.classList.add("evacuazione-visibile");

  if (grafoDatiStatico && idPartenza && idPuntoRaccolta) {
    const percorsoEvacuazione = calcolaPercorsoMinimo(
      grafoDatiStatico,
      idPartenza,
      idPuntoRaccolta,
    );
    disegnaPercorsoSVG(percorsoEvacuazione, true);
  }
}

function scambiaOrigineDestinazione() {
  if (!destinazioneId || destinazioneId === "evacuazione") return;

  const temp = partenzaId;
  partenzaId = destinazioneId;
  destinazioneId = temp;

  aggiornaMappa(true);
}

/* ==========================================================================
   EVENT LISTENERS E AVVIO
   ========================================================================== */

function setupEventListeners() {
  const btnSwap = document.getElementById("btn-swap");
  btnSwap?.addEventListener("click", scambiaOrigineDestinazione);

  document
    .getElementById("modal-close")
    ?.addEventListener("click", chiudiPopUp);

  document.getElementById("room-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "room-modal") chiudiPopUp();
  });

  // Listener per il click sulle stanze SVG
  document.querySelectorAll(".room, #ingresso-principale").forEach((roomEl) => {
    roomEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const clickedId = roomEl.getAttribute("id");
      if (!clickedId) return;

      mostraPopUpStanza(clickedId, (nuovaDestinazione) => {
        destinazioneId = nuovaDestinazione;
        gestisciStileSelettoreArrivo(destinazioneId);
        aggiornaMappa(true);
      });
    });
  });
}

async function caricaMappaSVG() {
  const container = document.getElementById("map-container");
  if (!container) return;

  try {
    // 1. Carica prima la configurazione JSON dell'evento
    await caricaConfigurazioneDaURL();

    // 2. Carica ed inietta il file SVG della mappa
    const response = await fetch("assets/mappa.svg");
    if (!response.ok) throw new Error("Impossibile caricare mappa.svg");

    const svgText = await response.text();
    container.innerHTML = svgText;

    const svg =
      document.getElementById("school-map") || container.querySelector("svg");
    if (svg) {
      svg.setAttribute("viewBox", viewBoxEdificioH);
      svg.removeAttribute("preserveAspectRatio");
    }

    // 3. Applica stili ed etichette agli elementi SVG
    applicaEtichetteMappa();

    // 4. Popola i dropdown con le stanze caricate dall'SVG e dalla configurazione
    const statoIniziale = popolaDropdowns({
      partenzaId,
      destinazioneId,
      onFromChange: (val) => {
        partenzaId = val;
        aggiornaMappa(true);
      },
      onToChange: (val) => {
        destinazioneId = val;
        gestisciStileSelettoreArrivo(destinazioneId);
        aggiornaMappa(true);
      },
    });

    partenzaId = statoIniziale.partenzaId;
    destinazioneId = statoIniziale.destinazioneId;

    // 5. Attiva gli eventi di click ed aggiorna lo stato visivo
    setupEventListeners();
    aggiornaMappa(true);
  } catch (error) {
    console.error("Errore durante il caricamento della mappa:", error);
    container.innerHTML =
      "<p style='color: white; padding: 20px;'>Errore nel caricamento della mappa dell'istituto.</p>";
  }
}

document.addEventListener("DOMContentLoaded", caricaMappaSVG);

window.addEventListener("online", () =>
  mostranotifica("Connessione ripristinata"),
);
window.addEventListener("offline", () =>
  mostranotifica("Sei offline: la mappa funziona comunque!"),
);

function mostranotifica(messaggio) {
  let toast = document.getElementById("pwa-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "pwa-toast";
    toast.className = "pwa-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = messaggio;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4000);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then(() => console.log("Service Worker registrato correttamente."))
      .catch((err) => console.log("Errore registrazione Service Worker:", err));
  });
}
