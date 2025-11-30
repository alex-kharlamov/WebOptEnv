import React, { useRef, Suspense, forwardRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { OrbitControls, Box, Text } from '@react-three/drei';

const styles = `
#root, body, html {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #FFFFFF; 
}

body {
  background-color: #FFFFFF !important;
}

.roll-btn {
  position: absolute;
  bottom: 5vh;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: #ac59cb;
  color: white;
  font-size: 1.2em;
  padding: 0.8em 1.5em;
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(172, 89, 203, 0.4);
  cursor: pointer;
}
.roll-btn:hover {
  background: #bf6edb;
}
`;

function Floor(props) {
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

const FaceText = ({ children, position, rotation }) => (
  <Text
    position={position}
    rotation={rotation}
    fontSize={1}
    color="white"
  >
    {children}
  </Text>
);

const Dice = forwardRef((props, ref) => {
  return (
    <RigidBody
      ref={ref} 
      position={[0, 5, 0]} 
      colliders="cuboid" 
      mass={1} 
      restitution={0.6}
    >
      
      <Box args={[1.5, 1.5, 1.5]} castShadow>
        <meshStandardMaterial color="black" />
        
        <FaceText position={[0, 0, 0.76]}>1</FaceText>
        <FaceText position={[0, 0, -0.76]} rotation={[0, Math.PI, 0]}>6</FaceText>
        <FaceText position={[0.76, 0, 0]} rotation={[0, Math.PI / 2, 0]}>2</FaceText>
        <FaceText position={[-0.76, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>5</FaceText>
        <FaceText position={[0, 0.76, 0]} rotation={[-Math.PI / 2, 0, 0]}>3</FaceText>
        <FaceText position={[0, -0.76, 0]} rotation={[Math.PI / 2, 0, 0]}>4</FaceText>
      </Box>
    </RigidBody>
  );
});

function App() {
  const diceRef = useRef();

  function rollDice() {
    if (diceRef.current) {
    
      diceRef.current.setTranslation({ x: 0, y: 5, z: 0 }, true);
      diceRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      diceRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  
      const force = 5 + Math.random() * 5;
      diceRef.current.applyImpulse(
        { 
          x: (Math.random() - 0.5) * force, 
          y: (Math.random() - 0.5) * force, 
          z: (Math.random() - 0.5) * force 
        },
        true
      );
  
      const torque = 10 + Math.random() * 10;
      diceRef.current.applyTorqueImpulse(
        { 
          x: (Math.random() - 0.5) * torque, 
          y: (Math.random() - 0.5) * torque, 
          z: (Math.random() - 0.5) * torque 
        },
        true
      );
    }
  }

  return (  
    <>
     
      <style>{styles}</style>
      <button onClick={rollDice} className="roll-btn">Roll</button>
      
      <Canvas shadows camera={{ position: [0, 7, 10], fov: 50 }}>
        <Suspense fallback={null}>
          <OrbitControls />
          
          <ambientLight intensity={1.0} /> 
          <directionalLight 
            position={[10, 15, 10]} 
            intensity={2.5}
            castShadow 
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <Physics gravity={[0, -9.81, 0]}>
            <Floor />
            <Dice ref={diceRef} />
          </Physics>
        </Suspense>
      </Canvas>
    </>
  );
}

export default App;