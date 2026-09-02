import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Activity, DollarSign,
  CheckCircle, Clock, Send, AlertTriangle, ToggleLeft, ToggleRight, Sparkles, Terminal, ShoppingCart, CreditCard, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import toast, { Toaster } from 'react-hot-toast';
import './index.css';

// Types
type Metrics = {
  total_cases: number;
  revenue_at_risk: number;
  recovered_revenue: number;
};

type RecoveryCase = {
  id: string;
  transaction_id: string;
  customer: { name: string; email: string } | null;
  status: string;
  potential_revenue: number;
  ai_recommendation?: {
    recommended_action: string;
    confidence_score: number;
    reasoning: string;
    generated_message?: string;
  };
};

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'store'>('dashboard');

  // Dashboard State
  const [metrics, setMetrics] = useState<Metrics>({ total_cases: 0, revenue_at_risk: 0, recovered_revenue: 0 });
  const [cases, setCases] = useState<RecoveryCase[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [agentLogs, setAgentLogs] = useState<string[]>(["[System] Agentic workflow initialized and ready..."]);

  // Storefront State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'failed'>('idle');
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(0);

  const basePrice = 2500;
  const finalPrice = basePrice - discountApplied;

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'SAVE10') {
      setDiscountApplied(basePrice * 0.10);
      toast.success("10% Discount Applied Successfully!");
    } else {
      toast.error("Invalid promo code");
      setDiscountApplied(0);
    }
  };

  const addLog = (log: string) => {
    setAgentLogs(prev => [log, ...prev].slice(0, 5));
  };

  const fetchDashboardData = async () => {
    if (currentView !== 'dashboard') return;
    try {
      const [metricsRes, casesRes, txRes, autoRes] = await Promise.all([
        fetch('/api/dashboard/metrics'),
        fetch('/api/dashboard/recovery-cases'),
        fetch('/api/transactions'),
        fetch('/api/dashboard/settings/autonomous')
      ]);

      if (metricsRes.ok && casesRes.ok && txRes.ok && autoRes.ok) {
        const metricsData = await metricsRes.json();
        const casesData = await casesRes.json();
        const txData = await txRes.json();
        const autoData = await autoRes.json();
        
        setMetrics(metricsData);
        setCases(casesData.recovery_cases || []);
        setTransactions(txData.transactions || []);
        setAutonomousMode(autoData.autonomous_mode);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
    setLoading(false);
  };

  const simulateWebhookEvent = async (amount = Math.floor(Math.random() * 500000) + 100000, customerName = "john.doe", failReason = "bank_timeout") => {
    addLog(`[Webhook] Incoming payment.failed event received for ${customerName}`);
    try {
      const response = await fetch('/api/webhooks/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: "payment.failed",
          payload: {
            payment: {
              entity: {
                amount: amount,
                currency: "INR",
                status: "failed",
                method: "upi",
                error_description: failReason,
                email: `narrakeerthanredy@gmail.com`,
                contact: "9876543210"
              }
            }
          }
        })
      });
      if (response.ok) {
        addLog(`[Agent] Analyzed customer history. Generated recovery strategy.`);
        if (currentView === 'dashboard') {
          toast.success('Agent processed new recovery case!');
          fetchDashboardData();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    setCheckoutStatus('idle');

    // Simulate real checkout latency
    setTimeout(() => {
      setIsCheckingOut(false);
      setCheckoutStatus('failed');
      toast.error("Payment declined by bank.");
      // Fire webhook in background (scale amount based on discount)
      simulateWebhookEvent(finalPrice * 100, "sneaker_fan_99", "insufficient_funds");
    }, 2500);
  };

  const handleApprove = async (caseId: string) => {
    addLog(`[Agent] Dispatching generated recovery message for case ${caseId.substring(0, 6)}...`);
    try {
      const response = await fetch(`/api/dashboard/recovery-cases/${caseId}/approve`, {
        method: 'POST'
      });
      if (response.ok) {
        toast.success('Recovery action successfully executed!');
        fetchDashboardData();
      }
    } catch (error) {
      toast.error('Failed to approve action');
    }
  };

  const toggleAutonomousMode = async () => {
    const newValue = !autonomousMode;
    setAutonomousMode(newValue);
    addLog(`[System] Autonomous Mode toggled to: ${newValue ? 'ON' : 'OFF'}`);
    
    try {
      await fetch('/api/dashboard/settings/autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newValue })
      });
      if (newValue) {
        toast.success("Agent is now running autonomously!");
      } else {
        toast("Autonomous mode disabled. Manual approval required.", { icon: '🛑' });
      }
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [currentView]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
        <div className="p-6 flex items-center gap-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            ReviveAI
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button
            onClick={() => setCurrentView('store')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${currentView === 'store' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <ShoppingCart className="w-5 h-5" /> Mock Storefront
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-700">Autonomous Mode</span>
              <span className="text-[10px] text-gray-500">Auto-execute &gt;90% conf</span>
            </div>
            <button onClick={toggleAutonomousMode}>
              {autonomousMode ?
                <ToggleRight className="w-8 h-8 text-indigo-600" /> :
                <ToggleLeft className="w-8 h-8 text-gray-400" />
              }
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

        {currentView === 'dashboard' ? (
          <>
            <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Agent Command Center</h2>
                <p className="text-sm text-gray-500">Monitoring real-time payment events</p>
              </div>
              <button
                onClick={() => simulateWebhookEvent()}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-md shadow-indigo-200 transition-all active:scale-95"
              >
                <AlertTriangle className="w-4 h-4" /> Inject Webhook
              </button>
            </header>

            <div className="flex-1 overflow-auto p-8 flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 transition-transform hover:-translate-y-1">
                    <div className="p-4 bg-red-50 rounded-full"><DollarSign className="w-6 h-6 text-red-500" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Revenue at Risk</p>
                      <h3 className="text-2xl font-bold text-gray-900">₹{metrics.revenue_at_risk.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 transition-transform hover:-translate-y-1">
                    <div className="p-4 bg-green-50 rounded-full"><CheckCircle className="w-6 h-6 text-green-500" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Recovered Revenue</p>
                      <h3 className="text-2xl font-bold text-gray-900">₹{metrics.recovered_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 transition-transform hover:-translate-y-1">
                    <div className="p-4 bg-indigo-50 rounded-full"><Clock className="w-6 h-6 text-indigo-500" /></div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Cases Analysed</p>
                      <h3 className="text-2xl font-bold text-gray-900">{metrics.total_cases}</h3>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold">Live Recovery Queue</h3>
                    <span className="flex items-center gap-2 bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Agent Active
                    </span>
                  </div>

                  {loading && cases.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Listening for webhooks...</div>
                  ) : cases.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><CheckCircle className="w-8 h-8 text-gray-300" /></div>
                      <h4 className="text-gray-900 font-medium text-lg mb-1">Zero Revenue Leaks</h4>
                      <p className="text-gray-500">No active recovery cases.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                            <th className="px-6 py-4 font-medium">Customer</th>
                            <th className="px-6 py-4 font-medium">Value</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                            <th className="px-6 py-4 font-medium">Agent Strategy</th>
                            <th className="px-6 py-4 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {cases.map((c) => (
                            <React.Fragment key={c.id}>
                              <tr
                                className={`hover:bg-indigo-50/30 transition-colors cursor-pointer ${expandedCase === c.id ? 'bg-indigo-50/30' : ''}`}
                                onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
                              >
                                <td className="px-6 py-4">
                                  <div className="font-medium text-gray-900">{c.customer?.name || "Unknown"}</div>
                                  <div className="text-xs text-gray-500">{c.customer?.email}</div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                  ₹{c.potential_revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 inline-flex text-[10px] uppercase font-bold tracking-wider rounded-full ${c.status === 'actioned' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'
                                    }`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {c.ai_recommendation ? (
                                    <div className="flex items-center gap-2">
                                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                      <span className="text-sm font-medium text-gray-800">
                                        {c.ai_recommendation.recommended_action.replace(/_/g, ' ')}
                                      </span>
                                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-bold">
                                        {(c.ai_recommendation.confidence_score * 100).toFixed(0)}%
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">Processing...</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {c.status === 'pending' ? (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleApprove(c.id); }}
                                      className="inline-flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 font-medium py-1.5 px-4 rounded-md transition-colors text-sm shadow-sm"
                                    >
                                      <Send className="w-3.5 h-3.5" /> Approve
                                    </button>
                                  ) : (
                                    <span className="text-sm font-medium text-gray-400 inline-flex items-center gap-1.5">
                                      <CheckCircle className="w-4 h-4 text-green-500" /> Done
                                    </span>
                                  )}
                                </td>
                              </tr>

                              {/* Expanded Generative Preview */}
                              {expandedCase === c.id && c.ai_recommendation && (
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                  <td colSpan={5} className="px-6 py-6">
                                    <div className="flex flex-col md:flex-row gap-6">
                                      <div className="flex-1 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                          <Terminal className="w-3.5 h-3.5" /> Agent Reasoning
                                        </h4>
                                        <p className="text-sm text-gray-700 italic">"{c.ai_recommendation.reasoning}"</p>
                                      </div>
                                      <div className="flex-1 bg-white p-5 rounded-lg border border-indigo-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                                        <h4 className="text-xs font-bold text-indigo-500 uppercase mb-2 flex items-center gap-2">
                                          <Sparkles className="w-3.5 h-3.5" /> Generated Message Preview
                                        </h4>
                                        <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                                          {c.ai_recommendation.generated_message || "Message generation pending..."}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
                  <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold">Recent Transactions</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                          <th className="px-6 py-4 font-medium">Customer</th>
                          <th className="px-6 py-4 font-medium">Amount</th>
                          <th className="px-6 py-4 font-medium">Method</th>
                          <th className="px-6 py-4 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {transactions.map((tx, i) => (
                          <tr key={i} className="hover:bg-gray-50/30">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{tx.customer_name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 uppercase">{tx.payment_method}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 inline-flex text-[10px] uppercase font-bold tracking-wider rounded-full ${tx.status === 'captured' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              <div className="w-full lg:w-80 flex flex-col h-full">
                <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 flex flex-col overflow-hidden sticky top-8">
                  <div className="bg-gray-950 px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-bold text-gray-200">Agent Activity Feed</h3>
                  </div>
                  <div className="p-4 h-96 overflow-y-auto flex flex-col-reverse space-y-reverse space-y-3">
                    {agentLogs.map((log, i) => (
                      <div key={i} className="text-xs font-mono text-gray-300 border-l-2 border-indigo-500/30 pl-3 py-1">
                        <span className="text-indigo-400">{new Date().toLocaleTimeString()}</span><br />
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-8">
            <div className="bg-white max-w-4xl w-full rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
              {/* Product Image Side */}
              <div className="w-full md:w-1/2 bg-gray-50 p-12 flex flex-col items-center justify-center border-r border-gray-100">
                <div className="w-64 h-64 bg-indigo-100 rounded-full flex items-center justify-center mb-8 relative">
                  <ShoppingCart className="w-24 h-24 text-indigo-500 absolute" />
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce">Hot Item!</div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">AirMax Premium Sneakers</h3>
                <p className="text-gray-500 text-center mb-6">Limited edition urban footwear. Secure your pair before they sell out.</p>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">₹{finalPrice.toLocaleString()}</span>
                  {discountApplied > 0 ? (
                    <span className="text-sm text-green-500 font-bold">10% Discount Applied!</span>
                  ) : (
                    <span className="text-sm text-gray-400 line-through">₹3,999</span>
                  )}
                </div>
              </div>

              {/* Checkout Form Side */}
              <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" /> Secure Checkout
                </h2>

                {checkoutStatus === 'failed' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Payment Declined</h4>
                      <p className="text-xs mt-1">Your bank declined the transaction due to insufficient funds. The seller has been notified.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Email Address</label>
                    <input type="email" value="sneaker_fan_99@example.com" readOnly className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Payment Method</label>
                    <div className="flex gap-3">
                      <div className="flex-1 border-2 border-indigo-600 bg-indigo-50 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer">
                        <span className="font-bold text-indigo-700">UPI</span>
                      </div>
                      <div className="flex-1 border border-gray-200 rounded-lg p-3 flex flex-col items-center justify-center cursor-not-allowed opacity-50">
                        <CreditCard className="w-5 h-5 mb-1 text-gray-400" />
                        <span className="text-xs font-bold text-gray-400">Card</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Promo Code Section */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Promo Code</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Enter code (e.g. SAVE10)" 
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 uppercase" 
                      />
                      <button 
                        onClick={handleApplyPromo}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex justify-center items-center gap-2"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing Payment...
                    </>
                  ) : (
                    <>Pay ₹{finalPrice.toLocaleString()} Securely</>
                  )}
                </button>
                <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Encrypted by MockGateway
                </p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
