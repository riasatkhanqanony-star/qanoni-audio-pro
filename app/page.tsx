"use client";

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Search, Sparkles, Headphones, Flame } from 'lucide-react';
import { SideNav, MobileNav } from '@/components/nav';
import SongCard from '@/components/song-card';
import SongList from '@/components/song-list';

const fallbackSettings = {
  appName: 'Qanoni Audio',
  tagline: 'Your sound. Your style.',
  heroEyebrow: 'Premium audio library',
  heroTitle: 'Sound that feels like yours.',
  heroDescription: 'Discover polished ringtones and short audio moments. Play instantly, save favorites, and explore a catalog curated for everyday listening.',
  heroButtonText: 'Explore library',
  featuredTitle: 'Featured for you',
  latestTitle: 'Latest drops',
  footerText: 'Qanoni Audio — a modern audio catalog platform.',
  accentColor: '#ff5a1f',
  showFeatured: true,
  showLatest: true,
  showCategories: true,
};

export default function Home() {
  const [songs, setSongs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(fallbackSettings);
  const [active, setActive] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/public/settings', { cache: 'no-store' }).then((r) => r.json()).catch(() => fallbackSettings),
      fetch('/api/public/categories', { cache: 'no-store' }).then((r) => r.json()).catch(() => []),
    ]).then(([site, cats]) => {
      setSettings({ ...fallbackSettings, ...(site || {}) });
      setCategories(Array.isArray(cats) ? cats : []);
    });
  }, []);

  const [featured, setFeatured] = useState<any[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const latestParams = new URLSearchParams({ sort: 'latest', limit: '100' });
      if (q) latestParams.set('q', q);
      if (active) latestParams.set('category', active);

      const featuredParams = new URLSearchParams({ sort: 'featured', featured: 'true', limit: '20' });
      if (q) featuredParams.set('q', q);
      if (active) featuredParams.set('category', active);

      Promise.all([
        fetch(`/api/public/songs?${latestParams.toString()}`, { cache: 'no-store', signal: controller.signal }).then((r) => r.json()),
        fetch(`/api/public/songs?${featuredParams.toString()}`, { cache: 'no-store', signal: controller.signal }).then((r) => r.json()),
      ])
        .then(([latestData, featuredData]) => {
          setSongs(Array.isArray(latestData) ? latestData : []);
          setFeatured(Array.isArray(featuredData) ? featuredData : []);
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 240);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [active, q]);

  const latest = useMemo(() => songs.slice(0, 8), [songs]);
  const trending = useMemo(() => [...songs].sort((a, b) => Number(b.plays || 0) - Number(a.plays || 0)).slice(0, 5), [songs]);

  return (
    <div className="app-shell" style={{ ['--accent' as any]: settings.accentColor }}>
      <SideNav />
      <main className="main">
        <header className="topbar" id="search">
          <div className="search"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ringtones, artists, moods..." /><span className="search-shortcut">⌘ K</span></div>
          <div className="mini-user"><span className="avatar"><Headphones size={16} /></span><span>Guest</span></div>
        </header>

        <section className="hero">
          <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
          <div className="hero-content">
            <div className="eyebrow"><Sparkles size={14} />{settings.heroEyebrow}</div>
            <h1>{settings.heroTitle}</h1>
            <p>{settings.heroDescription}</p>
            <div className="actions"><a className="btn btn-primary" href="/library">{settings.heroButtonText}<ChevronRight size={17} /></a><a className="btn btn-secondary" href="#featured">Browse featured</a></div>
          </div>
          <div className="hero-stack">
            {trending.slice(0, 3).map((song, index) => <div className={`hero-mini hero-mini-${index}`} key={song.id}><img src={song.coverUrl} alt="" /><div><strong>{song.title}</strong><span>{song.artist}</span></div><Flame size={14} /></div>)}
            {!trending.length && <div className="hero-empty">Your next favorite starts here.</div>}
          </div>
        </section>

        {settings.showCategories && <section className="section category-section">
          <div className="section-head"><div><h2>Browse moods</h2><span>Jump into a sound</span></div></div>
          <div className="chips"><button className={`chip ${active === '' ? 'active' : ''}`} onClick={() => setActive('')}>All</button>{categories.map((c) => <button key={c.id} className={`chip ${active === c.slug ? 'active' : ''}`} onClick={() => setActive(c.slug)}>{c.name}<small>{c._count?.songs ?? 0}</small></button>)}</div>
        </section>}

        {settings.showFeatured && <section className="section" id="featured">
          <div className="section-head"><div><h2>{settings.featuredTitle}</h2><span>Curated picks from your catalog</span></div><a className="section-link" href="/library?sort=likes">View all</a></div>
          {loading ? <div className="empty">Loading your library…</div> : featured.length ? <div className="cards">{featured.slice(0, 5).map((song) => <SongCard key={song.id} song={song} />)}</div> : <div className="empty">No featured audio yet. Mark tracks as featured in Admin Studio.</div>}
        </section>}

        {settings.showLatest && <section className="section">
          <div className="section-head"><div><h2>{settings.latestTitle}</h2><span>Freshly published tracks</span></div><a className="section-link" href="/library">Open library</a></div>
          {latest.length ? <SongList songs={latest} /> : <div className="empty">Your catalog is empty.</div>}
        </section>}

        <footer className="site-footer"><span>{settings.footerText}</span></footer>
      </main>
      <MobileNav />
    </div>
  );
}
