"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Receipt, Download, FileText, CheckCircle2, ChevronRight, ShoppingBag } from "lucide-react";

interface Invoice {
  id: string;
  date: string;
  plan: string;
  amount: string;
  method: string;
  merch: boolean;
}

export default function SubscriptionPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("roi_invoices") || "[]");
      setInvoices(stored);
      if (stored.length > 0) setSelectedInvoice(stored[0]);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !selectedInvoice) return;
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const opt = {
        margin:       0.5,
        filename:     `${selectedInvoice.id}.pdf`,
        image:        { type: 'jpeg' as const, quality: 1 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
      };
      await html2pdf().set(opt).from(invoiceRef.current).save();
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111] selection:bg-[#B42318] selection:text-white">
      <Navbar />

      <main className="pt-28 pb-20 px-4 sm:px-8 max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl sm:text-4xl font-black uppercase text-[#111111] font-mono tracking-tight">
            My Subscription & <span className="text-[#B42318]">Invoices</span>
          </h1>
          <p className="text-[#777777] font-medium text-sm">Manage your active plans and download payment receipts.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
             <div className="w-8 h-8 border-4 border-[#B42318] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-[32px] p-12 text-center border border-[#E8DEC8] shadow-sm flex flex-col items-center justify-center">
            <Receipt className="text-[#E8DEC8] mb-4" size={48} />
            <h3 className="text-xl font-black uppercase font-mono tracking-tight text-[#111111] mb-2">No Invoices Found</h3>
            <p className="text-[#777777] text-sm max-w-md">You haven't made any transactions yet. Your invoices will appear here after you purchase a plan.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Invoice List */}
            <div className="md:col-span-5 flex flex-col gap-4">
              {invoices.map((inv) => (
                <div 
                  key={inv.id} 
                  onClick={() => setSelectedInvoice(inv)}
                  className={`bg-white rounded-2xl p-5 border cursor-pointer transition-all ${
                    selectedInvoice?.id === inv.id 
                      ? "border-[#B42318] shadow-md ring-1 ring-[#B42318]" 
                      : "border-[#E8DEC8] hover:border-[#111111] shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${selectedInvoice?.id === inv.id ? "bg-[#FDF2F2] text-[#B42318]" : "bg-[#EFE7DA] text-[#111111]"}`}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider font-mono">{inv.plan} Plan</p>
                        <p className="text-[10px] text-[#777777]">{inv.date}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black font-mono text-[#B42318]">{inv.amount}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E8DEC8]">
                    <div className="flex items-center gap-1.5">
                      {inv.merch && <ShoppingBag size={10} className="text-[#B42318]"/>}
                      <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider">
                        Via {inv.method} {inv.merch && "+ Merch"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase">
                      <CheckCircle2 size={12} /> Paid
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Invoice Viewer */}
            <div className="md:col-span-7">
              {selectedInvoice ? (
                <div className="bg-white rounded-[32px] p-8 border border-[#E8DEC8] shadow-sm relative overflow-hidden flex flex-col">
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#F8F1E6] rounded-bl-full -z-10 opacity-50" />
                  
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black uppercase font-mono tracking-tight text-[#111111]">Invoice Details</h3>
                    <button 
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] hover:bg-[#252525] text-white text-[11px] font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-md"
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>

                  {/* Printable Area */}
                  <div ref={invoiceRef} className="bg-white border-2 border-[#111111] rounded-2xl p-8 relative">
                    <div className="flex justify-between items-start mb-10 border-b border-[#E8DEC8] pb-6">
                      <div>
                        <div className="w-10 h-10 rounded-lg bg-[#111111] text-[#F8F1E6] flex items-center justify-center font-black text-lg mb-2">
                          ♫
                        </div>
                        <p className="text-lg font-black tracking-tight text-[#111111] uppercase font-mono">
                          RHYTHM OF INDIA
                        </p>
                        <p className="text-[10px] text-[#777777] uppercase font-bold tracking-widest">
                          Digital Academy
                        </p>
                      </div>
                      <div className="text-right">
                        <h4 className="text-2xl font-black uppercase text-[#B42318] tracking-widest font-mono mb-1">INVOICE</h4>
                        <p className="text-[11px] font-bold text-[#111111] font-mono">{selectedInvoice.id}</p>
                        <p className="text-[11px] text-[#777777]">Date: {selectedInvoice.date}</p>
                      </div>
                    </div>

                    <div className="mb-10">
                      <p className="text-[10px] font-black uppercase text-[#777777] tracking-wider mb-2">Billed To</p>
                      <p className="text-sm font-bold text-[#111111]">Rhythm Learner</p>
                      <p className="text-xs text-[#777777]">student@rhythmofindia.org</p>
                    </div>

                    <table className="w-full text-left border-collapse mb-10">
                      <thead>
                        <tr className="border-b-2 border-[#111111] text-[10px] font-black uppercase text-[#111111] tracking-wider">
                          <th className="py-3 px-2">Description</th>
                          <th className="py-3 px-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-[#E8DEC8]">
                          <td className="py-4 px-2">
                            <p className="text-sm font-bold text-[#111111]">{selectedInvoice.plan} Plan Subscription</p>
                            <p className="text-[11px] text-[#777777]">Access to classical dance courses</p>
                          </td>
                          <td className="py-4 px-2 text-right font-mono font-bold text-[#111111]">{selectedInvoice.amount}</td>
                        </tr>
                        {selectedInvoice.merch && (
                          <tr className="border-b border-[#E8DEC8]">
                            <td className="py-4 px-2">
                              <p className="text-sm font-bold text-[#111111]">Exclusive Merchandise Kit</p>
                              <p className="text-[11px] text-[#777777]">T-shirt, bottle & booklet</p>
                            </td>
                            <td className="py-4 px-2 text-right font-mono font-bold text-[#111111]">Included</td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="py-4 px-2 text-right font-black uppercase text-[#111111] text-xs">Total Paid</td>
                          <td className="py-4 px-2 text-right font-black font-mono text-[#B42318] text-lg">{selectedInvoice.amount}</td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="flex justify-between items-center text-[10px] text-[#777777]">
                      <p>Payment Method: <span className="uppercase font-bold text-[#111111]">{selectedInvoice.method}</span></p>
                      <p>Thank you for choosing Rhythm of India!</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#EFE7DA] rounded-[32px] p-12 h-full flex flex-col items-center justify-center border border-[#E8DEC8] border-dashed text-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                    <ChevronRight size={24} className="text-[#B42318]" />
                  </div>
                  <p className="text-sm font-bold text-[#111111]">Select an invoice to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
