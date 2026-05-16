import { Sidebar } from '@/components/layout/Sidebar';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { PageTransition } from '@/components/layout/PageTransition';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto thin-scrollbar bg-gray-50">
          <PageTransition className="h-full">
            {children}
          </PageTransition>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
