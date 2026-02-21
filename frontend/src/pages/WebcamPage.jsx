import { useEffect, useRef } from "react";

export default function WebcamPage() {
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="container">
      <h2>Webcam</h2>
      <video ref={videoRef} autoPlay playsInline width="500" />

      <div>
        <button>Start Prediction</button>
        <button>Stop</button>
      </div>
    </div>
  );
}