'use client';

import { useState, useRef, useCallback } from 'react';

interface SignalSubmission {
  type: 'text' | 'image';
  content?: string;
  base64Content?: string;
  fileName?: string;
  mimeType?: string;
}

interface SignalDropzoneProps {
  onSubmit: (submission: SignalSubmission) => void;
  isSubmitting: boolean;
}

export function SignalDropzone({ onSubmit, isSubmitting }: SignalDropzoneProps) {
  const [content, setContent] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<{ base64: string; name: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() && !isSubmitting) {
      onSubmit({ type: 'text', content: content.trim() });
    }
  };

  const handleImageSubmit = () => {
    if (imageFile && !isSubmitting) {
      onSubmit({
        type: 'image',
        base64Content: imageFile.base64,
        fileName: imageFile.name,
        mimeType: imageFile.type,
      });
    }
  };

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      // Extract base64 without the data URL prefix
      const base64 = dataUrl.split(',')[1];
      setImageFile({ base64, name: file.name, type: file.type });
      setContent(''); // Clear text when image is selected
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const clearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const exampleTexts = [
    'STINGRAY LIVE AT THE RIGGER THURSDAY 15TH MAY 8PM',
    'Jazz Night at The Blue Note - Friday 23rd May, doors 7pm, tickets £15',
  ];

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      {/* Image Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-amber-500 bg-amber-500/10'
            : imagePreview
            ? 'border-green-600 bg-green-900/20'
            : 'border-zinc-700 hover:border-zinc-600'
        }`}
      >
        {imagePreview ? (
          <div className="space-y-4">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-lg"
            />
            <div className="flex items-center justify-center gap-4">
              <span className="text-sm text-zinc-400">{imageFile?.name}</span>
              <button
                onClick={clearImage}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            </div>
            <button
              onClick={handleImageSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {isSubmitting ? 'Interpreting...' : 'Interpret Poster'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">🎵</div>
            <p className="text-zinc-300 font-medium">Drop a gig poster here</p>
            <p className="text-sm text-zinc-500">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300"
            >
              Choose file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 border-t border-zinc-800" />
        <span className="text-sm text-zinc-500">or paste text</span>
        <div className="flex-1 border-t border-zinc-800" />
      </div>

      {/* Text Input */}
      <form onSubmit={handleTextSubmit}>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (e.target.value) clearImage(); // Clear image when typing
          }}
          placeholder="Paste Facebook event text, poster text, or any event announcement..."
          className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
          disabled={isSubmitting}
        />

        <div className="flex items-center justify-between mt-4">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? 'Interpreting...' : 'Interpret Text'}
          </button>
          <span className="text-sm text-zinc-500">{content.length} characters</span>
        </div>
      </form>

      {/* Examples */}
      <div className="mt-6 pt-6 border-t border-zinc-800">
        <p className="text-sm text-zinc-500 mb-3">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {exampleTexts.map((text, i) => (
            <button
              key={i}
              onClick={() => { setContent(text); clearImage(); }}
              disabled={isSubmitting}
              className="text-sm px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Example {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
