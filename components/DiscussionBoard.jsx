'use client';

import { useEffect, useRef } from 'react';
import { mountBoard } from '../lib/board-engine';
import BoardBackground from './BoardBackground';
import BoardCanvas from './BoardCanvas';
import FolderDock from './FolderDock';
import HelperMascot from './HelperMascot';
import BoardOverlays from './BoardOverlays';

export default function DiscussionBoard() {
  const root = useRef(null);
  useEffect(() => mountBoard(root.current), []);

  return (
    <main ref={root}>
      <BoardBackground />
      <BoardCanvas />
      <FolderDock />
      <HelperMascot />
      <BoardOverlays />
    </main>
  );
}
