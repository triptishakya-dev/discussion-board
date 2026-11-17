export default function BoardCanvas() {
  return (
    <>
      <div id="board" className="fixed inset-0 cursor-grab"><div id="world"></div></div>
      
      <h1 className="board-title">Discussion Board</h1>

      <div className="mini glass" id="mini" title="Overview"><canvas id="mm" width="360" height="240"></canvas></div>
    </>
  );
}
