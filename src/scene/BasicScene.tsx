export default function BasicScene() {
  return (
    <>
      <color attach="background" args={['#080e1b']} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={3} color="#cdeeff" />
      <directionalLight position={[-4, 1, -2]} intensity={2} color="#416be8" />
      <mesh position={[0, 0.4, 0]} rotation={[0.2, 0.35, 0]}>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color="#65bbda" metalness={0.3} roughness={0.45} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <circleGeometry args={[3.4, 64]} />
        <meshStandardMaterial color="#152039" metalness={0.1} roughness={0.9} />
      </mesh>
    </>
  )
}
