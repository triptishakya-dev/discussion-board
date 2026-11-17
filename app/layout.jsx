import './globals.css';

export const metadata = { title: 'Discussion Board' };
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

const restoreTheme = "try{const t=localStorage.getItem('db-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}";

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: restoreTheme }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
