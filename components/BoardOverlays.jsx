export default function BoardOverlays() {
  return (
    <>
      <div className="modal" id="modal"><div className="sheet" id="sheet"></div></div>
      <div className="toast glass" id="toast" role="status"></div>
      <input type="file" id="file" multiple hidden />
    </>
  );
}
