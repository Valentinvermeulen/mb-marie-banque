import { Button } from "./button";

interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

export default function NumericKeypad({ onKeyPress, onBackspace, disabled = false }: NumericKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "⌫"].map((key, index) => {
        if (key === null) return <div key={`empty-${index}`} />;
        
        if (key === "⌫") {
          return (
            <Button
              key="backspace"
              variant="ghost"
              onClick={onBackspace}
              disabled={disabled}
              className="h-14 text-2xl font-bold text-white bg-black/80 backdrop-blur-sm rounded-xl hover:bg-black/90 active:bg-black transition-colors active:scale-95 border border-white/30"
            >
              ⌫
            </Button>
          );
        }

        return (
          <Button
            key={`key-${key}`}
            variant="ghost"
            onClick={() => onKeyPress(key.toString())}
            disabled={disabled}
            className="h-14 text-2xl font-bold text-white bg-black/80 backdrop-blur-sm rounded-xl hover:bg-black/90 active:bg-black transition-colors active:scale-95 border border-white/30"
          >
            {key}
          </Button>
        );
      })}
    </div>
  );
}