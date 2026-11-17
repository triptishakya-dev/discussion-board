export default function BoardBackground() {
  return (
    <div className="bg pointer-events-none fixed inset-0 z-0 overflow-hidden" id="bg" aria-hidden="true">
      <div className="field">
        {[1, 2, 3, 4, 5].map(index => <i key={index} className={`f${index}`} />)}
      </div>
      <div className="halftone" />
      <div className="rig" id="rig">
        {Array.from({ length: 7 }, (_, index) => (
          <div className="slot absolute left-0 top-0" key={index}
            style={{ transform: `translate(${index * 12}vmin, ${(index * 4.2).toFixed(1)}vmin)` }}>
            <div className="pane" style={{ '--i': index, animationDelay: `${index * -0.7}s` }} />
          </div>
        ))}
      </div>
      <div className="vignette" />
    </div>
  );
}
