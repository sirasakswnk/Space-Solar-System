export const uranusAxisTilt = 97.77 * Math.PI / 180
export const uranusMapSize = { width: 2048, height: 1024 }
// A representative pale atmospheric band, not a named or current cloud feature.
export const uranusAtmosphereRegion = { x: 700, y: 430 }
const yaw = Math.PI * 2 * uranusAtmosphereRegion.x / uranusMapSize.width - Math.PI / 2
const pitch = Math.PI / 2 - Math.PI * uranusAtmosphereRegion.y / uranusMapSize.height
const x = Math.sin(yaw) * Math.cos(pitch), y = Math.sin(pitch), z = Math.cos(yaw) * Math.cos(pitch)
const tiltedX = x * Math.cos(uranusAxisTilt) - y * Math.sin(uranusAxisTilt)
const tiltedY = x * Math.sin(uranusAxisTilt) + y * Math.cos(uranusAxisTilt)
export const uranusAtmosphereAnchor = { yaw: Math.atan2(tiltedX, z), pitch: Math.asin(tiltedY), height: 0.08 }
export const uranusAtmosphereOutline = { startAngle: 0.18, widthAngle: 0.004, radiusOffset: 0.025 }
