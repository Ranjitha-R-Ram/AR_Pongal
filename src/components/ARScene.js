import React, { useState, useRef, useEffect } from "react";
import { Camera } from "lucide-react";
import * as THREE from "three";

const ARScene = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const playbackVideoRef = useRef(null);
  const sceneRef = useRef(null); // To hold the 3D scene
  const cameraRef = useRef(null); // Camera for three.js scene
  const [showAR, setShowAR] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [potDetected, setPotDetected] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ potPixels: 0, ratio: 0 });
  const [browserSupport, setBrowserSupport] = useState({
    webgl: false,
    getUserMedia: false,
  });

  const models = {
    video: "/models/pongal.mp4",
    marker: "/models/marker.patt",
  };

  useEffect(() => {
    checkBrowserSupport();
  }, []);

  useEffect(() => {
    if (browserSupport.webgl && browserSupport.getUserMedia) {
      initializeCamera();
    }
    return () => {
      stopCamera();
    };
  }, [browserSupport]);

  const checkBrowserSupport = () => {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    setBrowserSupport((prev) => ({
      ...prev,
      webgl: !!gl,
    }));

    const getUserMediaSupport = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );

    setBrowserSupport((prev) => ({
      ...prev,
      getUserMedia: getUserMediaSupport,
    }));

    if (!getUserMediaSupport) {
      setError("Your browser does not support camera access");
    }

    if (!gl) {
      setError("Your browser does not support WebGL, which is required for AR");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  const initializeCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1980 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            resolve();
          };
        });

        await videoRef.current.play();

        setCameraActive(true);
        setIsLoading(false);
        startDetection();
      }
    } catch (err) {
      console.error("Camera initialization error:", err);
      setError(
        err.message ||
          "Failed to access camera. Please ensure camera permissions are granted."
      );
      setIsLoading(false);
    }
  };

  const isPotColor = (r, g, b) => {
    const isOrangePot = r > 180 && r < 255 && g > 80 && g < 180 && b < 100;
    const isDarkerOrange = r > 150 && r < 200 && g > 60 && g < 120 && b < 80;
    return isOrangePot || isDarkerOrange;
  };

  const startDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    let animationFrameId;
    let detectionCounter = 0;
    const detectionThreshold = 2;

    const detect = () => {
      if (!videoRef.current || !ctx) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let potPixels = 0;
        const totalPixels = (canvas.width * canvas.height) / 16;

        const centerX = Math.floor(canvas.width / 4);
        const centerY = Math.floor(canvas.height / 4);
        const centerWidth = Math.floor(canvas.width / 2);
        const centerHeight = Math.floor(canvas.height / 2);

        for (let y = centerY; y < centerY + centerHeight; y += 2) {
          for (let x = centerX; x < centerX + centerWidth; x += 2) {
            const i = (y * canvas.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            if (isPotColor(r, g, b)) {
              potPixels++;
            }
          }
        }

        const detectionRatio = potPixels / totalPixels;
        setDebugInfo({ potPixels, ratio: detectionRatio });

        if (detectionRatio > 0.065) {
          detectionCounter++;
          if (detectionCounter >= detectionThreshold) {
            setPotDetected(true);
            setShowVideo(true);
          }
        } else {
          detectionCounter = 0;
          setPotDetected(false);
          setShowVideo(false);
        }
      } catch (err) {
        console.error("Detection error:", err);
      }

      animationFrameId = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  };

  const show3DModel = () => {
    // Add logic to show a 3D model using Three.js when pot is detected
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    sceneRef.current.appendChild(renderer.domElement);

    // Create a simple cube to simulate 3D object
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    const animate = function () {
      requestAnimationFrame(animate);

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      renderer.render(scene, camera);
    };

    animate();
  };

  if (!browserSupport.webgl || !browserSupport.getUserMedia) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {!browserSupport.webgl && "WebGL is not supported in your browser. "}
          {!browserSupport.getUserMedia &&
            "Camera access is not supported in your browser."}
          <br />
          Please try using a modern browser like Chrome or Firefox.
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="flex flex-col items-center gap-4">
            <Camera className="w-8 h-8 text-white" />
            <div className="text-white text-xl">Starting camera...</div>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-4 text-center z-50">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            cameraActive ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span>Camera: {cameraActive ? "Active" : "Inactive"}</span>
      </div>
      <div className="text-xs mt-1">
        Detection: {(debugInfo.ratio * 100).toFixed(2)}%
      </div>

      {potDetected && showVideo && (
        <div className="text-xs mt-6 text-green-400">
          Pot Detected!
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <video
              ref={playbackVideoRef}
              src={models.video}
              autoPlay
              width="1000"
              height="600"
              // loop
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Camera Feed - Hidden when Pot is Detected */}
      {!potDetected && (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
      )}

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover opacity-0"
      />

      {showAR && (
        <a-scene
          embedded
          arjs="sourceType: webcam; debugUIEnabled: true; trackingMethod: best;"
          className="absolute top-0 left-0 w-full h-full z-30">
          <a-marker type="pattern" url={models.marker}>
            <a-entity
              gltf-model={models.ox}
              position="0 0 0"
              scale="0.5 0.5 0.5"
              animation="property: rotation; to: 0 360 0; dur: 2000; loop: true"
            />
            <a-entity
              gltf-model={models.family}
              position="0 1 0"
              scale="0.5 0.5 0.5"
              animation="property: position; to: 0 2 0; dur: 2000; loop: true"
            />
          </a-marker>
          <a-entity camera />
        </a-scene>
      )}
      <div
        ref={sceneRef}
        className="absolute top-0 left-0 w-full h-full z-30"
      />
    </div>
  );
};

export default ARScene;
