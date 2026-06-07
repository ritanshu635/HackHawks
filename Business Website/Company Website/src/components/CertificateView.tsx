import React from 'react';
import { motion } from 'framer-motion';
import { FileBadge, QrCode, ShieldCheck, Download, Printer, X } from 'lucide-react';
import { Button } from './ui/button';

interface CertificateViewProps {
  companyName: string;
  allocatedCC: number;
  complianceYear: number;
  onClose: () => void;
}

export const CertificateView = ({ companyName, allocatedCC, complianceYear, onClose }: CertificateViewProps) => {
  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const refNo = `CB-${companyName.substring(0, 3).toUpperCase()}-${complianceYear}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
    >
      <div className="relative w-full max-w-[1100px] bg-[#fdfcf8] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm border-[20px] border-[#1e3a8a] p-1 scale-90 md:scale-100">
        {/* Decorative inner border */}
        <div className="border-[2px] border-[#1e3a8a]/30 p-10 min-h-[600px] flex flex-col justify-between relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/felt.png')]">

          {/* Close Button - Highly Prominent */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg group flex items-center gap-2 px-4"
          >
            <X className="w-6 h-6" />
            <span className="font-black text-xs uppercase tracking-widest">Close</span>
          </button>

          {/* Top Header: Shield & QR */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-[#1e3a8a] flex items-center justify-center rounded-sm shadow-xl border-2 border-white/20">
                <ShieldCheck className="w-12 h-12 text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-2xl font-black tracking-[0.15em] uppercase text-[#1e3a8a] leading-none">National Carbon Registry</h2>
                <p className="text-xs font-black text-black/60 uppercase mt-1 tracking-widest">Government of India • Environmental Compliance</p>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-32 h-32 border-[3px] border-black p-2 bg-white shadow-lg">
                <QrCode className="w-full h-full text-black" />
              </div>
              <p className="text-[9px] mt-2 font-black text-black uppercase tracking-tighter">Secure Ledger Verification</p>
            </div>
          </div>

          {/* Center Content */}
          <div className="text-center space-y-6">
            <div className="space-y-1">
              <h1 className="text-5xl md:text-6xl font-serif font-black text-[#1e3a8a] tracking-tight drop-shadow-sm">
                CERTIFICATE OF CARBON NEUTRALITY
              </h1>
              <div className="flex items-center justify-center gap-6">
                <div className="h-[2px] w-20 bg-[#b8860b]" />
                <p className="text-sm font-black uppercase tracking-[0.4em] text-[#b8860b]">Official Legislative Record</p>
                <div className="h-[2px] w-20 bg-[#b8860b]" />
              </div>
            </div>

            <div className="py-2 space-y-6">
              <p className="text-2xl font-serif italic text-black/90 font-bold">This is to certify that</p>

              <div className="inline-block border-b-4 border-[#1e3a8a] px-16 pb-2">
                <p className="text-4xl md:text-5xl font-black text-black uppercase tracking-widest">
                  {companyName}
                </p>
              </div>

              <div className="max-w-4xl mx-auto space-y-6 leading-relaxed">
                <p className="text-xl md:text-2xl text-black font-medium leading-relaxed font-serif italic">
                  has successfully achieved <span className="text-[#1e3a8a] font-black not-italic px-1">carbon neutrality</span> by acquiring and retiring verified carbon credits through the
                  <span className="font-black not-italic text-black underline decoration-[#1e3a8a]/30 decoration-2"> National Carbon Credit Registry (NCCR)</span> under the
                  <span className="font-black not-italic text-black underline decoration-[#1e3a8a]/30 decoration-2"> CarbonKisan Government Carbon Platform</span>.
                </p>

                <p className="text-lg md:text-xl text-black/80 font-medium font-serif italic">
                  The credits have been government-verified, permanently retired, and applied toward the company’s
                  <span className="font-black text-[#1e3a8a] not-italic"> ESG and environmental compliance</span> for the stated period.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Grid & Seal */}
          <div className="flex justify-between items-end mt-8 border-t-2 border-[#1e3a8a]/20 pt-8">
            <div className="grid grid-cols-2 gap-x-16 gap-y-6 text-left">
              <div className="bg-[#1e3a8a]/5 p-3 rounded-sm border-l-4 border-[#1e3a8a]">
                <p className="text-[10px] uppercase font-black text-[#1e3a8a] tracking-widest mb-1">Total Carbon Credits</p>
                <p className="text-3xl font-black text-black">{allocatedCC.toLocaleString()} CC</p>
              </div>
              <div className="bg-[#1e3a8a]/5 p-3 rounded-sm border-l-4 border-[#1e3a8a]">
                <p className="text-[10px] uppercase font-black text-[#1e3a8a] tracking-widest mb-1">Compliance Period</p>
                <p className="text-3xl font-black text-black">Year {complianceYear}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-black/50 tracking-widest">📄 Reference No</p>
                <p className="text-sm font-black font-mono text-black">{refNo}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-black/50 tracking-widest">📅 Issue Date</p>
                <p className="text-sm font-black text-black">{issueDate}</p>
              </div>
            </div>

            <div className="relative text-center pb-4">
              {/* Seal Image Placeholder - Using Lucide for now but making it look like a seal */}
              <div className="absolute -top-12 left-1/2 -translate-x-12 opacity-10">
                <FileBadge className="w-24 h-24 text-[#b8860b]" />
              </div>

              <div className="w-56 h-[2px] bg-black mb-2 mx-auto" />
              <p className="text-xs font-black text-black uppercase tracking-widest">Authorized Government Authority</p>
              <p className="text-[10px] font-black text-[#1e3a8a] uppercase">Ministry of Finance & Environment</p>
            </div>
          </div>
        </div>

        {/* External Print/PDF Actions */}
        <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-6 no-print">
          <Button
            variant="outline"
            className="bg-white border-2 border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white gap-2 font-black px-8 py-6 rounded-full shadow-xl transition-all"
            onClick={() => window.print()}
          >
            <Printer className="w-5 h-5" /> PRINT CERTIFICATE
          </Button>
          <Button
            className="bg-earth-gold text-black hover:bg-earth-gold/90 gap-2 font-black px-8 py-6 rounded-full shadow-xl transition-all"
            onClick={() => alert("Digital copy saved to your compliance folder.")}
          >
            <Download className="w-5 h-5" /> DOWNLOAD AS PDF
          </Button>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .fixed { position: absolute; top: 0; left: 0; }
          .z-[100], .z-[100] * { visibility: visible; }
        }
      `}</style>
    </motion.div>
  );
};
