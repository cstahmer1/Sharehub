import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Shield, CreditCard, RefreshCw, Info } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

interface DepositPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: number;
    listingTitle: string;
    ownerName: string;
    startAt: string;
    totalCents: number;
  } | null;
  depositPercentage?: number;
}

function DepositPaymentForm({ booking, depositPercentage = 10, onSuccess, onCancel }: {
  booking: DepositPaymentDialogProps['booking'];
  depositPercentage: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [savePaymentMethod, setSavePaymentMethod] = useState(true);
  const [cardholderName, setCardholderName] = useState("");

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!stripe || !elements || !booking) {
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

      const response = await apiRequest("POST", `/api/escrow/${booking.id}/deposit`, {
        payment_method_id: paymentMethod!.id,
        save_pm: savePaymentMethod,
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) =>
          Array.isArray(query.queryKey) && query.queryKey[0] === "/api/bookings"
      });
      toast({
        title: "Deposit Paid Successfully!",
        description: "Your deposit has been processed and the project is now funded.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Failed to process deposit payment",
      });
    },
  });

  if (!booking) return null;

  const depositAmount = Math.round(booking.totalCents * (depositPercentage / 100));

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <Info className="w-4 h-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Booking Details:</p>
            <p className="text-sm"><strong>Project:</strong> {booking.listingTitle}</p>
            <p className="text-sm"><strong>Owner:</strong> {booking.ownerName}</p>
            <p className="text-sm"><strong>Date:</strong> {new Date(booking.startAt).toLocaleDateString()}</p>
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground">Budgeted Amount: ${(booking.totalCents / 100).toLocaleString()}</p>
              <p className="text-lg font-bold text-foreground mt-1">
                Deposit ({depositPercentage}%): ${(depositAmount / 100).toLocaleString()}
              </p>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <Alert>
        <Shield className="w-4 h-4" />
        <AlertDescription>
          Your payment is processed securely via Stripe. The deposit is held in escrow until the provider proposes a final amount and you approve it.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <div>
          <Label htmlFor="cardholder-name">Cardholder Name</Label>
          <Input
            id="cardholder-name"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="John Doe"
            data-testid="input-cardholder-name"
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

        <div className="flex items-center space-x-2">
          <Checkbox
            id="save-payment"
            checked={savePaymentMethod}
            onCheckedChange={(checked) => setSavePaymentMethod(checked as boolean)}
            data-testid="checkbox-save-payment-method"
          />
          <Label htmlFor="save-payment" className="text-sm cursor-pointer">
            Save payment method for future charges (if final amount exceeds deposit)
          </Label>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={depositMutation.isPending}
          data-testid="button-cancel-deposit"
        >
          Cancel
        </Button>
        <Button
          className="bg-[hsl(15,80%,55%)] hover:bg-[hsl(15,80%,45%)] text-white"
          onClick={() => depositMutation.mutate()}
          disabled={depositMutation.isPending || !stripe || !cardholderName}
          data-testid="button-pay-deposit"
        >
          {depositMutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ${(depositAmount / 100).toLocaleString()} Deposit
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export function DepositPaymentDialog({ open, onOpenChange, booking, depositPercentage = 10 }: DepositPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pay Deposit</DialogTitle>
        </DialogHeader>
        <Elements stripe={stripePromise}>
          <DepositPaymentForm
            booking={booking}
            depositPercentage={depositPercentage}
            onSuccess={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        </Elements>
      </DialogContent>
    </Dialog>
  );
}
