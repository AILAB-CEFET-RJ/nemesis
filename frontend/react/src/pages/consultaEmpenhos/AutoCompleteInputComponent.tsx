type Suggestion = {
  best_match: string;
  score: number;
};

type AutocompleteInputProps = {
  label: string;
  value: string;
  setValue: (c: string) => void;
  handleChange: (val: string, type: number, key: string) => void;
  type: number;
  stateKey: string;
  suggestions: Suggestion[];
  setSuggestions: (s: Suggestion[]) => void;
  configured: boolean;
  setConfigured: (c: boolean) => void;
  placeholder: string;
  disabled: boolean;
};

export function AutocompleteInput({
  label,
  value,
  setValue,
  handleChange,
  type,
  stateKey,
  suggestions,
  setSuggestions,
  configured,
  setConfigured,
  placeholder,
  disabled,
}: AutocompleteInputProps) {
  return (
    <div className="mb-4">
      <label className="block mb-2">{label}:</label>
      <div className="relative">
        {!configured ? (  
          <input
            type="text"
            disabled={label === "Unidade" && !disabled}
            value={value}
            onChange={(e) => handleChange(e.target.value, type, stateKey)}
            placeholder={placeholder}
            className="w-full p-2 border border-gray-300 rounded"
          />
        ) : (
          <div className="w-full p-2 border border-gray-300 rounded flex items-center justify-between">
            <span>{value}</span>
            <button
              type="button"
              className="ml-2 text-gray-500 hover:text-red-600 font-bold"
              onClick={() => {
                setConfigured(false);
                handleChange("", type, stateKey); // limpa pelo handleChange também
                setSuggestions([]);
              }}
              aria-label="Limpar campo"
            >
              ×
            </button>
          </div>
        )}

        {suggestions.some((s) => s.score > 0.2) && (
          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 shadow-lg">
            {suggestions
              .slice(0, 5)
              .filter((s) => s.score > 0.2)
              .map((s, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    className="block w-full text-left px-3 py-2 hover:bg-blue-100"
                    onClick={() => {
                      setValue(s.best_match); // seta pelo handleChange
                      setSuggestions([]);
                      setConfigured(true);
                    }}
                  >
                    {s.best_match}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
