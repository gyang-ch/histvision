import React, { useState, useEffect, useRef } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { gsap } from 'gsap';
import { IIIFViewer } from './IIIFViewer';
import type { OCRResult } from './IIIFViewer';
import type { CharacterBox } from './IIIFViewer';
import type { BookRecord } from '../data/books';
import { getPlantColor } from '../utils/colors';
import { bookLangToCode, getPrompt, getDecodingParams } from '../utils/ocrProfiles';
import './BookReader.css';

interface BookReaderProps {
  book: BookRecord;
  onBack: () => void;
}

interface OCRDebugInfo {
  requestedUrl?: string;
  processedWidth?: number;
  processedHeight?: number;
  originalWidth?: number;
  originalHeight?: number;
  segmentation?: string;
  textDirection?: string;
  lang?: string;
  status?: string;
  rawOutput?: string;
}

const ThumbnailImage: React.FC<{ src: string; isSelected: boolean; isNearSelected: boolean; alt: string }> = ({ src, isSelected, isNearSelected, alt }) => {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if ((isSelected || isNearSelected) && hasError && retryCount < 3) {
      const timer = setTimeout(() => {
        setHasError(false);
        setRetryCount(c => c + 1);
      }, 500 + retryCount * 500); // Increasing backoff
      return () => clearTimeout(timer);
    }
  }, [isSelected, isNearSelected, hasError, retryCount]);

  if (hasError) {
    return (
      <div 
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#334155',
          color: '#94a3b8',
          fontSize: '0.7rem'
        }}
      >
        <span style={{ marginBottom: '4px' }}>Error</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 4 23 10 17 10"></polyline>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
        </svg>
      </div>
    );
  }

  return (
    <img 
      src={`${src}${retryCount > 0 ? `?retry=${retryCount}` : ''}`} 
      alt={alt} 
      loading="lazy"
      onError={() => setHasError(true)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block'
      }}
    />
  );
};

const AZURE_BASE = import.meta.env.VITE_AZURE_BLOB_BASE as string;
const AZURE_SAS = import.meta.env.VITE_AZURE_SAS_TOKEN as string;

/** Extract the image URL from a tileSource entry (string info.json URL or Azure blob object). */
function getTileSourceImageUrl(source: any, iiifSize = '1000,'): string {
  if (source && source.type === 'image') return source.url;
  if (typeof source === 'string') return source.replace('info.json', `full/${iiifSize}/0/default.jpg`);
  const id = source?.['@id'] || source?.id || '';
  return id.replace('info.json', `full/${iiifSize}/0/default.jpg`);
}

export const BookReader: React.FC<BookReaderProps> = ({ book, onBack }) => {
  const API_BASE_URL = (
    (window as any).APP_CONFIG?.API_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'https://gyang-ch--image-api.modal.run'
  ).replace(/\/+$/, '');
  const PREDICT_URL = `${API_BASE_URL}/predict`;
  const backBtnRef = useRef<HTMLButtonElement>(null);
  const [isBackFloating, setIsBackFloating] = useState(false);

  useEffect(() => {
    if (backBtnRef.current) {
      gsap.fromTo(backBtnRef.current, 
        { opacity: 0, x: -20 }, 
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out", delay: 0.2 }
      );
    }
  }, []);

  useEffect(() => {
    const FLOAT_THRESHOLD_PX = 180;
    const onScroll = () => {
      const isFloating = window.scrollY > FLOAT_THRESHOLD_PX;
      setIsBackFloating(isFloating);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!backBtnRef.current) return;
    
    if (isBackFloating) {
      gsap.to(backBtnRef.current, {
        scale: 0.95,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.28)"
      });
    } else {
      gsap.to(backBtnRef.current, {
        scale: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
        boxShadow: "0 6px 18px rgba(15, 23, 42, 0.2)"
      });
    }
  }, [isBackFloating]);

  const [tileSources, setTileSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [pageInput, setPageInput] = useState((selectedPageIndex + 1).toString());
  const thumbnailsRowRef = useRef<HTMLDivElement>(null);

  // Sync pageInput with selectedPageIndex
  useEffect(() => {
    setPageInput((selectedPageIndex + 1).toString());
  }, [selectedPageIndex]);

  // Synchronize thumbnail scrolling
  useEffect(() => {
    if (thumbnailsRowRef.current) {
      const selectedThumb = thumbnailsRowRef.current.children[selectedPageIndex] as HTMLElement;
      if (selectedThumb) {
        selectedThumb.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [selectedPageIndex]);
  
  // Resizing State
  const [sidePanelWidth, setSidePanelWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const resizerRef = useRef<HTMLDivElement>(null);

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing) {
      const container = resizerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const newWidth = containerRect.right - e.clientX;
        // Constraints: Min 280px, Max 60% of container
        if (newWidth > 280 && newWidth < containerRect.width * 0.6) {
          setSidePanelWidth(newWidth);
        }
      }
    }
  };

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

  // OCR States
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isQwenTranscribing, setIsQwenTranscribing] = useState(false);
  const [qwenThinking, setQwenThinking] = useState<string | null>(null);
  const [qwenResults, setQwenResults] = useState<string[]>([]);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [characterBoxes, setCharacterBoxes] = useState<CharacterBox[]>([]);
  
  // Translation States
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // YOLO States
  const [isDetecting, setIsDetecting] = useState(false);
  const [plantDetections, setPlantDetections] = useState<any[]>([]);

  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const [currentOcrUrl, setCurrentOcrUrl] = useState<string | null>(null);
  const [ocrDebug, setOcrDebug] = useState<OCRDebugInfo | null>(null);

  useEffect(() => {
    const fetchManifest = async () => {
      try {
        setLoading(true);
        const response = await fetch(book.manifestUrl);
        const manifest = await response.json();
        
        const sources: any[] = [];

        // For RHS/libnova books, the IIIF server blocks cross-origin requests.
        // Use Azure blob storage page images instead, looked up by libnova image ID.
        const manifestId: string = manifest.id || manifest['@id'] || '';
        const isRhsManifest = manifestId.includes('libnova.com');

        if (isRhsManifest) {
          // The blob book_id is hardcoded in BookRecord.blobBookId (books.ts).
          // Build sequential page paths for all canvases in the manifest.
          const blobBookId = book.blobBookId ?? '';
          const canvases = manifest.sequences?.[0]?.canvases || manifest.items || [];
          if (blobBookId && canvases.length > 0) {
            canvases.forEach((_: any, i: number) => {
              const pagePath = `book_pages/${blobBookId}/page_${String(i + 1).padStart(3, '0')}.jpg`;
              sources.push({ type: 'image', url: `${AZURE_BASE}/${pagePath}?${AZURE_SAS}` });
            });
          }
        } else if (manifest.sequences && manifest.sequences[0].canvases) {
          manifest.sequences[0].canvases.forEach((canvas: any) => {
            const image = canvas.images[0];
            const service = image.resource.service;
            if (service) {
              const id = service['@id'] || service.id;
              sources.push(id.endsWith('/info.json') ? id : `${id}/info.json`);
            }
          });
        } else if (manifest.items) {
          manifest.items.forEach((canvas: any) => {
            const annotationPage = canvas.items[0];
            const annotation = annotationPage.items[0];
            const service = annotation.body.service?.[0] || annotation.body.service;
            if (service) {
              const id = service['@id'] || service.id;
              sources.push(id.endsWith('/info.json') ? id : `${id}/info.json`);
            }
          });
        }

        if (sources.length === 0) throw new Error("No image sources found.");
        setTileSources(sources);
      } catch (err) {
        console.error(err);
        setError("Failed to load manifest.");
      } finally {
        setLoading(false);
      }
    };
    fetchManifest();
  }, [book.manifestUrl]);

  const handleTranslate = async () => {
    const textToTranslate = (qwenResults.length > 0 ? qwenResults.join('\n') : ocrResults.map((line) => line.text).join('\n')).trim();
    if (!textToTranslate) return;

    setIsTranslating(true);
    setTranslatedText(null);

    const normalizeLangCode = (lang: string) => {
      const l = lang.toLowerCase();
      if (l.includes('latin')) return 'la';
      if (l.includes('arabic')) return 'ar';
      if (l.includes('chinese')) return 'zh-Hans';
      if (l.includes('japanese')) return 'ja';
      if (l.includes('persian')) return 'fa';
      if (l.includes('hebrew')) return 'he';
      if (l.includes('german')) return 'de';
      if (l.includes('french')) return 'fr';
      if (l.includes('spanish')) return 'es';
      if (l.includes('italian')) return 'it';
      if (l.includes('portuguese')) return 'pt';
      if (l.includes('english')) return 'en';
      return null;
    };

    const detectedLang = (book.language || [])
      .map(normalizeLangCode)
      .find((code) => !!code) || null;

    // Note: Vite env vars are embedded into the client bundle. Treat this as a public key.
    // For true secrecy, proxy translation through your backend instead of calling Azure from the browser.
    const key = (import.meta.env.VITE_AZURE_TRANSLATION_KEY as string | undefined) || '';
    const endpoint = "https://api.cognitive.microsofttranslator.com";
    const region = (import.meta.env.VITE_AZURE_TRANSLATION_REGION as string | undefined) || "francecentral";

    if (!key) {
      console.error('Azure translation key missing. Set VITE_AZURE_TRANSLATION_KEY in frontend/.env.');
      alert('Translation is not configured (missing Azure key).');
      setIsTranslating(false);
      return;
    }

    const fetchTranslation = async (text: string, forceAutoDetect = false) => {
      const fromParam =
        !forceAutoDetect && detectedLang && detectedLang !== 'en'
          ? `&from=${detectedLang}`
          : '';
      const url = `${endpoint}/translate?api-version=3.0&to=en${fromParam}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Ocp-Apim-Subscription-Region': region,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ Text: text }])
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        const raw = await response.text();
        throw new Error(`Translation failed with status ${response.status}. ${raw}`);
      }

      if (!response.ok || data?.error) {
        const message = data?.error?.message || `Translation failed with status ${response.status}.`;
        throw new Error(message);
      }

      const translated = data?.[0]?.translations?.[0]?.text;
      if (!translated) {
        throw new Error('Translation service returned no text.');
      }
      return translated as string;
    };

    const splitIntoChunks = (text: string, maxLen = 4500) => {
      const parts: string[] = [];
      const lines = text.split(/\n+/);
      let buffer = '';
      for (const line of lines) {
        const next = buffer ? `${buffer}\n${line}` : line;
        if (next.length > maxLen) {
          if (buffer) parts.push(buffer);
          if (line.length > maxLen) {
            for (let i = 0; i < line.length; i += maxLen) {
              parts.push(line.slice(i, i + maxLen));
            }
            buffer = '';
          } else {
            buffer = line;
          }
        } else {
          buffer = next;
        }
      }
      if (buffer) parts.push(buffer);
      return parts;
    };

    try {
      const chunks = splitIntoChunks(textToTranslate);
      const translatedChunks: string[] = [];
      for (const chunk of chunks) {
        try {
          const translated = await fetchTranslation(chunk, false);
          translatedChunks.push(translated);
        } catch (err) {
          // If explicit source language fails, retry with auto-detect
          const translated = await fetchTranslation(chunk, true);
          translatedChunks.push(translated);
        }
      }
      setTranslatedText(translatedChunks.join('\n'));
    } catch (error) {
      console.error("Azure Translation Error:", error);
      alert("Translation failed.");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyTranscription = async () => {
    const textToCopy = (qwenResults.length > 0 ? qwenResults.join('\n') : ocrResults.map((line) => line.text).join('\n')).trim();
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Copy transcription failed:", error);
    }
  };

  const handleTranscribe = async () => {
    if (!tileSources[selectedPageIndex]) return;
    
    try {
      setIsTranscribing(true);
      setOcrResults([]);
      setQwenResults([]);
      setCharacterBoxes([]);
      setTranslatedText(null);
      setCurrentOcrUrl(null);
      
      let modelLang = "Latin";
      const languages = (book.language || []).map((l) => l.toLowerCase());
      if (languages.some((l) => l.includes("arabic"))) {
        modelLang = "Arabic";
      } else if (languages.some((l) => l.includes("chinese") || l.includes("japanese"))) {
        modelLang = "Chinese";
      }

      const imageUrl = getTileSourceImageUrl(tileSources[selectedPageIndex]);

      setOcrDebug({
        status: "Processing...",
        requestedUrl: imageUrl,
        lang: modelLang,
      });

      const response = await fetch(`${PREDICT_URL}?task=iiif&url=${encodeURIComponent(imageUrl)}&lang=${encodeURIComponent(modelLang)}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setOcrResults(result.data);
        setCharacterBoxes(result.characters || []);
        setImageSize({ width: result.width, height: result.height });
        setCurrentOcrUrl(imageUrl);
        setOcrDebug({
          status: "Completed",
          requestedUrl: result.requested_url || imageUrl,
          processedWidth: result.processed_width,
          processedHeight: result.processed_height,
          originalWidth: result.width,
          originalHeight: result.height,
          segmentation: result.segmentation,
          textDirection: result.text_direction,
          lang: result.lang
        });
      } else {
        alert("Transcription failed: " + (result.detail || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend transcription service.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleQwenTranscribe = async () => {
    if (!tileSources[selectedPageIndex]) return;
    
    try {
      setIsQwenTranscribing(true);
      setQwenThinking(""); // Initialize to empty string so Thinking UI appears immediately
      setOcrResults([]);
      setQwenResults([]);
      setCharacterBoxes([]);
      setTranslatedText(null);
      setCurrentOcrUrl(null);
      
      const tileSource = tileSources[selectedPageIndex];
      const imageUrl = getTileSourceImageUrl(tileSource);

      setOcrDebug({
        status: "Processing Qwen (Frontend)...",
        requestedUrl: imageUrl,
        lang: bookLangToCode(book.language || []),
      });

      let originalWidth = 1000;
      let originalHeight = 1000;
      if (typeof tileSource === 'string') {
        try {
          const infoRes = await fetch(tileSource);
          const infoData = await infoRes.json();
          if (infoData.width) originalWidth = infoData.width;
          if (infoData.height) originalHeight = infoData.height;
        } catch (e) {
          console.warn("Could not fetch info.json", e);
        }
      }

      const langCode = bookLangToCode(book.language || []);
      const promptText = getPrompt(langCode);
      const decodingParams = getDecodingParams(langCode);

      setOcrDebug(prev => prev ? { ...prev, status: "Waiting for Together API...", lang: langCode } : null);

      const response = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_TOGETHER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemma-4-31B-it",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: promptText },
                { type: "image_url", image_url: { url: imageUrl } }
              ]
            }
          ],
          max_tokens: 8192,
          stream: true,
          temperature: decodingParams.temperature,
          repetition_penalty: decodingParams.repetition_penalty,
          frequency_penalty: decodingParams.frequency_penalty,
        })
      });

      if (!response.ok) {
        throw new Error(`Together API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Could not get response reader");
      
      const decoder = new TextDecoder();
      let rawContent = "";
      let fullReasoning = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(line => line.trim() !== "");

        for (const line of lines) {
          const message = line.replace(/^data: /, "");
          if (message === "[DONE]") break;

          try {
            const parsed = JSON.parse(message);
            const delta = parsed.choices[0].delta;

            // 1. Update the "Thinking" UI
            if (delta.reasoning_content) {
              fullReasoning += delta.reasoning_content;
              setQwenThinking(fullReasoning);
            } else if (delta.content && delta.content.includes("<think>")) {
              // Some models put thinking in content (e.g. DeepSeek-R1-Distill-Qwen)
              const thinkPart = delta.content.split("</think>")[0].replace("<think>", "");
              fullReasoning += thinkPart;
              setQwenThinking(fullReasoning);
            }

            // 2. Update the "Transcription" UI
            if (delta.content) {
              rawContent += delta.content;
            }
          } catch (_e) { /* handle partial chunk errors */ }
        }
      }

      // Combine reasoning into content if it's missing the <think> tag (Together AI quirk)
      if (fullReasoning && !rawContent.includes("<think>")) {
        rawContent = `<think>\n${fullReasoning}\n</think>\n${rawContent}`;
      }
      
      setOcrDebug(prev => prev ? { ...prev, status: "Parsing Output..." } : null);
      
      console.log("=== QWEN RAW OUTPUT ===");
      console.log(rawContent);
      console.log("=======================");

      if (!rawContent.trim()) {
        console.warn("Qwen returned empty content.");
      }

      // Strip out <think>...</think> block entirely, then take each non-empty line
      const contentWithoutThinking = rawContent
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .trim();

      const parsed_lines: string[] = contentWithoutThinking
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && l !== '```');

      let finalStatus = "Completed";
      if (parsed_lines.length === 0 && rawContent.trim()) {
        parsed_lines.push("No text found. See raw output.");
        finalStatus = "Parsing Failed";
      }

      setQwenResults(parsed_lines);
      setQwenThinking(null); // Clear thinking ONLY AFTER results are set to avoid flicker
      setCurrentOcrUrl(imageUrl);
      
      setOcrDebug({
        status: finalStatus,
        requestedUrl: imageUrl,
        processedWidth: originalWidth,
        processedHeight: originalHeight,
        originalWidth: originalWidth,
        originalHeight: originalHeight,
        segmentation: "Qwen3.5",
        textDirection: "auto",
        lang: "auto",
        rawOutput: rawContent
      });
      
    } catch (err) {
      console.error(err);
      alert("Error executing Qwen transcription on frontend.");
    } finally {
      setIsQwenTranscribing(false);
    }
  };

  const handleDetectPlants = async () => {
    if (!tileSources[selectedPageIndex]) return;
    try {
      setIsDetecting(true);
      setPlantDetections([]);
      setCharacterBoxes([]);
      setOcrDebug(null);
      const imageUrl = getTileSourceImageUrl(tileSources[selectedPageIndex], '2000,');

      const response = await fetch(`${PREDICT_URL}?task=plants&url=${encodeURIComponent(imageUrl)}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setPlantDetections(result.data);
        setImageSize({ width: result.width, height: result.height });
        setCurrentOcrUrl(imageUrl);
      } else {
        alert("Detection failed: " + (result.detail || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to detection service.");
    } finally {
      setIsDetecting(false);
    }
  };

  if (loading) return <div className="loading" style={{ padding: '2rem', textAlign: 'center' }}>Loading Manifest...</div>;
  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '4rem 2rem', textAlign: 'center' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fc8181" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>{error}</p>
      <button onClick={onBack} style={{ padding: '0.65rem 2rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer', letterSpacing: '0.03em' }}>← Back to Library</button>
    </div>
  );
  if (!tileSources || tileSources.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', padding: '4rem 2rem', textAlign: 'center' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fc8181" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>No images found.</p>
      <button onClick={onBack} style={{ padding: '0.65rem 2rem', fontSize: '0.95rem', fontWeight: 700, borderRadius: '8px', border: '1px solid #475569', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer', letterSpacing: '0.03em' }}>← Back to Library</button>
    </div>
  );

  return (
    <div className="book-reader-wrapper" style={{ display: 'flex', flexDirection: 'column', width: '100%', margin: 0 }}>
      <div className="book-reader" style={{ borderRadius: 0, padding: '2rem 0.75rem', border: 'none', width: '100%', boxSizing: 'border-box' }}>
	        <div className="reader-header" style={{ marginBottom: '2rem', textAlign: 'center', borderBottom: '1px solid rgba(148, 163, 184, 0.2)', paddingBottom: '1.5rem' }}>
	          <h2 style={{ 
	            margin: 0, 
	            fontFamily: '"EB Garamond", Georgia, serif', 
	            fontSize: '1.5rem', 
	            color: '#f8fafc', 
	            fontWeight: 700,
	            letterSpacing: '0.3px',
	            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
	          }}>{book.title}</h2>
	        </div>

        <div className={`reader-layout ${isResizing ? 'resizing' : ''}`} ref={resizerRef} style={{ gridTemplateColumns: `minmax(0, 1fr) auto ${sidePanelWidth}px` }}>
          <div className="book-reader-viewer-main">
            <div className="thumbnails-strip">
              <div className="strip-header">
                <h3>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  Library Folios
                </h3>
                <div className="page-nav-container">
                  <form 
                    className="page-counter-form" 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const p = parseInt(pageInput);
                      if (!isNaN(p) && p >= 1 && p <= tileSources.length) {
                        setSelectedPageIndex(p - 1);
                      } else {
                        setPageInput((selectedPageIndex + 1).toString());
                      }
                    }}
                  >
                    <input 
                      type="text" 
                      className="page-input" 
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={() => {
                        const p = parseInt(pageInput);
                        if (isNaN(p) || p < 1 || p > tileSources.length) {
                          setPageInput((selectedPageIndex + 1).toString());
                        } else {
                          setSelectedPageIndex(p - 1);
                        }
                      }}
                      aria-label="Go to page"
                    />
                    <span className="page-total"> / {tileSources.length} pages</span>
                  </form>
                </div>              </div>
              <div className="thumbnails-row custom-scrollbar" ref={thumbnailsRowRef}>
                {tileSources.map((source, index) => {
                  const isSelected = selectedPageIndex === index;
                  const thumbUrl = (source && source.type === 'image')
                    ? source.url
                    : (source['@id'] || source.id || (typeof source === 'string' ? source : '')).replace('/info.json', '/full/200,/0/default.jpg');
                  
                  return (
                    <button
                      key={index}
                      onClick={() => setSelectedPageIndex(index)}
                      className={`strip-thumb-btn ${isSelected ? 'selected' : ''}`}
                      title={`Page ${index + 1}`}
                    >
                      <ThumbnailImage 
                        src={thumbUrl}
                        isSelected={isSelected}
                        isNearSelected={Math.abs(index - selectedPageIndex) <= 3}
                        alt={`Page ${index + 1}`}
                      />
                      <div className="thumb-label">{index + 1}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="seadragon-container">
              <IIIFViewer 
                tileSources={tileSources} 
                initialPage={selectedPageIndex}
                onPageChange={(page) => {
                  setSelectedPageIndex(page);
                  setOcrResults([]);
                  setQwenResults([]);
                  setPlantDetections([]);
                  setCharacterBoxes([]);
                  setImageSize(null);
                  setCurrentOcrUrl(null);
                  setOcrDebug(null);
                }}
                ocrResults={[...ocrResults, ...plantDetections]} 
                characterBoxes={characterBoxes}
                highlightIndex={highlightIndex}
                onHoverLine={setHighlightIndex}
                imageSize={imageSize}
              />
            </div>
          </div>

          <div 
            className={`resizer-bar ${isResizing ? 'active' : ''}`}
            onMouseDown={startResizing}
          >
            <div className="resizer-line"></div>
            <div className="resizer-handle">
              <div className="grip-dot"></div>
              <div className="grip-dot"></div>
              <div className="grip-dot"></div>
            </div>
          </div>

          <div className="side-results-panel">
            <div className="side-controls" style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginBottom: '0.25rem',
              background: 'rgba(15, 23, 42, 0.4)',
              padding: '0.75rem',
              borderRadius: '12px',
              border: '1px solid #4a5568'
            }}>
              <Tippy content="Transcription by Kraken" placement="top" delay={0} animation={false}>
                <button
                  className={`glow-btn-group transcribe-btn-new ${isTranscribing ? 'loading' : ''}`}
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget;
                    const fill = btn.querySelector('.glow-btn-fill');
                    if (!fill) return;
                    const rect = btn.getBoundingClientRect();
                    const fromTop = e.clientY < rect.top + rect.height / 2;
                    gsap.killTweensOf(fill);
                    gsap.fromTo(fill,
                      { y: fromTop ? '-100%' : '100%' },
                      { y: '0%', duration: 0.4, ease: "power3.out" }
                    );
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.currentTarget;
                    const fill = btn.querySelector('.glow-btn-fill');
                    if (!fill) return;
                    const rect = btn.getBoundingClientRect();
                    const toTop = e.clientY < rect.top + rect.height / 2;
                    gsap.killTweensOf(fill);
                    gsap.to(fill,
                      { y: toTop ? '-100%' : '100%', duration: 0.4, ease: "power3.out" }
                    );
                  }}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    gsap.timeline()
                      .to(btn, { scale: 0.95, duration: 0.1, ease: "power2.out" })
                      .to(btn, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.3)", clearProps: "scale" });
                    handleTranscribe();
                  }}
                  disabled={isTranscribing || isDetecting || isQwenTranscribing}
                  style={{ flex: 1, height: '38px', minWidth: 0, opacity: (isTranscribing || isDetecting || isQwenTranscribing) ? 0.9 : 1 }}
                >
                  <div className="glow-btn-fill"></div>
                  <div className="glow-btn-content" style={{ fontSize: '11px', padding: '0 8px', gap: '6px' }}>
                    {isTranscribing ? <div className="loading-spinner" /> : <span>✨</span>}
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 800 }}>{isTranscribing ? 'Kraken...' : 'Kraken'}</span>
                  </div>
                </button>
              </Tippy>

              <Tippy content="Transcription by Qwen" placement="top" delay={0} animation={false}>
                <button
                  className={`glow-btn-group transcribe-btn-new ${isQwenTranscribing ? 'loading' : ''}`}
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget;
                    const fill = btn.querySelector('.glow-btn-fill');
                    if (!fill) return;
                    const rect = btn.getBoundingClientRect();
                    const fromTop = e.clientY < rect.top + rect.height / 2;
                    gsap.killTweensOf(fill);
                    gsap.fromTo(fill,
                      { y: fromTop ? '-100%' : '100%' },
                      { y: '0%', duration: 0.4, ease: "power3.out" }
                    );
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.currentTarget;
                    const fill = btn.querySelector('.glow-btn-fill');
                    if (!fill) return;
                    const rect = btn.getBoundingClientRect();
                    const toTop = e.clientY < rect.top + rect.height / 2;
                    gsap.killTweensOf(fill);
                    gsap.to(fill,
                      { y: toTop ? '-100%' : '100%', duration: 0.4, ease: "power3.out" }
                    );
                  }}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    gsap.timeline()
                      .to(btn, { scale: 0.95, duration: 0.1, ease: "power2.out" })
                      .to(btn, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.3)", clearProps: "scale" });
                    handleQwenTranscribe();
                  }}
                  disabled={isTranscribing || isDetecting || isQwenTranscribing}
                  style={{ flex: 1, height: '38px', minWidth: 0, opacity: (isTranscribing || isDetecting || isQwenTranscribing) ? 0.9 : 1 }}
                >
                  <div className="glow-btn-fill" style={{ background: 'linear-gradient(90deg, #3b82f6, #2dd4bf)' }}></div>
                  <div className="glow-btn-content" style={{ fontSize: '11px', padding: '0 8px', gap: '6px' }}>
                    {isQwenTranscribing ? <div className="loading-spinner" /> : <span>🤖</span>}
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 800 }}>{isQwenTranscribing ? 'Qwen...' : 'Qwen'}</span>
                  </div>
                </button>
              </Tippy>

              <Tippy content="Detect plants" placement="top" delay={0} animation={false}>
                <button
                  className={`glow-btn-group detect-btn-new ${isDetecting ? 'loading' : ''}`}
                  onMouseEnter={(e) => {
                    const btn = e.currentTarget;
                    const fill = btn.querySelector('.glow-btn-fill');
                    if (!fill) return;
                    const rect = btn.getBoundingClientRect();
                    const fromTop = e.clientY < rect.top + rect.height / 2;
                    gsap.killTweensOf(fill);
                    gsap.fromTo(fill,
                      { y: fromTop ? '-100%' : '100%' },
                      { y: '0%', duration: 0.4, ease: "power3.out" }
                    );
                  }}
                  onMouseLeave={(e) => {
                    const btn = e.currentTarget;
                    const fill = btn.querySelector('.glow-btn-fill');
                    if (!fill) return;
                    const rect = btn.getBoundingClientRect();
                    const toTop = e.clientY < rect.top + rect.height / 2;
                    gsap.killTweensOf(fill);
                    gsap.to(fill,
                      { y: toTop ? '-100%' : '100%', duration: 0.4, ease: "power3.out" }
                    );
                  }}
                  onClick={(e) => {
                    const btn = e.currentTarget;
                    gsap.timeline()
                      .to(btn, { scale: 0.95, duration: 0.1, ease: "power2.out" })
                      .to(btn, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.3)", clearProps: "scale" });
                    handleDetectPlants();
                  }}
                  disabled={isTranscribing || isDetecting || isQwenTranscribing}
                  style={{ flex: 1, height: '38px', minWidth: 0, opacity: (isTranscribing || isDetecting || isQwenTranscribing) ? 0.9 : 1 }}
                >
                  <div className="glow-btn-fill"></div>
                  <div className="glow-btn-content" style={{ fontSize: '11px', padding: '0 8px', gap: '6px' }}>
                    {isDetecting ? <div className="loading-spinner" /> : <span>🌿</span>}
                    <span style={{ whiteSpace: 'nowrap', fontWeight: 800 }}>{isDetecting ? 'YOLO...' : 'YOLO'}</span>
                  </div>
                </button>
              </Tippy>
            </div>

            {(ocrResults.length > 0 || qwenResults.length > 0 || plantDetections.length > 0 || qwenThinking !== null || isQwenTranscribing) ? (
              <div className="side-results-container">
                {plantDetections.length > 0 && (
                  <div className="plant-results-list" style={{ padding: '0.8rem 1.25rem 1rem 1.25rem', borderBottom: (ocrResults.length > 0 || qwenResults.length > 0 || qwenThinking !== null || isQwenTranscribing) ? '1px solid #4a5568' : 'none' }}>
                    <h4 style={{ 
                      color: '#94a3b8', 
                      fontWeight: '700', 
                      fontSize: '0.9rem', 
                      letterSpacing: '0.08em',
                      margin: '0 0 0.8rem 0'
                    }}>Detected Plants</h4>
                    <div className="results-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                      {plantDetections.map((det, idx) => {
                        const plantColor = getPlantColor(det.label);
                        const isActive = highlightIndex === (ocrResults.length + idx);
                        return (
                        <span
                          key={idx}
                          className={`plant-tag ${isActive ? 'active' : ''}`}
                          onMouseEnter={() => setHighlightIndex(ocrResults.length + idx)}
                          onMouseLeave={() => setHighlightIndex(null)}
                          style={{ 
                            fontSize: '0.85rem',
                            backgroundColor: isActive ? `rgba(${plantColor}, 1)` : `rgba(${plantColor}, 0.15)`,
                            borderColor: `rgba(${plantColor}, 0.5)`,
                            color: isActive ? '#ffffff' : `rgb(${plantColor})`,
                            boxShadow: isActive ? `0 0 8px rgba(${plantColor}, 0.4)` : 'none',
                          }}
                        >
                          📍 {det.label} ({(det.confidence * 100).toFixed(1)}%)
                        </span>
                        );
                      })}
                    </div>                  </div>
                )}

                {(ocrResults.length > 0 || qwenResults.length > 0 || qwenThinking !== null || isQwenTranscribing) && (
                  <div className="transcription-results" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="transcription-shell" style={{ border: 'none', background: 'transparent', boxShadow: 'none', height: '100%' }}>
                      <div className="results-header" style={{ border: 'none', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ 
                          color: '#94a3b8', 
                          fontWeight: '700', 
                          fontSize: '0.95rem', 
                          letterSpacing: '0.08em', 
                          margin: '0.3rem 0 0 0.65rem' 
                        }}>{qwenThinking !== null ? 'Qwen AI Reasoning' : qwenResults.length > 0 ? 'Qwen Transcription' : 'Transcription'}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.65rem', marginTop: '0.3rem' }}>
                          <button
                            onClick={handleCopyTranscription}
                            disabled={ocrResults.length === 0 && qwenResults.length === 0}
                            className="osd-btn copy-transcription-btn"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              width: 'fit-content',
                              whiteSpace: 'nowrap',
                              background: isCopied ? 'rgba(16, 185, 129, 0.2)' : '#334155',
                              color: isCopied ? '#10b981' : '#e2e8f0',
                              border: `1px solid ${isCopied ? '#10b981' : '#475569'}`,
                              borderRadius: '6px',
                              cursor: (ocrResults.length === 0 && qwenResults.length === 0) ? 'not-allowed' : 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              opacity: (ocrResults.length === 0 && qwenResults.length === 0) ? 0.6 : 1,
                              letterSpacing: '0.5px'
                            }}
                            title="Copy all transcription to clipboard"
                          >
                            {isCopied ? (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleTranslate}
                            disabled={isTranslating || (ocrResults.length === 0 && qwenResults.length === 0)}
                            className="osd-btn translate-btn"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              background: '#334155',
                              color: '#e2e8f0',
                              border: '1px solid #475569',
                              borderRadius: '6px',
                              cursor: (isTranslating || (ocrResults.length === 0 && qwenResults.length === 0)) ? 'not-allowed' : 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              opacity: (isTranslating || (ocrResults.length === 0 && qwenResults.length === 0)) ? 0.6 : 1,
                              letterSpacing: '0.5px'
                            }}
                            title="Translate to English"
                          >
                            {isTranslating ? (
                              <>
                                <div className="btn-loader" style={{ width: '14px', height: '14px', margin: 0 }}></div>
                                <span>Translating...</span>
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 6 6"></path><path d="m4 14 6-6 2-3"></path><path d="M2 5h12"></path><path d="M7 2h1"></path><path d="m22 22-5-10-5 10"></path><path d="M14 18h6"></path></svg>
                                <span style={{ whiteSpace: 'nowrap' }}>Translate to English</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-display-panel" style={{ position: 'relative', flex: 1, overflow: 'auto' }}>
                        {qwenThinking !== null ? (
                          // Qwen is still thinking — show live reasoning stream
                          <div style={{
                            padding: '24px',
                            color: '#94a3b8',
                            whiteSpace: 'pre-wrap',
                            fontSize: '0.85rem',
                            lineHeight: 1.6,
                            fontFamily: 'monospace',
                            background: 'rgba(15, 23, 42, 0.3)',
                            minHeight: '100%'
                          }}>
                            <div style={{
                              marginBottom: '16px',
                              color: '#63b3ed',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '0.7rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em'
                            }}>
                              <div className="btn-loader" style={{
                                width: '12px',
                                height: '12px',
                                margin: 0,
                                border: '2px solid rgba(99, 179, 237, 0.2)',
                                borderTop: '2px solid #63b3ed'
                              }}></div>
                              Qwen AI Thinking...
                            </div>
                            {qwenThinking || "Waiting for reasoning process..."}
                          </div>
                        ) : qwenResults.length > 0 ? (
                          // Qwen finished — show plain text, no line boxes
                          <div style={{ width: 'max-content', minWidth: '100%', position: 'relative', padding: '10px 0' }}>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              style={{
                                outline: 'none',
                                color: '#e2e8f0',
                                whiteSpace: 'pre',
                                lineHeight: 1.6,
                                paddingLeft: '32px',
                                paddingRight: '48px',
                                minHeight: '100%',
                                cursor: 'text'
                              }}
                              onBlur={(e) => {
                                const lines = (e.currentTarget.textContent || '').split('\n');
                                setQwenResults(lines.map(l => l.trim()).filter(l => l.length > 0));
                              }}
                            >
                              {qwenResults.join('\n')}
                            </div>
                          </div>
                        ) : (
                          // Kraken OCR — show with line hover highlights
                          <div style={{ width: 'max-content', minWidth: '100%', position: 'relative', padding: '10px 0' }}>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              style={{
                                outline: 'none',
                                color: '#e2e8f0',
                                whiteSpace: 'pre',
                                lineHeight: 1.6,
                                paddingLeft: '32px',
                                paddingRight: '48px',
                                minHeight: '100%',
                                cursor: 'text'
                              }}
                              onMouseMove={(e) => {
                                const style = window.getComputedStyle(e.currentTarget);
                                const fontSize = parseFloat(style.fontSize) || 16;
                                const lineHeight = 1.6 * fontSize;
                                const idx = Math.floor(e.nativeEvent.offsetY / lineHeight);
                                if (idx >= 0 && idx < ocrResults.length) {
                                  if (highlightIndex !== idx) setHighlightIndex(idx);
                                } else {
                                  if (highlightIndex !== null) setHighlightIndex(null);
                                }
                              }}
                              onMouseLeave={() => setHighlightIndex(null)}
                              onBlur={(e) => {
                                const lines = (e.currentTarget.textContent || '').split('\n');
                                const newResults = lines.map((text, i) => {
                                  return ocrResults[i] ? { ...ocrResults[i], text } : { boundary: [], baseline: [], confidence: 1, text };
                                });
                                setOcrResults(newResults.slice(0, Math.max(ocrResults.length, lines.length)));
                              }}
                            >
                              {ocrResults.map((line) => line.text).join('\n')}
                            </div>

                            <div style={{ position: 'absolute', top: '12px', left: 0, bottom: '12px', width: '100%', pointerEvents: 'none' }}>
                              {ocrResults.map((line, idx) => (
                                <div
                                  key={idx}
                                  className={`text-line-overlay ${highlightIndex === idx ? 'highlighted' : ''}`}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    height: `${1.6}em`,
                                    pointerEvents: 'none',
                                    position: 'absolute',
                                    top: `${idx * 1.6}em`,
                                    left: 0,
                                    right: 0,
                                    padding: '0 8px',
                                    boxSizing: 'border-box'
                                  }}
                                >
                                  <span
                                    className="line-no"
                                    onMouseEnter={() => setHighlightIndex(idx)}
                                    onMouseLeave={() => setHighlightIndex(null)}
                                    style={{ pointerEvents: 'auto', userSelect: 'none', width: '24px', opacity: 0.7, fontSize: '0.85em', paddingTop: '0.15em' }}
                                  >
                                    {idx + 1}
                                  </span>

                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(line.text || '').then(() => {});
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; setHighlightIndex(idx); }}
                                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.3'; setHighlightIndex(null); }}
                                    title="Copy row"
                                    style={{
                                      pointerEvents: 'auto',
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '2px',
                                      color: '#e2e8f0',
                                      opacity: 0.3,
                                      transition: 'opacity 0.2s',
                                      userSelect: 'none',
                                      zIndex: 10
                                    }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {translatedText && (
                        <div className="translation-result" style={{
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          padding: '12px 16px',
                          background: 'rgba(15, 23, 42, 0.3)',
                          maxHeight: '40%',
                          overflow: 'auto',
                          color: '#54befb',
                          fontSize: '0.9rem',
                          lineHeight: 1.6
                        }}>
                          <h4 style={{ 
                            color: '#54befb', 
                            fontWeight: '700', 
                            fontSize: '0.85rem', 
                            letterSpacing: '0.08em', 
                            margin: '0 0 8px 0' 
                          }}>Translation</h4>
                          <div style={{ whiteSpace: 'pre-wrap' }}>
                            {translatedText}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="side-results-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                <div style={{ color: '#94a3b8' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem', opacity: 0.3 }}>
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <p style={{ fontSize: '0.9rem', margin: 0 }}>Analysis results will appear here after running AI models.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="ai-analysis-footer" style={{ marginTop: '1rem' }}>
        {ocrDebug && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            border: '1px solid rgba(71, 85, 105, 0.4)',
            borderRadius: '10px',
            background: 'rgba(11, 15, 25, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            color: '#e2e8f0',
            fontSize: '12px',
            lineHeight: 1.5
          }}>
            <strong style={{ display: 'block', marginBottom: '6px' }}>
              OCR Debug {ocrDebug.status && <span style={{ color: '#63b3ed', marginLeft: '4px' }}>[{ocrDebug.status}]</span>}
            </strong>
            <div><strong>Model Lang:</strong> {ocrDebug.lang || 'Unknown'}</div>
            {ocrDebug.textDirection && <div><strong>Text Direction:</strong> {ocrDebug.textDirection}</div>}
            {ocrDebug.segmentation && <div><strong>Segmentation:</strong> {ocrDebug.segmentation}</div>}
            {ocrDebug.processedWidth && <div><strong>Processed Image:</strong> {ocrDebug.processedWidth} x {ocrDebug.processedHeight}</div>}
            {ocrDebug.originalWidth && <div><strong>Original Page:</strong> {ocrDebug.originalWidth} x {ocrDebug.originalHeight}</div>}
            <div style={{ wordBreak: 'break-all' }}><strong>Requested URL:</strong> {ocrDebug.requestedUrl || currentOcrUrl}</div>
            {ocrDebug.rawOutput && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(71, 85, 105, 0.4)' }}>
                <strong>Raw Output:</strong>
                <pre style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  overflowY: 'auto', 
                  maxHeight: '150px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  marginTop: '6px',
                  fontSize: '11px'
                }}>
                  {ocrDebug.rawOutput}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
