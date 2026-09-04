import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollRef } from '../../store';

const PARTICLE_COUNT = 15000;

export default function HeroSequence() {
    const pointsRef = useRef<THREE.Points>(null);

    const [positions, targetPositions, colors, randoms] = useMemo(() => {
        const pos = new Float32Array(PARTICLE_COUNT * 3);
        const target = new Float32Array(PARTICLE_COUNT * 3);
        const col = new Float32Array(PARTICLE_COUNT * 3);
        const rnd = new Float32Array(PARTICLE_COUNT);

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Stage 1 (Initial): Photons traveling from sun (far above)
            pos[i * 3] = (Math.random() - 0.5) * 60;
            pos[i * 3 + 1] = Math.random() * 50 + 20;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 60;

            // Target: Approaching solar panels (Grid formation)
            target[i * 3] = (Math.random() - 0.5) * 15;
            target[i * 3 + 1] = (Math.random() - 0.5) * 2;
            target[i * 3 + 2] = (Math.random() - 0.5) * 15;

            // Initial Color: Solar Gold / White
            col[i * 3] = 1.0;
            col[i * 3 + 1] = 0.9;
            col[i * 3 + 2] = 0.6;

            rnd[i] = Math.random();
        }

        return [pos, target, col, rnd];
    }, []);

    const shaderArgs = useMemo(() => {
        return {
            uniforms: {
                uTime: { value: 0 },
                uProgress: { value: 0 },
            },
            vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        
        attribute vec3 targetPosition;
        attribute vec3 color;
        attribute float random;
        
        varying vec3 vColor;
        varying float vRandom;
        varying float vProgress;
        
        void main() {
            vColor = color;
            vRandom = random;
            vProgress = uProgress;
            
            // Movement logic
            vec3 currentPos = position;
            
            // Stage 1 -> 2 transition (Photons travel to panels)
            float moveProgress = smoothstep(0.05, 0.3, uProgress) * (0.5 + random * 0.5);
            currentPos = mix(currentPos, targetPosition, min(moveProgress, 1.0));
            
            // Add subtle floating animation
            currentPos.y += sin(uTime * 1.5 + random * 10.0) * 0.1;
            
            vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
            
            // Particle size grows slightly when reaching target
            float size = 3.0 + smoothstep(0.1, 0.3, uProgress) * 2.0;
            gl_PointSize = size * (10.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
        }
      `,
            fragmentShader: `
        varying vec3 vColor;
        varying float vRandom;
        varying float vProgress;
        
        void main() {
            float d = distance(gl_PointCoord, vec2(0.5));
            if(d > 0.5) discard;
            
            // Soft particle
            float alpha = (1.0 - (d * 2.0)) * 0.8;
            
            vec3 finalColor = vColor;
            
            // Stage 3: Missing photons turn red (ghost generation)
            if (vProgress > 0.35 && vRandom > 0.75) {
                float intensity = smoothstep(0.35, 0.45, vProgress);
                finalColor = mix(finalColor, vec3(1.0, 0.0, 0.24), intensity); // Neon red
            }
            
            // Stage 4: AI Tracing illuminates network paths (Violet)
            if (vProgress > 0.55 && vRandom > 0.75) {
                float intensity = smoothstep(0.55, 0.65, vProgress);
                finalColor = mix(finalColor, vec3(0.62, 0.0, 1.0), intensity); // Violet
            }
            
            // Stage 6: Recovered energy flows back (Emerald/Cyan)
            if (vProgress > 0.8 && vRandom > 0.75) {
                float intensity = smoothstep(0.8, 0.9, vProgress);
                finalColor = mix(finalColor, vec3(0.0, 0.9, 0.46), intensity);
            }
            
            // Fade in initially
            alpha *= smoothstep(0.0, 0.05, vProgress);
            
            gl_FragColor = vec4(finalColor, alpha);
        }
      `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        };
    }, []);

    useFrame((state) => {
        if (pointsRef.current) {
            const material = pointsRef.current.material as THREE.ShaderMaterial;
            material.uniforms.uTime.value = state.clock.elapsedTime;
            material.uniforms.uProgress.value = THREE.MathUtils.lerp(
                material.uniforms.uProgress.value,
                scrollRef.value,
                0.05
            );
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
                <bufferAttribute attach="attributes-targetPosition" args={[targetPositions, 3]} />
                <bufferAttribute attach="attributes-color" args={[colors, 3]} />
                <bufferAttribute attach="attributes-random" args={[randoms, 1]} />
            </bufferGeometry>
            <shaderMaterial args={[shaderArgs]} />
        </points>
    );
}
