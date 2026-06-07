import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJsonLoader } from '@/hooks/useJsonLoader';
import { paymentService } from '@/services/api';
import { useCarbonStore } from '@/store/carbonStore';
import { Loader2 } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
}

export const PaymentModal = ({ isOpen, onClose, companyId }: PaymentModalProps) => {
  const [ccAmount, setCCAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { createPaymentOrder, verifyPayment } = useCarbonStore();

  const handlePayment = async () => {
    if (ccAmount <= 0) return;
    setLoading(true);

    try {
      // 1. Load Razorpay script
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      // 2. Get Key
      const keyRes = await paymentService.getKey();
      const key = keyRes.data.key;

      // 3. Create Order
      const order = await createPaymentOrder(companyId, ccAmount);

      const options = {
        key,
        amount: order.amount.toString(),
        currency: order.currency,
        name: 'Carbon Bloom Connect',
        description: `Purchase of ${ccAmount} Carbon Credits`,
        image: 'https://placeholder.svg', // Replace with logo if available
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              companyId,
            });
            alert('Payment Successful! CC Allocated.');
            onClose();
          } catch (err) {
            console.error(err);
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: 'Company Rep',
          email: 'admin@company.com',
          contact: '9999999999',
        },
        theme: {
          color: '#10b981', // Emerald-500
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err) {
      console.error(err);
      alert('Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glass-panel border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Request Carbon Credits</DialogTitle>
          <DialogDescription>
            Enter the number of carbon credits you want to purchase.
            Current Rate: ₹2000 / CC
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cc-amount" className="text-right">
              CC Amount
            </Label>
            <Input
              id="cc-amount"
              type="number"
              value={ccAmount}
              onChange={(e) => setCCAmount(Number(e.target.value))}
              className="col-span-3 bg-white/5 border-white/10"
            />
          </div>
          <div className="flex justify-between items-center px-4 bg-white/5 p-2 rounded">
            <span>Total Cost:</span>
            <span className="font-bold text-xl">₹{(ccAmount * 2000).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handlePayment}
            disabled={loading || ccAmount <= 0}
            className="w-full gradient-primary"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            Pay & Allocate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function loadScript(src: string) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}
