import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#000000]">
      <Sidebar />
      <main className="px-4 pt-20 pb-24 md:p-10 md:ml-[280px] relative z-10 flex-1 min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
          <p className="text-gray-500 font-medium tracking-wide animate-pulse text-sm">
            Loading...
          </p>
        </div>
      </main>
    </div>
  );
}
