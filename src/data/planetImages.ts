// Local image maps already used by the 3D scene, reused as static pictures on
// the page shown when WebGL is unavailable.
export const planetImages: Record<string, { src: string; alt: string }> = {
  earth: { src: '/assets/earth/daymap.jpg', alt: 'แผนที่ภาพพื้นผิว Earth' },
  mercury: { src: '/assets/mercury/surface.jpg', alt: 'แผนที่ภาพพื้นผิว Mercury' },
  venus: { src: '/assets/venus/atmosphere.jpg', alt: 'แผนที่ภาพชั้นเมฆ Venus' },
  mars: { src: '/assets/mars/surface.jpg', alt: 'แผนที่ภาพพื้นผิว Mars' },
  jupiter: { src: '/assets/jupiter/atmosphere.jpg', alt: 'แผนที่ภาพชั้นเมฆ Jupiter' },
  saturn: { src: '/assets/saturn/atmosphere.jpg', alt: 'แผนที่ภาพชั้นเมฆ Saturn' },
  uranus: { src: '/assets/uranus/atmosphere.jpg', alt: 'แผนที่ภาพบรรยากาศ Uranus' },
  neptune: { src: '/assets/neptune/atmosphere.jpg', alt: 'แผนที่ภาพบรรยากาศ Neptune' },
}
