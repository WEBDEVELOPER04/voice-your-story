import { useState, useRef } from "react";
import { ReactTyped } from "react-typed";

function Recorder() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);

    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(audioChunks.current, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setAudioURL(url);

      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Server response:", data);
          if (data.delete_token) {
            // ✅ Save delete token locally for this story
            localStorage.setItem(`delete_${data.id}`, data.delete_token);
          }
        })
        .catch((err) => console.error("Upload error:", err));

      audioChunks.current = [];
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  return (
    <div className="p-6 rounded-2xl shadow-md bg-white flex flex-col items-center gap-4 mb-6">
      <h2 className="font-semibold text-xl text-indigo-700">🎤 Share Your Story</h2>
      {recording ? (
        <button
          onClick={stopRecording}
          className="w-20 h-20 rounded-full bg-red-500 text-white text-2xl shadow-lg hover:bg-red-600 transition"
        >
          ⏹
        </button>
      ) : (
        <button
          onClick={startRecording}
          className="w-20 h-20 rounded-full bg-green-500 text-white text-2xl shadow-lg hover:bg-green-600 transition"
        >
          🎙️
        </button>
      )}

      <p className="mt-4 text-center text-gray-600 text-sm leading-relaxed max-w-md">
  <ReactTyped
    strings={[
      "This website is a safe space for anyone wishing to share traumatic experiences anonymously.\n\nEvery post is completely anonymous.\n\nInappropriate or harmful content is monitored and will be removed. \n\nTo record a story, click the microphone button and stop button when finished. \n\nWhen finished recording reload the site for it to posted! \n\nYou are only able to delete your stories."
    ]}
    typeSpeed={40}
    backSpeed={20}
    loop={false}
    showCursor={false}
  />
</p>


      {audioURL && (
        <div className="mt-4 w-full">
          <h3 className="font-medium text-gray-700">Preview:</h3>
          <audio controls src={audioURL} className="mt-2 w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}

export default Recorder;
