import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { Center, Environment } from '@react-three/drei';
import HeroSequence from './HeroSequence';
import SolarCampus from './SolarCampus';

export default function MainScene() {
    const earthRef = useRef<Mesh>(null);

    useFrame((_, delta) => {
        if (earthRef.current) {
            earthRef.current.rotation.y += delta * 0.02;
        }
    });

    return (
        <group>
            <directionalLight position={[10, 10, -5]} intensity={1.5} color="#FFC300" />

            {/* Background Planet representation */}
            <Center>
                <mesh ref={earthRef} position={[0, -2, -10]}>
                    <sphereGeometry args={[12, 64, 64]} />
                    <meshStandardMaterial
                        color="#0F1115"
                        roughness={0.8}
                        metalness={0.5}
                        emissive="#00F0FF"
                        emissiveIntensity={0.05}
                        wireframe={true}
                        transparent={true}
                        opacity={0.3}
                    />
                </mesh>
            </Center>

            {/* Particle System for the Hero sequence */}
            <HeroSequence />

            {/* Grid of physical panels that degrade/fail during ghost generation */}
            <SolarCampus />



            <Environment preset="night" />
        </group>
    );
}
