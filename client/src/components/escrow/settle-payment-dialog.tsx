import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowRight, RefreshCw, Info, DollarSign, AlertTriangle } from "lucide-react";

interface SettlePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: number;
    listingTitle: string;
    providerName: string;
    amountFundedCents?: number;
  } | null;
  userRole: "admin" | "homeowner";
}

export function SettlePaymentDialog({ open, onOpenChange, booking, userRole }: SettlePaymentDialogProps) {
  const { toast } = useToast();
  const [retainagePercent, setRetainagePercent] = useState("0");
  const [confirmSettle, setConfirmSettle] = useState(false);

  const settleMutation = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("No booking selected");
      
      const retainageBps = Math.round(parseFloat(retainagePercent) * 100);
      if (isNaN(retainageBps) || retainageBps < 0 || retainageBps > 10000) {
        throw new Error("Invalid retainage percentage");
      }

      const response = await apiRequest("POST", `/api/escrow/${booking.id}/settle`, {
        retainage_bps: retainageBps,
      });

      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === "/api/bookings"
      });
      
      const retainageHeld = data.retainageHeld || 0;
      
      toast({
        title: "Payment Settled!",
        description: retainageHeld > 0
          ? `$${(data.payoutAmount / 100).toLocaleString()} transferred to provider. $${(retainageHeld / 100).toLocaleString()} held in retainage.`
          : `$${(data.payoutAmount / 100).toLocaleString()} transferred to provider.`,
      });
      
      setRetainagePercent("0");
      setConfirmSettle(false);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Settlement Failed",
        description: error.message || "Failed to settle payment",
      });
    },
  });

  if (!booking) return null;

  const fundedAmount = booking.amountFundedCents || 0;
  const platformFee = Math.round(fundedAmount * 5 / 100);
  const retainageBps = parseFloat(retainagePercent) * 100 || 0;
  const retainageAmount = Math.round(fundedAmount * retainageBps / 10000);
  const payoutAmount = fundedAmount - platformFee - retainageAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settle Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Info className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium text-foreground">Project: {booking.listingTitle}</p>
                <p className="text-sm">Provider: {booking.providerName}</p>
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-lg font-bold text-foreground">
                    Total Funded: ${(fundedAmount / 100).toLocaleString()}
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <Alert>
            <DollarSign className="w-4 h-4" />
            <AlertDescription>
              <p className="font-medium mb-2">Payment Breakdown:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Funded:</span>
                  <span className="font-medium">${(fundedAmount / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-orange-600 dark:text-orange-400">
                  <span>Platform Fee (5%):</span>
                  <span>-${(platformFee / 100).toLocaleString()}</span>
                </div>
                {retainageAmount > 0 && (
                  <div className="flex justify-between text-orange-600 dark:text-orange-400">
                    <span>Retainage ({retainagePercent}%):</span>
                    <span>-${(retainageAmount / 100).toLocaleString()}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border flex justify-between font-bold text-base">
                  <span>Provider Payout:</span>
                  <span className="text-green-600 dark:text-green-400">${(payoutAmount / 100).toLocaleString()}</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="retainage-percent">Retainage Holdback (%) - Optional</Label>
            <Input
              id="retainage-percent"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={retainagePercent}
              onChange={(e) => setRetainagePercent(e.target.value)}
              placeholder="0"
              data-testid="input-retainage-percent"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optionally hold back a percentage for warranty/quality assurance. Can be released later.
            </p>
          </div>

          {retainageAmount > 0 && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                ${(retainageAmount / 100).toLocaleString()} will be held back. You'll need to manually release it later when satisfied with the work.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="confirm-settle"
              checked={confirmSettle}
              onCheckedChange={(checked) => setConfirmSettle(checked as boolean)}
              data-testid="checkbox-confirm-settle"
            />
            <Label htmlFor="confirm-settle" className="text-sm cursor-pointer leading-relaxed">
              I confirm the work is complete and authorize payment of ${(payoutAmount / 100).toLocaleString()} to the provider.
            </Label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setRetainagePercent("0");
                setConfirmSettle(false);
                onOpenChange(false);
              }}
              disabled={settleMutation.isPending}
              data-testid="button-cancel-settle"
            >
              Cancel
            </Button>
            <Button
              className="bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,45%)] text-white"
              onClick={() => settleMutation.mutate()}
              disabled={settleMutation.isPending || !confirmSettle}
              data-testid="button-confirm-settle"
            >
              {settleMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Settling...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Settle Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
