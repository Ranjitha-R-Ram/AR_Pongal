import React, { useState, useRef, useEffect } from "react";
import { Camera } from "lucide-react";
import "./ARScene.css";

const ARScene = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [potDetected, setPotDetected] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState({ potPixels: 0, ratio: 0 });
  const [browserSupport, setBrowserSupport] = useState({
    webgl: false,
    getUserMedia: false,
  });

  const MODEL_URL =
    "https://modelviewer.dev/shared-assets/models/Astronaut.glb";

  useEffect(() => {
    const loadModelViewer = async () => {
      if (!customElements.get("model-viewer")) {
        const script = document.createElement("script");
        script.type = "module";
        script.src =
          "https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js";
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
        console.log("model-viewer loaded successfully");
      }
    };

    loadModelViewer().catch((err) => {
      console.error("Failed to load model-viewer:", err);
      setError("Failed to load 3D viewer component");
    });
  }, []);

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
          videoRef.current.onloadedmetadata = resolve;
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
            if (isPotColor(data[i], data[i + 1], data[i + 2])) {
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
            setShowModel(true);
          }
        } else {
          detectionCounter = 0;
          setPotDetected(false);
          setShowModel(false);
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

  const handleModelLoad = () => {
    setModelLoaded(true);
    console.log("3D model loaded successfully");
  };

  const handleModelError = (error) => {
    console.error("Model loading error:", error);
    setError("Failed to load 3D model");
  };

  if (!browserSupport.webgl || !browserSupport.getUserMedia) {
    return (
      <div className="ar-error-message">
        {!browserSupport.webgl && "WebGL is not supported in your browser. "}
        {!browserSupport.getUserMedia &&
          "Camera access is not supported in your browser."}
        <br />
        Please try using a modern browser like Chrome or Firefox.
      </div>
    );
  }

  return (
    <div className="ar-scene-container">
      {isLoading && (
        <div className="ar-loading">
          <div className="icon-container">
            <Camera className="w-8 h-8 text-white" />
            <div className="text">Starting camera...</div>
          </div>
        </div>
      )}

      {error && <div className="ar-error-message">{error}</div>}

      <div className="ar-camera-status">
        <div className="flex items-center gap-2">
          <div
            className={`status-indicator ${
              cameraActive ? "active" : "inactive"
            }`}
          />
          <span>Camera: {cameraActive ? "Active" : "Inactive"}</span>
        </div>
        <div className="detection-ratio">
          Detection: {(debugInfo.ratio * 100).toFixed(2)}%
        </div>
      </div>

      {potDetected && showModel && (
        <div className="ar-model-container">
          {!modelLoaded && (
            <div className="loading-overlay">
              <div className="text">Loading 3D model...</div>
            </div>
          )}
          <model-viewer
            src={MODEL_URL}
            camera-controls
            auto-rotate
            ar
            ar-modes="webxr scene-viewer quick-look"
            shadow-intensity="1"
            environment-image="neutral"
            exposure="1"
            camera-target="0 1.5 0"
            camera-orbit="0deg 90deg 2.5m"
            min-camera-orbit="auto auto 1.5m"
            max-camera-orbit="auto auto 4m"
            auto-rotate-delay="0"
            rotation-per-second="20deg"
            interaction-policy="allow-when-focused"
            onload={handleModelLoad}
            onerror={handleModelError}
            className="ar-model-viewer"
          />
        </div>
      )}

      {!potDetected && !showModel && (
        <video ref={videoRef} className="ar-video" playsInline muted />
      )}

      <canvas ref={canvasRef} className="ar-canvas" />
    </div>
  );
};

export default ARScene;
