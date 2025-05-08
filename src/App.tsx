// App.tsx
import React, { useState, useReducer, useMemo, useCallback } from "react";

const formReducer = (
  state: { text: string; error: string | null },
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

const InputForm: React.FC<{
  onGenerate: (text: string) => void;
  state: { text: string; error: string | null };
  dispatch: React.Dispatch<{ type: string; payload?: string }>;
}> = ({ onGenerate, state, dispatch }) => (
  <form
    onSubmit={(e) => {
      e.preventDefault();
      if (!state.text.trim()) {
        dispatch({ type: "SET_ERROR", payload: "Please enter some text" });
        return;
      }
      if (state.text.length > 50) {
        dispatch({
          type: "SET_ERROR",
          payload: "Text must be 50 characters or less",
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
      <input
        id="textInput"
        type="text"
        value={state.text}
        onChange={(e) =>
          dispatch({ type: "UPDATE_TEXT", payload: e.target.value })
        }
        placeholder="Enter text (max 50 chars)"
        maxLength={50}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        aria-describedby={state.error ? "text-error" : undefined}
      />
      {state.error && (
        <p id="text-error" className="mt-1 text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </div>
    <button
      type="submit"
      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
    >
      Generate ASCII Art
    </button>
  </form>
);

const OutputDisplay: React.FC<{ ascii: string | null }> = ({ ascii }) => {
  const { copy, copied } = useClipboard();

  return (
    <div className="mt-6">
      <div className="relative">
        <pre
          className="p-4 bg-gray-100 rounded-md overflow-x-auto text-sm font-mono min-h-[100px] whitespace-pre-wrap break-words"
          aria-label="ASCII Art Output"
        >
          {ascii || "Your ASCII art will appear here..."}
        </pre>
        {ascii && (
          <button
            onClick={() => copy(ascii)}
            className="absolute top-2 right-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200"
            aria-label="Copy to clipboard"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(formReducer, { text: "", error: null });
  const [ascii, setAscii] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generateAscii = useCallback(async (text: string) => {
    setLoading(true);
    try {
      // Step 1: Import figlet
      const figletModule = await import("https://cdn.skypack.dev/figlet") as any;
      const figlet = figletModule.default;
      
      // Step 2: Import the Standard font
      const standardFontModule = await import("https://cdn.skypack.dev/figlet/importable-fonts/Standard.js") as any;
      const standardFont = standardFontModule.default;
      
      // Step 3: Parse the font
      figlet.parseFont('Standard', standardFont);
      
      // Step 4: Generate the ASCII art
      figlet.text(
        text,
        { font: 'Standard' },
        (err: Error | null, data?: string) => {
          if (err) {
            console.error("Figlet error:", err);
            throw err;
          }
          setAscii(data || null);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error("ASCII generation failed:", err);
      dispatch({ type: "SET_ERROR", payload: "Failed to generate ASCII art" });
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          ASCII Signature Generator
        </h1>
        <InputForm
          onGenerate={generateAscii}
          state={state}
          dispatch={dispatch}
        />
        {loading ? (
          <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Generating...</p>
          </div>
        ) : (
          <OutputDisplay ascii={ascii} />
        )}
      </div>
    </div>
  );
};

export default App;
