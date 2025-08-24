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