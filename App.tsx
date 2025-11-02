import React, { useState, useCallback, useEffect } from 'react';
import { PromptGenerator } from './components/PromptGenerator';
import { ImageAnalyzer } from './components/ImageAnalyzer';
import type { Mode, HistoryItem, PromptHistoryItem, ImageHistoryItem } from './types';
import { AgInkIcon, BrainCircuitIcon, ImageIcon, KeyIcon, HistoryIcon, CheckIcon, CloseIcon, SunIcon, MoonIcon, InfoIcon } from './components/icons';

const MAX_HISTORY_ITEMS = 10;

const FadeIn: React.FC<{ children: React.ReactNode, duration?: number, key?: string | number }> = ({ children, duration = 500 }) => {
    return (
        <div className="animate-fade-in" style={{ animationDuration: `${duration}ms` }}>
            {children}
        </div>
    );
};

const App: React.FC = () => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<HistoryItem | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
      if (typeof window !== 'undefined' && window.localStorage) {
          const storedTheme = localStorage.getItem('ag_ink_theme');
          if (storedTheme) return storedTheme as 'light' | 'dark';
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
  });

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('ag_ink_history');
      if (storedHistory) setHistory(JSON.parse(storedHistory));
      
      const storedApiKey = localStorage.getItem('ag_ink_api_key');
      if (storedApiKey) setApiKey(storedApiKey);
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);
  
  useEffect(() => {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ag_ink_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleModeSelect = useCallback((selectedMode: Mode) => {
    setInitialData(null);
    setMode(selectedMode);
  }, []);

  const handleReset = useCallback(() => {
    setMode(null);
    setInitialData(null);
  }, []);

  const saveToHistory = (itemData: Omit<PromptHistoryItem, 'id' | 'timestamp'> | Omit<ImageHistoryItem, 'id' | 'timestamp'>) => {
    setHistory(prevHistory => {
        const newItem: HistoryItem = {
            ...itemData,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        };
        const updatedHistory = [newItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem('ag_ink_history', JSON.stringify(updatedHistory));
        return updatedHistory;
    });
  };
  
  const loadFromHistory = (item: HistoryItem) => {
      setInitialData(item);
      setMode(item.type);
      setShowHistoryPanel(false);
  };
  
  const saveApiKey = (key: string) => {
      setApiKey(key);
      localStorage.setItem('ag_ink_api_key', key);
      setShowApiKeyModal(false);
  };

  const renderContent = () => {
    switch (mode) {
      case 'prompt':
        return (
          <FadeIn key="prompt">
            <PromptGenerator 
              onBack={handleReset} 
              saveToHistory={saveToHistory} 
              initialData={initialData?.type === 'prompt' ? initialData : null}
            />
          </FadeIn>
        );
      case 'image':
        return (
          <FadeIn key="image">
            <ImageAnalyzer 
              onBack={handleReset} 
              saveToHistory={saveToHistory}
              initialData={initialData?.type === 'image' ? initialData : null}
            />
          </FadeIn>
        );
      default:
        return (
          <FadeIn key="home">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">How can I assist you?</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Choose a task to get started.</p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                  onClick={() => handleModeSelect('prompt')}
                  className="group animate-subtle-pulse flex items-center justify-center w-full md:w-64 gap-3 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-500 transition-all duration-300 transform hover:scale-105 active:scale-100"
                >
                  <BrainCircuitIcon className="w-8 h-8 text-blue-500 transition-colors group-hover:text-blue-600"/>
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Give Prompt</span>
                </button>
                <button
                  onClick={() => handleModeSelect('image')}
                  className="group animate-subtle-pulse flex items-center justify-center w-full md:w-64 gap-3 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-lg hover:border-purple-500 transition-all duration-300 transform hover:scale-105 active:scale-100"
                >
                  <ImageIcon className="w-8 h-8 text-purple-500 transition-colors group-hover:text-purple-600"/>
                  <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">Analyze Image</span>
                </button>
              </div>
            </div>
          </FadeIn>
        );
    }
  };

  return (
    <>
      <style>{`
        @keyframes subtle-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
          50% { transform: scale(1.02); box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
        }
        .dark .animate-subtle-pulse {
          50% { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3); }
        }
        .animate-subtle-pulse { animation: subtle-pulse 3s infinite cubic-bezier(0.4, 0, 0.6, 1); }
        @keyframes fade-in { 0% { opacity: 0; transform: translateY(20px) scale(0.98); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fade-in { animation: fade-in 0.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards; }
      `}</style>
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans text-gray-900 dark:text-gray-200 bg-gray-50 dark:bg-gray-900 relative">
        <header className="w-full max-w-4xl mx-auto flex justify-between items-center py-8">
            <div className="w-48 flex items-center gap-2">
                <button onClick={() => setShowApiKeyModal(true)} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                    <KeyIcon className="w-5 h-5" />
                    API Key
                    {apiKey && <CheckIcon className="w-5 h-5 text-green-500" />}
                </button>
                 <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
            </div>
            <div className="flex-grow flex justify-center items-center gap-4">
                <AgInkIcon className="w-12 h-12 text-gray-800 dark:text-gray-200"/>
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-300 dark:to-gray-100">
                AG ink
                </h1>
            </div>
            <div className="w-48 flex justify-end">
                 <button 
                    onClick={() => setShowAboutModal(true)} 
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="About AG ink"
                >
                    <InfoIcon className="w-5 h-5" />
                    <span>About</span>
                </button>
            </div>
        </header>
        
        <main className="w-full flex-grow flex items-center justify-center">
          <div className="w-full max-w-4xl p-4">
            {renderContent()}
          </div>
        </main>

        <footer className="w-full text-center py-6">
          <p className="text-gray-500 dark:text-gray-400">
            ⚡ Powered by AG ink – Smart Intelligence Hub
          </p>
        </footer>

        <button onClick={() => setShowHistoryPanel(true)} className="fixed bottom-6 right-6 flex items-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all transform hover:scale-105">
            <HistoryIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
        </button>
        
        {showHistoryPanel && <HistoryPanel history={history} onLoad={loadFromHistory} onClose={() => setShowHistoryPanel(false)} />}
        {showApiKeyModal && <ApiKeyModal currentKey={apiKey} onSave={saveApiKey} onClose={() => setShowApiKeyModal(false)} />}
        {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
      </div>
    </>
  );
};

const ThemeToggle: React.FC<{ theme: 'light' | 'dark'; toggleTheme: () => void; }> = ({ theme, toggleTheme }) => (
    <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle theme"
    >
        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
    </button>
);


const ApiKeyModal: React.FC<{ currentKey: string | null; onSave: (key: string) => void; onClose: () => void; }> = ({ currentKey, onSave, onClose }) => {
    const [key, setKey] = useState(currentKey || '');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Set API Key</h3>
                    <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Provide an API key to enhance results. This is optional and not required for core features.</p>
                <input
                    type="password"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter your API key"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg shadow-inner focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-gray-200"
                />
                <button onClick={() => onSave(key)} className="mt-4 w-full bg-blue-500 text-white font-bold py-3 rounded-lg shadow-md hover:bg-blue-600 transition-colors active:scale-95">Save Key</button>
            </div>
        </div>
    );
}

const AboutModal: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-2xl m-4 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">About AG ink</h3>
                    <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-grow overflow-y-auto pr-4 -mr-4 text-gray-600 dark:text-gray-400 space-y-4">
                    <p>
                        <strong className="text-gray-700 dark:text-gray-300">Developed by:</strong> AG Studios<br />
                        <strong className="text-gray-700 dark:text-gray-300">Founders of AG Studios:</strong> Asmin Adhikari & Ashok Gaire
                    </p>
                    <p>AG ink is a global platform designed to help people everywhere use any AI tool effortlessly. Our mission is simple — to make artificial intelligence easy, accessible, and enjoyable for everyone, regardless of technical skill or background.</p>
                    <p>The idea behind AG ink was born from our own struggles with writing effective prompts. We often found it challenging to make AI models fully understand what we wanted, and that inspired us to create something better — a tool that simplifies interaction with any AI.</p>
                    <p>We firmly believe that technology should unite, not divide. That’s why AG ink has no paid plans — everything is free for everyone. Our philosophy centers on equality, accessibility, and the belief that innovation should empower people equally across the world.</p>
                    <p>Powered by Gemini Intelligence, AG ink connects users to a wide range of AI platforms with ease, enabling them to generate prompts, analyze images, and make the most out of AI technology.</p>
                    <p>Our vision is to continuously expand AG ink within the context of effective AI use. We are committed to bringing frequent updates and improvements to ensure every user has the best possible experience.</p>
                    <p>AG ink also includes a one-click tone adjustment feature, allowing users to instantly modify how their prompts sound — whether professional, friendly, or creative.</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-300 italic mt-6 text-center">“AG ink — Smart Intelligence for Everyone.”</p>
                </div>
                <div className="mt-6 flex justify-end border-t border-gray-200 dark:border-gray-700 pt-4">
                    <button onClick={onClose} className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-blue-600 transition-colors active:scale-95">Close</button>
                </div>
            </div>
        </div>
    );
}


const HistoryPanel: React.FC<{ history: HistoryItem[], onLoad: (item: HistoryItem) => void, onClose: () => void }> = ({ history, onLoad, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-end z-50 animate-fade-in">
            <div className="bg-white dark:bg-gray-800 h-full w-full max-w-sm shadow-2xl flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">History</h3>
                    <button onClick={onClose} className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><CloseIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {history.length === 0 ? (
                        <p className="text-center text-gray-500 dark:text-gray-400 p-8">No history yet.</p>
                    ) : (
                        <ul>
                            {history.map(item => (
                                <li key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                                    <button onClick={() => onLoad(item)} className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <p className="font-semibold text-gray-700 dark:text-gray-300 truncate">{item.type === 'prompt' ? item.userInput : `${item.imageCount} image(s) analyzed`}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(item.timestamp).toLocaleString()}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};


export default App;