"use client";

import Link from 'next/link';
import { Compass, Heart, Home, Library, Search, Headphones } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function SideNav() {
  const pathname = usePathname();
  const [appName, setAppName] = useState('Qanoni Audio');

  useEffect(() => {
    fetch('/api/public/settings', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d?.appName) setAppName(d.appName); })
      .catch(() => undefined);
  }, []);

  const active = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/library') return pathname === '/library' || pathname.startsWith('/song/');
    return false;
  };

  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brand-mark"><Headphones size={18} /></span>
        <span>{appName}</span>
      </Link>
      <div className="nav-group">
        <p className="nav-title">Discover</p>
        <Link className={`nav-item ${active('/') ? 'active' : ''}`} href="/"><Home size={18} />Home</Link>
        <Link className={`nav-item ${active('/library') ? 'active' : ''}`} href="/library"><Library size={18} />Library</Link>
        <Link className="nav-item" href="/#search"><Search size={18} />Search</Link>
      </div>
      <div className="nav-group">
        <p className="nav-title">Your space</p>
        <Link className="nav-item" href="/library?sort=likes"><Heart size={18} />Most liked</Link>
        <Link className="nav-item" href="/library?sort=plays"><Compass size={18} />Most played</Link>
      </div>
      <div className="side-note"><strong>Made to play.</strong><span>Explore, tap play, and keep your favorites close.</span></div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-nav">
      <Link className={pathname === '/' ? 'active' : ''} href="/"><Home size={18}/><span>Home</span></Link>
      <Link className={pathname === '/library' || pathname.startsWith('/song/') ? 'active' : ''} href="/library"><Library size={18}/><span>Library</span></Link>
      <Link href="/#search"><Search size={18}/><span>Search</span></Link>
      <Link href="/library?sort=likes"><Heart size={18}/><span>Likes</span></Link>
    </nav>
  );
}
