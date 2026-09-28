/* ==========================================================================
   CONSTANTI DI ALLINEAMENTO E GRIGLIA (LAYOUT GRID SYSTEM)
   ========================================================================== */
export const GRID = {
  // Punti di riferimento Y
  VIEWBOX_ORIGIN_Y: 0,
  VIEWBOX_HEIGHT: 2500,

  TERRENO_MARGIN_Y: 10,

  INGRESSO_PEDONALE_PRINCIPALE_VERT_Y: 367,

  CORRIDOIO_NORD_Y: 487,
  CORRIDOIO_NORD_H: 30,

  PALAZZINE_FLORIANI_EST_Y: 900,
  PALAZZINE_FLORIANI_OVEST_Y: 1090,
  PALAZZINE_FLORIANI_H: 150,

  // Punti di riferimento X
  VIEWBOX_ORIGIN_X: 0,
  VIEWBOX_WIDTH: 2143,

  TERRENO_MARGIN_X: 10,

  PALAZZINE_FLORIANI_OVEST_X: 240,
  PALAZZINE_FLORIANI_EST_X: 580,
  PALAZZINE_FLORIANI_W: 150,

  INGRESSO_PEDONALE_PRINCIPALE_VERT_X: 753,

};

/* ==========================================================================
   STRUTTURA DEGLI ELEMENTI GRAFICI DELLA MAPPA
   ========================================================================== */
export const mapData = {
  // Layer 1: Terreno ed Ambiente Esterno (prati, confini Istituto, strada)
  // Prati, confine dell'istituto, strada.
  baseLayout: [
    {
      id: "terreno-principale",
      type: "terreno",
      x: GRID.VIEWBOX_ORIGIN_X + GRID.TERRENO_MARGIN_X,
      y: GRID.VIEWBOX_ORIGIN_Y + GRID.TERRENO_MARGIN_Y,
      w: GRID.VIEWBOX_WIDTH - 2 * GRID.TERRENO_MARGIN_X,
      h: GRID.VIEWBOX_HEIGHT - 2 * GRID.TERRENO_MARGIN_Y,
    },
  ],

  // Layer 2: Elementi Esterni & Infrastrutture
  // Parcheggi (poligoni), campi sportivi, cortili, ingressi pedonali.
  elementiEsterni: [
    {
      id: "parcheggio-nord",
      type: "polygon",
      className: "parcheggio",
      points: "700,367 1800,367 1800,290 800,20",
      label: "Parcheggio Nord",
      textX: 1200,
      textY: 300,
    },
    {
      id: "nuova-palazzina",
      type: "rect",
      className: "edificio-esterno",
      x: 240,
      y: 500,
      w: 490,
      h: 280,
      label: "Nuova Palazzina",
    },
    {
      id: "floriani-1",
      type: "rect",
      className: "edificio-esterno",
      x: GRID.PALAZZINE_FLORIANI_EST_X,
      y: GRID.PALAZZINE_FLORIANI_EST_Y,
      w: GRID.PALAZZINE_FLORIANI_W,
      h: GRID.PALAZZINE_FLORIANI_H,
      label: "palazzina Floriani 1",
    },
    {
      id: "floriani-2",
      type: "rect",
      className: "edificio-esterno",
      x: GRID.PALAZZINE_FLORIANI_EST_X,
      y: GRID.PALAZZINE_FLORIANI_EST_Y + GRID.PALAZZINE_FLORIANI_H + 30,
      w: GRID.PALAZZINE_FLORIANI_W,
      h: GRID.PALAZZINE_FLORIANI_H,
      label: "palazzina Floriani 2",
    },
    {
      id: "floriani-3",
      type: "rect",
      className: "edificio-esterno",
      x: GRID.PALAZZINE_FLORIANI_EST_X,
      y: GRID.PALAZZINE_FLORIANI_EST_Y + 2 * GRID.PALAZZINE_FLORIANI_H + 2 * 30,
      w: GRID.PALAZZINE_FLORIANI_W,
      h: GRID.PALAZZINE_FLORIANI_H,
      label: "palazzina Floriani 3",
    },
    {
      id: "floriani-4",
      type: "rect",
      className: "edificio-esterno",
      x: GRID.PALAZZINE_FLORIANI_OVEST_X,
      y: GRID.PALAZZINE_FLORIANI_OVEST_Y,
      w: GRID.PALAZZINE_FLORIANI_W,
      h: GRID.PALAZZINE_FLORIANI_H,
      label: "palazzina Floriani 4",
    },
    {
      id: "floriani-5",
      type: "rect",
      className: "edificio-esterno",
      x: GRID.PALAZZINE_FLORIANI_OVEST_X,
      y: GRID.PALAZZINE_FLORIANI_OVEST_Y + GRID.PALAZZINE_FLORIANI_H + 40,
      w: GRID.PALAZZINE_FLORIANI_W,
      h: GRID.PALAZZINE_FLORIANI_H,
      label: "palazzina Floriani 5",
    },
    {
      id: "palestra-floriani",
      type: "rect",
      className: "edificio-esterno",
      x: GRID.PALAZZINE_FLORIANI_OVEST_X + GRID.PALAZZINE_FLORIANI_W + 20,
      y: GRID.PALAZZINE_FLORIANI_OVEST_Y + GRID.PALAZZINE_FLORIANI_H + 40,
      w: GRID.PALAZZINE_FLORIANI_W,
      h: GRID.PALAZZINE_FLORIANI_H,
      label: "palestra Floriani",
    },
    {
      id: "floriani-6",
      type: "rect",
      className: "edificio-esterno",
      x: GRID.PALAZZINE_FLORIANI_OVEST_X + GRID.PALAZZINE_FLORIANI_W + 20,
      y: 1570,
      w: GRID.PALAZZINE_FLORIANI_W * 2 + 20,
      h: 140,
      label: "palazzina Floriani 6",
    },
    {
      id: "palazzina-ex-Vanoni",
      type: "rect",
      className: "edificio-esterno",
      x: GRID.PALAZZINE_FLORIANI_OVEST_X + GRID.PALAZZINE_FLORIANI_W + 20,
      y: 1840,
      w: GRID.PALAZZINE_FLORIANI_W * 2 + 20,
      h: 140,
      label: "palazzina ex Vanoni",
    },
    {
      id: "palestre",
      type: "rect",
      className: "edificio-esterno",
      x: GRID.INGRESSO_PEDONALE_PRINCIPALE_VERT_X + 130,
      y: 1700,
      w: 500,
      h: 720,
      label: "Palestre",
    },
    {
      id: "tensostruttura",
      type: "rect",
      className: "edificio-esterno",
      x: 1500,
      y: 1900,
      w: 160,
      h: 400,
      label: "tensostruttura",
    },
    {
      id: "campo-sportivo",
      type: "rect",
      className: "campo-sportivo",
      x: 1700,
      y: 1700,
      w: 400,
      h: 720,
      label: "Campo Sportivo",
    },
    {
      id: "palazzina-amfiteatro",
      type: "rect",
      className: "edificio-esterno",
      x: 40,
      y: 1570,
      w: 320,
      h: 410,
      label: "palazzina Amfiteatro",
    },
    {
      id: "palazzina-banfi",
      type: "rect",
      className: "edificio-esterno",
      x: 40,
      y: 2120,
      w: 680,
      h: 310,
      label: "palazzina Banfi",
    },
  ],

  //Layer 3: Struttura Muraria ed Edificio Esterno (layer-edificio)
  // Sagoma esterna degli edifici, muri perimetrali principali.
  edifici: [
    {
      id: "blocco-nord",
      type: "rect",
      className: "blocco",
      x: 883, // DA RENDERE PARAMETRICO
      y: 407,
      w: 900,
      h: 470,
      label: "blocco Nord",
    },
    {
      id: "blocco-centrale",
      type: "rect",
      className: "blocco",
      x: 1293, // DA RENDERE PARAMETRICO
      y: 877,
      w: 120,
      h: 210,
      label: "blocco centrale",
    },
    {
      id: "blocco-sud",
      type: "rect",
      className: "blocco",
      x: 883, // DA RENDERE PARAMETRICO
      y: 1087,
      w: 900,
      h: 470,
      label: "blocco centrale",
    },
     {
      id: "blocco-palestra-floriani",
      type: "rect",
      className: "blocco",
      x: GRID.PALAZZINE_FLORIANI_OVEST_X + GRID.PALAZZINE_FLORIANI_W + 20,
      y: GRID.PALAZZINE_FLORIANI_OVEST_Y + GRID.PALAZZINE_FLORIANI_H + 40,
      w: GRID.PALAZZINE_FLORIANI_W,
      h: GRID.PALAZZINE_FLORIANI_H,
      label: "blocco palestra Floriani",
    },
    {
      id: "blocco-palazzina-ex-Vanoni",
      type: "rect",
      className: "blocco",
      x: GRID.PALAZZINE_FLORIANI_OVEST_X + GRID.PALAZZINE_FLORIANI_W + 20,
      y: 1840,
      w: GRID.PALAZZINE_FLORIANI_W * 2 + 20,
      h: 140,
      label: "blocco palazzina ex Vanoni",
    },
    {
      id: "blocco-palestre",
      type: "rect",
      className: "blocco",
      x: GRID.INGRESSO_PEDONALE_PRINCIPALE_VERT_X + 130,
      y: 1700,
      w: 500,
      h: 720,
      label: "blocco Palestre",
    },
    {
      id: "blocco-tensostruttura",
      type: "rect",
      className: "blocco",
      x: 1500,
      y: 1900,
      w: 160,
      h: 400,
      label: "blocco tensostruttura",
    },
    {
      id: "blocco-campo-sportivo",
      type: "rect",
      className: "blocco-arrotondato",
      x: 1700,
      y: 1700,
      w: 400,
      h: 720,
      label: "Campo Sportivo",
    },

  ],
  /*<g id="blocchi-edificio-einstein">
        <rect id="blocco-nord" x="883.33" y="407.14" width="900" height="470" class="blocco" />
        <rect id="blocco-centrale" x="1293.33" y="877.14" width="120" height="210" class="blocco" />
        <rect id="blocco-sud" x="883.33" y="1087.14" width="900" height="470" class="blocco" />
    </g>*/

  // Layer 4: Corridoi & Connessioni (layer-corridoi)
  // Corridoi interni, atri, spazi di transito (sovrapposti alla base dell'edificio).
  corridoi: [
   
  ],

  //Layer 5: Stanze, Aule & Servizi (layer-stanze)
  //Rettangoli delle aule, laboratori, uffici, bagni.
  stanze: [
  ],
  // Layer 6: Etichette Testuali (ForeignObjects / Text) (layer-labels)
  // I testi e le sigle per garantire che siano sempre ben visibili e sopra qualsiasi colore di sfondo.

  // Layer 7: Overlay Percorsi & Pathfinding (layer-navigation)
  // Linee del percorso da seguire, frecce direzionali, marker di partenza e arrivo (devono stare sopra a tutto).
};
