import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';



function App() {
  // Pause decrementation for 0.5s after admitting a task
  const [decrementPaused, setDecrementPaused] = useState(false);
  // Each task: { value: number, type: 'normal' | 'high' }
  const [queue, setQueue] = useState([]);
  const [subQueues, setSubQueues] = useState({
    high: [],
    regular2: [],
    regular3: [],
    regular4: []
  });
  const [normalQueueIndex, setNormalQueueIndex] = useState(2); // 2: regular2, 3: regular3, 4: regular4

  // Admit task to sub-queues (balance normal tasks among regular queues)
  const admitTask = () => {
    if (queue.length === 0) return;
    const task = queue[0];
    if (task.type === 'high') {
      setSubQueues(sq => ({
        ...sq,
        high: [...sq.high, task.value]
      }));
    } else {
      // Balanced assignment: find the regular queue with the fewest tasks
      const queueNames = ['regular2', 'regular3', 'regular4'];
      setSubQueues(sq => {
        let minQueue = queueNames[0];
        let minLength = sq[minQueue].length;
        queueNames.forEach(name => {
          if (sq[name].length < minLength) {
            minQueue = name;
            minLength = sq[name].length;
          }
        });
        return {
          ...sq,
          [minQueue]: [...sq[minQueue], task.value]
        };
      });
    }
    setQueue(q => q.slice(1));
    setDecrementPaused(true);
    setTimeout(() => setDecrementPaused(false), 500);
  };

  // Helper to get duration for the currently queued task in a queue
  const getCurrentTaskDuration = (queueArr) => {
    if (queueArr.length === 0) return 0;
    return queueArr[0];
  };

  // Progress state for each queue
  const [progress, setProgress] = useState({
    high: 0,
    regular2: 0,
    regular3: 0,
    regular4: 0
  });
  // Track initial duration for each queue
  const [initialDuration, setInitialDuration] = useState({
    high: 0,
    regular2: 0,
    regular3: 0,
    regular4: 0
  });

  // Effect to decrement progress bars
  useEffect(() => {
    if (decrementPaused) return;
    // For smooth but slower progress, use a longer interval and smaller decrement
    const interval = setInterval(() => {
      setProgress(prev => {
        const updated = { ...prev };
        ['high', 'regular2', 'regular3', 'regular4'].forEach(q => {
          // Only decrement if progress is initialized and matches the current task
          if (subQueues[q].length > 0 && prev[q] > 0) {
            updated[q] = Math.max(0, prev[q] - 0.4); // slightly faster decrement
          } else {
            updated[q] = 0;
          }
        });
        return updated;
      });
    }, 40); // slightly faster interval
    return () => clearInterval(interval);
  }, [subQueues, decrementPaused]);

  // Effect to consume task only when duration reaches zero
  useEffect(() => {
    ['high', 'regular2', 'regular3', 'regular4'].forEach(q => {
      // Only consume if progress is 0 and initialDuration is not 0 (prevents instant removal)
      if (subQueues[q].length > 0 && progress[q] === 0 && initialDuration[q] > 0) {
        setSubQueues(sq => ({
          ...sq,
          [q]: sq[q].slice(1)
        }));
        setInitialDuration(prev => ({ ...prev, [q]: 0 }));
      }
    });
    // eslint-disable-next-line
  }, [progress, subQueues, initialDuration]);

  // When a new task is added to a queue, set its progress
  useEffect(() => {
    ['high', 'regular2', 'regular3', 'regular4'].forEach(q => {
      // Only set progress and initialDuration if a new task is admitted and progress is not set
      if (subQueues[q].length > 0 && (progress[q] === 0 && initialDuration[q] === 0)) {
        setProgress(prev => ({ ...prev, [q]: subQueues[q][0] }));
        setInitialDuration(prev => ({ ...prev, [q]: subQueues[q][0] }));
      }
    });
    // eslint-disable-next-line
  }, [subQueues, progress, initialDuration]);

  return (
    <div className="App" style={{ background: '#fff', minHeight: '100vh', padding: '40px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', border: '1px solid #ccc', background: '#fff', borderRadius: 8, display: 'flex', flexDirection: 'row', padding: 30 }}>
        {/* Left: Main Queue */}
        <div style={{ flex: 2, borderRight: '1px solid #ccc', paddingRight: 30 }}>
          <button
            style={{ marginBottom: 16, userSelect: 'none' }}
            onClick={() => {
              const value = Math.floor(Math.random() * 200);
              const type = Math.random() < 0.5 ? 'normal' : 'high';
              setQueue(q => [...q, { value, type }]);
            }}
          >
            ADD RANDOM TASK
          </button>
          <h3 style={{ textAlign: 'left' }}>Task Queue</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {queue.map((task, idx) => (
              <span
                key={idx}
                style={{
                  border: task.type === 'high' ? '1.5px solid #e57373' : '1px solid #222',
                  background: '#fff',
                  color: task.type === 'high' ? '#e57373' : '#222',
                  padding: '4px 10px',
                  borderRadius: 4
                }}
              >
                {task.value}
              </span>
            ))}
          </div>
          <button style={{ marginBottom: 16, userSelect: 'none' }} onClick={admitTask}>ADMIT TASK</button>
        </div>
        {/* Right: Sub Queues */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 30 }}>
          {/* High Priority Queue 1 */}
          <div style={{ border: '1px solid #e57373', borderRadius: 8, padding: 16, marginBottom: 8, textAlign: 'left' }}>
            <strong>High Priority Queue 1</strong>
            <div style={{ fontSize: 14, marginTop: 8 }}>Queue List:</div>
            <div style={{ minHeight: 24, marginBottom: 8 }}>
              {subQueues.high.map((task, idx) => (
                <span key={idx} style={{ border: '1px solid #e57373', color: '#e57373', padding: '2px 8px', borderRadius: 4, marginRight: 4 }}>{task}</span>
              ))}
            </div>
            <div style={{ fontSize: 14 }}>Duration:</div>
            <div style={{ minHeight: 24, width: '100%', background: '#eee', borderRadius: 4, overflow: 'hidden', position: 'relative', height: 16 }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${initialDuration.high ? (progress.high / initialDuration.high) * 100 : 0}%`,
                background: '#e57373',
                transition: 'width 50ms linear',
                borderRadius: 4
              }} />
            </div>
          </div>
          {/* Regular Queue 2 */}
          <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 8, textAlign: 'left' }}>
            <strong>Regular Queue 2</strong>
            <div style={{ fontSize: 14, marginTop: 8 }}>Queue List:</div>
            <div style={{ minHeight: 24, marginBottom: 8 }}>
              {subQueues.regular2.map((task, idx) => (
                <span key={idx} style={{ border: '1px solid #ccc', color: '#333', padding: '2px 8px', borderRadius: 4, marginRight: 4 }}>{task}</span>
              ))}
            </div>
            <div style={{ fontSize: 14 }}>Duration:</div>
            <div style={{ minHeight: 24, width: '100%', background: '#eee', borderRadius: 4, overflow: 'hidden', position: 'relative', height: 16 }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${initialDuration.regular2 ? (progress.regular2 / initialDuration.regular2) * 100 : 0}%`,
                background: '#888',
                transition: 'width 50ms linear',
                borderRadius: 4
              }} />
            </div>
          </div>
          {/* Regular Queue 3 */}
          <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, marginBottom: 8, textAlign: 'left' }}>
            <strong>Regular Queue 3</strong>
            <div style={{ fontSize: 14, marginTop: 8 }}>Queue List:</div>
            <div style={{ minHeight: 24, marginBottom: 8 }}>
              {subQueues.regular3.map((task, idx) => (
                <span key={idx} style={{ border: '1px solid #ccc', color: '#333', padding: '2px 8px', borderRadius: 4, marginRight: 4 }}>{task}</span>
              ))}
            </div>
            <div style={{ fontSize: 14 }}>Duration:</div>
            <div style={{ minHeight: 24, width: '100%', background: '#eee', borderRadius: 4, overflow: 'hidden', position: 'relative', height: 16 }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${initialDuration.regular3 ? (progress.regular3 / initialDuration.regular3) * 100 : 0}%`,
                background: '#888',
                transition: 'width 50ms linear',
                borderRadius: 4
              }} />
            </div>
          </div>
          {/* Regular Queue 4 */}
          <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16, textAlign: 'left' }}>
            <strong>Regular Queue 4</strong>
            <div style={{ fontSize: 14, marginTop: 8 }}>Queue List:</div>
            <div style={{ minHeight: 24, marginBottom: 8 }}>
              {subQueues.regular4.map((task, idx) => (
                <span key={idx} style={{ border: '1px solid #ccc', color: '#333', padding: '2px 8px', borderRadius: 4, marginRight: 4 }}>{task}</span>
              ))}
            </div>
            <div style={{ fontSize: 14 }}>Duration:</div>
            <div style={{ minHeight: 24, width: '100%', background: '#eee', borderRadius: 4, overflow: 'hidden', position: 'relative', height: 16 }}>
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${initialDuration.regular4 ? (progress.regular4 / initialDuration.regular4) * 100 : 0}%`,
                background: '#888',
                transition: 'width 50ms linear',
                borderRadius: 4
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
