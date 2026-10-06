import './globals.css';
import type { Metadata } from 'next';
import { PlayerProvider } from '@/components/player-provider';

export const metadata: Metadata = {
  title: 'Qanoni Audio — Premium Audio',
  description: 'A professional, dynamic ringtone and audio streaming catalog.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <PlayerProvider>{children}</PlayerProvider>
      </body>
    </html>
  );
}
