import { requiredElement } from "../shared/dom-helpers";

export const SEGMENT_COLORS: string[] = [
  "#f4d87e",
  "#f4a96b",
  "#f4a0a0",
  "#a8d8f0",
  "#c5b8f0",
  "#ae945d",
  "#8a78c5",
  "#745bc6",
  "#312260",
  "#1f1542",
  "#3c287b",
  "rgb(141, 116, 225)",
  "#504672",
];

export function getSegmentColor(index: number): string {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}

export interface Point {
  x: number;
  y: number;
}

export function getPointOnCircle(center: Point, radius: number, angleRadians: number): Point {
  return {
    x: center.x + radius * Math.cos(angleRadians - Math.PI / 2),
    y: center.y + radius * Math.sin(angleRadians - Math.PI / 2),
  };
}

export const WHEEL_CENTER: Point = { x: 100, y: 100 };
export const WHEEL_RADIUS: number = 100;
export const FULL_CIRCLE_RADIANS: number = Math.PI * 2;
export const SVG_NS = "http://www.w3.org/2000/svg";

function createWheelSegmentPath(
  segmentIndex: number,
  segmentCount: number,
  color: string
): SVGPathElement {
  const angleStep = FULL_CIRCLE_RADIANS / segmentCount;
  const startAngle = segmentIndex * angleStep;
  const endAngle = (segmentIndex + 1) * angleStep;

  const startPoint = getPointOnCircle(WHEEL_CENTER, WHEEL_RADIUS, startAngle);
  const endPoint = getPointOnCircle(WHEEL_CENTER, WHEEL_RADIUS, endAngle);
  const largeArcFlag = angleStep > Math.PI ? 1 : 0;

  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute(
    "d",
    `M ${WHEEL_CENTER.x} ${WHEEL_CENTER.y} L ${startPoint.x} ${startPoint.y} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y} Z`
  );
  path.setAttribute("fill", color);
  path.setAttribute("stroke", "black");
  path.setAttribute("stroke-width", "1");

  return path;
}

function createWheelLabel(
  segmentIndex: number,
  segmentCount: number,
  name: string
): SVGTextElement {
  const angleStep = FULL_CIRCLE_RADIANS / segmentCount;
  const middleAngle = (segmentIndex + 0.5) * angleStep;

  const labelRadius = WHEEL_RADIUS * 0.62;
  const labelPoint = getPointOnCircle(WHEEL_CENTER, labelRadius, middleAngle);

  const text = document.createElementNS(SVG_NS, "text");
  text.setAttribute("x", String(labelPoint.x));
  text.setAttribute("y", String(labelPoint.y));
  text.setAttribute("fill", "black");
  text.setAttribute("font-size", "10");
  text.setAttribute("font-weight", "bold");
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "middle");

  const angleInDegrees = (middleAngle * 180) / Math.PI;
  const readableRotation = angleInDegrees > 180 ? angleInDegrees + 90 : angleInDegrees - 90;

  text.setAttribute(
    "transform",
    `rotate(${readableRotation} ${labelPoint.x} ${labelPoint.y})`
  );

  text.textContent = name;
  return text;
}

export const wheelElement = requiredElement<SVGGElement>("wheel");

export function clearWheel(): void {
  wheelElement.innerHTML = "";
}

export function generateWheel(names: string[]): void {
  const segmentCount = names.length;
  clearWheel();

  if (segmentCount === 0) return;

  if (segmentCount === 1) {
    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("cx", String(WHEEL_CENTER.x));
    circle.setAttribute("cy", String(WHEEL_CENTER.y));
    circle.setAttribute("r", String(WHEEL_RADIUS));
    circle.setAttribute("fill", getSegmentColor(0));
    circle.setAttribute("stroke", "black");
    circle.setAttribute("stroke-width", "1");
    wheelElement.appendChild(circle);

    const text = document.createElementNS(SVG_NS, "text");
    text.setAttribute("x", String(WHEEL_CENTER.x));
    text.setAttribute("y", String(WHEEL_CENTER.y));
    text.setAttribute("fill", "black");
    text.setAttribute("font-size", "10");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.textContent = names[0];
    wheelElement.appendChild(text);
    return;
  }

  names.forEach((name, index) => {
    const color = getSegmentColor(index);
    const segmentPath = createWheelSegmentPath(index, segmentCount, color);
    const label = createWheelLabel(index, segmentCount, name);

    wheelElement.appendChild(segmentPath);
    wheelElement.appendChild(label);
  });
}
