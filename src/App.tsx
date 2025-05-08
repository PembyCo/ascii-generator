// App.tsx
import React, { useState, useReducer, useMemo, useCallback, useEffect, useRef } from "react";

// Define TypeScript interfaces
interface FormState {
  text: string;
  error: string | null;
}

interface FigletOptions {
  font: string;
  horizontalLayout: string;
  width: number;
  whitespaceBreak: boolean;
}

type FigletType = {
  text: (
    text: string, 
    options: FigletOptions, 
    callback: (err: Error | null, data?: string) => void
  ) => void;
  parseFont: (name: string, font: any) => void;
};

interface SpacingOptions {
  removeLineSpacing: boolean;
}

// Hooks and Reducers
const formReducer = (
  state: FormState,
  action: { type: string; payload?: string }
) => {
  switch (action.type) {
    case "UPDATE_TEXT":
      return { ...state, text: action.payload || "", error: null };
    case "SET_ERROR":
      return { ...state, error: action.payload || null };
    default:
      return state;
  }
};

const useClipboard = () => {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, []);
  return { copy, copied };
};

// UI Components
interface SpacingControlsProps {
  options: SpacingOptions;
  onChange: (newOptions: SpacingOptions) => void;
  highContrast: boolean;
  onHighContrastChange: (value: boolean) => void;
}

const SpacingControls: React.FC<SpacingControlsProps> = ({ options, onChange, highContrast, onHighContrastChange }) => (
  <div className="mt-4 space-y-2">
    <div className="flex items-center flex-wrap">
      <div className="flex items-center mr-4 mb-2">
        <input
          type="checkbox"
          id="remove-spacing"
          checked={options.removeLineSpacing}
          onChange={(e) => onChange({ ...options, removeLineSpacing: e.target.checked })}
          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mr-2"
        />
        <label htmlFor="remove-spacing" className="text-gray-700 text-sm">
          Remove spacing between lines
        </label>
      </div>
      
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          id="high-contrast"
          checked={highContrast}
          onChange={(e) => onHighContrastChange(e.target.checked)}
          className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mr-2"
        />
        <label htmlFor="high-contrast" className="text-gray-700 text-sm">
          High contrast mode
        </label>
      </div>
    </div>
  </div>
);

const InputForm: React.FC<{
  onGenerate: (text: string) => void;
  state: FormState;
  dispatch: React.Dispatch<{ type: string; payload?: string }>;
  spacingOptions: SpacingOptions;
  onSpacingChange: (newOptions: SpacingOptions) => void;
  highContrast: boolean;
  onHighContrastChange: (value: boolean) => void;
}> = ({ onGenerate, state, dispatch, spacingOptions, onSpacingChange, highContrast, onHighContrastChange }) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      if (!state.text.trim()) {
        dispatch({ type: "SET_ERROR", payload: "Please enter some text" });
        return;
      }
      if (state.text.length > 200) {
        dispatch({
          type: "SET_ERROR",
          payload: "Text must be 200 characters or less",
        });
        return;
      }
      onGenerate(state.text);
    }}
    className="space-y-4"
  >
    <div>
      <label
        htmlFor="textInput"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Enter Your Text
      </label>
      <textarea
        id="textInput"
        value={state.text}
        onChange={(e) =>
          dispatch({ type: "UPDATE_TEXT", payload: e.target.value })
        }
        placeholder="Enter text (max 200 chars)"
        maxLength={200}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        aria-describedby={state.error ? "text-error" : undefined}
      />
      {state.error && (
        <p id="text-error" className="mt-1 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </div>
    
    <SpacingControls 
      options={spacingOptions} 
      onChange={onSpacingChange}
      highContrast={highContrast}
      onHighContrastChange={onHighContrastChange}
    />
    
    <button
      type="submit"
      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
    >
      Generate ASCII Art
    </button>
  </form>
);

const OutputDisplay: React.FC<{ 
  ascii: string | null;
  highContrast: boolean;
  spacingOptions: SpacingOptions;
}> = ({ ascii, highContrast, spacingOptions }) => {
  const { copy, copied } = useClipboard();
  
  const processedAscii = useMemo(() => {
    if (!ascii) return null;
    
    let processed = ascii;
    
    if (spacingOptions.removeLineSpacing) {
      processed = processed.replace(/\n\n/g, '\n');
    }
    
    return processed;
  }, [ascii, spacingOptions]);

  return (
    <div className="mt-4 sm:mt-6">
      <div className="relative">
        <pre
          className="p-3 sm:p-4 bg-gray-100 rounded-md overflow-x-auto text-sm font-mono min-h-[150px] sm:min-h-[200px] whitespace-pre-wrap break-words"
          aria-label="ASCII Art Output"
          style={highContrast ? { backgroundColor: "#000", color: "#fff" } : {}}
        >
          {processedAscii || "Your ASCII art will appear here..."}
        </pre>
        {ascii && (
          <div className="absolute top-2 right-2 flex space-x-1 sm:space-x-2 fixed-top-right">
            <button
              onClick={() => copy(processedAscii || '')}
              className="px-2 sm:px-3 py-1 bg-gray-200 text-gray-700 text-xs sm:text-sm rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
              aria-label="Copy to clipboard"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => {
                const blob = new Blob([processedAscii || ''], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'ascii-art.txt';
                link.href = url;
                link.click();
              }}
              className="px-2 sm:px-3 py-1 bg-gray-200 text-gray-700 text-xs sm:text-sm rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
              aria-label="Download ASCII art as text file"
            >
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  // State management
  const [state, dispatch] = useReducer(formReducer, { text: "", error: null });
  const [ascii, setAscii] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [spacingOptions, setSpacingOptions] = useState<SpacingOptions>({
    removeLineSpacing: false
  });
  const asciiCache = useRef<Map<string, string>>(new Map());
  const figletRef = useRef<FigletType | null>(null);
  const [fontLoaded, setFontLoaded] = useState(false);
  const [width, setWidth] = useState(80);
  const [horizontalLayout, setHorizontalLayout] = useState("default");
  const [whitespaceBreak, setWhitespaceBreak] = useState(true);

  // ASCII generation function
  const generateAscii = useCallback(async (text: string) => {
    if (!fontLoaded || !figletRef.current) {
      console.log("Font not loaded yet");
      return;
    }
    
    setLoading(true);
    
    // Create a cache key
    const cacheKey = `${text}-${horizontalLayout}-${width}-${whitespaceBreak}`;
    
    // Check if result is cached
    if (asciiCache.current.has(cacheKey)) {
      console.log("Using cached result");
      setAscii(asciiCache.current.get(cacheKey) || null);
      setLoading(false);
      return;
    }
    
    try {
      const figlet = figletRef.current;
      
      // Process each line separately for multi-line text
      const lines = text.split('\n');
      let result = '';
      
      // Process each line
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') {
          result += '\n\n'; // Add extra line break for empty lines
          continue;
        }
        
        // Use a promise-based approach to handle each line
        const lineResult = await new Promise<string>((resolve, reject) => {
          figlet.text(
            line,
            { 
              font: 'Standard',
              horizontalLayout: horizontalLayout,
              width: width,
              whitespaceBreak: whitespaceBreak
            },
            (err: Error | null, data?: string) => {
              if (err) {
                console.error("Figlet error:", err);
                reject(err);
                return;
              }
              resolve(data || '');
            }
          );
        });
        
        result += lineResult;
        if (i < lines.length - 1) {
          result += '\n\n'; // Add line breaks between ASCII art lines
        }
      }
      
      // Cache the result
      asciiCache.current.set(cacheKey, result);
      setAscii(result);
      setLoading(false);
      
    } catch (err) {
      console.error("ASCII generation failed:", err);
      dispatch({ type: "SET_ERROR", payload: "Failed to generate ASCII art" });
      setLoading(false);
    }
  }, [fontLoaded, horizontalLayout, width, whitespaceBreak]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+G to generate
      if (e.altKey && e.key === 'g') {
        const generateButton = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
        if (generateButton) generateButton.click();
      }
      
      // Alt+C to copy
      if (e.altKey && e.key === 'c') {
        const copyButton = document.querySelector('button[aria-label="Copy to clipboard"]') as HTMLButtonElement | null;
        if (copyButton) copyButton.click();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Font preloading
  useEffect(() => {
    const preloadFont = async () => {
      try {
        // Import figlet
        const figletModule = await import("https://cdn.skypack.dev/figlet") as any;
        const figlet = figletModule.default;
        
        // Import the Standard font
        const standardFontModule = await import("https://cdn.skypack.dev/figlet/importable-fonts/Standard.js") as any;
        const standardFont = standardFontModule.default;
        
        // Parse the font
        figlet.parseFont('Standard', standardFont);
        
        // Store the figlet reference
        figletRef.current = figlet;
        setFontLoaded(true);
      } catch (err) {
        console.error("Font preloading failed:", err);
      }
    };
    
    preloadFont();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start pt-8 sm:pt-12 px-2 py-4 sm:p-4 container-fluid">
      <h1 className="text-2xl sm:text-4xl font-bold text-indigo-600 mb-4 text-center tracking-wide">
        Text<span className="text-gray-800">2</span>ASCII <span className="text-indigo-400">Generator</span>
      </h1>
      
      <div className="w-full max-w-3xl bg-indigo-50 border border-indigo-100 rounded-md p-3 sm:p-4 mb-6 text-center">
        <p className="text-sm sm:text-base text-indigo-700">
          Enter your text below, customize the options if needed, and press Generate to create your ASCII art. 
          Use Alt+G to generate quickly or Alt+C to copy the result.
        </p>
      </div>
      
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-3 sm:p-6 mb-12">
        <div>
          <InputForm
            onGenerate={generateAscii}
            state={state}
            dispatch={dispatch}
            spacingOptions={spacingOptions}
            onSpacingChange={setSpacingOptions}
            highContrast={highContrast}
            onHighContrastChange={setHighContrast}
          />
        </div>
        
        {loading ? (
          <div className="mt-4 sm:mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-sm sm:text-base text-gray-600">Generating...</p>
          </div>
        ) : (
          <OutputDisplay 
            ascii={ascii} 
            highContrast={highContrast} 
            spacingOptions={spacingOptions}
          />
        )}
      </div>
    </div>
  );
};

export default App;
