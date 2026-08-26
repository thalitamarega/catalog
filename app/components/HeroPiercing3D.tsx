"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const ROTATION_SECONDS = 12;

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  (Array.isArray(material) ? material : [material]).forEach((item) => item.dispose());
}

function makeDelicateClicker() {
  const group = new THREE.Group();
  const ringRadius = 1.08;
  const tubeRadius = 0.067;

  const whiteGold = new THREE.MeshPhysicalMaterial({
    color: "#ece8df",
    metalness: 1,
    roughness: 0.16,
    clearcoat: 0.8,
    clearcoatRoughness: 0.08,
  });
  const hingeMetal = new THREE.MeshPhysicalMaterial({
    color: "#c5bcb1",
    metalness: 1,
    roughness: 0.2,
    clearcoat: 0.65,
    clearcoatRoughness: 0.1,
  });
  const stone = new THREE.MeshPhysicalMaterial({
    color: "#f8fbff",
    metalness: 0.05,
    roughness: 0.02,
    transmission: 0.35,
    transparent: true,
    opacity: 0.96,
    ior: 2.15,
  });

  // A torus is actual round geometry, so the profile stays volumetric at every
  // point of the rotation instead of behaving like a flat card.
  const hoop = new THREE.Mesh(
    new THREE.TorusGeometry(ringRadius, tubeRadius, 20, 180),
    whiteGold,
  );
  group.add(hoop);

  // Refined hinged closure at the top of the clicker.
  const hinge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.2, 24),
    hingeMetal,
  );
  hinge.position.set(0, ringRadius, 0);
  hinge.rotation.z = Math.PI / 2;
  group.add(hinge);

  const hingePin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.222, 18),
    whiteGold,
  );
  hingePin.position.set(0, ringRadius, 0.02);
  hingePin.rotation.z = Math.PI / 2;
  group.add(hingePin);

  // A small latch gives the closure a believable construction without making
  // the piece visually heavy.
  const latch = new THREE.Mesh(
    new THREE.SphereGeometry(0.083, 20, 16),
    whiteGold,
  );
  latch.position.set(0.145, ringRadius - 0.006, 0.006);
  latch.scale.set(1.18, 0.72, 0.78);
  group.add(latch);

  // Seven tiny faceted stones form a short pavé accent along the lower arc.
  const gemCount = 7;
  for (let index = 0; index < gemCount; index += 1) {
    const theta = THREE.MathUtils.lerp(-2.1, -0.85, index / (gemCount - 1));
    const x = Math.cos(theta) * ringRadius;
    const y = Math.sin(theta) * ringRadius;

    const setting = new THREE.Mesh(
      new THREE.CylinderGeometry(0.074, 0.074, 0.038, 14),
      hingeMetal,
    );
    setting.position.set(x, y, 0.055);
    setting.rotation.z = theta;
    group.add(setting);

    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.072, 1), stone);
    gem.position.set(x, y, 0.102);
    gem.rotation.set(0.24, -0.18, theta + (index % 2 ? 0.17 : -0.09));
    group.add(gem);
  }

  group.rotation.set(0.15, -0.34, -0.2);
  return group;
}

export function HeroPiercing3D() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.04, 5.15);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.className = "hero-piercing-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");

    const environment = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environmentMap = pmrem.fromScene(environment, 0.035).texture;
    scene.environment = environmentMap;

    const keyLight = new THREE.DirectionalLight("#fff8ed", 2.8);
    keyLight.position.set(-2.3, 3, 4);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight("#f5d8c6", 7, 8, 2);
    rimLight.position.set(2.2, -1.6, 3);
    scene.add(rimLight);
    const wineReflection = new THREE.PointLight("#780024", 4.5, 7, 2);
    wineReflection.position.set(-2.4, -1.8, 1.7);
    scene.add(wineReflection);

    const jewel = makeDelicateClicker();
    scene.add(jewel);

    const resize = () => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    stage.appendChild(renderer.domElement);
    stage.dataset.webgl = "ready";

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const start = performance.now();
    let animationFrame = 0;
    const render = (now: number) => {
      if (!prefersReducedMotion.matches) {
        const elapsed = (now - start) / 1000;
        jewel.rotation.y = -0.34 + (elapsed / ROTATION_SECONDS) * Math.PI * 2;
        jewel.rotation.x = 0.15 + Math.sin(elapsed * 0.76) * 0.045;
        jewel.rotation.z = -0.2 + Math.sin(elapsed * 0.62) * 0.025;
        jewel.position.y = Math.sin(elapsed * 1.04) * 0.075;
      }
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(render);
    };
    animationFrame = window.requestAnimationFrame(render);

    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    const onContextLost = (event: Event) => {
      event.preventDefault();
      window.cancelAnimationFrame(animationFrame);
      delete stage.dataset.webgl;
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          disposeMaterial(object.material);
        }
      });
      environment.dispose();
      environmentMap.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      delete stage.dataset.webgl;
    };
  }, []);

  return <div className="hero-piercing-stage" ref={stageRef} aria-hidden="true" />;
}
