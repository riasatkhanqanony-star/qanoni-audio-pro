"use client";

import { Heart, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePlayer } from './player-provider';
import { formatDuration } from '@/lib/format';

export default function SongList({ songs }: { songs: any[] }) {
  const { play } = usePlayer();
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const next: Record<string, boolean> = {};
    songs.forEach((song) => { next[song.id] = localStorage.getItem(`qanoni-liked-${song.id}`) === '1'; });
    setLiked(next);
  }, [songs]);

  const like = async (id: string) => {
    if (liked[id]) return;
    setLiked((prev) => ({ ...prev, [id]: true }));
    localStorage.setItem(`qanoni-liked-${id}`, '1');
    await fetch(`/api/public/songs/${id}/like`, { method: 'POST' }).catch(() => undefined);
  };

  return (
    <div className="list">
      {songs.map((song, index) => (
        <div className="row" key={song.id}>
          <div className="row-index">{String(index + 1).padStart(2, '0')}</div>
          <img className="row-cover" src={song.coverUrl} alt="" />
          <button className="row-meta text-button" onClick={() => play(song, songs)}>
            <span className="row-title">{song.title}</span>
            <span className="row-artist">{song.artist}</span>
          </button>
          <div className="row-stat">{Number(song.plays || 0).toLocaleString()}</div>
          <div className="row-stat duration">{formatDuration(song.duration)}</div>
          <div className="row-actions">
            <button className={`heart ${liked[song.id] ? 'liked' : ''}`} onClick={() => like(song.id)} aria-label="Like"><Heart size={16} fill={liked[song.id] ? 'currentColor' : 'none'} /></button>
            <button className="ghost-icon" onClick={() => play(song, songs)} aria-label={`Play ${song.title}`}><Play size={17} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
