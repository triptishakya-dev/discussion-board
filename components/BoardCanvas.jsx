export default function BoardCanvas() {
  return (
    <>
      <div id="board" className="fixed inset-0 cursor-grab"><div id="world"></div></div>
      
      <div className="hint" id="hint">
        <h1><b>Open a folder</b><span>to start.</span></h1>
        <p>Every square foot either builds brand equity or wastes it.</p>
        <div className="keys"><span><b>Drag</b> to move around</span><span><b>Pinch</b> to zoom</span><span><b>Double-tap</b> to focus</span></div>
      </div>
      
      <div className="mini glass" id="mini" title="Overview"><canvas id="mm" width="360" height="240"></canvas></div>
    </>
  );
}
