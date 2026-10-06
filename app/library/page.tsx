"use client";

import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { SideNav, MobileNav } from '@/components/nav';
import SongCard from '@/components/song-card';

export default function Library() {
  const [songs, setSongs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('latest');

  useEffect(() => {
    fetch('/api/public/categories', { cache: 'no-store' }).then((r) => r.json()).then((d) => setCategories(Array.isArray(d) ? d : [])).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ sort });
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      fetch(`/api/public/songs?${params.toString()}`, { cache: 'no-store', signal: controller.signal }).then((r) => r.json()).then((d) => setSongs(Array.isArray(d) ? d : [])).catch(() => undefined);
    }, 180);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [q, category, sort]);

  const title = useMemo(() => category ? `${categories.find((c) => c.slug === category)?.name || 'Category'} library` : 'All audio', [category, categories]);

  return (
    <div className="app-shell"><SideNav /><main className="main">
      <header className="topbar"><div className="search"><Search size={18}/><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the full library..."/></div><div className="library-sort"><SlidersHorizontal size={16}/><select value={sort} onChange={(e) => setSort(e.target.value)}><option value="latest">Latest</option><option value="plays">Most played</option><option value="likes">Most liked</option></select></div></header>
      <section className="section library-top"><div className="section-head"><div><p className="eyebrow">Library</p><h2>{title}</h2><span>{songs.length} published items</span></div></div>
        <div className="chips"> <button className={`chip ${category === '' ? 'active' : ''}`} onClick={() => setCategory('')}>All</button>{categories.map((c) => <button key={c.id} className={`chip ${category === c.slug ? 'active' : ''}`} onClick={() => setCategory(c.slug)}>{c.name}<small>{c._count?.songs ?? 0}</small></button>)}</div>
      </section>
      <section className="section">{songs.length ? <div className="cards">{songs.map((song) => <SongCard key={song.id} song={song}/>)}</div> : <div className="empty">No audio matches your filters.</div>}</section>
    </main><MobileNav/></div>
  );
}
