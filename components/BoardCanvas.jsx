import { CONFIG } from '../lib/board-config';

export default function BoardCanvas() {
  return (
    <>
      <div id="board" className="fixed inset-0 z-[1] cursor-grab"><div id="world" className="absolute left-0 top-0 origin-top-left will-change-transform"></div></div>
      
      <div className="hint" id="hint"><b>Open a folder to start</b><span>Drag to move around · pinch or scroll to zoom</span></div>
      
      <div className="brand glass" id="brand"><b>{CONFIG.brandName}</b><small>Discussion board</small></div>
      <div className="mini glass" id="mini" title="Overview"><canvas id="mm" width="360" height="240"></canvas></div>
    </>
  );
}
