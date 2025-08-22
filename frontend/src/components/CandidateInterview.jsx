import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

export default function CandidateInterview() {
  const { token } = useParams();
  const BASE = "http://localhost:8000";
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [finished, setFinished] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaUrlOnServer, setMediaUrlOnServer] = useState(null);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const candRes = await fetch(`${BASE}/candidates`);
        const candData = await candRes.json();
        const candidate = candData[token];
        if (!candidate) {
          alert("Candidate not found");
          return;
        }
        const qsRes = await fetch(
          `${BASE}/questions?role=${encodeURIComponent(candidate.role)}&limit=5&token=${token}`
        );
        const qsData = await qsRes.json();
        setQuestions(qsData.questions || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadQuestions();
  }, [token]);

  useEffect(() => {
    let mounted = true;
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) return;
        if (videoRef.current) videoRef.current.srcObject = stream;
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.error("Camera/Mic permission denied", err);
        alert("Please allow camera and microphone access!");
      }
    }
    initCamera();
    return () => {
      mounted = false;
      const r = mediaRecorderRef.current;
      if (r && r.state !== "inactive") {
        r.stream && r.stream.getTracks().forEach((t) => t.stop());
        try { r.stop(); } catch {}
      } else {
        const vid = videoRef.current;
        if (vid && vid.srcObject) {
          vid.srcObject.getTracks().forEach((t) => t.stop());
        }
      }
    };
  }, []);

  const startRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    chunksRef.current = [];
    setTranscript("");
    setPreviewUrl(null);
    setMediaUrlOnServer(null);
    recorder.start();
    setRecording(true);
  };

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setRecording(false);
    setTranscript("Processing...");
    const stopPromise = new Promise((resolve) => {
      recorder.addEventListener(
        "stop",
        () => {
          resolve();
        },
        { once: true }
      );
    });
    try {
      recorder.stop();
    } catch (e) {}
    await stopPromise;
    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    const localUrl = URL.createObjectURL(blob);
    setPreviewUrl(localUrl);
    const formData = new FormData();
    formData.append("file", blob, "answer.webm");
    formData.append("token", token);
    formData.append("question", questions[currentIndex] || "");
    try {
      const res = await fetch(`${BASE}/answer`, { method: "POST", body: formData });
      if (!res.ok) {
        const text = await res.text();
        console.error("Upload failed:", res.status, text);
        setTranscript("Error uploading answer.");
        return;
      }
      const data = await res.json();
      setTranscript(data.transcript || "No transcript returned");
      setMediaUrlOnServer(data.media_url || null);
      chunksRef.current = [];
    } catch (err) {
      console.error(err);
      setTranscript("Error uploading answer.");
    }
  };

  const nextQuestion = () => {
    if (recording) return;
    setPreviewUrl(null);
    setMediaUrlOnServer(null);
    setTranscript("");
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold">Thank you!</h2>
        <p className="mt-2">Your interview is complete.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Interview</h2>

      <video ref={videoRef} autoPlay playsInline muted className="w-full mb-4 rounded" />

      {previewUrl && (
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">Recorded preview</div>
          <video src={previewUrl} controls className="w-full rounded" />
        </div>
      )}

      {questions.length === 0 ? (
        <p>Loading questions...</p>
      ) : (
        <>
          <p className="mb-4">
            <span className="font-semibold">Question {currentIndex + 1}:</span>{" "}
            {questions[currentIndex]}
          </p>

          <div className="flex gap-4 mb-4">
            {!recording ? (
              <button onClick={startRecording} className="bg-green-600 text-white px-4 py-2 rounded">
                Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} className="bg-red-600 text-white px-4 py-2 rounded">
                Stop Recording
              </button>
            )}
          </div>

          <div className="bg-gray-100 p-3 rounded mb-4 min-h-[60px]">
            {transcript ? (
              <p>
                <span className="font-semibold">Transcript:</span> {transcript}
              </p>
            ) : (
              <p className="italic text-gray-500">No answer yet.</p>
            )}
            {mediaUrlOnServer && (
              <div className="mt-2 text-sm">
                <a href={`${BASE}${mediaUrlOnServer}`} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
                  View saved video on server
                </a>
              </div>
            )}
          </div>

          <button onClick={nextQuestion} disabled={recording} className="bg-indigo-600 text-white px-4 py-2 rounded">
            {currentIndex + 1 < questions.length ? "Next Question" : "End Interview"}
          </button>
        </>
      )}
    </div>
  );
}
