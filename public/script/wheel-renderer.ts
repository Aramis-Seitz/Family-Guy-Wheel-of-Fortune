import type { Point } from "./types.js";
import {
  WHEEL_CENTER,
  WHEEL_RADIUS,
  FULL_CIRCLE_RADIANS,
  SEGMENT_COLORS,
} from "./constants.js";
import { wheelElement } from "./dom.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export function getSegmentColor(index: number): string {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}

function getPointOnCircle(center: Point, radius: number, angleRadians: number): Point {
  return {
    x: center.x + radius * Math.cos(angleRadians - Math.PI / 2),
    y: center.y + radius * Math.sin(angleRadians - Math.PI / 2),
  };
}

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

export function clearWheel(): void {
  if (!wheelElement) return;
  wheelElement.innerHTML = "";
}

export function generateWheel(names: string[]): void {
  const segmentCount = names.length;
  if (segmentCount < 2 || !wheelElement) return;

  const wheel = wheelElement;
  clearWheel();

  names.forEach((name, index) => {
    const color = getSegmentColor(index);
    const segmentPath = createWheelSegmentPath(index, segmentCount, color);
    const label = createWheelLabel(index, segmentCount, name);

    wheel.appendChild(segmentPath);
    wheel.appendChild(label);
  });
}
