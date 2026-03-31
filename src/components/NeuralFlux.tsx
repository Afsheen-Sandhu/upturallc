"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

export default function NeuralFlux() {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationState = useRef({ progress: 0, dispersing: false });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let width = container.clientWidth || 400;
    let height = container.clientHeight || 220;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    camera.position.z = 8.5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. Create Neural Field (More particles for "grain" effect)
    const particlesCount = 4000;
    const positions = new Float32Array(particlesCount * 3);
    const sizes = new Float32Array(particlesCount);
    const initialPositions = new Float32Array(particlesCount * 3);
    const randomDirections = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount; i++) {
      const r = 2.2 + Math.random() * 0.4;
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();

      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      initialPositions[i * 3] = x;
      initialPositions[i * 3 + 1] = y;
      initialPositions[i * 3 + 2] = z;

      // Random direction for dispersion
      randomDirections[i * 3] = (Math.random() - 0.5) * 15;
      randomDirections[i * 3 + 1] = (Math.random() - 0.5) * 15;
      randomDirections[i * 3 + 2] = (Math.random() - 0.5) * 15;

      sizes[i] = Math.random() * 2.5 + 1.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xFF5500,
      size: 0.08,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const centerLight = new THREE.PointLight(0xFF3C00, 35, 12);
    scene.add(centerLight);

    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / width) * 2 - 1;
      targetMouseY = -((e.clientY - rect.top) / height) * 2 + 1;
    };

    const handleClick = () => {
      if (animationState.current.dispersing) return;
      
      animationState.current.dispersing = true;
      
      gsap.to(animationState.current, {
        progress: 1,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(animationState.current, {
            progress: 0,
            duration: 1.5,
            ease: "elastic.out(1, 0.5)",
            delay: 0.2,
            onComplete: () => {
              animationState.current.dispersing = false;
            }
          });
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('click', handleClick);

    const animate = () => {
      requestAnimationFrame(animate);

      const time = Date.now() * 0.0005;
      const { progress } = animationState.current;

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const posAttr = points.geometry.attributes.position;
      const positionsArray = posAttr.array as Float32Array;
      
      for (let i = 0; i < particlesCount; i++) {
        const ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;

        // Base Idle Animation
        const wave = Math.sin(time + initialPositions[ix]) * 0.1;
        const baseY = initialPositions[iy] + Math.cos(time + initialPositions[iy]) * 0.1;
        
        // Disperse logic
        const tx = initialPositions[ix] + randomDirections[ix] * progress;
        const ty = initialPositions[iy] + randomDirections[iy] * progress;
        const tz = initialPositions[iz] + randomDirections[iz] * progress;

        positionsArray[ix] = THREE.MathUtils.lerp(initialPositions[ix] + wave + (mouseX * 0.2), tx, progress);
        positionsArray[iy] = THREE.MathUtils.lerp(baseY + (mouseY * 0.2), ty, progress);
        positionsArray[iz] = THREE.MathUtils.lerp(initialPositions[iz] + Math.sin(time * 0.5) * 0.1, tz, progress);
      }
      posAttr.needsUpdate = true;

      points.rotation.y += 0.0015;
      scene.rotation.x = mouseY * 0.1;
      scene.rotation.y = mouseX * 0.1;

      renderer.render(scene, camera);
    };

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth && newHeight) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleClick);
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      id="footer-3d-canvas-container"
      style={{ width: "100%", maxWidth: "400px", height: "220px", position: "relative", cursor: "pointer" }}
    />
  );
}
