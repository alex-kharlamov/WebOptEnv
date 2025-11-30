import { RigidBody, CuboidCollider } from '@react-three/rapier';

export function Floor(props) {
  return (
    <RigidBody type="fixed" rotation={[-Math.PI / 2, 0, 0]} {...props}>
      <CuboidCollider args={[100, 100, 0.1]} />
      
      <mesh receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshPhysicalMaterial 
          color="#FFFFFF" 
          roughness={0.1} 
          metalness={0.1} 
          reflectivity={0.5} 
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
    </RigidBody>
  );
}