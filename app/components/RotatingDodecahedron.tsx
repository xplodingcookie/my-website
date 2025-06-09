'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const RotatingDodecahedron = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(400, 400);
    mountRef.current.appendChild(renderer.domElement);

    // Create dodecahedron geometry
    const geometry = new THREE.DodecahedronGeometry(2, 0);
    
    // Create wireframe material
    const wireframeMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff,
      linewidth: 2
    });

    // Create wireframe
    const wireframe = new THREE.WireframeGeometry(geometry);
    const dodecahedron = new THREE.LineSegments(wireframe, wireframeMaterial);
    scene.add(dodecahedron);

    // Create vertices as spheres
    const vertexGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const vertexMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    const vertices = geometry.attributes.position.array;
    const vertexSpheres = [];
    
    // Track unique vertices (remove duplicates)
    const uniqueVertices = new Set();
    const vertexPositions = [];
    
    for (let i = 0; i < vertices.length; i += 3) {
      const x = Math.round(vertices[i] * 1000) / 1000;
      const y = Math.round(vertices[i + 1] * 1000) / 1000;
      const z = Math.round(vertices[i + 2] * 1000) / 1000;
      const key = `${x},${y},${z}`;
      
      if (!uniqueVertices.has(key)) {
        uniqueVertices.add(key);
        vertexPositions.push([x, y, z]);
      }
    }

    // Create sphere at each unique vertex
    vertexPositions.forEach(([x, y, z]) => {
      const sphere = new THREE.Mesh(vertexGeometry, vertexMaterial);
      sphere.position.set(x, y, z);
      scene.add(sphere);
      vertexSpheres.push(sphere);
    });

    camera.position.z = 6;

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      // Rotate the dodecahedron and vertices together
      dodecahedron.rotation.x += 0.005;
      dodecahedron.rotation.y += 0.01;
      
      vertexSpheres.forEach(sphere => {
        sphere.rotation.x += 0.005;
        sphere.rotation.y += 0.01;
        
        // Apply the same rotation as the dodecahedron
        const originalPosition = sphere.userData.originalPosition || sphere.position.clone();
        if (!sphere.userData.originalPosition) {
          sphere.userData.originalPosition = originalPosition;
        }
        
        // Create rotation matrix
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationFromEuler(new THREE.Euler(
          dodecahedron.rotation.x,
          dodecahedron.rotation.y,
          dodecahedron.rotation.z
        ));
        
        // Apply rotation to original position
        const newPosition = originalPosition.clone();
        newPosition.applyMatrix4(rotationMatrix);
        sphere.position.copy(newPosition);
      });
      
      renderer.render(scene, camera);
    };

    animate();

    // Store refs
    sceneRef.current = scene;
    rendererRef.current = renderer;

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div 
        ref={mountRef} 
        className="border border-gray-800 rounded-lg"
        style={{ width: '400px', height: '400px' }}
      />
    </div>
  );
};

export default RotatingDodecahedron;