import {
  configurazioneAttiva,
  getColoreCategoria,
} from "./config.js";

/* ==========================================================================
   STATO E ISTANZE UI
   ========================================================================== */

let tomSelectFrom = null;
let tomSelectTo = null;

/* ==========================================================================
   INIZIALIZZAZIONE TOM-SELECT E SELETTORI
   ========================================================================== */

export function inizializzaTomSelect(onFromChange, onToChange) {
  if (tomSelectFrom) tomSelectFrom.destroy();
  if (tomSelectTo) tomSelectTo.destroy();

  const selectFrom = document.getElementById("select-from");
  const selectTo = document.getElementById("select-to");

  const opzioniComuni = {
    create: false,
    maxOptions: null,
    sortField: [],
    searchField: ["text"],
    lockOptgroupOrder: true,
  };

  if (selectFrom) {
    tomSelectFrom = new TomSelect("#select-from", {
      ...opzioniComuni,
      placeholder: "Cerca partenza...",
      allowEmptyOption: false,
    });

    tomSelectFrom.on("change", function (val) {
      this.blur();
      if (onFromChange) onFromChange(val);
    });
  }

  if (selectTo) {
    tomSelectTo = new TomSelect("#select-to", {
      ...opzioniComuni,
      placeholder: "Cerca destinazione...",
      allowEmptyOption: true,
    });

    tomSelectTo.on("change", function (val) {
      this.blur();
      if (onToChange) onToChange(val);
    });
  }
}

export function popolaDropdowns({
  partenzaId,
  destinazioneId,
  onFromChange,
  onToChange,
}) {
  const selectFrom = document.getElementById("select-from");
  const selectTo = document.getElementById("select-to");
  if (!selectFrom || !selectTo) return { partenzaId, destinazioneId };

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

    const categoria = eIngresso ? "Accesso" : stanza?.categoria || "Aule";
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

  const ordinePredefinitoCategorie = [
    "Accesso",
    "Aule",
    "Laboratori",
    "Uffici",
    "Servizi",
    "Locali Tecnici",
    "Sport",
  ];

  const categorieOrdinate = Object.keys(gruppiPerCategoria).sort((a, b) => {
    if (a === "Accesso") return -1;
    if (b === "Accesso") return 1;

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
        const coloreBg = getColoreCategoria(cat);
        const coloreTesto =
          cat === "Aule" || cat === "Servizi" || cat === "Aule Didattiche"
            ? "#000000"
            : "#ffffff";

        html += `<optgroup label="── ${cat.toUpperCase()} ──" style="background-color: ${coloreBg}; color: ${coloreTesto}; font-weight: bold;">`;
        opzioniFiltrare.forEach((opt) => {
          html += `<option value="${opt.id}">${opt.titolo}</option>`;
        });
        html += `</optgroup>`;
      }
    });
    return html;
  }

  let optionsFromHTML = generaHTMLGruppi(false);

  let optionsToHTML = `<option value="" selected>-- Seleziona destinazione --</option>`;
  optionsToHTML += `<option value="evacuazione">🚨 EVACUAZIONE / SICUREZZA</option>`;
  optionsToHTML += `<option value="ingresso-principale">📍 INGRESSO</option>`;
  optionsToHTML += generaHTMLGruppi(true);

  selectFrom.innerHTML = optionsFromHTML;
  selectTo.innerHTML = optionsToHTML;

  let nuovaPartenzaId = partenzaId;
  const tutteLeOpzioniFrom = Object.values(gruppiPerCategoria).flat();
  if (tutteLeOpzioniFrom.some((opt) => opt.id === partenzaId)) {
    selectFrom.value = partenzaId;
  } else if (tutteLeOpzioniFrom.some((opt) => opt.id === "ingresso-principale")) {
    nuovaPartenzaId = "ingresso-principale";
    selectFrom.value = nuovaPartenzaId;
  } else if (tutteLeOpzioniFrom.length > 0) {
    nuovaPartenzaId = tutteLeOpzioniFrom[0].id;
    selectFrom.value = nuovaPartenzaId;
  }

  selectTo.value = destinazioneId;

  inizializzaTomSelect(onFromChange, onToChange);
  gestisciStileSelettoreArrivo(destinazioneId);

  return { partenzaId: nuovaPartenzaId, destinazioneId };
}

export function sincronizzaValoriTomSelect(partenzaId, destinazioneId) {
  if (tomSelectFrom && tomSelectFrom.getValue() !== partenzaId) {
    tomSelectFrom.setValue(partenzaId, true);
  }
  if (tomSelectTo && tomSelectTo.getValue() !== destinazioneId) {
    tomSelectTo.setValue(destinazioneId, true);
  }
  gestisciStileSelettoreArrivo(destinazioneId);
}

export function gestisciStileSelettoreArrivo(destinazioneId) {
  const wrapperTo = tomSelectTo
    ? tomSelectTo.wrapper
    : document.getElementById("select-to");
  if (wrapperTo) {
    wrapperTo.classList.toggle(
      "mode-evacuazione",
      destinazioneId === "evacuazione",
    );
  }
}

/* ==========================================================================
   INTERAZIONE POP-UP MODAL E UTILITY TESTO
   ========================================================================== */

function normalizzaStringa(str) {
  if (!str) return "";
  return str
    .replace(/\n/g, " ")
    .replace(/^[^\w\d]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function getTitoloFormattatoStanza(id) {
  if (id === "ingresso-principale") return "📍 INGRESSO";

  const stanza = configurazioneAttiva?.stanze?.[id];
  if (stanza) {
    const etichetta =
      stanza.etichettaElenco ||
      stanza["etichetta-elenco"] ||
      stanza.etichetta ||
      id;

    const cleanEtichetta = normalizzaStringa(etichetta);
    const cleanOriginale = normalizzaStringa(stanza.aulaOriginale);

    if (cleanOriginale && cleanOriginale !== cleanEtichetta) {
      const originalePulito = stanza.aulaOriginale.replace(/\n/g, " ");
      return `${etichetta} (${originalePulito})`;
    }

    return etichetta;
  }

  return id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export function mostraPopUpStanza(id, onConfirmDestination) {
  const modal = document.getElementById("room-modal");
  if (!modal) return;

  const stanza = configurazioneAttiva?.stanze?.[id];

  const info = {
    titolo:
      stanza?.etichettaElenco ||
      stanza?.etichettaMappa ||
      id.replace(/-/g, " "),
    categoria: stanza?.categoria || "Aule",
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
  if (modalDesc) modalDesc.textContent = info.descrizione;

  if (modalCategory) {
    modalCategory.textContent = info.categoria;
    const coloreBg = getColoreCategoria(info.categoria);
    modalCategory.style.backgroundColor = coloreBg;

    if (
      info.categoria === "Aule" ||
      info.categoria === "Servizi" ||
      info.categoria === "Aule Didattiche"
    ) {
      modalCategory.style.color = "#000000";
    } else {
      modalCategory.style.color = "#ffffff";
    }
  }

  if (refElement) {
    const cleanTitolo = normalizzaStringa(info.titolo);
    const cleanOriginale = normalizzaStringa(info.aulaOriginale);

    if (cleanOriginale && cleanOriginale !== cleanTitolo) {
      refElement.textContent = `📍 Ubicazione: ${info.aulaOriginale}`;
      refElement.style.display = "block";
    } else {
      refElement.style.display = "none";
    }
  }

  if (btnSetDest) {
    btnSetDest.onclick = () => {
      if (onConfirmDestination) onConfirmDestination(id);
      chiudiPopUp();
    };
  }

  modal.classList.remove("hidden");
}

export function chiudiPopUp() {
  const modal = document.getElementById("room-modal");
  if (modal) modal.classList.add("hidden");
}