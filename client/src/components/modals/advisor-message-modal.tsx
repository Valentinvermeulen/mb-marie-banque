import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Send, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdvisorMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
}

export default function AdvisorMessageModal({ open, onOpenChange, clients }: AdvisorMessageModalProps) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [amount, setAmount] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/notifications", {
        userId: selectedClientId,
        title: messageTitle,
        message: messageContent,
        type: messageType,
        amount: amount || undefined
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message envoyé",
        description: "Le message a été envoyé avec succès au client",
      });
      handleClose();
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setSelectedClientId("");
    setMessageTitle("");
    setMessageContent("");
    setMessageType("info");
    setAmount("");
    onOpenChange(false);
  };

  const handleSend = () => {
    if (!selectedClientId || !messageTitle || !messageContent) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="h-4 w-4 text-orange-400" />;
      case "success": return <CheckCircle className="h-4 w-4 text-green-400" />;
      default: return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md animate-slide-up">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-white">
            Envoyer un message client
            <Button
              size="icon"
              variant="ghost"
              onClick={handleClose}
              className="h-8 w-8 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sélection du client */}
          <div>
            <Label htmlFor="client" className="text-white">Client destinataire</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id} className="text-white focus:bg-gray-700">
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type de message */}
          <div>
            <Label htmlFor="type" className="text-white">Type de message</Label>
            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="info" className="text-white focus:bg-gray-700">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-400" />
                    Information
                  </div>
                </SelectItem>
                <SelectItem value="warning" className="text-white focus:bg-gray-700">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400" />
                    Avertissement
                  </div>
                </SelectItem>
                <SelectItem value="success" className="text-white focus:bg-gray-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    Succès
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Titre du message */}
          <div>
            <Label htmlFor="title" className="text-white">Titre du message</Label>
            <Input
              id="title"
              value={messageTitle}
              onChange={(e) => setMessageTitle(e.target.value)}
              placeholder="Titre du message"
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>

          {/* Montant (optionnel) */}
          <div>
            <Label htmlFor="amount" className="text-white">Montant <span className="text-gray-400">(optionnel)</span></Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Montant en euros"
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>

          {/* Contenu du message */}
          <div>
            <Label htmlFor="content" className="text-white">Message</Label>
            <Textarea
              id="content"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Votre message au client..."
              rows={4}
              className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>

          {/* Aperçu du message */}
          {messageTitle && messageContent && (
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-3">
              <p className="text-xs text-white/60 mb-2">Aperçu du message :</p>
              <div className="flex items-start gap-3">
                {getTypeIcon(messageType)}
                <div>
                  <h4 className="font-bold text-white text-sm">{messageTitle}</h4>
                  <p className="text-white/80 text-xs mt-1">{messageContent}</p>
                  {amount && (
                    <p className="text-blue-400 text-xs mt-1 font-medium">{parseFloat(amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-600 text-white hover:bg-gray-800"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendMessageMutation.isPending || !selectedClientId || !messageTitle || !messageContent}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sendMessageMutation.isPending ? "Envoi..." : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}