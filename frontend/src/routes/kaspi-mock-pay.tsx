import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export const Route = createFileRoute('/kaspi-mock-pay')({
  component: KaspiMockPay,
});

function KaspiMockPay() {
  const navigate = useNavigate();
  const search: any = Route.useSearch();
  const { order_id, org_id, plan } = search;
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');

  const handleSimulatePayment = async () => {
    setStatus('pending');
    try {
      await fetch("http://127.0.0.1:8000/api/payments/kaspi/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id,
          org_id,
          plan,
          status: "PAID"
        })
      });
      setStatus('success');
      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 2000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md w-full rounded-2xl border bg-card p-8 text-center shadow-lg">
        <h1 className="text-3xl font-bold text-[#f14635] mb-2">Kaspi Pay (Mock)</h1>
        <p className="text-muted-foreground mb-6">
          This is a simulated Kaspi Pay checkout page. In production, this would be the actual Kaspi Pay QR/App integration.
        </p>

        <div className="bg-muted p-4 rounded-lg mb-6 text-left text-sm font-mono space-y-2">
          <p><strong>Order ID:</strong> {order_id}</p>
          <p><strong>Organization:</strong> {org_id}</p>
          <p><strong>Plan:</strong> <span className="uppercase text-primary">{plan}</span></p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-500/20 text-green-500 p-4 rounded-lg font-semibold animate-pulse">
            Payment Successful! Redirecting to Dashboard...
          </div>
        ) : (
          <div className="space-y-3">
            <Button 
              className="w-full bg-[#f14635] text-white hover:bg-[#d03d2e] rounded-md h-12 text-lg"
              onClick={handleSimulatePayment}
            >
              Simulate Successful Payment
            </Button>
            <Button 
              variant="outline"
              className="w-full rounded-md"
              onClick={() => navigate({ to: '/pricing' })}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
