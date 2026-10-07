/**
 * Calcola il centroide (x, y) di un elemento SVG tramite getBBox
 */
export function getCentroideNodo(nodoId) {
  const el = document.getElementById(nodoId);
  if (!el) {
    console.warn(`Elemento non trovato nell'SVG: ${nodoId}`);
    return null;
  }

  const box = el.getBBox();
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2
  };
}

/**
 * Calcola la distanza euclidea tra due nodi SVG
 */
export function calcolaDistanza(nodoAId, nodoBId) {
  const posA = getCentroideNodo(nodoAId);
  const posB = getCentroideNodo(nodoBId);

  if (!posA || !posB) return Infinity;

  return Math.hypot(posB.x - posA.x, posB.y - posA.y);
}

/**
 * Algoritmo di Dijkstra basato sulle coordinate euclidee dinamiche
 */
export function calcolaPercorsoMinimo(grafo, sorgenteId, destinazioneId) {
  const distanze = {};
  const precedenti = {};
  const unvisited = new Set();

  // Inizializzazione
  Object.keys(grafo.adiacenze).forEach(nodo => {
    distanze[nodo] = Infinity;
    precedenti[nodo] = null;
    unvisited.add(nodo);
  });

  distanze[sorgenteId] = 0;

  while (unvisited.size > 0) {
    let nodoCorrente = null;
    let minDist = Infinity;

    unvisited.forEach(nodo => {
      if (distanze[nodo] < minDist) {
        minDist = distanze[nodo];
        nodoCorrente = nodo;
      }
    });

    if (nodoCorrente === null || nodoCorrente === destinazioneId) break;

    unvisited.delete(nodoCorrente);

    const vicini = grafo.adiacenze[nodoCorrente] || [];
    vicini.forEach(vicinoId => {
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

  // Ricostruzione rotta
  const percorso = [];
  let curr = destinazioneId;
  while (curr !== null) {
    percorso.unshift(curr);
    curr = precedenti[curr];
  }

  return percorso[0] === sorgenteId ? percorso : [];
}