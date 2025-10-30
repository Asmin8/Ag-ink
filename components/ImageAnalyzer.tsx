import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { ImageFile, AnalysisResult, ImageHistoryItem } from '../types';
import { analyzeImagesAndGeneratePrompt } from '../services/geminiService';
import { BackArrowIcon, ClipboardIcon, CheckIcon, UploadIcon, WandIcon } from './icons';


interface ImageAnalyzerProps {
  onBack: () => void;
  saveToHistory: (data: Omit<ImageHistoryItem, 'id' | 'timestamp'>) => void;
  initialData?: ImageHistoryItem | null;
}

export const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ onBack, saveToHistory, initialData }) => {
    const [images, setImages] = useState<ImageFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        if (initialData) {
            setResult(initialData.result);
        }
    }, [initialData]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []) as File[];
        if (images.length + files.length > 20) {
            setError("You can upload a maximum of 20 images.");
            return;
        }
        setError(null);
        const newImageFiles = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setImages(prev => [...prev, ...newImageFiles]);
    };

    const handleAnalyze = async () => {
        if (images.length === 0) {
            setError("Please upload at least one image.");
            return;
        }
        setIsLoading(true);
        setError(null);
        const filesToAnalyze = images.map(img => img.file);
        const analysisResult = await analyzeImagesAndGeneratePrompt(filesToAnalyze);
        setResult(analysisResult);
        saveToHistory({
            type: 'image',
            imageCount: filesToAnalyze.length,
            result: analysisResult
        });
        setIsLoading(false);
    };

    const handleCopy = () => {
        if (result?.prompt) {
            navigator.clipboard.writeText(result.prompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    
    const resetFlow = () => {
        setImages([]);
        setError(null);
        setIsLoading(false);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }
    
    const handleStartOver = () => {
        if (initialData) {
            onBack();
        } else {
            resetFlow();
        }
    }


    if (isLoading) {
        return (
            <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 text-center animate-fade-in">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto"></div>
                <p className="mt-4 text-lg font-semibold text-gray-600 dark:text-gray-300">Analyzing images...</p>
                <p className="text-gray-500 dark:text-gray-400">This might take a moment.</p>
            </div>
        );
    }

    if (result) {
        return (
            <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 relative animate-fade-in">
                <button onClick={onBack} className="absolute top-4 left-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <BackArrowIcon className="w-6 h-6" />
                </button>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Analysis Summary</h3>
                        <p className="p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200">{result.summary}</p>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Generated Prompt</h3>
                        <div className="relative p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{result.prompt}</p>
                            <button onClick={handleCopy} className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-700 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                                {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                            </button>
                        </div>
                    </div>
                    <button 
                        onClick={handleStartOver} 
                        className="mt-4 w-full bg-purple-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-purple-600 transition-colors active:scale-95"
                    >
                        {initialData ? "Go Back" : "Analyze More Images"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 relative animate-fade-in">
            <button onClick={onBack} className="absolute top-4 left-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                <BackArrowIcon className="w-6 h-6" />
            </button>
            <div className="text-center">
                <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-300">Upload Images for Analysis</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">You can upload up to 20 images.</p>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-10 cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                    />
                    <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                        <UploadIcon className="w-12 h-12 mb-2"/>
                        <p>Click to browse or drag & drop</p>
                    </div>
                </div>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>
            {images.length > 0 && (
                <div className="mt-6">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                        {images.map((image, index) => (
                            <img key={index} src={image.preview} alt={`upload-preview-${index}`} className="w-full h-24 object-cover rounded-lg shadow-md" />
                        ))}
                    </div>
                    <button 
                        onClick={handleAnalyze} 
                        className="mt-6 w-full flex items-center justify-center gap-2 bg-gray-800 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:bg-gray-900 transition-all duration-300 transform hover:scale-105 active:scale-100"
                    >
                        <WandIcon className="w-5 h-5"/>
                        Analyze {images.length} Image{images.length > 1 && 's'}
                    </button>
                </div>
            )}
        </div>
    );
};