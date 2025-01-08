import React, { useEffect, useRef, useState } from "react";
import "./WebARStyles.css";

const WebARComponent = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [markerFound, setMarkerFound] = useState(false);
  const [modelVisible, setModelVisible] = useState(false); // New state to control model visibility

  useEffect(() => {
    // Register model loading event handler
    const handleModelLoaded = () => {
      console.log("3D model loaded successfully");
      setModelLoaded(true);
    };

    const handleModelError = (error) => {
      console.error("3D model failed to load:", error);
      setError("Failed to load 3D model");
    };

    // Add event listeners to the model entity
    const modelEntity = document.querySelector("[gltf-model]");
    if (modelEntity) {
      modelEntity.addEventListener("model-loaded", handleModelLoaded);
      modelEntity.addEventListener("model-error", handleModelError);
    }

    return () => {
      if (modelEntity) {
        modelEntity.removeEventListener("model-loaded", handleModelLoaded);
        modelEntity.removeEventListener("model-error", handleModelError);
      }
    };
  }, []);

  const setupVideo = async (stream) => {
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    streamRef.current = stream;

    try {
      const canvas = document.createElement("canvas");
      canvas.willReadFrequently = true;

      await video.play();
      console.log("Video playback started successfully");
    } catch (err) {
      console.error("Video playback failed:", err);
      throw new Error("Failed to start video playback");
    }
  };

  const initializeAR = async () => {
    if (typeof window.AFRAME === "undefined") {
      throw new Error("A-Frame not loaded");
    }

    try {
      const constraints = {
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      await setupVideo(stream);

      // Register marker detection events
      const marker = document.querySelector("a-marker");
      if (marker) {
        marker.addEventListener("markerFound", () => {
          console.log("Marker detected!");
          setMarkerFound(true);
          setModelVisible(true); // Make the model visible when the marker is found
        });

        marker.addEventListener("markerLost", () => {
          console.log("Marker lost!");
          setMarkerFound(false);
        });
      }

      await new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          resolve();
        };
      });

      setIsLoading(false);
    } catch (err) {
      console.error("AR initialization failed:", err);
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;

    const startAR = async () => {
      try {
        await initializeAR();
      } catch (err) {
        if (mounted) {
          setError(err.message || "Failed to initialize AR");
          setIsLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(startAR, 1000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  return (
    <div className="ar-container">
      {isLoading && (
        <div className="loading-screen">
          <div className="loading-spinner" />
          <p>Starting AR Experience...</p>
        </div>
      )}

      <video ref={videoRef} playsInline autoPlay muted className="ar-video" />

      <a-scene
        embedded
        arjs="sourceType: webcam; debugUIEnabled: true; detectionMode: mono_and_matrix; matrixCodeType: 3x3;"
        vr-mode-ui="enabled: false"
        renderer="logarithmicDepthBuffer: true; antialias: true; alpha: true"
        className="ar-scene">
        <a-assets>
          <a-asset-item
            id="pongal-model"
            src={`${process.env.PUBLIC_URL}/models/whole_setup.glb`}
          />
        </a-assets>

        <a-marker
          type="pattern"
          url={`${process.env.PUBLIC_URL}/markers/pot-marker.patt`}
          emitevents="true"
          smooth="true"
          smoothCount="5"
          smoothTolerance="0.01"
          smoothThreshold="2">
          {/* Only display the model when markerFound is true */}
          {modelVisible && (
            <a-entity
              position="0 0 0"
              scale="0.1 0.1 0.1"
              gltf-model="#pongal-model"
              animation="property: rotation; to: 0 360 0; loop: true; dur: 10000"></a-entity>
          )}
        </a-marker>

        <a-entity camera></a-entity>
      </a-scene>

      <div className="ar-overlay">
        <p
          className={`text-center p-4 bg-black bg-opacity-50 text-white rounded ${
            markerFound ? "bg-green-500" : "bg-red-500"
          }`}>
          {error
            ? `Error: ${error}`
            : !modelLoaded
            ? "Loading 3D model..."
            : markerFound
            ? "Marker detected! 3D model should appear."
            : "Point your camera at the marker to see the 3D model"}
        </p>
      </div>
    </div>
  );
};

export default WebARComponent;
