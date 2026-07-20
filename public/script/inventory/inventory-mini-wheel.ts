import { FULL_CIRCLE_RADIANS, SVG_NS, getSegmentColor, getPointOnCircle } from "../wheel/renderer";

export function createMiniWheel(names: string[], size = 70): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");

  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 200 200");

  if (names.length < 2) return svg;

  names.forEach((name, i) => {
    svg.appendChild(createMiniSegment(i, names.length));
    svg.appendChild(createMiniLabel(i, names.length, name));
  });

  return svg;
}

const MINI_CENTER = { x: 100, y: 100 };
const MINI_RADIUS = 90;

function createMiniSegment(index: number, count: number): SVGPathElement {
  const angleStep = FULL_CIRCLE_RADIANS / count;
  const start = index * angleStep;
  const end = (index + 1) * angleStep;

  const startPoint = getPointOnCircle(MINI_CENTER, MINI_RADIUS, start);
  const endPoint = getPointOnCircle(MINI_CENTER, MINI_RADIUS, end);

  const largeArc = angleStep > Math.PI ? 1 : 0;

  const path = document.createElementNS(SVG_NS, "path");

  path.setAttribute(
    "d",
    `M ${MINI_CENTER.x} ${MINI_CENTER.y}
     L ${startPoint.x} ${startPoint.y}
     A ${MINI_RADIUS} ${MINI_RADIUS} 0 ${largeArc} 1 ${endPoint.x} ${endPoint.y}
     Z`
  );

  path.setAttribute("fill", getSegmentColor(index));
  path.setAttribute("stroke", "black");
  path.setAttribute("stroke-width", "0.5");

  return path;
}

const MINI_LABEL_RADIUS = MINI_RADIUS * 0.6;

function createMiniLabel(
  index: number,
  count: number,
  name: string
): SVGTextElement {
  const angleStep = FULL_CIRCLE_RADIANS / count;
  const middleAngle = (index + 0.5) * angleStep;

  const point = getPointOnCircle(MINI_CENTER, MINI_LABEL_RADIUS, middleAngle);

  const text = document.createElementNS(SVG_NS, "text");

  text.setAttribute("x", String(point.x));
  text.setAttribute("y", String(point.y));
  text.setAttribute("fill", "black");
  text.setAttribute("font-size", "8");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");

  const angleDeg = (middleAngle * 180) / Math.PI;
  const rotation = angleDeg > 180 ? angleDeg + 90 : angleDeg - 90;

  text.setAttribute(
    "transform",
    `rotate(${rotation} ${point.x} ${point.y})`
  );

  text.textContent = name;

  return text;
}
