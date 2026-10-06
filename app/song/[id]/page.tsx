"use client";

import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Heart, Play, Share2, Headphones } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { usePlayer } from '@/components/player-provider';
import { formatDuration } from '@/lib/format';

export default function SongPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { play } = usePlayer();
  const [song, setSong] = useState<any | null>(null);
  const [liked, setLiked] = useState(false);
  const [downloadAllowed, setDownloadAllowed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/public/songs/${params.id}`, { cache: 'no-store' }).then(async (r) => {
      if (!r.ok) throw new Error();
      return r.json();
    }).then((d) => { setSong(d); setLiked(localStorage.getItem(`qanoni-liked-${d.id}`) === '1'); }).catch(() => router.replace('/library'));
    fetch('/api/public/settings', { cache: 'no-store' }).then((r) => r.json()).then((d) => setDownloadAllowed(Boolean(d?.allowDownloads))).catch(() => undefined);
  }, [params.id, router]);

  if (!song) return <main className="detail-page"><div className="detail-loading">Loading audio…</div></main>;

  const like = async () => {
    if (liked) return;
    setLiked(true);
    localStorage.setItem(`qanoni-liked-${song.id}`, '1');
    fetch(`/api/public/songs/${song.id}/like`, { method: 'POST' }).catch(() => undefined);
  };

  const download = async () => {
    if (!downloadAllowed) return;
    fetch(`/api/public/songs/${song.id}/download`, { method: 'POST' }).catch(() => undefined);
    const a = document.createElement('a'); a.href = song.audioUrl; a.download = `${song.title}.wav`; a.target = '_blank'; a.rel = 'noopener'; a.click();
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: song.title, text: `${song.title} — ${song.artist}`, url }).catch(() => undefined);
    else { await navigator.clipboard.writeText(url).catch(() => undefined); setCopied(true); setTimeout(() => setCopied(false), 1600); }
  };

  return <main className="detail-page">
    <div className="detail-wrap">
      <button className="back-link" onClick={() => router.back()}><ArrowLeft size={16}/>Back to library</button>
      <section className="detail-hero">
        <div className="detail-cover"><img src={song.coverUrl} alt="" /></div>
        <div className="detail-copy">
          <p className="eyebrow"><Headphones size={14}/> {song.category?.name || 'Audio'}</p>
          <h1>{song.title}</h1>
          <p className="detail-artist">{song.artist}</p>
          <p className="detail-description">{song.description || 'A polished audio track ready to play.'}</p>
          <div className="detail-stats"><span>{Number(song.plays || 0).toLocaleString()} plays</span><span>{Number(song.likes || 0).toLocaleString()} likes</span><span>{formatDuration(song.duration)}</span></div>
          <div className="actions"><button className="btn btn-primary" onClick={() => play(song)}><Play size={17} fill="currentColor"/>Play now</button><button className={`circle-action ${liked ? 'liked' : ''}`} onClick={like}><Heart size={17} fill={liked ? 'currentColor' : 'none'}/></button>{downloadAllowed && <button className="circle-action" onClick={download}><Download size={17}/></button>}<button className="circle-action" onClick={share}><Share2 size={17}/></button></div>
          {copied && <span className="copy-note">Link copied.</span>}
        </div>
      </section>
    </div>
  </main>;
}
