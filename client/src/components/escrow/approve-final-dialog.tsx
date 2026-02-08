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
import { CheckCircle, RefreshCw, Info, DollarSign, AlertTriangle, CreditCard } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

interface ApproveFinalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: number;
    listingTitle: string;
    providerName: string;
    amountDepositCents?: number;
    amountFinalCents?: number;
    amountDeltaCents?: number;
    finalProposalNote?: string;
    homeownerPmSaved?: boolean;
  } | null;
}

function ApproveFinalForm({ booking, onSuccess, onCancel }: {
  booking: ApproveFinalDialogProps['booking'];
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [agree, setAgree] = useState(false);
  const [cardholderName, setCardholderName] = useState("");

  if (!booking) return null;

  const delta = booking.amountDeltaCents || 0;
  const needsPayment = delta > 0 && !booking.homeownerPmSaved;

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("No booking selected");

      let paymentMethodId: string | undefined;

      if (needsPayment) {
        if (!stripe || !elements) {
          throw new Error("Stripe not initialized");
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error("Card element not found");
        }

        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: {
            name: cardholderName,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        paymentMethodId = paymentMethod!.id;
      }

      const response = await apiRequest("POST", `/api/escrow/${booking.id}/approve-final`, {
        agree: true,
        payment_method_id: paymentMethodId,
      });

      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === "/api/bookings"
      });
      
      toast({
        title: "Final Amount Approved!",
        description: delta > 0
          ? `Additional charge of $${(delta / 100).toLocaleString()} processed successfully.`
          : delta < 0
          ? `Refund of $${(Math.abs(delta) / 100).toLocaleString()} processed successfully.`
          : "Final amount approved. Ready for settlement.",
      });
      
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: error.message || "Failed to approve final amount",
      });
    },
  });

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="w-4 h-4" />
        <AlertDescription>
          <div className="space-y-1">
            <p className="font-medium text-foreground">Project: {booking.listingTitle}</p>
            <p className="text-sm">Provider: {booking.providerName}</p>
            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
              <p className="text-sm">Deposit Paid: ${((booking.amountDepositCents || 0) / 100).toLocaleString()}</p>
              <p className="text-lg font-bold text-foreground mt-1">
                Final Amount: ${((booking.amountFinalCents || 0) / 100).toLocaleString()}
              </p>
              {delta !== 0 && (
                <p className={`text-sm mt-1 ${delta > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                  {delta > 0 ? 'Additional charge' : 'Refund'}: ${(Math.abs(delta) / 100).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {booking.finalProposalNote && (
        <Alert>
          <DollarSign className="w-4 h-4" />
          <AlertDescription>
            <p className="font-medium mb-1">Provider's Note:</p>
            <p className="text-sm">{booking.finalProposalNote}</p>
          </AlertDescription>
        </Alert>
      )}

      {delta > 0 && !booking.homeownerPmSaved && (
        <Alert variant="default" className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <AlertDescription className="text-orange-900 dark:text-orange-100">
            <p className="font-medium">Additional Payment Required</p>
            <p className="text-sm mt-1">
              The final amount is ${(Math.abs(delta) / 100).toLocaleString()} more than your deposit. Please provide payment details below.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {needsPayment && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="cardholder-name-approve">Cardholder Name</Label>
            <Input
              id="cardholder-name-approve"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="John Doe"
              data-testid="input-cardholder-name-approve"
            />
          </div>

          <div>
            <Label>Card Details</Label>
            <div className="border rounded-md p-3 bg-background">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: 'hsl(var(--foreground))',
                      '::placeholder': {
                        color: 'hsl(var(--muted-foreground))',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start space-x-2 pt-2">
        <Checkbox
          id="agree-final"
          checked={agree}
          onCheckedChange={(checked) => setAgree(checked as boolean)}
          data-testid="checkbox-agree-final"
        />
        <Label htmlFor="agree-final" className="text-sm cursor-pointer leading-relaxed">
          I approve the final amount of ${((booking.amountFinalCents || 0) / 100).toLocaleString()} and authorize payment
          {delta > 0 && ' of the additional amount'}
          {delta < 0 && ' and refund processing'}.
        </Label>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={approveMutation.isPending}
          data-testid="button-cancel-approve"
        >
          Cancel
        </Button>
        <Button
          className="bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,45%)] text-white"
          onClick={() => approveMutation.mutate()}
          disabled={approveMutation.isPending || !agree || (needsPayment && !cardholderName)}
          data-testid="button-approve-final"
        >
          {approveMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              {delta > 0 ? `Approve & Pay $${(Math.abs(delta) / 100).toLocaleString()}` : 'Approve Final Amount'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function ApproveFinalDialog({ open, onOpenChange, booking }: ApproveFinalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Approve Final Amount</DialogTitle>
        </DialogHeader>
        <Elements stripe={stripePromise}>
          <ApproveFinalForm
            booking={booking}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
