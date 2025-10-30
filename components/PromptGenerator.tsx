import React, { useState, useCallback, useEffect } from 'react';
import { AI_APPS } from '../constants';
import type { AiApp, Plan, PromptHistoryItem, Tone, Style, Length } from '../types';
import { generateOptimizedPrompt } from '../services/geminiService';
import { BackArrowIcon, ClipboardIcon, CheckIcon, WandIcon } from './icons';

type Step = 'select_app' | 'select_plan' | 'input_prompt' | 'generating' | 'result';

interface PromptGeneratorProps {
  onBack: () => void;
  saveToHistory: (data: Omit<PromptHistoryItem, 'id' | 'timestamp'>) => void;
  initialData?: PromptHistoryItem | null;
}

const FadeIn: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="animate-fade-in">{children}</div>
);

const TONES: Tone[] = ['Professional', 'Casual', 'Creative'];
const STYLES: Style[] = ['Concise', 'Descriptive', 'Technical'];
const LENGTHS: Length[] = ['Short', 'Medium', 'Long'];

const OptionSelector: React.FC<{label: string, options: string[], selected: string, onSelect: (value: any) => void}> = ({ label, options, selected, onSelect }) => (
    <div>
        <h4 className="text-md font-semibold text-gray-600 dark:text-gray-400 mb-2">{label}</h4>
        <div className="flex gap-2 rounded-lg p-1 bg-gray-100 dark:bg-gray-700/50">
            {options.map(option => (
                <button
                    key={option}
                    onClick={() => onSelect(option)}
                    className={`flex-1 text-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${selected === option ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow' : 'text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                    {option}
                </button>
            ))}
        </div>
    </div>
);


export const PromptGenerator: React.FC<PromptGeneratorProps> = ({ onBack, saveToHistory, initialData }) => {
  const [step, setStep] = useState<Step>('select_app');
  const [selectedApp, setSelectedApp] = useState<AiApp | null>(AI_APPS[0]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Refinement states
  const [tone, setTone] = useState<Tone>('Casual');
  const [style, setStyle] = useState<Style>('Descriptive');
  const [length, setLength] = useState<Length>('Medium');
  
  useEffect(() => {
    if (initialData) {
      setSelectedApp(initialData.selectedApp);
      setSelectedPlan(initialData.selectedPlan);
      setUserInput(initialData.userInput);
      setResult(initialData.result);
      setTone(initialData.tone);
      setStyle(initialData.style);
      setLength(initialData.length);
      setStep('result');
    }
  }, [initialData]);

  const handleAppSelect = useCallback((app: AiApp) => {
    setSelectedApp(app);
    setStep('select_plan');
  }, []);

  const handlePlanSelect = useCallback((plan: Plan) => {
    setSelectedPlan(plan);
    setStep('input_prompt');
  }, []);

  const handleGenerate = async () => {
    if (!selectedApp || !selectedPlan || !userInput.trim()) return;
    setStep('generating');
    const optimizedPrompt = await generateOptimizedPrompt(selectedApp, selectedPlan, userInput, tone, style, length);
    setResult(optimizedPrompt);
    saveToHistory({
        type: 'prompt',
        selectedApp,
        selectedPlan,
        userInput,
        result: optimizedPrompt,
        tone,
        style,
        length
    });
    setStep('result');
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const resetFlow = () => {
      setStep('select_app');
      setSelectedApp(AI_APPS[0]);
      setSelectedPlan(null);
      setUserInput('');
      setResult('');
      setTone('Casual');
      setStyle('Descriptive');
      setLength('Medium');
  }

  const renderStep = () => {
    switch (step) {
      case 'select_app':
        return (
          <FadeIn key="select_app">
            <h3 className="text-xl font-semibold text-center mb-6 text-gray-700 dark:text-gray-300">Which AI are you creating a prompt for?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {AI_APPS.map(app => (
                <button
                  key={app.id}
                  onClick={() => handleAppSelect(app)}
                  className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 text-center transform hover:scale-105 active:scale-100"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{app.name}</span>
                </button>
              ))}
            </div>
          </FadeIn>
        );

      case 'select_plan':
        return (
          <FadeIn key="select_plan">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">You selected: <span className="text-blue-600 dark:text-blue-400 font-bold">{selectedApp?.name}</span></h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Which plan are you on?</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => handlePlanSelect('Free')} className="px-8 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 transition-all transform hover:scale-105 active:scale-100">🆓 Free Plan</button>
                <button onClick={() => handlePlanSelect('Paid')} className="px-8 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-all transform hover:scale-105 active:scale-100">💎 Paid Plan</button>
              </div>
            </div>
          </FadeIn>
        );
      
      case 'input_prompt':
        return (
            <FadeIn key="input_prompt">
                <h3 className="text-xl font-semibold text-center mb-6 text-gray-700 dark:text-gray-300">What's your prompt idea?</h3>
                <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={`e.g., "A photo of a cat programming in a futuristic city"`}
                    className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-inner focus:ring-2 focus:ring-blue-500 focus:outline-none transition bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                <div className="mt-6 space-y-4">
                    <OptionSelector label="Tone" options={TONES} selected={tone} onSelect={setTone} />
                    <OptionSelector label="Style" options={STYLES} selected={style} onSelect={setStyle} />
                    <OptionSelector label="Length" options={LENGTHS} selected={length} onSelect={setLength} />
                </div>
                <button 
                    onClick={handleGenerate} 
                    disabled={!userInput.trim()}
                    className="mt-6 w-full flex items-center justify-center gap-2 bg-gray-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-100"
                >
                    <WandIcon className="w-5 h-5" />
                    Generate Optimized Prompt
                </button>
            </FadeIn>
        );

      case 'generating':
        return (
          <FadeIn key="generating">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-lg font-semibold text-gray-600 dark:text-gray-300">AG ink is thinking...</p>
              <p className="text-gray-500 dark:text-gray-400">Crafting the perfect prompt for you.</p>
            </div>
          </FadeIn>
        );

      case 'result':
        return (
          <FadeIn key="result">
            <h3 className="text-xl font-semibold text-center mb-4 text-gray-700 dark:text-gray-300">Your Optimized Prompt:</h3>
            <div className="relative p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{result}</p>
                <button onClick={handleCopy} className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                    {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                </button>
            </div>
            <button 
              onClick={initialData ? onBack : resetFlow} 
              className="mt-6 w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-blue-600 transition-colors active:scale-95"
            >
                {initialData ? "Go Back" : "Start Over"}
            </button>
          </FadeIn>
        );
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 relative">
      {(step !== 'result' || !initialData) && step !== 'select_app' ? (
        <button onClick={() => setStep(prev => prev === 'input_prompt' ? 'select_plan' : 'select_app')} className="absolute top-4 left-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <BackArrowIcon className="w-6 h-6" />
        </button>
      ) : step === 'select_app' && !initialData ? (
        <button onClick={onBack} className="absolute top-4 left-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <BackArrowIcon className="w-6 h-6" />
        </button>
      ) : null}
      {renderStep()}
    </div>
  );
};