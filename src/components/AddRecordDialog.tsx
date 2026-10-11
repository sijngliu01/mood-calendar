import { useRef, useState } from 'react';
import { BriefcaseBusiness, Heart, ImagePlus, LoaderCircle, Plus, Tag, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import MoodIcon from '@/components/MoodIcon';
import { useMood } from '@/context/MoodContext';
import type { MoodType } from '@/data/mood';
import { getNowFields } from '@/lib/date';
import { compressImage } from '@/lib/image';
import { cn } from '@/lib/utils';

interface AddRecordDialogProps {
  open: boolean;
  recordId?: string | null;
  initialDate?: string;
  onOpenChange: (open: boolean) => void;
}

interface INewImage {
  blob: Blob;
  url: string;
}

export default function AddRecordDialog({ open, recordId, initialDate, onOpenChange }: AddRecordDialogProps) {
  const { records, categories, tags, saveRecord, addTag } = useMood();
  const editingRecord = records.find((record) => record.id === recordId);
  const now = getNowFields();
  const [type, setType] = useState<MoodType>(editingRecord?.type || 'life');
  const [categoryId, setCategoryId] = useState(editingRecord?.categoryId || categories.find((item) => item.id === 'happy')?.id || categories[0]?.id);
  const [date, setDate] = useState(editingRecord?.date || initialDate || now.date);
  const [time, setTime] = useState(editingRecord?.time || now.time);
  const [note, setNote] = useState(editingRecord?.note || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(editingRecord?.tagIds || []);
  const [newTag, setNewTag] = useState('');
  const [keepImageIds, setKeepImageIds] = useState<string[]>(editingRecord?.imageIds || []);
  const [newImages, setNewImages] = useState<INewImage[]>([]);
  const [processingImages, setProcessingImages] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const releaseNewImages = () => {
    newImages.forEach((image) => URL.revokeObjectURL(image.url));
    setNewImages([]);
  };

  const close = () => {
    if (submitting) return;
    releaseNewImages();
    onOpenChange(false);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((current) => current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]);
  };

  const createTag = () => {
    const id = addTag(newTag);
    if (!id) return toast.info('标签为空或已存在');
    setSelectedTags((current) => [...current, id]);
    setNewTag('');
  };

  const selectImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const remaining = 6 - keepImageIds.length - newImages.length;
    if (remaining <= 0) return toast.info('每条记录最多添加 6 张图片');
    setProcessingImages(true);
    try {
      const selected = Array.from(files).filter((file) => file.type.startsWith('image/')).slice(0, remaining);
      const blobs = await Promise.all(selected.map(compressImage));
      setNewImages((current) => [...current, ...blobs.map((blob) => ({ blob, url: URL.createObjectURL(blob) }))]);
      if (files.length > remaining) toast.info('每条记录最多添加 6 张图片');
    } catch {
      toast.error('部分图片无法读取，请换一张重试');
    } finally {
      setProcessingImages(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages((current) => {
      URL.revokeObjectURL(current[index].url);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const submit = async () => {
    if (submitting || processingImages) return;
    if (!note.trim() && keepImageIds.length + newImages.length === 0) {
      toast.info('写下感受或添加一张图片');
      return;
    }
    setSubmitting(true);
    try {
      await saveRecord({
        date,
        time,
        type,
        categoryId,
        note: note.trim(),
        tagIds: selectedTags,
        keepImageIds,
        imageBlobs: newImages.map((image) => image.blob),
      }, recordId || undefined);
      releaseNewImages();
      onOpenChange(false);
      toast.success(recordId ? '记录已更新' : '心情已记录');
    } catch {
      setSubmitting(false);
      toast.error('保存失败，请检查浏览器存储空间');
    }
  };

  const existingImages = editingRecord?.imageIds.map((id, index) => ({
    id,
    url: editingRecord.imageUrls?.[index],
  })).filter((image) => keepImageIds.includes(image.id) && image.url) || [];
  const imageCount = keepImageIds.length + newImages.length;

  return <Dialog open={open} onOpenChange={(next) => next ? onOpenChange(true) : close()}>
    <DialogContent className="max-h-[94dvh] overflow-y-auto rounded-2xl border p-0 sm:max-w-[540px]">
      <div className="sticky top-0 z-10 border-b bg-card/95 px-5 py-5 backdrop-blur sm:px-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-semibold">{recordId ? '编辑记录' : '记录此刻'}</DialogTitle>
          <DialogDescription>这一刻，最想留下什么？</DialogDescription>
        </DialogHeader>
      </div>
      <div className="space-y-7 px-5 pb-6 sm:px-6">
        <section>
          <p className="mb-3 text-sm font-medium text-muted-foreground">记录类型</p>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1.5">
            <button type="button" onClick={() => setType('life')} className={cn('flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium', type === 'life' ? 'bg-life-soft text-life shadow-sm' : 'text-muted-foreground')}><Heart size={17} />生活心情</button>
            <button type="button" onClick={() => setType('work')} className={cn('flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium', type === 'work' ? 'bg-work-soft text-work shadow-sm' : 'text-muted-foreground')}><BriefcaseBusiness size={17} />工作心情</button>
          </div>
        </section>
        <section>
          <p className="mb-3 text-sm font-medium text-muted-foreground">今天感觉怎样？</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {categories.map((category) => <button key={category.id} type="button" onClick={() => setCategoryId(category.id)} className={cn('flex min-w-0 flex-col items-center gap-2 rounded-xl border p-2 text-xs transition-colors', categoryId === category.id ? 'glass-primary' : 'border-transparent bg-secondary')}><MoodIcon name={category.icon} size={29} /><span className="truncate">{category.label}</span></button>)}
          </div>
        </section>
        <section className="grid grid-cols-2 gap-3">
          <label className="space-y-2 text-sm text-muted-foreground">日期<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label className="space-y-2 text-sm text-muted-foreground">时间<Input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
        </section>
        <section>
          <p className="mb-3 text-sm font-medium text-muted-foreground">发生了什么？</p>
          <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="写下此刻最想记住的事……" className="min-h-28 resize-none rounded-xl" />
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between"><p className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><ImagePlus size={16} />图片</p><span className="text-xs text-muted-foreground">{imageCount}/6</span></div>
          {imageCount > 0 && <div className="mb-3 grid grid-cols-3 gap-2">
            {existingImages.map((image) => <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg bg-secondary"><img src={image.url} alt="" className="h-full w-full object-cover" /><button type="button" aria-label="移除图片" onClick={() => setKeepImageIds((current) => current.filter((id) => id !== image.id))} className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white"><Trash2 size={15} /></button></div>)}
            {newImages.map((image, index) => <div key={image.url} className="relative aspect-square overflow-hidden rounded-lg bg-secondary"><img src={image.url} alt="" className="h-full w-full object-cover" /><button type="button" aria-label="移除图片" onClick={() => removeNewImage(index)} className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white"><Trash2 size={15} /></button></div>)}
          </div>}
          <div className="relative"><input ref={fileInputRef} type="file" accept="image/*" multiple disabled={processingImages || imageCount >= 6} className="block w-full cursor-pointer rounded-lg border bg-secondary text-sm text-muted-foreground file:mr-3 file:h-10 file:cursor-pointer file:border-0 file:bg-accent file:px-4 file:text-sm file:font-medium disabled:opacity-50" onChange={(event) => selectImages(event.target.files)} />{processingImages && <LoaderCircle size={17} className="pointer-events-none absolute right-3 top-3 animate-spin" />}</div>
        </section>
        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"><Tag size={16} />标签</div>
          <div className="flex flex-wrap gap-2">{tags.map((tag) => <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} className={cn('rounded-full border px-3 py-1.5 text-sm', selectedTags.includes(tag.id) ? 'glass-primary' : 'border-transparent bg-secondary')}>{tag.label}</button>)}</div>
          <div className="mt-3 flex gap-2"><Input value={newTag} onChange={(event) => setNewTag(event.target.value)} placeholder="自定义新标签" onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); createTag(); } }} /><Button type="button" variant="secondary" onClick={createTag} className="shrink-0"><Plus size={16} />添加</Button></div>
        </section>
        <div className="sticky bottom-0 -mx-5 flex gap-3 border-t bg-card/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6"><Button type="button" variant="secondary" onClick={close} disabled={submitting} className="h-12 flex-1 rounded-xl"><X size={18} />取消</Button><Button type="button" onClick={submit} disabled={submitting || processingImages} className="h-12 flex-1 rounded-xl">{submitting ? '保存中…' : '保存记录'}</Button></div>
      </div>
    </DialogContent>
  </Dialog>;
}
