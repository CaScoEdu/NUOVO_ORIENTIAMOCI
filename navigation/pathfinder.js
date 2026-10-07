/**
 * Calcola il centroide (x, y) di un elemento SVG nel sistema di coordinate locale (viewBox)
 */
export function getCentroideNodo(nodoId) {
  const el = document.getElementById(nodoId);
  if (!el) {
    console.warn(`Elemento non trovato nell'SVG: ${nodoId}`);
    return null;
  }

  // 1. Cerchi (<circle cx="..." cy="..." />)
  if (el.tagName.toLowerCase() === "circle") {
    const cx = parseFloat(el.getAttribute("cx"));
    const cy = parseFloat(el.getAttribute("cy"));
    if (!isNaN(cx) && !isNaN(cy)) return { x: cx, y: cy };
  }

  // 2. Gruppi o icone con transform="translate(X, Y)" (es. Segnali Evacuazione)
  const transformAttr = el.getAttribute("transform");
  if (transformAttr) {
    const matchTranslate = /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(transformAttr);
    if (matchTranslate) {
      const transX = parseFloat(matchTranslate[1]);
      const transY = parseFloat(matchTranslate[2]);

      let scaleX = 1;
      let scaleY = 1;
      const matchScale = /scale\(\s*([-\d.]+)(?:[,\s]+([-\d.]+))?\s*\)/.exec(transformAttr);
      if (matchScale) {
        scaleX = parseFloat(matchScale[1]);
        scaleY = parseFloat(matchScale[2] !== undefined ? matchScale[2] : matchScale[1]);
      }

      try {
        const bbox = el.getBBox();
        if (bbox.width > 0 || bbox.height > 0) {
          const centroLocaleX = bbox.x + bbox.width / 2;
          const centroLocaleY = bbox.y + bbox.height / 2;

          return {
            x: transX + (centroLocaleX * scaleX),
            y: transY + (centroLocaleY * scaleY)
          };
        }
      } catch (e) {
        // Fallback in caso getBBox non sia disponibile
      }

      return { x: transX, y: transY };
    }
  }

  // 3. Rettangoli, Stanze ed elementi standard tramite getBBox
  try {
    const bbox = el.getBBox();
    if (bbox.width > 0 || bbox.height > 0) {
      return {
        x: bbox.x + bbox.width / 2,
        y: bbox.y + bbox.height / 2
      };
    }
  } catch (e) {
    // Fallback
  }

  // 4. Fallback per attributi x e y diretti
  const directX = parseFloat(el.getAttribute("x") || 0);
  const directY = parseFloat(el.getAttribute("y") || 0);

  return { x: directX, y: directY };
}

/**
 * Calcola la distanza euclidea tra due nodi SVG
 */
export function calcolaDistanza(nodoAId, nodoBId) {
  const posA = getCentroideNodo(nodoAId);
  const posB = getCentroideNodo(nodoBId);

  if (!posA || !posB) return 1;

  const dx = posA.x - posB.x;
  const dy = posA.y - posB.y;

  return Math.hypot(dx, dy);
}

/**
 * Algoritmo di Dijkstra basato sulle coordinate euclidee dinamiche
 */
export function calcolaPercorsoMinimo(grafo, sorgenteId, destinazioneId) {
  if (!grafo || !grafo.adiacenze) return [];

  const distanze = {};
  const precedenti = {};
  const unvisited = new Set();

  Object.keys(grafo.adiacenze).forEach((nodo) => {
    distanze[nodo] = Infinity;
    precedenti[nodo] = null;
    unvisited.add(nodo);
  });

  if (!unvisited.has(sorgenteId) || !unvisited.has(destinazioneId)) {
    console.warn(`Sorgente (${sorgenteId}) o Destinazione (${destinazioneId}) non trovate nel grafo.`);
    return [];
  }

  distanze[sorgenteId] = 0;

  while (unvisited.size > 0) {
    let nodoCorrente = null;
    let minDist = Infinity;

    unvisited.forEach((nodo) => {
      if (distanze[nodo] < minDist) {
        minDist = distanze[nodo];
        nodoCorrente = nodo;
      }
    });

    if (nodoCorrente === null || nodoCorrente === destinazioneId) break;

    unvisited.delete(nodoCorrente);

    const vicini = grafo.adiacenze[nodoCorrente] || [];
    vicini.forEach((vicinoId) => {
      if (unvisited.has(vicinoId)) {
        const pesoArco = calcolaDistanza(nodoCorrente, vicinoId);
        const nuovaDistanza = distanze[nodoCorrente] + pesoArco;

        if (nuovaDistanza < distanze[vicinoId]) {
          distanze[vicinoId] = nuovaDistanza;
          precedenti[vicinoId] = nodoCorrente;
        }
      }
    });
  }

  const percorso = [];
  let curr = destinazioneId;
  while (curr !== null) {
    percorso.unshift(curr);
    curr = precedenti[curr];
  }

  return percorso[0] === sorgenteId ? percorso : [];
}