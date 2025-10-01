import Recorder from "./components/Recorder.jsx";
import StoryList from "./components/StoryList.jsx";

function App() {
  return (
   <div className="min-h-screen bg-indigo-50">
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Recorder />
      <h2 className="font-semibold text-xl">📚 Your Stories</h2>
      <StoryList />
    </div>
  </div>
  );
}

export default App;

