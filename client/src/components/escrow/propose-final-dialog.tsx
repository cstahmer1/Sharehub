import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DollarSign, RefreshCw, Info, AlertTriangle } from "lucide-react";

interface ProposeFinalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: number;
    listingTitle: string;
    ownerName: string;
    amountDepositCents?: number;
    amountBudgetedCents?: number;
  } | null;
}

export function ProposeFinalDialog({ open, onOpenChange, booking }: ProposeFinalDialogProps) {
  const { toast } = useToast();
  const [finalAmount, setFinalAmount] = useState("");
  const [note, setNote] = useState("");

  const proposeMutation = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("No booking selected");
      
      const finalCents = Math.round(parseFloat(finalAmount) * 100);
      if (isNaN(finalCents) || finalCents <= 0) {
        throw new Error("Invalid amount");
      }

      const response = await apiRequest("POST", `/api/escrow/${booking.id}/propose-final`, {
        final_cents: finalCents,
        note: note || undefined,
      });

      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === "/api/bookings"
      });
      
      const delta = data.delta || 0;
      const deltaDisplay = Math.abs(delta / 100).toLocaleString();
      
      toast({
        title: "Final Amount Proposed",
        description: delta > 0 
          ? `You've proposed $${deltaDisplay} more than the deposit. Awaiting homeowner approval.`
          : delta < 0
          ? `You've proposed $${deltaDisplay} less than the deposit. Awaiting homeowner approval.`
          : "Final amount matches deposit. Awaiting homeowner approval.",
      });
      
      setFinalAmount("");
      setNote("");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Failed to Propose Final Amount",
        description: error.message || "An error occurred while proposing the final amount",
      });
    },
  });

  if (!booking) return null;

  const depositAmount = booking.amountDepositCents || 0;
  const budgetedAmount = booking.amountBudgetedCents || 0;
  const finalCents = parseFloat(finalAmount) * 100 || 0;
  const delta = finalCents - depositAmount;
  const maxAllowed = Math.round(depositAmount * 1.25);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Propose Final Amount</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Info className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Project: {booking.listingTitle}</p>
                <p className="text-sm">Client: {booking.ownerName}</p>
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-sm">Original Budget: ${(budgetedAmount / 100).toLocaleString()}</p>
                  <p className="text-sm font-medium">Deposit Paid: ${(depositAmount / 100).toLocaleString()}</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="final-amount">Final Amount ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="final-amount"
                type="number"
                min="0"
                step="0.01"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                placeholder="0.00"
                className="pl-9"
                data-testid="input-final-amount"
              />
            </div>
            {finalCents > 0 && (
              <p className={`text-sm mt-1 ${delta > 0 ? 'text-orange-600 dark:text-orange-400' : delta < 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                {delta > 0 && `Additional charge: $${(delta / 100).toLocaleString()}`}
                {delta < 0 && `Refund to client: $${(Math.abs(delta) / 100).toLocaleString()}`}
                {delta === 0 && 'Matches deposit amount'}
              </p>
            )}
          </div>

          {finalCents > maxAllowed && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Final amount cannot exceed 25% over deposit (${(maxAllowed / 100).toLocaleString()}). Contact admin for approval of larger increases.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label htmlFor="proposal-note">Explanation (Optional)</Label>
            <Textarea
              id="proposal-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain any changes from the original estimate..."
              rows={3}
              data-testid="textarea-proposal-note"
            />
            <p className="text-xs text-muted-foreground mt-1">
              If the final amount differs from the deposit, explain why to the homeowner.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setFinalAmount("");
                setNote("");
                onOpenChange(false);
              }}
              disabled={proposeMutation.isPending}
              data-testid="button-cancel-proposal"
            >
              Cancel
            </Button>
            <Button
              className="bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,45%)] text-white"
              onClick={() => proposeMutation.mutate()}
              disabled={proposeMutation.isPending || !finalAmount || finalCents <= 0 || finalCents > maxAllowed}
              data-testid="button-submit-proposal"
            >
              {proposeMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Proposal"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
