interface ElementViewProps {
  el: CanvasElement;
  selected: boolean;
  connecting: boolean;
  connectArmed: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onResizeMouseDown: (e: React.MouseEvent) => void;
}

export function ElementView({ el, selected, connecting, connectArmed, onMouseDown, onResizeMouseDown }: ElementViewProps) {
  const boxShadow = el.style.shadow ? `${el.style.shadowX}px ${el.style.shadowY}px ${el.style.shadowBlur}px ${el.style.shadowColor}` : undefined;
  const baseStyle: React.CSSProperties = {
    position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h,
    cursor: connecting ? 'crosshair' : 'move', userSelect: 'none',
    opacity: el.style.opacity / 100,
    transform: el.style.rotation ? `rotate(${el.style.rotation}deg)` : undefined,
    outline: selected ? '2px solid #7C3AED' : connectArmed ? '2px dashed #F97316' : 'none',
    outlineOffset: 2,
    borderWidth: el.style.borderWidth,
    borderColor: el.style.borderColor,
    borderStyle: el.style.borderWidth ? el.style.borderStyle : 'none',
    boxShadow,
  };

  const stopClick = (e: React.MouseEvent) => e.stopPropagation();

  let inner: React.ReactNode;
  if (el.type === 'rect') {
    inner = (
      <div style={{ ...baseStyle, background: el.fill, borderRadius: el.style.borderRadius, display: 'flex', alignItems: 'flex-end', padding: 6 }} onMouseDown={onMouseDown} onClick={stopClick}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>{el.label}</span>
      </div>
    );
  } else if (el.type === 'circle') {
    inner = (
      <div style={{ ...baseStyle, background: el.fill, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseDown={onMouseDown} onClick={stopClick}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.9)' }}>{el.label}</span>
      </div>
    );
  } else {
    inner = (
      <div style={{
        ...baseStyle,
        fontFamily: el.typography.fontFamily,
        fontSize: el.typography.fontSize,
        fontWeight: el.typography.fontWeight,
        lineHeight: el.typography.lineHeight,
        letterSpacing: el.typography.letterSpacing,
        textAlign: el.typography.textAlign,
        color: el.fill,
        display: 'flex',
        alignItems: 'center',
        justifyContent: el.typography.textAlign === 'center' ? 'center' : el.typography.textAlign === 'right' ? 'flex-end' : 'flex-start',
      }} onMouseDown={onMouseDown} onClick={stopClick}>
        {el.text}
      </div>
    );
  }

  return (
    <>
      {inner}
      {selected && (
        <div
          onMouseDown={onResizeMouseDown}
          onClick={stopClick}
          style={{
            position: 'absolute', left: el.x + el.w - 6, top: el.y + el.h - 6, width: 12, height: 12,
            background: '#7C3AED', border: '2px solid #fff', borderRadius: 3, cursor: 'nwse-resize', zIndex: 5,
          }}
        />
      )}
    </>
  );
}
