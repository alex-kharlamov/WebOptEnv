import { forwardRef } from 'react';
import { RigidBody } from '@react-three/rapier';
import { Box, Text } from '@react-three/drei';

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

export default Dice;