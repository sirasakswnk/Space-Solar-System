// Image coordinates in the inspected 2048 × 1024 map, measured from top-left.
// This rayed crater is an illustration reference, not a named/geolocated feature.
export const mercuryCraterImage = { x: 846, y: 578, width: 2048, height: 1024 }
export const mercuryCraterAnchor = {
  // Three SphereGeometry: x=-cos(phi), z=sin(phi); TextureLoader flips image Y.
  yaw: Math.PI * 2 * mercuryCraterImage.x / mercuryCraterImage.width - Math.PI / 2,
  pitch: Math.PI / 2 - Math.PI * mercuryCraterImage.y / mercuryCraterImage.height,
  height: 0.08,
}
export const mercuryCraterOutline = { radiusOffset: 0.015, startAngle: 0.09, widthAngle: 0.004 }
