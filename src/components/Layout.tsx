import { useEffect, useState } from 'react';
import { BarChart3, CalendarDays, Download, ListTree, Plus, Settings } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import AddRecordDialog from '@/components/AddRecordDialog';
import MoodProvider from '@/context/MoodProvider';
import { useMood } from '@/context/MoodContext';
import { cn } from '@/lib/utils';

const NAV = [
  { path: '/', label: '记录', icon: ListTree, activeClass: 'text-primary after:bg-primary' },
  { path: '/calendar', label: '月历', icon: CalendarDays, activeClass: 'text-primary after:bg-primary' },
  { path: '/stats', label: '统计', icon: BarChart3, activeClass: 'text-primary after:bg-primary' },
  { path: '/settings', label: '设置', icon: Settings, activeClass: 'text-primary after:bg-primary' },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface ILayoutContext {
  editRecord: (recordId: string) => void;
  newRecord: (date?: string) => void;
}

function LayoutContent() {
  const { isReady } = useMood();
  const [open, setOpen] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [initialDate, setInitialDate] = useState<string | undefined>();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const listener = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', listener);
    return () => window.removeEventListener('beforeinstallprompt', listener);
  }, []);

  const openNew = (date?: string) => {
    setRecordId(null);
    setInitialDate(date);
    setOpen(true);
  };
  const openEdit = (id: string) => {
    setRecordId(id);
    setInitialDate(undefined);
    setOpen(true);
  };
  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result.outcome === 'accepted') setInstallPrompt(null);
  };

  if (!isReady) {
    return <div className="fixed inset-0 grid place-items-center bg-background"><div className="h-7 w-7 animate-spin rounded-full border-2 border-muted border-t-foreground" /></div>;
  }

  return <div className="min-h-screen bg-transparent text-foreground">
    {installPrompt && <button type="button" onClick={install} className="fixed right-4 top-[max(16px,env(safe-area-inset-top))] z-30 inline-flex h-10 items-center gap-2 rounded-full border bg-card/95 px-4 text-sm font-medium shadow-sm backdrop-blur"><Download size={16} />安装</button>}
    <Outlet context={{ editRecord: openEdit, newRecord: openNew } satisfies ILayoutContext} />
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="mx-auto grid max-w-3xl grid-cols-[1fr_1fr_76px_1fr_1fr] items-end">
        {NAV.slice(0, 2).map((item) => <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => cn('relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground', isActive && `font-semibold after:absolute after:-top-2 after:h-0.5 after:w-5 after:rounded-full ${item.activeClass}`)}><item.icon size={21} /><span>{item.label}</span></NavLink>)}
        <button type="button" aria-label="新增心情记录" onClick={() => openNew()} className="glass-primary-fab mx-auto -mt-7 flex h-16 w-16 items-center justify-center rounded-full border-[5px] transition-transform active:scale-95"><Plus size={30} /></button>
        {NAV.slice(2).map((item) => <NavLink key={item.path} to={item.path} className={({ isActive }) => cn('relative flex h-14 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground', isActive && `font-semibold after:absolute after:-top-2 after:h-0.5 after:w-5 after:rounded-full ${item.activeClass}`)}><item.icon size={21} /><span>{item.label}</span></NavLink>)}
      </div>
    </nav>
    {open && <AddRecordDialog key={`${recordId || 'new'}-${initialDate || 'today'}`} open recordId={recordId} initialDate={initialDate} onOpenChange={setOpen} />}
    <Toaster position="top-center" />
  </div>;
}

export const Layout = () => <MoodProvider><LayoutContent /></MoodProvider>;
