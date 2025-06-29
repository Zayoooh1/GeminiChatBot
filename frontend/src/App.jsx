import React, { useState, useEffect } from 'react';
import { Sun, Moon, Code, CheckCircle, AlertTriangle, Info, Download, Settings, Play, RotateCcw, MessageSquare, Copy, Search } from 'lucide-react';
import Editor from "@monaco-editor/react";
import axios from 'axios';
import ReviewFeedbackDisplay from './components/ReviewFeedbackDisplay'; // Import the new component

// Mock API URL (replace with your actual backend URL if different)
const API_URL = '/api'; // Uses proxy set in vite.config.js

const initialCode = `// Welcome to CodeGenius!
// This is the main application component.
// It handles state management for the UI, API interactions, and renders all sub-components.
// Users can input prompts, select languages, generate code, review code, and manage themes.
`;

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('python');
  const [generatedCode, setGeneratedCode] = useState(initialCode);
  const [reviewFeedback, setReviewFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' or 'review'
  const [editorLanguage, setEditorLanguage] = useState('python'); // for Monaco editor

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Update Monaco editor language when our app language changes
    // This mapping might need to be more sophisticated for more languages
    const langMap = {
      python: 'python',
      javascript: 'javascript',
      java: 'java',
      go: 'go',
      html: 'html',
      css: 'css',
      // add other languages Monaco supports
    };
    setEditorLanguage(langMap[language] || 'plaintext');
  }, [language]);


  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleGenerateCode = async () => {
    if (!prompt) {
      setError({ type: 'user', message: 'Prompt cannot be empty.' });
      return;
    }
    setIsLoading(true);
    setError(null);
    setReviewFeedback(null);
    try {
      const response = await axios.post(`${API_URL}/generate`, { prompt, language });
      setGeneratedCode(response.data.code || '// No code generated.');
      setActiveTab('generate'); // Switch to generated code view
    } catch (err) {
      setError({ type: 'api', message: err.response?.data?.error || 'Failed to generate code.' });
      setGeneratedCode('// Error generating code. See error message.');
    }
    setIsLoading(false);
  };

  const handleReviewCode = async () => {
    if (!generatedCode || generatedCode === initialCode) {
      setError({ type: 'user', message: 'No code to review. Generate or paste code first.' });
      return;
    }
    setIsLoading(true);
    setError(null);
    setReviewFeedback(null);
    try {
      const response = await axios.post(`${API_URL}/review`, { code: generatedCode, language });
      setReviewFeedback(response.data.review || 'No feedback received.');
      setActiveTab('review'); // Switch to review feedback view
    } catch (err) {
      setError({ type: 'api', message: err.response?.data?.error || 'Failed to review code.' });
      setReviewFeedback('Error fetching review. See error message.');
    }
    setIsLoading(false);
  };

  const handleCodeChange = (value) => {
    setGeneratedCode(value);
  };

  const handleDownloadCode = () => {
    if (!generatedCode || generatedCode === initialCode) {
        setError({type: 'user', message: 'No code to download.'});
        return;
    }
    const element = document.createElement("a");
    const file = new Blob([generatedCode], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    const extensionMap = {
      python: 'py',
      javascript: 'js',
      java: 'java',
      go: 'go',
      html: 'html',
      css: 'css',
      // Add other language extensions here
    };
    const extension = extensionMap[language] || 'txt'; // Default to .txt if language not in map
    element.download = `generated_code.${extension}`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };


  const LoadingIndicator = () => (
    <div className="flex items-center justify-center space-x-2 p-4">
      <RotateCcw className="w-6 h-6 animate-spin-slow text-blue-500" />
      <span className="text-lg">Processing...</span>
    </div>
  );

  const ErrorDisplay = ({ error }) => {
    if (!error) return null;
    return (
      <div className={`p-4 mb-4 text-sm rounded-lg ${error.type === 'api' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200' : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200'}`} role="alert">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span className="font-medium">{error.type === 'api' ? 'API Error:' : 'Input Error:'}</span> {error.message}
        </div>
      </div>
    );
  };


  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Code className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">CodeGenius</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-6 w-6 text-yellow-400 group-hover:text-yellow-300" /> : <Moon className="h-6 w-6 text-gray-600 group-hover:text-indigo-500" />}
          </button>
          {/* Placeholder for future settings icon */}
          {/* <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <Settings className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button> */}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col md:flex-row p-4 gap-4">
        {/* Left Panel: Prompt and Controls */}
        <div className="w-full md:w-1/3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
              <MessageSquare className="inline-block h-5 w-5 mr-2 align-text-bottom" />
              Your Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Create a Flask app with an SQLite DB for task management..."
              rows="8"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-shadow"
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
              <Code className="inline-block h-5 w-5 mr-2 align-text-bottom" />
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="go">Go</option>
              {/* Add more languages as supported */}
            </select>
          </div>

          <ErrorDisplay error={error} />

          {isLoading && <LoadingIndicator />}

          <div className="space-y-3">
            <button
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-md transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 shadow-md hover:shadow-lg disabled:opacity-50 disabled:transform-none active:animate-bubble"
            >
              <Play className="h-5 w-5 mr-2" />
              Generate Code
            </button>
            <button
              onClick={handleReviewCode}
              disabled={isLoading || !generatedCode || generatedCode === initialCode}
              className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-md transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 shadow-md hover:shadow-lg disabled:opacity-50 disabled:transform-none active:animate-bubble"
            >
              <Search className="h-5 w-5 mr-2" />
              Review Code
            </button>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
             <button
                onClick={handleDownloadCode}
                disabled={!generatedCode || generatedCode === initialCode}
                className="w-full flex items-center justify-center bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-semibold py-3 px-4 rounded-md transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 shadow-md hover:shadow-lg disabled:opacity-50 disabled:transform-none active:animate-bubble"
              >
                <Download className="h-5 w-5 mr-2" />
                Download Code
              </button>
          </div>
        </div>

        {/* Right Panel: Code Editor and Review Feedback */}
        <div className="w-full md:w-2/3 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-lg flex flex-col">
          {/* Tabs for Code and Review */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('generate')}
              className={`py-3 px-6 font-semibold transition-colors ${activeTab === 'generate' ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300'}`}
            >
              Generated Code
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`py-3 px-6 font-semibold transition-colors ${activeTab === 'review' ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-300'}`}
            >
              Review Feedback
            </button>
          </div>

          {/* Content based on active tab */}
          <div className="flex-grow p-1 relative">
            {activeTab === 'generate' && (
              <Editor
                height="calc(100vh - 200px)" // Adjust height as needed
                language={editorLanguage}
                value={generatedCode}
                onChange={handleCodeChange}
                theme={darkMode ? 'vs-dark' : 'light'}
                options={{
                  selectOnLineNumbers: true,
                  roundedSelection: false,
                  readOnly: false,
                  cursorStyle: 'line',
                  automaticLayout: true,
                  minimap: { enabled: true }
                }}
              />
            )}
            {activeTab === 'review' && (
              <ReviewFeedbackDisplay markdownContent={reviewFeedback} />
            )}
          </div>
        </div>
      </main>

      {/* Footer (optional) */}
      {/* <footer className="bg-gray-100 dark:bg-gray-800 p-4 text-center text-sm text-gray-600 dark:text-gray-400 border-t dark:border-gray-700">
        Powered by Gemini & React - CodeGenius &copy; 2024
      </footer> */}
    </div>
  );
}

export default App;
