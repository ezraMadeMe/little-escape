import React, { useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "../../../shared/hooks/useIsMobile";

export type SwipeDeckItem = {
  id: string;
  name: string;
  subtitle?: string;
};

type Props<T extends SwipeDeckItem> = {
  items: T[];
  index: number;
  onIndexChange: (nextIndex: number) => void;

  onAccept?: (item: T) => void; // 오른쪽
  onReject?: (item: T) => void; // 왼쪽

  renderCard?: (item: T) => React.ReactNode;

  height?: number;
  thresholdPx?: number;
};

type Point = { x: number; y: number };

export function SwipeDeck<T extends SwipeDeckItem>(props: Props<T>) {
  const isMobile = useIsMobile();
  const height = props.height ?? (isMobile ? 260 : 280);
  const threshold = props.thresholdPx ?? (isMobile ? 90 : 120);

  const items = props.items ?? [];
  const maxIndex = Math.max(0, items.length - 1);
  const idx = Math.max(0, Math.min(props.index, maxIndex));

  const top = items[idx] ?? null;
  const next = items[idx + 1] ?? null;

  const [drag, setDrag] = useState<Point>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<Point | null>(null);
  const baseRef = useRef<Point>({ x: 0, y: 0 });
  const animRef = useRef(false);

  const progress = useMemo(() => {
    const p = drag.x / threshold;
    return Math.max(-1, Math.min(1, p));
  }, [drag.x, threshold]);

  const rotation = useMemo(() => progress * 12, [progress]);

  const resetDrag = () => setDrag({ x: 0, y: 0 });

  const goNext = () => props.onIndexChange(Math.min(idx + 1, maxIndex + 1)); // 끝 넘어가면 empty 처리

  const fling = async (dir: "LEFT" | "RIGHT") => {
    if (!top || animRef.current) return;
    animRef.current = true;

    setDrag({ x: (dir === "RIGHT" ? 1 : -1) * threshold * 2.2, y: drag.y });
    await wait(180);

    if (dir === "RIGHT") props.onAccept?.(top);
    else props.onReject?.(top);

    goNext();
    resetDrag();

    animRef.current = false;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!top) return;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY };
    baseRef.current = { x: drag.x, y: drag.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    setDrag({ x: baseRef.current.x + dx, y: baseRef.current.y + dy });
  };

  const onPointerUp = async () => {
    if (!dragging) return;
    setDragging(false);
    startRef.current = null;

    if (Math.abs(drag.x) >= threshold) {
      await fling(drag.x > 0 ? "RIGHT" : "LEFT");
      return;
    }
    resetDrag();
  };

  useEffect(() => {
    // 인덱스 바뀔 때 드래그 초기화
    resetDrag();
    setDragging(false);
    startRef.current = null;
    baseRef.current = { x: 0, y: 0 };
  }, [idx]);

  return (
    <div style={styles.shell}>
      <div style={{ ...styles.deck, height }}>
        {next && (
          <div style={{ ...styles.card, ...styles.nextCard, height }}>
            {props.renderCard ? props.renderCard(next) : <DefaultCard item={next} />}
          </div>
        )}

        {top ? (
          <div
            style={{
              ...styles.card,
              height,
              transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
              transition: dragging ? "none" : "transform 180ms ease",
              cursor: dragging ? "grabbing" : "grab",
              boxShadow: shadowByProgress(progress),
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div style={styles.badgeRow}>
              <div style={{ ...styles.badge, opacity: Math.max(0, progress) }}>ACCEPT</div>
              <div style={{ ...styles.badge, opacity: Math.max(0, -progress) }}>NOPE</div>
            </div>

            {props.renderCard ? props.renderCard(top) : <DefaultCard item={top} />}
          </div>
        ) : (
          <div style={{ ...styles.empty, height }}>더 이상 추천이 없어요.</div>
        )}
      </div>

      <div style={styles.actions}>
        <button style={styles.btnGhost} onClick={() => fling("LEFT")} disabled={!top}>
          거절
        </button>
        <button style={styles.btnPrimary} onClick={() => fling("RIGHT")} disabled={!top}>
          수락
        </button>
      </div>

      <div style={styles.hint}>
        {isMobile ? "카드를 좌/우로 스와이프" : "카드를 드래그하거나 버튼 클릭"}
      </div>
    </div>
  );
}

function DefaultCard(props: { item: SwipeDeckItem }) {
  return (
    <div style={styles.cardInner}>
      <div style={styles.title}>{props.item.name}</div>
      {!!props.item.subtitle && <div style={styles.sub}>{props.item.subtitle}</div>}
      <div style={styles.meta}>id: {props.item.id}</div>
    </div>
  );
}

function shadowByProgress(p: number) {
  const a = Math.min(1, Math.abs(p));
  const blur = 18 + a * 10;
  const y = 10 + a * 6;
  return `0 ${y}px ${blur}px rgba(0,0,0,0.25)`;
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

const styles: Record<string, React.CSSProperties> = {
  shell: { width: "100%" },
  deck: { position: "relative", width: "100%", userSelect: "none", touchAction: "none" },
  card: {
    position: "absolute",
    inset: 0,
    borderRadius: 16,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    overflow: "hidden",
  },
  nextCard: {
    transform: "scale(0.97) translateY(8px)",
    opacity: 0.9,
    filter: "saturate(0.9)",
  },
  empty: {
    borderRadius: 16,
    border: "1px dashed rgba(0,0,0,0.25)",
    display: "grid",
    placeItems: "center",
    background: "rgba(0,0,0,0.02)",
    color: "rgba(0,0,0,0.6)",
    fontWeight: 700,
  },

  cardInner: { padding: 14, height: "100%", display: "flex", flexDirection: "column", gap: 8 },
  title: { fontSize: 18, fontWeight: 900 },
  sub: { fontSize: 13, opacity: 0.75, lineHeight: 1.4 },
  meta: { marginTop: "auto", fontSize: 12, opacity: 0.55 },

  badgeRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    display: "flex",
    justifyContent: "space-between",
    pointerEvents: "none",
  },
  badge: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "rgba(255,255,255,0.85)",
    fontWeight: 900,
    fontSize: 12,
  },

  actions: { marginTop: 10, display: "flex", gap: 10 },
  btnGhost: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontWeight: 900,
  },
  btnPrimary: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
  },
  hint: { marginTop: 8, fontSize: 12, opacity: 0.65 },
};
