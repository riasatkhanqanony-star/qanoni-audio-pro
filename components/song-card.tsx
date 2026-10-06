"use client";

import Link from 'next/link';
import { Heart, Play } from 'lucide-react';
import { MouseEvent, useEffect, useState } from 'react';
import { usePlayer } from './player-provider';
import { formatDuration } from '@/lib/format';

export default function SongCard({ song, compact = false }: { song: any; compact?: boolean }) {
  const { play } = usePlayer();
  const storageKey = `qanoni-liked-${song.id}`;
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    setLiked(localStorage.getItem(storageKey) === '1');
  }, [storageKey]);

  const like = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (liked) return;
    setLiked(true);
    localStorage.setItem(storageKey, '1');
    await fetch(`/api/public/songs/${song.id}/like`, { method: 'POST' }).catch(() => undefined);
  };

  if (compact) {
    return (
      <button className="compact-card" onClick={() => play(song)}>
        <img src={song.coverUrl} alt="" />
        <span><strong>{song.title}</strong><small>{song.artist}</small></span>
        <Play size={16} fill="currentColor" />
      </button>
    );
  }

  return (
    <article className="card" onClick={() => play(song)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(song); } }}>
      <div className="cover">
        <img src={song.coverUrl} alt={`${song.title} cover`} loading="lazy" />
        <button className="cover-play" onClick={(e) => { e.stopPropagation(); play(song); }} aria-label={`Play ${song.title}`}><Play size={18} fill="currentColor" /></button>
        <div className="cover-glow" />
      </div>
      <div className="card-meta">
        <div className="card-title" title={song.title}>{song.title}</div>
        <div className="card-sub" title={song.artist}>{song.artist}</div>
      </div>
      <div className="card-footer">
        <Link className="card-category" href={`/song/${song.id}`} onClick={(e) => e.stopPropagation()}>
          {song.category?.name || 'Audio'} · {formatDuration(song.duration)}
        </Link>
        <button className={`heart ${liked ? 'liked' : ''}`} onClick={like} aria-label={`Like ${song.title}`}><Heart size={16} fill={liked ? 'currentColor' : 'none'} /></button>
      </div>
    </article>
  );
}
