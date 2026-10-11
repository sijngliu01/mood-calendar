import { BriefcaseBusiness, Heart, ImageIcon, Pencil, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import MoodIcon from '@/components/MoodIcon';
import { useMood } from '@/context/MoodContext';
import type { MoodType } from '@/data/mood';
import type { ILayoutContext } from '@/components/Layout';
import { formatRecordDate, getGreeting, parseDateKey, toDateKey } from '@/lib/date';
import { cn } from '@/lib/utils';

export default function TimelinePage() {
  const { records, tags, categories, deleteRecord } = useMood();
  const { editRecord, newRecord } = useOutletContext<ILayoutContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedType = searchParams.get('type');
  const filter: 'all' | MoodType = requestedType === 'life' || requestedType === 'work' ? requestedType : 'all';
  const categoryFilter = searchParams.get('category');
  const tagFilter = searchParams.get('tag');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const selectedCategory = categories.find((category) => category.id === categoryFilter);
  const selectedTag = tags.find((tag) => tag.id === tagFilter);
  const drillActive = Boolean(categoryFilter || tagFilter || from || to);
  const today = toDateKey(new Date());

  const visible = records.filter((record) =>
    (filter === 'all' || record.type === filter)
    && (!categoryFilter || record.categoryId === categoryFilter)
    && (!tagFilter || record.tagIds.includes(tagFilter))
    && (!from || record.date >= from)
    && (!to || record.date <= to)
  ).sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  const dates = [...new Set(visible.map((record) => record.date))];
  const groups = dates.map((date) => ({ date, records: visible.filter((record) => record.date === date) }));

  const changeType = (value: 'all' | MoodType) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'all') next.delete('type');
    else next.set('type', value);
    setSearchParams(next, { replace: true });
  };
  const clearDrill = () => setSearchParams({}, { replace: true });
  const remove = async (id: string) => {
    if (!window.confirm('删除这条记录及其中的本地图片？')) return;
    await deleteRecord(id);
  };
  const rangeLabel = from && to
    ? `${parseDateKey(from).getMonth() + 1}/${parseDateKey(from).getDate()}-${parseDateKey(to).getMonth() + 1}/${parseDateKey(to).getDate()}`
    : null;

  return <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-36 pt-9 sm:px-8">
    <header className="mb-8">
      <p className="mb-2 text-sm text-muted-foreground">{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date())}</p>
      <h1 className="text-4xl font-semibold">{getGreeting()}</h1>
      <p className="mt-3 text-muted-foreground">最近的心情，都在这里。</p>
    </header>
    {drillActive && <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3"><div><p className="text-xs text-muted-foreground">当前筛选</p><p className="mt-1 font-medium">{[selectedCategory?.label, selectedTag ? `#${selectedTag.label}` : null, rangeLabel].filter(Boolean).join(' · ') || '筛选记录'}</p></div><button type="button" title="清除筛选" onClick={clearDrill} className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground"><X size={17} /></button></div>}
    <div className="mb-8 flex gap-2">
      {([['all', '全部'], ['life', '生活'], ['work', '工作']] as const).map(([value, label]) => <button key={value} type="button" onClick={() => changeType(value)} className={cn('rounded-full border px-4 py-2 text-sm font-medium transition-colors', filter !== value && 'bg-card text-muted-foreground', filter === 'all' && value === 'all' && 'glass-primary', filter === 'life' && value === 'life' && 'border-life bg-life-soft text-life', filter === 'work' && value === 'work' && 'border-work bg-work-soft text-work')}>{label}</button>)}
    </div>
    <div className="space-y-10">
      {groups.map((group) => <section key={group.date}>
        <div className="mb-4 flex items-baseline justify-between"><h2 className="text-lg font-semibold">{formatRecordDate(group.date, today)}</h2><span className="text-xs text-muted-foreground">{group.records.length} 条</span></div>
        <div className="space-y-4">
          {group.records.map((record) => {
            const category = categories.find((item) => item.id === record.categoryId) || categories[0];
            return <article key={record.id} className="rounded-xl border border-l-[3px] border-l-primary bg-card p-4 shadow-[0_10px_30px_rgba(31,42,53,0.05)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10"><MoodIcon name={category.icon} size={31} /></span><div><div className="flex flex-wrap items-center gap-2"><span className="font-semibold">{category.label}</span><span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs', record.type === 'work' ? 'bg-work-soft text-work' : 'bg-life-soft text-life')}>{record.type === 'work' ? <BriefcaseBusiness size={12} /> : <Heart size={12} />}{record.type === 'work' ? '工作' : '生活'}</span></div><time className="mt-1 block text-xs text-muted-foreground">{record.time}</time></div></div>
                <div className="flex shrink-0 gap-1"><button type="button" title="编辑记录" onClick={() => editRecord(record.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"><Pencil size={16} /></button><button type="button" title="删除记录" onClick={() => remove(record.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 size={16} /></button></div>
              </div>
              {record.note && <p className="mt-4 whitespace-pre-wrap leading-7">{record.note}</p>}
              {record.imageUrls && record.imageUrls.length > 0 && <div className={cn('mt-4 grid gap-2', record.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>{record.imageUrls.map((url, index) => <button type="button" key={`${record.id}-${index}`} onClick={() => window.open(url, '_blank')} className="overflow-hidden rounded-lg bg-secondary"><img src={url} alt={`记录图片 ${index + 1}`} className={cn('w-full object-cover', record.imageUrls!.length === 1 ? 'max-h-96' : 'aspect-square')} /></button>)}</div>}
              {record.tagIds.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{record.tagIds.map((tagId) => { const tag = tags.find((item) => item.id === tagId); return tag ? <span key={tagId} className="rounded-full px-3 py-1 text-xs" style={{ backgroundColor: tag.color }}>{tag.label}</span> : null; })}</div>}
            </article>;
          })}
        </div>
      </section>)}
      {visible.length === 0 && <div className="rounded-xl border bg-card px-6 py-14 text-center"><SlidersHorizontal className="mx-auto mb-3 text-primary" /><p className="font-medium">这里还没有记录</p><p className="mt-2 text-sm text-muted-foreground">从此刻开始就好。</p><button type="button" onClick={() => newRecord()} className="glass-primary mt-5 inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium"><ImageIcon size={16} />记录此刻</button></div>}
    </div>
  </main>;
}
