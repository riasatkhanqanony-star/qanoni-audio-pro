"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, SkipBack, SkipForward, Volume2, X, ListMusic } from 'lucide-react';
import { formatDuration } from '@/lib/format';

type Song = {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number;
  likes: number;
  plays: number;
};

type PlayerCtx = {
  current: Song | null;
  playing: boolean;
  progress: number;
  duration: number;
  volume: number;
  queue: Song[];
  play: (song: Song, list?: Song[]) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (value: number) => void;
  setVolume: (value: number) => void;
  stop: () => void;
};

const C = createContext<PlayerCtx | null>(null);
export function usePlayer() {
  const c = useContext(C);
  if (!c) throw new Error('usePlayer must be inside PlayerProvider');
  return c;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Song[]>([]);
  const indexRef = useRef(0);
  const [current, setCurrent] = useState<Song | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);

  useEffect(() => {
    const el = new Audio();
    el.preload = 'metadata';
    el.volume = volume;
    audio.current = el;

    const onTime = () => setProgress(el.currentTime || 0);
    const onMeta = () => setDuration(Number.isFinite(el.duration) ? el.duration : (current?.duration || 0));
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      const list = queueRef.current;
      if (!list.length) return setPlaying(false);
      const nextIndex = (indexRef.current + 1) % list.length;
      indexRef.current = nextIndex;
      const nextSong = list[nextIndex];
      setCurrent(nextSong);
      el.src = nextSong.audioUrl;
      el.currentTime = 0;
      el.play().catch(() => setPlaying(false));
      fetch(`/api/public/songs/${nextSong.id}/play`, { method: 'POST' }).catch(() => undefined);
    };

    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);

    return () => {
      el.pause();
      el.src = '';
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
    };
  }, []);

  const play = (song: Song, list?: Song[]) => {
    if (list?.length) queueRef.current = list;
    else if (!queueRef.current.length) queueRef.current = [song];

    const idx = queueRef.current.findIndex((item) => item.id === song.id);
    indexRef.current = idx >= 0 ? idx : 0;

    const el = audio.current;
    if (!el) return;

    const sameSong = current?.id === song.id;
    setCurrent(song);

    if (sameSong && el.src === new URL(song.audioUrl, window.location.origin).href) {
      if (el.paused) el.play().catch(() => setPlaying(false));
      return;
    }

    setProgress(0);
    el.src = song.audioUrl;
    el.currentTime = 0;
    el.play().catch(() => setPlaying(false));
    fetch(`/api/public/songs/${song.id}/play`, { method: 'POST' }).catch(() => undefined);
  };

  const toggle = () => {
    const el = audio.current;
    if (!el || !current) return;
    if (el.paused) el.play().catch(() => setPlaying(false));
    else el.pause();
  };

  const next = () => {
    const list = queueRef.current;
    if (!list.length) return;
    indexRef.current = (indexRef.current + 1) % list.length;
    play(list[indexRef.current], list);
  };

  const previous = () => {
    const list = queueRef.current;
    if (!list.length) return;
    indexRef.current = (indexRef.current - 1 + list.length) % list.length;
    play(list[indexRef.current], list);
  };

  const seek = (value: number) => {
    if (!audio.current) return;
    audio.current.currentTime = value;
    setProgress(value);
  };

  const setVolume = (value: number) => {
    setVolumeState(value);
    if (audio.current) audio.current.volume = value;
  };

  const stop = () => {
    if (audio.current) audio.current.pause();
    setCurrent(null);
    setProgress(0);
  };

  const value = useMemo<PlayerCtx>(() => ({
    current, playing, progress, duration, volume, queue: queueRef.current,
    play, toggle, next, previous, seek, setVolume, stop
  }), [current, playing, progress, duration, volume]);

  return <C.Provider value={value}>{children}<PlayerBar /></C.Provider>;
}

function PlayerBar() {
  const { current, playing, progress, duration, volume, toggle, next, previous, seek, setVolume, stop } = usePlayer();
  if (!current) return null;
  const max = duration || current.duration || 1;
  return (
    <div className="player-shell">
      <div className="player-cover"><img src={current.coverUrl} alt="" /></div>
      <div className="player-song">
        <strong>{current.title}</strong>
        <span>{current.artist}</span>
      </div>
      <div className="player-center">
        <div className="controls">
          <button className="ghost-icon" onClick={previous} aria-label="Previous"><SkipBack size={17} /></button>
          <button className="play-main" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
          </button>
          <button className="ghost-icon" onClick={next} aria-label="Next"><SkipForward size={17} /></button>
        </div>
        <div className="progress-row">
          <span>{formatDuration(progress)}</span>
          <input aria-label="Track progress" type="range" min={0} max={max} step={0.1} value={Math.min(progress, max)} onChange={(e) => seek(Number(e.target.value))} />
          <span>{formatDuration(duration || current.duration)}</span>
        </div>
      </div>
      <div className="player-actions">
        <div className="volume-control"><Volume2 size={16} /><input aria-label="Volume" type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} /></div>
        <ListMusic size={16} />
        <button className="ghost-icon" onClick={stop} aria-label="Close player"><X size={17} /></button>
      </div>
    </div>
  );
}
