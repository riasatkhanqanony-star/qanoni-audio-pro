"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BarChart3, Check, ChevronRight, Edit3, FileAudio, FolderPlus, ImagePlus, LogOut, Music2, Plus, RefreshCw, Save, Search, Settings2, Trash2, Pencil, X } from 'lucide-react';
import { upload as blobUpload } from '@vercel/blob/client';
import { useRouter } from 'next/navigation';

type Song = { id: string; title: string; artist: string; description?: string | null; coverUrl: string; audioUrl: string; duration: number; categoryId?: string | null; category?: { name: string } | null; isFeatured: boolean; isPublished: boolean; plays: number; likes: number; downloads: number; sortOrder: number; createdAt: string };
type Cat = { id: string; name: string; slug: string; _count?: { songs: number } };

type Settings = { appName: string; tagline: string; heroEyebrow: string; heroTitle: string; heroDescription: string; heroButtonText: string; featuredTitle: string; latestTitle: string; footerText: string; accentColor: string; allowDownloads: boolean; showFeatured: boolean; showLatest: boolean; showCategories: boolean };

const emptySong = { title: '', artist: 'Qanoni Audio', description: '', coverUrl: '', audioUrl: '', duration: 0, categoryId: '', isFeatured: false, isPublished: true, sortOrder: 0 };
const emptySettings: Settings = { appName: 'Qanoni Audio', tagline: 'Your sound. Your style.', heroEyebrow: 'Premium audio library', heroTitle: 'Sound that feels like yours.', heroDescription: '', heroButtonText: 'Explore library', featuredTitle: 'Featured for you', latestTitle: 'Latest drops', footerText: '', accentColor: '#ff5a1f', allowDownloads: true, showFeatured: true, showLatest: true, showCategories: true };

export default function Admin() {
  const router = useRouter();
  const [tab, setTab] = useState<'overview'|'songs'|'categories'|'settings'>('overview');
  const [songs, setSongs] = useState<Song[]>([]);
  const [categories, setCategories] = useState<Cat[]>([]);
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [songForm, setSongForm] = useState<any>(emptySong);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };

  const load = async () => {
    setBusy(true);
    try {
      const me = await fetch('/api/auth/me', { cache: 'no-store' }).then((r) => r.json());
      if (!me.authenticated) { router.replace('/admin/login'); return; }
      const qs = new URLSearchParams(); if (search) qs.set('q', search); if (status !== 'all') qs.set('status', status);
      const [s, c, site] = await Promise.all([
        fetch(`/api/admin/songs?${qs.toString()}`, { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/categories', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/admin/settings', { cache: 'no-store' }).then((r) => r.json())
      ]);
      setSongs(Array.isArray(s) ? s : []); setCategories(Array.isArray(c) ? c : []); setSettings({ ...emptySettings, ...(site || {}) }); setReady(true);
    } catch { notify('Could not load admin data.'); }
    finally { setBusy(false); }
  };

  useEffect(() => { load(); }, [router]);
  useEffect(() => { if (!ready) return; const t = window.setTimeout(load, 220); return () => window.clearTimeout(t); }, [search, status]);

  const stats = useMemo(() => ({ total: songs.length, published: songs.filter((s) => s.isPublished).length, featured: songs.filter((s) => s.isFeatured).length, plays: songs.reduce((n, s) => n + Number(s.plays || 0), 0), likes: songs.reduce((n, s) => n + Number(s.likes || 0), 0), downloads: songs.reduce((n, s) => n + Number(s.downloads || 0), 0) }), [songs]);

  const uploadFile = async (file: File, type: 'covers'|'audio') => {
    if (process.env.NEXT_PUBLIC_VERCEL_BLOB_ENABLED === 'true') {
      const blob = await blobUpload(`qanoni-audio/${type}/${file.name}`, file, { access: 'public', handleUploadUrl: '/api/admin/upload', contentType: file.type });
      return blob.url;
    }
    const fd = new FormData(); fd.append('file', file); fd.append('type', type);
    const r = await fetch('/api/admin/upload', { method: 'POST', body: fd }); const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Upload failed');
    return d.url;
  };

  const chooseAudio = (file: File | null) => {
    setAudio(file);
    if (!file) return;
    const url = URL.createObjectURL(file); const a = document.createElement('audio'); a.preload = 'metadata'; a.onloadedmetadata = () => { setSongForm((prev: any) => ({ ...prev, duration: Math.round(a.duration || 0) })); URL.revokeObjectURL(url); }; a.src = url;
  };

  const resetSong = () => { setSongForm({ ...emptySong }); setCover(null); setAudio(null); setEditing(null); };

  const saveSong = async () => {
    if (!songForm.title.trim()) return notify('Title is required.');
    if (!editing && (!cover || !audio)) return notify('Choose a cover image and audio file.');
    setBusy(true);
    try {
      let coverUrl = songForm.coverUrl; let audioUrl = songForm.audioUrl;
      if (cover) coverUrl = await uploadFile(cover, 'covers');
      if (audio) audioUrl = await uploadFile(audio, 'audio');
      const payload = { ...songForm, coverUrl, audioUrl, duration: Number(songForm.duration) || 0, categoryId: songForm.categoryId || null };
      const r = await fetch(editing ? `/api/admin/songs/${editing}` : '/api/admin/songs', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Save failed');
      notify(editing ? 'Track updated.' : 'Track published.'); resetSong(); await load(); setTab('songs');
    } catch (e: any) { notify(e.message || 'Could not save track.'); }
    finally { setBusy(false); }
  };

  const editSong = (song: Song) => { setEditing(song.id); setSongForm({ title: song.title, artist: song.artist, description: song.description || '', coverUrl: song.coverUrl, audioUrl: song.audioUrl, duration: song.duration, categoryId: song.categoryId || '', isFeatured: song.isFeatured, isPublished: song.isPublished, sortOrder: song.sortOrder }); setCover(null); setAudio(null); setTab('songs'); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const deleteSong = async (song: Song) => { if (!window.confirm(`Delete “${song.title}”? This also removes its stored media.`)) return; setBusy(true); const r = await fetch(`/api/admin/songs/${song.id}`, { method: 'DELETE' }); if (r.ok) { notify('Track deleted.'); await load(); } else notify('Delete failed.'); setBusy(false); };

  const saveCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim() || !catSlug.trim()) return;
    const normalized = catSlug.trim().toLowerCase().replace(/\s+/g, '-');
    const url = editingCategory ? `/api/admin/categories/${editingCategory}` : '/api/admin/categories';
    const r = await fetch(url, { method: editingCategory ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: catName.trim(), slug: normalized }) });
    const d = await r.json();
    if (r.ok) { setCatName(''); setCatSlug(''); setEditingCategory(null); notify(editingCategory ? 'Category updated.' : 'Category created.'); await load(); } else notify(d.error || 'Category failed.');
  };
  const editCategory = (c: Cat) => { setEditingCategory(c.id); setCatName(c.name); setCatSlug(c.slug); };
  const cancelCategoryEdit = () => { setEditingCategory(null); setCatName(''); setCatSlug(''); };
  const deleteCategory = async (c: Cat) => { if (!window.confirm(`Delete category “${c.name}”? Songs stay safe.`)) return; const r = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' }); const d = await r.json(); if (r.ok) { notify('Category deleted.'); await load(); } else notify(d.error || 'Cannot delete category.'); };
  const saveSettings = async () => { setBusy(true); const r = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); const d = await r.json(); if (r.ok) { setSettings(d); notify('Website settings saved.'); } else notify(d.error || 'Settings failed.'); setBusy(false); };

  const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.replace('/admin/login'); };

  if (!ready) return <main className="admin-page"><div className="admin-loading">Loading Studio…</div></main>;

  return <main className="admin-page">
    <header className="admin-header"><div><div className="admin-kicker">QANONI AUDIO / STUDIO</div><h1>Control center</h1><p>Manage the public catalog without exposing the studio to visitors.</p></div><div className="admin-head-actions"><a className="btn btn-secondary" href="/">View site <ChevronRight size={15}/></a><button className="btn btn-secondary" onClick={logout}><LogOut size={15}/>Sign out</button></div></header>
    <div className="admin-layout">
      <aside className="admin-sidebar">
        {([['overview','Overview',BarChart3],['songs','Songs',Music2],['categories','Categories',FolderPlus],['settings','Website',Settings2]] as const).map(([key, label, Icon]) => <button key={key} className={tab===key ? 'active' : ''} onClick={() => setTab(key)}><Icon size={17}/>{label}</button>)}
        <div className="admin-side-footer"><span>PostgreSQL</span><span>Vercel Blob</span><span>Dynamic CMS</span></div>
      </aside>
      <section className="admin-content">
        {tab === 'overview' && <>
          <div className="stats-grid">{[['Tracks', stats.total, Music2],['Published',stats.published,Check],['Featured',stats.featured,FileAudio],['Plays',stats.plays,BarChart3],['Likes',stats.likes,HeartIcon],['Downloads',stats.downloads,DownloadIcon]].map(([label,value,Icon]: any)=><div className="stat-card" key={label}><div><span>{label}</span><strong>{Number(value).toLocaleString()}</strong></div><Icon size={18}/></div>)}</div>
          <div className="admin-panel"><div className="panel-head"><div><h2>Quick publish</h2><p>Add a track in seconds — cover and audio come from a real file picker.</p></div><button className="btn btn-primary" onClick={() => { resetSong(); setTab('songs'); }}><Plus size={16}/>Add track</button></div><div className="quick-grid"><button onClick={() => setTab('songs')}><Music2 size={20}/><b>Catalog</b><span>Edit, publish, feature or remove tracks.</span></button><button onClick={() => setTab('categories')}><FolderPlus size={20}/><b>Categories</b><span>Organize the public library.</span></button><button onClick={() => setTab('settings')}><Settings2 size={20}/><b>Website</b><span>Change hero text, sections, accent and downloads.</span></button></div></div>
          <div className="admin-panel"><div className="panel-head"><div><h2>Latest tracks</h2><p>Most recently managed items.</p></div><button className="ghost-icon" onClick={load}><RefreshCw size={17}/></button></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>Track</th><th>Category</th><th>Status</th><th>Plays</th><th></th></tr></thead><tbody>{songs.slice(0,8).map((s)=><tr key={s.id}><td><div className="table-song"><img src={s.coverUrl} alt=""/><span><b>{s.title}</b><small>{s.artist}</small></span></div></td><td>{s.category?.name || '—'}</td><td><span className={s.isPublished ? 'status-pill' : 'status-pill off'}>{s.isPublished ? 'Published' : 'Draft'}</span></td><td>{s.plays.toLocaleString()}</td><td><button className="table-action" onClick={() => editSong(s)}><Edit3 size={15}/></button></td></tr>)}</tbody></table></div></div>
        </>}

        {tab === 'songs' && <>
          <div className="panel-head"><div><h2>{editing ? 'Edit track' : 'Add a track'}</h2><p>Everything is database-backed. Media is uploaded by browsing your device.</p></div>{editing && <button className="ghost-icon" onClick={resetSong}><X size={18}/></button>}</div>
          <div className="admin-panel nested"><div className="song-form-grid">
            <Field label="Title *"><input value={songForm.title} onChange={(e)=>setSongForm({...songForm,title:e.target.value})} placeholder="Midnight Drive"/></Field>
            <Field label="Artist"><input value={songForm.artist} onChange={(e)=>setSongForm({...songForm,artist:e.target.value})} placeholder="Artist name"/></Field>
            <Field label="Category"><select value={songForm.categoryId} onChange={(e)=>setSongForm({...songForm,categoryId:e.target.value})}><option value="">No category</option>{categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Sort order"><input type="number" value={songForm.sortOrder} onChange={(e)=>setSongForm({...songForm,sortOrder:Number(e.target.value)})}/></Field>
            <Field label="Description" full><textarea value={songForm.description} onChange={(e)=>setSongForm({...songForm,description:e.target.value})} placeholder="A short description..."/></Field>
            <FileField label="Cover image" icon={<ImagePlus size={18}/>} file={cover} current={songForm.coverUrl} accept="image/*" onChange={setCover}/>
            <FileField label="Audio file" icon={<FileAudio size={18}/>} file={audio} current={songForm.audioUrl} accept="audio/*" onChange={chooseAudio}/>
            <div className="toggles full"><label><input type="checkbox" checked={songForm.isFeatured} onChange={(e)=>setSongForm({...songForm,isFeatured:e.target.checked})}/><span>Featured</span></label><label><input type="checkbox" checked={songForm.isPublished} onChange={(e)=>setSongForm({...songForm,isPublished:e.target.checked})}/><span>Published</span></label></div>
          </div><div className="form-actions"><button className="btn btn-secondary" onClick={resetSong}>Reset</button><button className="btn btn-primary" disabled={busy} onClick={saveSong}>{busy ? 'Saving…' : <><Save size={16}/>{editing ? 'Save changes' : 'Publish track'}</>}</button></div></div>
          <div className="admin-panel"><div className="toolbar"><div className="search admin-search"><Search size={16}/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search title or artist..."/></div><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="all">All</option><option value="published">Published</option><option value="draft">Draft</option></select></div><div className="table-wrap"><table className="admin-table"><thead><tr><th>Track</th><th>Category</th><th>State</th><th>Plays</th><th>Likes</th><th>Actions</th></tr></thead><tbody>{songs.map((s)=><tr key={s.id}><td><div className="table-song"><img src={s.coverUrl} alt=""/><span><b>{s.title}</b><small>{s.artist}</small></span></div></td><td>{s.category?.name || '—'}</td><td><span className={s.isPublished ? 'status-pill' : 'status-pill off'}>{s.isPublished ? 'Published' : 'Draft'}</span>{s.isFeatured && <span className="feature-dot">Featured</span>}</td><td>{s.plays.toLocaleString()}</td><td>{s.likes.toLocaleString()}</td><td><div className="table-actions"><button className="table-action" onClick={() => editSong(s)}><Edit3 size={15}/></button><button className="table-action danger-action" onClick={() => deleteSong(s)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div></div>
        </>}

        {tab === 'categories' && <>
          <div className="panel-head"><div><h2>Categories</h2><p>Categories are public filters and fully editable.</p></div></div>
          <div className="admin-panel nested"><form className="category-create" onSubmit={saveCategory}><Field label="Name"><input value={catName} onChange={(e)=>setCatName(e.target.value)} placeholder="Romantic"/></Field><Field label="Slug"><input value={catSlug} onChange={(e)=>setCatSlug(e.target.value)} placeholder="romantic"/></Field><div style={{display:'flex',gap:8}}><button className="btn btn-primary" type="submit">{editingCategory ? <><Save size={16}/>Save</> : <><Plus size={16}/>Add category</>}</button>{editingCategory && <button className="btn btn-secondary" type="button" onClick={cancelCategoryEdit}>Cancel</button>}</div></form></div>
          <div className="category-grid">{categories.map((c)=><div className="category-card" key={c.id}><div className="category-icon"><Music2 size={17}/></div><div><b>{c.name}</b><span>/{c.slug} · {c._count?.songs ?? 0} tracks</span></div><div className="table-actions"><button className="table-action" onClick={()=>editCategory(c)}><Pencil size={15}/></button><button className="table-action danger-action" onClick={()=>deleteCategory(c)}><Trash2 size={15}/></button></div></div>)}</div>
        </>}

        {tab === 'settings' && <>
          <div className="panel-head"><div><h2>Public website settings</h2><p>Change what visitors see without touching the public React code.</p></div><button className="btn btn-primary" onClick={saveSettings} disabled={busy}><Save size={16}/>Save website</button></div>
          <div className="settings-grid admin-panel nested">
            {([['appName','App name'],['tagline','Tagline'],['heroEyebrow','Hero eyebrow'],['heroTitle','Hero title'],['heroButtonText','Hero button'],['featuredTitle','Featured section title'],['latestTitle','Latest section title'],['footerText','Footer text']] as const).map(([key,label])=><Field key={key} label={label}><input value={(settings as any)[key]} onChange={(e)=>setSettings({...settings,[key]:e.target.value})}/></Field>)}
            <Field label="Hero description" full><textarea value={settings.heroDescription} onChange={(e)=>setSettings({...settings,heroDescription:e.target.value})}/></Field>
            <Field label="Accent color"><div className="color-row"><input type="color" value={settings.accentColor} onChange={(e)=>setSettings({...settings,accentColor:e.target.value})}/><input value={settings.accentColor} onChange={(e)=>setSettings({...settings,accentColor:e.target.value})}/></div></Field>
            <div className="toggles"><label><input type="checkbox" checked={settings.allowDownloads} onChange={(e)=>setSettings({...settings,allowDownloads:e.target.checked})}/><span>Allow downloads</span></label><label><input type="checkbox" checked={settings.showFeatured} onChange={(e)=>setSettings({...settings,showFeatured:e.target.checked})}/><span>Show featured</span></label><label><input type="checkbox" checked={settings.showLatest} onChange={(e)=>setSettings({...settings,showLatest:e.target.checked})}/><span>Show latest</span></label><label><input type="checkbox" checked={settings.showCategories} onChange={(e)=>setSettings({...settings,showCategories:e.target.checked})}/><span>Show categories</span></label></div>
          </div>
        </>}
      </section>
    </div>
    {toast && <div className="toast">{toast}</div>}
  </main>;
}

function Field({ label, children, full=false }: { label: string; children: React.ReactNode; full?: boolean }) { return <div className={`field ${full ? 'full' : ''}`}><label>{label}</label>{children}</div>; }
function FileField({ label, icon, file, current, accept, onChange }: { label: string; icon: React.ReactNode; file: File | null; current?: string; accept: string; onChange: (file: File | null) => void }) { return <div className="upload-field"><label>{icon}{label}</label><input type="file" accept={accept} onChange={(e)=>onChange(e.target.files?.[0] || null)}/>{file && <span className="file-name">{file.name}</span>}{!file && current && <span className="file-name">Existing file is active</span>}</div>; }
function HeartIcon({size}:{size?:number}) { return <span className="metric-glyph" style={{fontSize:size}} aria-hidden>♥</span>; }
function DownloadIcon({size}:{size?:number}) { return <span className="metric-glyph" style={{fontSize:size}} aria-hidden>↓</span>; }
