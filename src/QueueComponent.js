import React from 'react';

/**
 * Reusable Queue Component
 * 
 * @param {string} title - Display name for the queue
 * @param {Array} tasks - Array of task values in this queue
 * @param {number} progress - Current progress value for active task
 * @param {number} initialDuration - Initial duration for progress calculation
 * @param {boolean} isHighPriority - Whether this is a high priority queue (affects styling)
 */
const QueueComponent = ({ 
  title, 
  tasks, 
  progress, 
  initialDuration, 
  isHighPriority = false 
}) => {
  // Dynamic styling based on queue type
  const borderColor = isHighPriority ? '#e57373' : '#ccc';
  const textColor = isHighPriority ? '#e57373' : '#333';
  const progressColor = isHighPriority ? '#e57373' : '#888';
  const borderWidth = isHighPriority ? '1.5px' : '1px';

  return (
    <div style={{ 
      border: `1px solid ${borderColor}`, 
      borderRadius: 8, 
      padding: 16, 
      marginBottom: 8, 
      textAlign: 'left' 
    }}>
      <strong>{title}</strong>
      
      {/* Queue Contents Display */}
      <div style={{ fontSize: 14, marginTop: 8 }}>Queue List:</div>
      <div style={{ minHeight: 24, marginBottom: 8 }}>
        {tasks.map((task, idx) => (
          <span 
            key={idx} 
            style={{ 
              border: `${borderWidth} solid ${borderColor}`, 
              color: textColor, 
              padding: '2px 8px', 
              borderRadius: 4, 
              marginRight: 4 
            }}
          >
            {task}
          </span>
        ))}
      </div>
      
      {/* Progress Bar Section */}
      <div style={{ fontSize: 14 }}>Duration:</div>
      <div style={{ 
        minHeight: 24, 
        width: '100%', 
        background: '#eee', 
        borderRadius: 4, 
        overflow: 'hidden', 
        position: 'relative', 
        height: 16 
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${initialDuration ? (progress / initialDuration) * 100 : 0}%`,
          background: progressColor,
          transition: 'width 50ms linear',
          borderRadius: 4
        }} />
      </div>
    </div>
  );
};

export default QueueComponent;