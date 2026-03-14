import { Sparkles, ShieldCheck, Clock } from "lucide-react";

export default function ExpertReviewPage() {
    return (
        <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 text-white relative">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
            </div>
        
            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 border border-white/10 text-sm text-emerald-100">
              <Sparkles size={16} />
              We’ll ask you 5 quick questions (takes about 60 seconds).
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold">Let’s create your expert-backed plan.</h1>
            <p className="text-slate-300 max-w-2xl">
              We’ll keep it light and focused. Preview the questions below.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end text-sm text-emerald-100/80">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} /> Secure & private
            </div>
            <div className="flex items-center gap-2 text-emerald-100/70">
              <Clock size={16} /> ~60 seconds
            </div>
          </div>
        </div>

            </div>
        </div>
    );
}