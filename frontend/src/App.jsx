// Top-level layout — fetches all three resources and wires the components together.
// Uses a flexbox layout with draggable splitters so the user can resize panes.
import { useEffect, useMemo, useState } from 'react';
import { getOilPrice, listEvents, listOilPrices, listStatePrices } from './api.js';
import USMap from './components/USMap.jsx';
import Timeline from './components/Timeline.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import Splitter from './components/Splitter.jsx';

const LS_DETAIL = 'opv.detailWidth';
const LS_TIMELINE = 'opv.timelineHeight';

export default function App() {
  const [prices, setPrices] = useState(null);
  const [events, setEvents] = useState(null);
  const [statePrices, setStatePrices] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);
  const [error, setError] = useState(null);

  // User-adjustable pane sizes, persisted to localStorage.
  const [detailWidth, setDetailWidth] = useState(() => {
    const v = parseInt(localStorage.getItem(LS_DETAIL), 10);
    return Number.isFinite(v) ? v : 380;
  });
  const [timelineHeight, setTimelineHeight] = useState(() => {
    const v = parseInt(localStorage.getItem(LS_TIMELINE), 10);
    return Number.isFinite(v) ? v : 260;
  });
  useEffect(() => localStorage.setItem(LS_DETAIL, String(detailWidth)), [detailWidth]);
  useEffect(() => localStorage.setItem(LS_TIMELINE, String(timelineHeight)), [timelineHeight]);

  // Initial load — three GETs in parallel.
  useEffect(() => {
    let cancelled = false;
    Promise.all([listOilPrices(), listEvents(), listStatePrices()])
      .then(([p, e, s]) => {
        if (cancelled) return;
        setPrices(p);
        setEvents(e);
        setStatePrices(s);
        if (p && p.length > 0) setSelectedDate(p[p.length - 1].date);
      })
      .catch(err => {
        console.error(err);
        setError(
          'Could not reach the API at /api. Make sure the FastAPI backend is running on http://localhost:8000.',
        );
      });
    return () => { cancelled = true; };
  }, []);

  // Per-day detail (with events) when the selection changes.
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    getOilPrice(selectedDate)
      .then(d => { if (!cancelled) setDayDetail(d); })
      .catch(() => { if (!cancelled) setDayDetail(null); });
    return () => { cancelled = true; };
  }, [selectedDate]);

  const headerStats = useMemo(() => {
    if (!prices || prices.length === 0) return null;
    const first = prices[0];
    const last = prices[prices.length - 1];
    const brentDelta = ((last.brent_usd - first.brent_usd) / first.brent_usd) * 100;
    const gasDelta = ((last.us_gas_avg - first.us_gas_avg) / first.us_gas_avg) * 100;
    return {
      rangeStart: first.date,
      rangeEnd: last.date,
      brentDelta,
      gasDelta,
      brentLast: last.brent_usd,
      gasLast: last.us_gas_avg,
    };
  }, [prices]);

  if (error) {
    return (
      <div className="app-error">
        <div className="pane">
          <h1>Oil Price Visualization · 2026 Iran Conflict</h1>
          <p className="error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="pane header">
        <div>
          <h1>Oil Price Visualization <span className="badge">2026 Iran Conflict</span></h1>
          <div className="subtitle">
            Daily Brent/WTI/Dubai crude + per-state US gasoline prices,
            annotated with conflict events. Drag the dividers to resize panes.
          </div>
        </div>
        {headerStats && (
          <div className="header-stats">
            <div>
              <strong>${headerStats.brentLast.toFixed(2)}</strong>
              Brent ({headerStats.brentDelta >= 0 ? '+' : ''}{headerStats.brentDelta.toFixed(1)}%)
            </div>
            <div>
              <strong>${headerStats.gasLast.toFixed(3)}</strong>
              US gas ({headerStats.gasDelta >= 0 ? '+' : ''}{headerStats.gasDelta.toFixed(1)}%)
            </div>
            <div>{headerStats.rangeStart} → {headerStats.rangeEnd}</div>
          </div>
        )}
      </div>

      <div className="row" style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div className="pane map-pane" style={{ flex: 1, minWidth: 0 }}>
          <p className="section-title">Per-state gas price · Mar 19, 2026 snapshot</p>
          {statePrices
            ? <USMap statePrices={statePrices} />
            : <div className="loading">Loading map data…</div>}
        </div>

        <Splitter
          orientation="vertical"
          value={detailWidth}
          onChange={setDetailWidth}
          min={260}
          max={720}
        />

        <div style={{ width: detailWidth, minWidth: 0, display: 'flex' }}>
          <DetailPanel
            selectedDate={selectedDate}
            dayDetail={dayDetail}
            allEvents={events || []}
            onSelectDate={setSelectedDate}
          />
        </div>
      </div>

      <Splitter
        orientation="horizontal"
        value={timelineHeight}
        onChange={setTimelineHeight}
        min={160}
        max={520}
      />

      <div className="pane timeline-pane" style={{ height: timelineHeight }}>
        <div className="timeline-controls">
          <p className="section-title" style={{ margin: 0 }}>
            Daily timeline · click a red dot for major events
          </p>
          <div className="spacer" />
          {prices && prices.length > 0 && (
            <>
              <button onClick={() => setSelectedDate(prices[0].date)}>⏮ Start</button>
              <button
                onClick={() => {
                  const idx = prices.findIndex(p => p.date === selectedDate);
                  if (idx > 0) setSelectedDate(prices[idx - 1].date);
                }}
              >◀ Prev</button>
              <button
                onClick={() => {
                  const idx = prices.findIndex(p => p.date === selectedDate);
                  if (idx >= 0 && idx < prices.length - 1) setSelectedDate(prices[idx + 1].date);
                }}
              >Next ▶</button>
              <button onClick={() => setSelectedDate(prices[prices.length - 1].date)}>End ⏭</button>
            </>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Timeline
            prices={prices || []}
            events={events || []}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      </div>
    </div>
  );
}
