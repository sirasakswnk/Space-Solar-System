// A representative cloud region in the inspected atmosphere map, not a live location.
export const venusCloudImage = { x: 460, y: 480, width: 2048, height: 1024 }
export const venusCloudAnchor = {
  yaw: Math.PI * 2 * venusCloudImage.x / venusCloudImage.width - Math.PI / 2,
  pitch: Math.PI / 2 - Math.PI * venusCloudImage.y / venusCloudImage.height,
  height: 0.08,
}
export const venusCloudOutline = { radiusOffset: 0.025, startAngle: 0.22, widthAngle: 0.004 }
