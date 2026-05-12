// Minimal draggable splitter — works for either orientation.
// Receives a `value` (px), an `onChange`, and clamps to [min, max].
import { useEffect, useRef } from 'react';

export default function Splitter({ orientation, value, onChange, min = 120, max = 1200 }) {
  const start = useRef(null);

  function onPointerDown(e) {
    e.preventDefault();
    start.current = {
      x: e.clientX,
      y: e.clientY,
      v: value,
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp, { once: true });
    document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }

  function onPointerMove(e) {
    if (!start.current) return;
    let delta;
    if (orientation === 'vertical') {
      // Right pane: dragging left shrinks the left/middle, growing the right pane.
      delta = start.current.x - e.clientX;
    } else {
      // Bottom pane: dragging up grows the bottom pane.
      delta = start.current.y - e.clientY;
    }
    const next = Math.min(max, Math.max(min, start.current.v + delta));
    onChange(next);
  }

  function onPointerUp() {
    start.current = null;
    window.removeEventListener('pointermove', onPointerMove);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  useEffect(() => () => {
    window.removeEventListener('pointermove', onPointerMove);
  }, []);

  const cls = `splitter splitter-${orientation}`;
  return <div className={cls} onPointerDown={onPointerDown} role="separator" />;
}
