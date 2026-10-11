/* Mappa cromatica delle categorie */
export const MappaColoriCategorie = {
  "Aule": "var(--color-aule)",
  "Aule Didattiche": "var(--color-aule)",
  "Laboratori": "var(--color-laboratori)",
  "Uffici": "var(--color-uffici)",
  "Direzione & Uffici": "var(--color-uffici)",
  "Servizi": "var(--color-servizi)",
  "Locali Tecnici": "var(--color-locali-tecnici)",
  "Sport": "var(--color-sport)",
  "Accesso": "var(--color-generale)",

  "biotecnologie": "var(--color-biotecnologie)",
  "artistico": "var(--color-artistico)",
  "scientifico": "var(--color-scientifico)",
  "elettronica": "var(--color-elettronica)",
  "informatica": "var(--color-informatica)",
  "generale": "var(--color-generale)",
};

export let configurazioneAttiva = {};

export function getColoreCategoria(categoria) {
  if (!categoria) return "var(--color-default)";
  return (
    MappaColoriCategorie[categoria] ||
    MappaColoriCategorie[categoria.toLowerCase()] ||
    "var(--color-generale)"
  );
}

export function getSettorePuntoRaccolta(idStanza) {
  const settore =
    configurazioneAttiva?.stanze?.[idStanza]?.puntoRaccolta ||
    configurazioneAttiva?.stanze?.[idStanza]?.["punto-raccolta"] ||
    "e";

  return settore.toLowerCase();
}

export async function caricaConfigurazioneDaURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const configFile = urlParams.get("config") || "school-day";

  try {
    const resBase = await fetch("config/base/stanze.json");
    if (!resBase.ok) throw new Error("Impossibile caricare config/base/stanze.json");
    const datiBase = await resBase.json();

    let configurazioneCustom = {};
    try {
      const resCustom = await fetch(`config/custom/${configFile}.json`);
      if (resCustom.ok) {
        configurazioneCustom = await resCustom.json();
      } else if (configFile !== "school-day") {
        const resFallback = await fetch("config/custom/school-day.json");
        if (resFallback.ok) configurazioneCustom = await resFallback.json();
      }
    } catch (errCustom) {
      console.warn(`Fallback su school-day per config=${configFile}`);
    }

    configurazioneAttiva = {
      titoloEvento: configurazioneCustom.titoloEvento || datiBase.titoloEvento || "Mappa dell'Istituto",
      stanze: {},
    };

    const stanzeCustom = configurazioneCustom.stanze || {};

    Object.keys(datiBase.stanze).forEach((roomId) => {
      const stanzaBase = datiBase.stanze[roomId];
      const stanzaCustom = stanzeCustom[roomId];

      const nomeFisicoBase =
        stanzaBase?.["etichetta-mappa"] ||
        stanzaBase?.etichettaMappa ||
        stanzaBase?.etichetta ||
        roomId.replace(/-/g, " ");

      const etichettaMappa =
        stanzaCustom?.["etichetta-mappa"] ||
        stanzaCustom?.etichettaMappa ||
        stanzaBase?.["etichetta-mappa"] ||
        stanzaBase?.etichettaMappa ||
        stanzaBase?.etichetta ||
        roomId;

      const etichettaElenco =
        stanzaCustom?.["etichetta-elenco"] ||
        stanzaCustom?.etichettaElenco ||
        stanzaCustom?.etichetta ||
        stanzaBase?.["etichetta-elenco"] ||
        stanzaBase?.etichettaElenco ||
        stanzaBase?.etichetta ||
        etichettaMappa;

      if (stanzaCustom) {
        configurazioneAttiva.stanze[roomId] = {
          ...stanzaBase,
          ...stanzaCustom,
          etichettaMappa,
          etichettaElenco,
          categoria: stanzaCustom.categoria || stanzaBase?.categoria || "Aule",
          aulaOriginale: nomeFisicoBase,
          puntoRaccolta:
            stanzaCustom["punto-raccolta"] ||
            stanzaCustom.puntoRaccolta ||
            stanzaBase?.["punto-raccolta"] ||
            stanzaBase?.puntoRaccolta,
          attivaInEvento: true,
        };
      } else {
        configurazioneAttiva.stanze[roomId] = {
          ...stanzaBase,
          etichettaMappa,
          etichettaElenco,
          aulaOriginale: nomeFisicoBase,
          puntoRaccolta: stanzaBase?.["punto-raccolta"] || stanzaBase?.puntoRaccolta,
          attivaInEvento: false,
        };
      }
    });

    if (configurazioneAttiva.titoloEvento) {
      const headerTitle = document.querySelector(".app-header h1");
      if (headerTitle) headerTitle.textContent = configurazioneAttiva.titoloEvento;
    }
  } catch (err) {
    console.error("Errore caricamento configurazioni:", err);
  }
}