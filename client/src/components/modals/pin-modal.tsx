import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
// NumericKeypad removed - using inline implementation
import { useToast } from "@/hooks/use-toast";

interface PinModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onSuccess: (pin?: string) => void;
  userId: string;
}

export default function PinModal({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  onSuccess,
  userId 
}: PinModalProps) {
  const [pin, setPin] = useState("");
  const { toast } = useToast();

  const verifyPinMutation = useMutation({
    mutationFn: async (pinData: { pin: string; userId: string }) => {
      const response = await apiRequest("POST", "/api/auth/verify-pin", pinData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Code validé",
        description: "Votre code PIN est correct",
      });
      onSuccess(pin);
      setPin("");
    },
    onError: () => {
      toast({
        title: "Code incorrect",
        description: "Le code PIN saisi est incorrect",
        variant: "destructive",
      });
      setPin("");
    },
  });

  const handleKeyPress = (key: string) => {
    if (pin.length < 6) {
      setPin(pin + key);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const handleValidate = () => {
    if (pin.length === 6) {
      verifyPinMutation.mutate({ pin, userId });
    }
  };

  const handleClose = () => {
    setPin("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[var(--cic-teal)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-[var(--cic-teal)] text-xl" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-white/70">{description}</p>
        </div>

        {/* PIN Input Display */}
        <div className="flex justify-center space-x-3 mb-8">
          {Array(6).fill(0).map((_, index) => (
            <div
              key={index}
              className={`w-12 h-12 border-2 rounded-xl flex items-center justify-center ${
                index < pin.length 
                  ? "border-[var(--cic-teal)] bg-[var(--cic-teal)]/5" 
                  : "border-gray-200"
              }`}
            >
              {index < pin.length && (
                <span className="text-2xl font-bold text-white">•</span>
              )}
            </div>
          ))}
        </div>

        {/* Numeric Keypad */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "⌫"].map((key, index) => {
              if (key === null) return <div key={`empty-${index}`} />;
              
              if (key === "⌫") {
                return (
                  <Button
                    key="backspace"
                    variant="ghost"
                    onClick={handleBackspace}
                    className="h-14 text-2xl font-bold text-white bg-white/10 rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors active:scale-95 border border-white/20 backdrop-blur-sm"
                  >
                    ⌫
                  </Button>
                );
              }

              return (
                <Button
                  key={`key-${key}`}
                  variant="ghost"
                  onClick={() => handleKeyPress(key.toString())}
                  className="h-14 text-2xl font-bold text-white bg-white/10 rounded-xl hover:bg-white/20 active:bg-white/30 transition-colors active:scale-95 border border-white/20 backdrop-blur-sm"
                >
                  {key}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1 py-3 border-white/20 text-white hover:bg-white/10"
          >
            Annuler
          </Button>
          <Button
            onClick={handleValidate}
            disabled={pin.length !== 6 || verifyPinMutation.isPending}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {verifyPinMutation.isPending ? "Vérification..." : "Valider"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
