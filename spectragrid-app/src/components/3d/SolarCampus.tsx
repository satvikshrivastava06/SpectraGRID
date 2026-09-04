import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { store, scrollRef } from '../../store';

export default function SolarCampus() {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const gridSize = 10;
    const count = gridSize * gridSize;

    useLayoutEffect(() => {
        if (!meshRef.current) return;

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        let i = 0;

        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                dummy.position.set((x - gridSize / 2) * 1.5, -2.5, (z - gridSize / 2) * 2.5);
                dummy.rotation.x = -Math.PI / 4;
                dummy.updateMatrix();

                meshRef.current.setMatrixAt(i, dummy.matrix);

                // Base color initially (Cyan/healthy)
                color.set('#00F0FF');
                meshRef.current.setColorAt(i, color);

                i++;
            }
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
        meshRef.current.instanceColor!.needsUpdate = true;
    }, [count, gridSize]);

    useFrame((state) => {
        if (!meshRef.current) return;

        const p = scrollRef.value;
        const activeNode = store.activeNode;

        let i = 0;
        const color = new THREE.Color();
        const flash = Math.sin(state.clock.elapsedTime * 6) > 0;

        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                // Determine base color mapping
                if (p > 0.35 && (x % 3 === 0 && z % 2 === 0)) {
                    // Failures / anomalies on scroll
                    color.set(flash && activeNode === 'panel' ? '#9D00FF' : '#FF003C');
                } else if (p > 0.4 && (x === 4 || z === 4)) {
                    // Warnings
                    color.set('#FFB800');
                } else {
                    // Healthy electric cyan
                    color.set('#00F0FF');
                }

                // If user selected panel B12 specifically, flash it bright magenta/violet
                if (activeNode === 'panel' && x === 8 && z === 8) {
                    color.set(flash ? '#9D00FF' : '#FF003C');
                }

                meshRef.current.setColorAt(i, color);
                i++;
            }
        }
        meshRef.current.instanceColor!.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <boxGeometry args={[1.2, 0.1, 2]} />
            <meshStandardMaterial
                roughness={0.2}
                metalness={0.8}
                emissiveIntensity={0.2}
            />
        </instancedMesh>
    );
}
