import { useState, useRef, useEffect } from "react";


function StoryList() {
    const [stories, setStories] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/stories')
            .then((res) => res.json())
            .then((data) => {
                //Numbering to each story
                const numbered = data.map((story, index) => ({
                    ...story,
                    label: `Story #${index + 1}`
                }));
                setStories(numbered);
            });
    }, []);

    
        // Format timestamp
    const formatTimeAgo = (timestamp) => {
        const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
        if (diff < 60) return `${diff}s ago`;
        if (diff < 2600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    return (
        <div className="stories space-y-4">
            {stories.map((story) => (
                <div
                    key={story.filename}
                    className="p-4 rounded-2x1 shadow bg-white border"
                >
                    <h3 className="font-semibold">{story.label}</h3>
                    <p className="text-sm text-gray-500">
                        {story.created_at
                        ? formatTimeAgo(story.created_at)
                        : "just now"}
                    </p>
                    <audio
                        controls
                        src={`http://localhost:5000/${story.filename}`}
                        className="mt-2 w-full"
                    />
                </div>  
            ))}
        </div>    
        );
    }

export default StoryList;


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
