import { Download, Plus, Trash2, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import MoodIcon from '@/components/MoodIcon';
import { EMOJI_OPTIONS } from '@/data/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMood } from '@/context/MoodContext';
import type { AggregationMode, ITag } from '@/data/mood';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const {
    aggregation, setAggregation, tags, addTag, updateTag, deleteTag,
    categories, addCategory, updateCategory, deleteCategory, clearRecords, records,
    createBackup, restoreBackup,
  } = useMood();
  const initialCategory = categories[0];
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategory?.id || '');
  const [categoryName, setCategoryName] = useState(initialCategory?.label || '');
  const [categoryScore, setCategoryScore] = useState(initialCategory?.score || 3);
  const [categoryIcon, setCategoryIcon] = useState(initialCategory?.icon || 'smile');
  const [selectedTagId, setSelectedTagId] = useState('');
  const [tagName, setTagName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const selectCategory = (category: typeof initialCategory) => {
    if (!category) return;
    setSelectedCategoryId(category.id);
    setCategoryName(category.label);
    setCategoryScore(category.score);
    setCategoryIcon(category.icon);
  };
  const selectTag = (tag: ITag) => {
    setSelectedTagId(tag.id);
    setTagName(tag.label);
  };

  const newCategory = () => {
    setSelectedCategoryId('');
    setCategoryName('');
    setCategoryScore(3);
    setCategoryIcon('smile');
  };
  const saveCategory = () => {
    if (selectedCategoryId) {
      if (!updateCategory(selectedCategoryId, { label: categoryName, score: categoryScore, icon: categoryIcon })) return toast.info('名称为空或已存在');
    } else {
      const id = addCategory({ label: categoryName, score: categoryScore, icon: categoryIcon });
      if (!id) return toast.info('名称为空或已存在');
      setSelectedCategoryId(id);
    }
    toast.success('心情类别已保存');
  };
  const removeCategory = () => {
    if (!selectedCategoryId) return;
    if (!deleteCategory(selectedCategoryId)) return toast.info('仍有记录使用该心情，暂时无法删除');
    const next = categories.find((item) => item.id !== selectedCategoryId);
    if (next) selectCategory(next);
    else newCategory();
  };
  const newTag = () => {
    setSelectedTagId('');
    setTagName('');
  };
  const saveTag = () => {
    if (selectedTagId) {
      if (!updateTag(selectedTagId, tagName)) return toast.info('标签为空或已存在');
    } else {
      const id = addTag(tagName);
      if (!id) return toast.info('标签为空或已存在');
      setSelectedTagId(id);
    }
    toast.success('标签已保存');
  };
  const removeTag = () => {
    if (!selectedTagId) return;
    deleteTag(selectedTagId);
    setSelectedTagId('');
  };
  const clear = async () => {
    if (!window.confirm('确定清空全部记录和本地图片？此操作无法恢复。')) return;
    await clearRecords();
    toast.success('全部记录已清空');
  };
  const exportData = async () => {
    setIsExporting(true);
    try {
      const blob = await createBackup();
      const date = new Date().toISOString().slice(0, 10);
      const file = new File([blob], `心情日历备份-${date}.json`, { type: 'application/json' });
      let shared = false;
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: '心情日历备份' });
          shared = true;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
        }
      }
      if (!shared) {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      toast.success(`备份已生成，包含 ${records.length} 条记录`);
    } catch {
      toast.error('导出失败，请检查浏览器存储空间');
    } finally {
      setIsExporting(false);
    }
  };
  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!window.confirm(`导入会覆盖当前 ${records.length} 条记录及全部设置。格式错误时不会改动现有数据，是否继续？`)) return;
    setIsImporting(true);
    try {
      const result = await restoreBackup(file);
      setSelectedCategoryId('');
      setCategoryName('');
      setSelectedTagId('');
      setTagName('');
      const imageNotice = result.missingImages ? `，${result.missingImages} 张缺失图片已跳过` : '';
      toast.success(`已恢复 ${result.records} 条记录和 ${result.images} 张图片${imageNotice}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败，请检查备份文件');
    } finally {
      setIsImporting(false);
    }
  };

  return <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-36 pt-9 sm:px-8">
    <header className="mb-8"><p className="mb-2 text-sm text-muted-foreground">偏好与管理</p><h1 className="text-4xl font-semibold">设置</h1></header>
    <section className="border-t py-7"><h2 className="text-lg font-semibold">每日统计方式</h2><p className="mt-1 text-sm text-muted-foreground">同一天记录多次时，月历和趋势如何计算</p><div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1.5">{([['average', '取平均值'], ['max', '取最高分']] as [AggregationMode, string][]).map(([value, label]) => <button key={value} type="button" onClick={() => setAggregation(value)} className={cn('rounded-lg border px-4 py-3 text-sm font-medium', aggregation === value ? 'glass-primary' : 'border-transparent text-muted-foreground')}>{label}</button>)}</div></section>

    <section className="border-t py-7">
      <div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">心情类别</h2><p className="mt-1 text-sm text-muted-foreground">名称、Emoji 和分数会用于历史统计</p></div><Button type="button" variant="secondary" size="sm" onClick={newCategory}><Plus size={15} />新增</Button></div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">{categories.map((category) => <button key={category.id} type="button" onClick={() => selectCategory(category)} className={cn('flex min-w-0 flex-col items-center gap-2 rounded-xl border p-3 text-xs', selectedCategoryId === category.id ? 'glass-primary' : 'border-transparent bg-secondary')}><MoodIcon name={category.icon} size={28} /><span className="w-full truncate">{category.label}</span></button>)}</div>
      <div className="mt-4 rounded-xl bg-secondary p-4"><div className="grid grid-cols-[88px_1fr] gap-3"><label className="text-sm text-muted-foreground">Emoji<button type="button" className="mt-2 flex h-10 w-full items-center justify-center rounded-lg border bg-card text-xl">{EMOJI_OPTIONS.find((item) => item.id === categoryIcon)?.emoji || '🙂'}</button></label><label className="text-sm text-muted-foreground">名称<Input className="mt-2 bg-card" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="例如：满足" /></label></div><div className="mt-4 grid grid-cols-6 gap-2">{EMOJI_OPTIONS.slice(0, 18).map((option) => <button key={option.id} type="button" title={option.label} onClick={() => setCategoryIcon(option.id)} className={cn('flex aspect-square items-center justify-center rounded-lg border text-xl', categoryIcon === option.id ? 'border-primary bg-card' : 'border-transparent bg-background')}>{option.emoji}</button>)}</div><div className="mt-4"><p className="mb-2 text-sm text-muted-foreground">心情分数</p><div className="grid grid-cols-5 gap-2">{[1, 2, 3, 4, 5].map((score) => <button key={score} type="button" onClick={() => setCategoryScore(score)} className={cn('h-10 rounded-lg border text-sm font-semibold', categoryScore === score ? 'glass-primary' : 'border-transparent bg-card')}>{score}</button>)}</div></div><div className="mt-4 flex justify-end gap-2">{selectedCategoryId && <Button type="button" variant="destructive" onClick={removeCategory}><Trash2 size={15} />删除</Button>}<Button type="button" onClick={saveCategory}>保存心情</Button></div></div>
    </section>

    <section className="border-t py-7">
      <div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">标签管理</h2><p className="mt-1 text-sm text-muted-foreground">标签用于筛选和统计下钻</p></div><Button type="button" variant="secondary" size="sm" onClick={newTag}><Plus size={15} />新增</Button></div>
      <div className="mt-4 flex flex-wrap gap-2">{tags.map((tag) => <button key={tag.id} type="button" onClick={() => selectTag(tag)} className={cn('rounded-full border px-3 py-1.5 text-sm', selectedTagId === tag.id ? 'border-foreground' : 'border-transparent')} style={{ backgroundColor: tag.color }}>{tag.label}</button>)}</div>
      <div className="mt-4 flex gap-2"><Input value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="标签名称" />{selectedTagId && <Button type="button" variant="destructive" size="icon" title="删除标签" onClick={removeTag}><Trash2 size={16} /></Button>}<Button type="button" onClick={saveTag}>保存</Button></div>
    </section>

    <section className="border-t py-7">
      <h2 className="text-lg font-semibold">数据管理</h2>
      <p className="mt-1 text-sm text-muted-foreground">当前共有 {records.length} 条记录。备份包含记录、图片、标签和心情设置。</p>
      <input ref={importInputRef} type="file" accept=".json,application/json" className="hidden" onChange={importData} />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" disabled={isExporting || isImporting} onClick={exportData}><Download size={16} />{isExporting ? '正在导出' : '导出备份'}</Button>
        <Button type="button" variant="secondary" disabled={isExporting || isImporting} onClick={() => importInputRef.current?.click()}><Upload size={16} />{isImporting ? '正在导入' : '导入备份'}</Button>
      </div>
      <Button type="button" variant="destructive" className="mt-4" onClick={clear}>清空全部记录</Button>
    </section>
  </main>;
}
