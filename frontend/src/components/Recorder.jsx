import { useState, useRef } from 'react';

function Recorder() {
    const [recording, setRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(null);
    const [stories, setStories] = useState([])
    const mediaRecorderRef = useRef(null);
    const audioChunks = useRef([]);

    const fetchStories = async () => {
        fetch('http://localhost:5000/stories')
            .then(res => res.json())
            .then(data => setStories(data))
            .catch(err => console.error("Error fetching stories:", err));
    };

    useEffect(() => {
        fetchStories();
    }, []);

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (e) => {
            audioChunks.current.push(e.data);
        };
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            setAudioURL(url);

            const formData = new FormData();
            formData.append('audio', blob, 'recording.webm');
            fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData,
            })
                .then((res) => res.json())
                .then((data) => console.log('Server response:', data))
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
        <div>
            <h2>🎤 Voice Your Story</h2>
            {recording ? (
                <button onClick={stopRecording}>Stop</button>
            ) : (
                <button onClick = {startRecording}>Start</button>
            )}
            {audioURL && (
                <div>
                    <h3>Preview:</h3>
                    <audio controls src={audioURL} />
                </div>
            )}
            <h2>Your Stories</h2>
            {stories.map((story, index) => (
                <div key={index}>
                    <p>{story.filename}</p>
                    <audio controls src={story.url}></audio>
                </div>
            ))}
        </div>
    );
}

export default Recorder;