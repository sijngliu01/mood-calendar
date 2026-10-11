import { BriefcaseBusiness, ChevronRight, Heart } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MoodIcon from '@/components/MoodIcon';
import { useMood } from '@/context/MoodContext';
import type { MoodType } from '@/data/mood';
import { getLastDays, parseDateKey } from '@/lib/date';
import { cn } from '@/lib/utils';

export default function StatsPage() {
  const { records, categories, tags, aggregation } = useMood();
  const navigate = useNavigate();
  const [type, setType] = useState<'all' | MoodType>('all');
  const [categoryId, setCategoryId] = useState(categories.find((item) => item.id === 'happy')?.id || categories[0]?.id);
  const dates = getLastDays(7);
  const dateSet = new Set(dates);
  const typeRecords = records.filter((record) => type === 'all' || record.type === type);
  const recentRecords = typeRecords.filter((record) => dateSet.has(record.date));

  const chartDays = dates.map((date) => {
    const scores = recentRecords.filter((record) => record.date === date)
      .map((record) => categories.find((category) => category.id === record.categoryId)?.score)
      .filter((score): score is number => score !== undefined);
    const score = scores.length === 0 ? null : aggregation === 'max'
      ? Math.max(...scores)
      : scores.reduce((sum, value) => sum + value, 0) / scores.length;
    const parsed = parseDateKey(date);
    return { date, score, label: `${parsed.getMonth() + 1}/${parsed.getDate()}` };
  });
  const valid = chartDays.filter((day) => day.score !== null);
  const average = valid.length ? valid.reduce((sum, day) => sum + day.score!, 0) / valid.length : null;
  const delta = valid.length > 1 ? valid[valid.length - 1].score! - valid[0].score! : null;
  const trend = delta === null ? '记录满两天后可查看趋势' : delta >= 0.4 ? '最近状态有所回升' : delta <= -0.4 ? '最近状态有所回落' : '最近状态整体平稳';
  const selectedCategory = categories.find((category) => category.id === categoryId) || categories[0];
  const categoryRecords = recentRecords.filter((record) => record.categoryId === selectedCategory?.id);
  const tagCounts = tags.map((tag) => ({ ...tag, count: categoryRecords.filter((record) => record.tagIds.includes(tag.id)).length }))
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count);
  const start = parseDateKey(dates[0]);
  const end = parseDateKey(dates[dates.length - 1]);

  const openTagRecords = (tagId: string) => {
    const params = new URLSearchParams({ category: selectedCategory.id, tag: tagId, from: dates[0], to: dates[dates.length - 1] });
    if (type !== 'all') params.set('type', type);
    navigate(`/?${params.toString()}`);
  };

  return <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-36 pt-9 sm:px-8">
    <header className="mb-8"><p className="mb-2 text-sm text-muted-foreground">{start.getMonth() + 1}月{start.getDate()}日 - {end.getMonth() + 1}月{end.getDate()}日</p><h1 className="text-4xl font-semibold">心情统计</h1><p className="mt-3 text-muted-foreground">当前按{aggregation === 'average' ? '每日平均分' : '每日最高分'}计算。</p></header>
    <div className="mb-5 flex gap-2">{([['all', '全部'], ['life', '生活'], ['work', '工作']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => setType(value)} className={cn('inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors', type !== value && 'bg-card text-muted-foreground', type === 'all' && value === 'all' && 'glass-primary', type === 'life' && value === 'life' && 'border-life bg-life-soft text-life', type === 'work' && value === 'work' && 'border-work bg-work-soft text-work')}>{value === 'life' && <Heart size={14} />}{value === 'work' && <BriefcaseBusiness size={14} />}{label}</button>)}</div>
    <section className="rounded-xl border bg-card p-5 shadow-[0_10px_30px_rgba(50,45,38,0.04)] sm:p-6">
      <div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">最近 7 天</p><h2 className="mt-1 text-xl font-semibold">{trend}</h2></div><div className="text-right"><strong className="font-serif text-4xl font-normal">{average === null ? '—' : average.toFixed(1)}</strong><span className="block text-xs text-muted-foreground">平均分</span></div></div>
      <div className="relative mt-8 grid h-64 grid-cols-7 border-b before:absolute before:inset-x-0 before:top-1/3 before:border-t before:border-dashed before:border-border after:absolute after:inset-x-0 after:top-2/3 after:border-t after:border-dashed after:border-border">
        {chartDays.map((day) => <div key={day.date} className="relative z-[1] flex min-w-0 flex-col"><div className="flex flex-1 items-end justify-center">{day.score === null ? <span className="mb-2 h-1.5 w-1.5 rounded-full bg-border" /> : <div className="relative w-7 rounded-t bg-primary/75" style={{ height: `${Math.max(8, day.score / 5 * 180)}px` }}><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[11px] font-medium">{day.score.toFixed(day.score % 1 ? 1 : 0)}</span></div>}</div><span className="h-9 pt-2 text-center text-[10px] text-muted-foreground">{day.label}</span></div>)}
      </div>
    </section>
    <section className="mt-6 rounded-xl border bg-card p-5 sm:p-6">
      <p className="text-sm text-muted-foreground">按心情下钻</p><h2 className="mt-1 text-xl font-semibold">哪些标签与这类心情同时出现？</h2>
      <div className="my-5 flex gap-2 overflow-x-auto pb-1">{categories.map((category) => <button key={category.id} type="button" onClick={() => setCategoryId(category.id)} className={cn('flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors', selectedCategory?.id === category.id ? 'glass-primary' : 'border-transparent bg-secondary')}><MoodIcon name={category.icon} size={20} />{category.label}</button>)}</div>
      <div className="rounded-xl border-l-[3px] border-l-primary bg-secondary p-4"><div className="mb-3 flex items-center justify-between"><span className="font-medium">“{selectedCategory?.label}”下的标签</span><span className="text-xs text-muted-foreground">近 7 天 · {categoryRecords.length} 条</span></div>{tagCounts.length > 0 ? <div>{tagCounts.map((tag) => <button key={tag.id} type="button" onClick={() => openTagRecords(tag.id)} className="flex w-full items-center gap-3 border-t py-3 text-left first:border-t-0"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} /><span className="flex-1 text-sm">{tag.label}</span><span className="text-sm font-semibold">{tag.count}</span><ChevronRight size={15} className="text-muted-foreground" /></button>)}</div> : <p className="py-5 text-center text-sm text-muted-foreground">这类心情还没有关联标签</p>}</div>
    </section>
  </main>;
}
