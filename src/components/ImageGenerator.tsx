import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Loader2, Download, ArrowRight, Zap, Maximize2, X, Ratio, Palette, Trash2, Wand2, Upload, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveImage, getAllImages, clearAllImages, deleteImage } from '../lib/db';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface GeneratedImage {
  url: string;
  prompt: string;
  style: string;
  aspectRatio: string;
  timestamp: number;
}

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

interface StylePreset {
  id: string;
  label: string;
  promptModifier: string;
}

const STYLES: StylePreset[] = [
  { id: 'none', label: 'No Style', promptModifier: '' },
  { id: 'cyberpunk', label: 'Cyberpunk', promptModifier: 'cyberpunk style, neon lights, high contrast, futuristic, detailed, 8k' },
  { id: 'photoreal', label: 'Photorealistic', promptModifier: 'photorealistic, 8k, highly detailed, cinematic lighting, realistic textures, photography' },
  { id: 'anime', label: 'Anime', promptModifier: 'anime style, studio ghibli, vibrant colors, cel shaded, detailed background' },
  { id: 'oil', label: 'Oil Painting', promptModifier: 'oil painting, textured, brush strokes, classical art style, masterpiece' },
  { id: '3d', label: '3D Render', promptModifier: '3d render, octane render, unreal engine 5, ray tracing, volumetric lighting' },
];

const LOADING_LOGS = [
  "> INITIALIZING NEURAL NET...",
  "> CONNECTING TO GEMINI CLUSTER...",
  "> PARSING INPUT SEQUENCE...",
  "> GENERATING LATENT VECTORS...",
  "> DENOISING IMAGE...",
  "> UPSCALING RESOLUTION...",
  "> APPLYING STYLE TRANSFER...",
  "> FINALIZING RENDER..."
];

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadingLog, setLoadingLog] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // New State
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [selectedStyle, setSelectedStyle] = useState<string>('none');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from IndexedDB on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const images = await getAllImages();
        // Sort by timestamp descending (newest first)
        setHistory(images.sort((a, b) => b.timestamp - a.timestamp));
        if (images.length > 0) {
          setGeneratedImage(images[images.length - 1]); // Set the most recent one
        }
      } catch (e) {
        console.error("Failed to load history from DB", e);
      }
    };
    loadHistory();
  }, []);

  // Terminal Log Effect
  useEffect(() => {
    if (isLoading) {
      setLoadingLog([]);
      let step = 0;
      const interval = setInterval(() => {
        if (step < LOADING_LOGS.length) {
          setLoadingLog(prev => [...prev, LOADING_LOGS[step]]);
          step++;
        } else {
          clearInterval(interval);
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const clearHistory = async () => {
    await clearAllImages();
    setHistory([]);
    setGeneratedImage(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const enhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: `Rewrite this image prompt to be more detailed, artistic, and descriptive for an AI image generator. Keep it under 40 words. Prompt: "${prompt}"` }] },
      });
      const enhancedText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (enhancedText) {
        setPrompt(enhancedText.trim());
      }
    } catch (e) {
      console.error("Failed to enhance prompt", e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim() && !uploadedImage) return;

    setIsLoading(true);
    setError(null);

    try {
      const styleModifier = STYLES.find(s => s.id === selectedStyle)?.promptModifier || '';
      const finalPrompt = styleModifier ? `${prompt}, ${styleModifier}` : prompt;

      let response;

      // Image-to-Image or Text-to-Image
      if (uploadedImage) {
        // Extract base64 data (remove "data:image/png;base64," prefix)
        const base64Data = uploadedImage.split(',')[1];
        const mimeType = uploadedImage.split(';')[0].split(':')[1];

        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: {
            parts: [
              { text: finalPrompt || "Describe this image" },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ],
          },
        });
      } else {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: finalPrompt }] },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio,
            }
          }
        });
      }

      let imageUrl = '';
      const candidates = response.candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (imageUrl) {
        const newImage: GeneratedImage = {
          url: imageUrl,
          prompt: prompt,
          style: selectedStyle,
          aspectRatio: aspectRatio,
          timestamp: Date.now(),
        };

        // Save to DB and State
        await saveImage(newImage);
        setGeneratedImage(newImage);
        setHistory(prev => [newImage, ...prev]);
        setUploadedImage(null); // Clear upload after generation
      } else {
        throw new Error("No image data found.");
      }

    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Generation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage.url;
      link.download = `IMAGINAI-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#ccff00] selection:text-black overflow-hidden flex flex-col">

      {/* Top Bar */}
      <div className="h-12 border-b border-[#333] flex items-center justify-between px-6 bg-black z-50">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-[#ccff00] rounded-full animate-pulse" />
          <span className="font-mono text-xs tracking-widest text-[#ccff00]">SYSTEM ONLINE</span>
        </div>
        <div className="font-mono text-xs text-zinc-500 hidden md:block">
          LATENCY: 12ms // REGION: GLOBAL // MODEL: GEMINI-2.5
        </div>
        <div className="font-display font-bold text-xl tracking-tighter">IMAGINAI</div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-48px)]">

        {/* Left Panel: Controls */}
        <div className="lg:w-[450px] border-r border-[#333] flex flex-col bg-black z-20 overflow-y-auto">

          <div className="p-7 flex-1 flex flex-col gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold leading-[0.85] tracking-tighter mb-3">
                CREATE<br />
                <span className="text-transparent" style={{ WebkitTextStroke: '1px #fff' }}>REALITY</span>
              </h1>
            </div>

            <div className="space-y-6">
              {/* Prompt Input */}
              <div className="relative">
                <label className="block font-mono text-[10px] text-[#ccff00] mb-2 uppercase tracking-widest flex justify-between">
                  <span>Input Sequence</span>
                  <button
                    onClick={enhancePrompt}
                    disabled={isEnhancing || !prompt.trim()}
                    className="flex items-center gap-1 text-[#ccff00] hover:text-white transition-colors disabled:opacity-50"
                  >
                    <Wand2 className="w-3 h-3" />
                    {isEnhancing ? 'ENHANCING...' : 'ENHANCE'}
                  </button>
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="TYPE HERE..."
                  className="w-full bg-[#111] text-white p-4 font-mono text-sm border border-[#333] focus:border-[#ccff00] focus:outline-none h-[6.5rem] resize-none transition-colors placeholder:text-zinc-700"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      generateImage();
                    }
                  }}
                />

                {/* Upload Button */}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-1.5 rounded hover:bg-[#333] transition-colors ${uploadedImage ? 'text-[#ccff00]' : 'text-zinc-500'}`}
                    title="Upload Reference Image"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {uploadedImage && (
                <div className="relative w-full h-20 bg-[#111] border border-[#333] flex items-center gap-4 p-2">
                  <img src={uploadedImage} alt="Reference" className="h-full aspect-square object-cover border border-[#333]" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-[10px] text-[#ccff00] truncate">REFERENCE_IMG_LOADED</p>
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="text-[10px] text-red-500 hover:text-red-400 underline mt-1"
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              )}

              {/* Configuration Grid */}
              <div className="grid grid-cols-1 gap-5">

                {/* Aspect Ratio */}
                <div>
                  <label className="block font-mono text-[10px] text-zinc-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Ratio className="w-3 h-3" /> Aspect Ratio
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['1:1', '16:9', '9:16'].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio as AspectRatio)}
                        className={`py-2 px-3 border font-mono text-xs transition-all ${aspectRatio === ratio
                          ? 'bg-[#ccff00] text-black border-[#ccff00] font-bold'
                          : 'bg-transparent text-zinc-400 border-[#333] hover:border-white'
                          }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style Selector */}
                <div>
                  <label className="block font-mono text-[10px] text-zinc-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Visual Style
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`py-2 px-3 border font-mono text-[10px] text-left transition-all truncate ${selectedStyle === style.id
                          ? 'bg-white text-black border-white'
                          : 'bg-transparent text-zinc-400 border-[#333] hover:border-zinc-500'
                          }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Generate Button */}
              <button
                onClick={generateImage}
                disabled={isLoading || (!prompt.trim() && !uploadedImage)}
                className="w-full h-14 bg-white hover:bg-[#ccff00] text-black font-display font-bold text-xl uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between px-6 group mt-3"
              >
                <span>{isLoading ? 'PROCESSING...' : 'EXECUTE'}</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>

              {error && (
                <div className="p-3 border border-red-500 bg-red-500/10 text-red-500 font-mono text-xs">
                  ERROR: {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Viewport */}
        <div className="flex-1 bg-[#050505] relative overflow-hidden flex flex-col">

          {/* Grid Background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />

          {/* Main Image Area */}
          <div className="flex-1 flex items-center justify-center p-8 relative z-10">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-mono text-[#ccff00] text-xs space-y-1 w-full max-w-md p-4 border border-[#333] bg-black/80 backdrop-blur"
                >
                  <div className="flex items-center gap-2 border-b border-[#333] pb-2 mb-2">
                    <Terminal className="w-4 h-4" />
                    <span>SYSTEM_LOG</span>
                  </div>
                  {loadingLog.map((log, i) => (
                    <div key={i} className="opacity-80">{log}</div>
                  ))}
                  <div className="animate-pulse">_</div>
                </motion.div>
              ) : generatedImage ? (
                <motion.div
                  key={generatedImage.url}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative max-h-full max-w-full shadow-2xl group"
                >
                  <img
                    src={generatedImage.url}
                    alt="Generated"
                    className="max-h-[80vh] object-contain border border-[#333]"
                    style={{
                      aspectRatio: generatedImage.aspectRatio.replace(':', '/')
                    }}
                  />

                  {/* Image Overlay Controls */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm border-t border-[#333] translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 flex justify-between items-center">
                    <div className="flex flex-col gap-1 max-w-[60%]">
                      <div className="font-mono text-xs text-white truncate">{generatedImage.prompt}</div>
                      <div className="font-mono text-[10px] text-[#ccff00] uppercase">
                        {STYLES.find(s => s.id === generatedImage.style)?.label} // {generatedImage.aspectRatio}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-[#ccff00] hover:text-black text-white border border-[#333] transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsFullscreen(true)}
                        className="p-2 hover:bg-white hover:text-black text-white border border-[#333] transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center space-y-4 opacity-30">
                  <div className="text-6xl font-display font-bold text-[#333]">NO SIGNAL</div>
                  <div className="font-mono text-xs text-[#666]">WAITING FOR INPUT STREAM...</div>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* History Strip */}
          {history.length > 0 && (
            <div className="h-24 border-t border-[#333] bg-black z-20 flex items-center px-4 gap-4 overflow-x-auto">
              <div className="flex flex-col items-center justify-center h-full border-r border-[#333] pr-4 gap-2">
                <div className="font-mono text-[10px] text-zinc-500 rotate-180 text-vertical-rl">
                  ARCHIVE
                </div>
                <button
                  onClick={clearHistory}
                  className="p-1 hover:text-red-500 text-zinc-600 transition-colors"
                  title="Clear History"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {history.map((img, idx) => (
                <button
                  key={img.timestamp}
                  onClick={() => {
                    setGeneratedImage(img);
                    setPrompt(img.prompt);
                    if (img.style) setSelectedStyle(img.style);
                    if (img.aspectRatio) setAspectRatio(img.aspectRatio as AspectRatio);
                  }}
                  className={`h-16 w-16 flex-shrink-0 border ${generatedImage?.timestamp === img.timestamp
                    ? 'border-[#ccff00]'
                    : 'border-[#333] hover:border-white'
                    } transition-colors overflow-hidden relative group bg-[#111]`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#ccff00]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && generatedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2 text-white hover:text-[#ccff00] transition-colors bg-black/50 rounded-full"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={generatedImage.url}
              alt="Fullscreen"
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
