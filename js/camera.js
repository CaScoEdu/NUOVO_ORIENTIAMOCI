import { getCentroideNodo, calcolaPercorsoMinimo } from "./pathfinder.js";
import { getSettorePuntoRaccolta } from "./config.js";

export const viewBoxEdificioH = "850 380 1000 1200";

export function autoFitCamera(partenzaId, destinazioneId, grafoDati) {
  const svg = document.getElementById("school-map");
  if (!svg) return;

  if (!destinazioneId) {
    svg.setAttribute("viewBox", viewBoxEdificioH);
    return;
  }

  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  function estendiBBox(x, y, w = 0, h = 0) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }

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
  } else {
    const elTo = document.getElementById(destinazioneId);
    if (elTo) elementiInquadratura.push(elTo);
  }

  elementiInquadratura.forEach((el) => {
    let rx = 0, ry = 0, rw = 0, rh = 0;
    try {
      const bbox = el.getBBox();
      rx = bbox.x; ry = bbox.y; rw = bbox.width; rh = bbox.height;

      const transformAttr = el.getAttribute("transform");
      if (transformAttr) {
        const translateMatch = /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(transformAttr);
        if (translateMatch) {
          rx += parseFloat(translateMatch[1]);
          ry += parseFloat(translateMatch[2]);
        }
        const scaleMatch = /scale\(\s*([-\d.]+)[,\s]*([-\d.]*)\s*\)/.exec(transformAttr);
        if (scaleMatch) {
          const scaleX = parseFloat(scaleMatch[1]);
          const scaleY = scaleMatch[2] ? parseFloat(scaleMatch[2]) : scaleX;
          rw *= scaleX; rh *= scaleY;
        }
      }
    } catch (e) {
      rx = parseFloat(el.getAttribute("x")) || 0;
      ry = parseFloat(el.getAttribute("y")) || 0;
      rw = parseFloat(el.getAttribute("width")) || 0;
      rh = parseFloat(el.getAttribute("height")) || 0;
    }
    estendiBBox(rx, ry, rw, rh);
  });

  let percorsoNodi = [];
  if (grafoDati && partenzaId) {
    if (destinazioneId === "evacuazione") {
      const settore = getSettorePuntoRaccolta(partenzaId);
      const idPuntoRaccolta = `punto-raccolta-${settore}`;
      percorsoNodi = calcolaPercorsoMinimo(grafoDati, partenzaId, idPuntoRaccolta);
    } else {
      percorsoNodi = calcolaPercorsoMinimo(grafoDati, partenzaId, destinazioneId);
    }
  }

  if (percorsoNodi && percorsoNodi.length > 0) {
    percorsoNodi.forEach((nodoId) => {
      const pos = getCentroideNodo(nodoId);
      if (pos) estendiBBox(pos.x, pos.y);
    });
  }

  if (minX === Infinity) {
    svg.setAttribute("viewBox", viewBoxEdificioH);
    return;
  }

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  const paddingX = Math.max(40, contentWidth * 0.05);
  const paddingY = Math.max(40, contentHeight * 0.05);

  const vX = minX - paddingX;
  const vY = minY - paddingY;
  const vW = contentWidth + paddingX * 2;
  const vH = contentHeight + paddingY * 2;

  svg.setAttribute("viewBox", `${vX} ${vY} ${vW} ${vH}`);
}