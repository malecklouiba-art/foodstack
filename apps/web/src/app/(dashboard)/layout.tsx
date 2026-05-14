import { Sidebar } from '@/components/layout/Sidebar';
import { PageTransition } from '@/components/layout/PageTransition';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark flex h-screen overflow-hidden bg-[#0A0A0A]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto thin-scrollbar bg-[#0A0A0A]">
        <PageTransition className="h-full">
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
