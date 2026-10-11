import { useState } from 'react';
import { BriefcaseBusiness, ChevronLeft, ChevronRight, Heart, Plus } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useMood } from '@/context/MoodContext';
import type { ILayoutContext } from '@/components/Layout';
import MoodIcon from '@/components/MoodIcon';
import { buildMonthGrid, getWeekday, parseDateKey, toDateKey } from '@/lib/date';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const { records, categories, tags, aggregation } = useMood();
  const { editRecord, newRecord } = useOutletContext<ILayoutContext>();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  const days = buildMonthGrid(year, month);
  const selected = parseDateKey(selectedDate);
  const selectedRecords = records.filter((record) => record.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));

  const dailyMood = (date: string) => {
    const dayCategories = records.filter((record) => record.date === date)
      .map((record) => categories.find((category) => category.id === record.categoryId))
      .filter(Boolean);
    if (!dayCategories.length) return null;
    if (aggregation === 'max') return dayCategories.reduce((best, category) => category!.score > best!.score ? category : best);
    const average = dayCategories.reduce((sum, category) => sum + category!.score, 0) / dayCategories.length;
    return categories.reduce((best, category) => Math.abs(category.score - average) < Math.abs(best.score - average) ? category : best, categories[0]);
  };
  const shiftMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setViewDate(next);
    const isCurrent = next.getFullYear() === today.getFullYear() && next.getMonth() === today.getMonth();
    setSelectedDate(isCurrent ? toDateKey(today) : toDateKey(next));
  };
  const selectDay = (date: string) => {
    const next = parseDateKey(date);
    setSelectedDate(date);
    if (next.getMonth() !== viewDate.getMonth() || next.getFullYear() !== viewDate.getFullYear()) {
      setViewDate(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  return <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-36 pt-9 sm:px-8">
    <header className="mb-8 flex items-end justify-between">
      <div><p className="mb-2 text-sm text-muted-foreground">心情月历</p><h1 className="text-4xl font-semibold">{month}月</h1><p className="mt-2 text-muted-foreground">{year} · {aggregation === 'average' ? '多条取平均值' : '多条取最高分'}</p></div>
      <div className="flex gap-2"><button type="button" title="上个月" onClick={() => shiftMonth(-1)} className="flex h-11 w-11 items-center justify-center rounded-lg border bg-card"><ChevronLeft size={20} /></button><button type="button" title="下个月" onClick={() => shiftMonth(1)} className="flex h-11 w-11 items-center justify-center rounded-lg border bg-card"><ChevronRight size={20} /></button></div>
    </header>
    <section className="rounded-xl border bg-card p-3 shadow-[0_10px_30px_rgba(50,45,38,0.04)] sm:p-6">
      <div className="mb-3 grid grid-cols-7 text-center text-xs text-muted-foreground">{['一', '二', '三', '四', '五', '六', '日'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="grid grid-cols-7">{days.map((day) => {
        const mood = dailyMood(day.key);
        const isSelected = day.key === selectedDate;
        return <button key={day.key} type="button" onClick={() => selectDay(day.key)} className={cn('flex h-[72px] min-w-0 flex-col items-center justify-start rounded-lg border border-transparent pt-2 transition-colors sm:h-20', !day.inMonth && 'opacity-30', isSelected && 'border-primary bg-primary/10')}><span className={cn('text-xs text-muted-foreground', isSelected && 'font-semibold text-primary')}>{day.day}</span>{mood && <span className="mt-2"><MoodIcon name={mood.icon} size={23} /></span>}</button>;
      })}</div>
    </section>
    <section className="mt-7">
      <div className="mb-4 flex items-end justify-between"><div><p className="text-xs text-muted-foreground">当天记录</p><h2 className="mt-1 text-lg font-semibold">{selected.getMonth() + 1}月{selected.getDate()}日 · {getWeekday(selectedDate)}</h2></div><button type="button" onClick={() => newRecord(selectedDate)} className="glass-primary inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium"><Plus size={15} />添加</button></div>
      {selectedRecords.length > 0 ? <div className="space-y-3">{selectedRecords.map((record) => {
        const category = categories.find((item) => item.id === record.categoryId) || categories[0];
        return <button key={record.id} type="button" onClick={() => editRecord(record.id)} className="grid w-full grid-cols-[64px_1fr] rounded-xl border border-l-[3px] border-l-primary bg-card p-4 text-left">
          <time className="pt-1 text-sm text-muted-foreground">{record.time}</time>
          <div className="min-w-0 border-l pl-4"><div className="flex items-center gap-2"><MoodIcon name={category.icon} size={25} /><span className="font-semibold">{category.label}</span><span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs', record.type === 'work' ? 'bg-work-soft text-work' : 'bg-life-soft text-life')}>{record.type === 'work' ? <BriefcaseBusiness size={12} /> : <Heart size={12} />}{record.type === 'work' ? '工作' : '生活'}</span></div>{record.note && <p className="mt-2 line-clamp-2 leading-6">{record.note}</p>}{record.tagIds.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{record.tagIds.map((id) => { const tag = tags.find((item) => item.id === id); return tag ? <span key={id} className="rounded-full px-2 py-0.5 text-[11px]" style={{ backgroundColor: tag.color }}>{tag.label}</span> : null; })}</div>}</div>
        </button>;
      })}</div> : <div className="rounded-xl border bg-card px-5 py-10 text-center text-sm text-muted-foreground">当天还没有记录</div>}
    </section>
  </main>;
}
