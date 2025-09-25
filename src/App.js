// Import React hooks and components
import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import QueueComponent from './QueueComponent';

/**
 * Queue Management System Component
 * 
 * This component simulates a multi-level queue scheduling system with:
 * - Main task queue where new tasks are added
 * - Multiple sub-queues: 1 high priority queue and 3 regular priority queues
 * - Task processing with visual progress bars
 * - Load balancing for regular priority tasks
 */
function App() {
  // ==================== STATE MANAGEMENT ====================
  
  /**
   * Controls whether progress bar decrementation is paused
   * Used to prevent progress updates immediately after admitting a task (0.5s pause)
   */
  const [decrementPaused, setDecrementPaused] = useState(false);
  
  /**
   * Main task queue - holds tasks waiting to be admitted to sub-queues
   * Each task structure: { value: number, type: 'normal' | 'high' }
   * - value: represents task duration/complexity
   * - type: determines which sub-queue the task will be routed to
   */
  const [queue, setQueue] = useState([]);
  
  /**
   * Dynamic queue management - stores queue names for each priority type
   * This makes it easy to add/remove queues dynamically
   */
  const [highPriorityQueues, setHighPriorityQueues] = useState(['high1']);
  const [regularPriorityQueues, setRegularPriorityQueues] = useState(['regular1', 'regular2', 'regular3', 'regular4']);
  
  /**
   * Tracks newly created queues to prevent immediate load balancing
   * Prevents "ghost" tasks by giving new queues time to fully initialize
   */
  const [newlyCreatedQueues, setNewlyCreatedQueues] = useState(new Set());

  /**
   * Sub-queues that process admitted tasks - dynamically generated based on queue lists
   * This automatically includes all queues from both priority groups
   */
  const [subQueues, setSubQueues] = useState(() => {
    const initialQueues = {};
    ['high1', 'regular1', 'regular2', 'regular3', 'regular4'].forEach(queueName => {
      initialQueues[queueName] = [];
    });
    return initialQueues;
  });
  
  /**
   * Index tracker for round-robin assignment of normal tasks
   * Currently unused but could be used for sequential queue assignment
   * 2: regular2, 3: regular3, 4: regular4
   */
  const [normalQueueIndex, setNormalQueueIndex] = useState(2);

  // ==================== TASK ADMISSION LOGIC ====================
  
  /**
   * Admits the first task from the main queue to appropriate sub-queue
   * 
   * Routing Logic:
   * - High priority tasks → High Priority Queue 1
   * - Normal priority tasks → Load balanced across Regular Queues 2-4
   * 
   * Load Balancing Strategy:
   * - Finds the regular queue with the fewest tasks
   * - Assigns the new normal task to that queue
   * - Ensures even distribution of workload
   */
  const admitTask = () => {
    // Exit if no tasks are waiting in the main queue
    if (queue.length === 0) return;
    
    // Get the first task from the queue (FIFO - First In, First Out)
    const task = queue[0];
    
    if (task.type === 'high') {
      // Load balancing logic for high priority tasks - uses sum-based load balancing
      setSubQueues(sq => {
        // Find the high priority queue with the minimum sum of task values
        let minQueue = highPriorityQueues[0];
        let minSum = sq[minQueue].reduce((sum, taskValue) => sum + taskValue, 0);
        
        // Iterate through all high priority queues to find the one with lowest sum
        highPriorityQueues.forEach(name => {
          const queueSum = sq[name].reduce((sum, taskValue) => sum + taskValue, 0);
          if (queueSum < minSum) {
            minQueue = name;
            minSum = queueSum;
          }
        });
        
        // Add the task to the high priority queue with the lowest sum
        return {
          ...sq,
          [minQueue]: [...sq[minQueue], task.value]
        };
      });
    } else {
      // Load balancing logic for normal priority tasks - uses sum-based load balancing
      setSubQueues(sq => {
        // Find the regular queue with the minimum sum of task values
        let minQueue = regularPriorityQueues[0];
        let minSum = sq[minQueue].reduce((sum, taskValue) => sum + taskValue, 0);
        
        // Iterate through all regular queues to find the one with lowest sum
        regularPriorityQueues.forEach(name => {
          const queueSum = sq[name].reduce((sum, taskValue) => sum + taskValue, 0);
          if (queueSum < minSum) {
            minQueue = name;
            minSum = queueSum;
          }
        });
        
        // Add the task to the queue with the lowest sum
        return {
          ...sq,
          [minQueue]: [...sq[minQueue], task.value]
        };
      });
    }
    
    // Remove the admitted task from the main queue
    setQueue(q => q.slice(1));
    
    // Pause progress bar updates for 500ms after admitting a task
    // This prevents immediate processing and provides visual feedback
    setDecrementPaused(true);
    setTimeout(() => setDecrementPaused(false), 500);
  };

  // ==================== HELPER FUNCTIONS ====================
  
  /**
   * Utility function to get the duration of the currently processing task in a queue
   * @param {Array} queueArr - Array of task values in a specific queue
   * @returns {number} - Duration of the first task (currently being processed) or 0 if queue is empty
   */
  const getCurrentTaskDuration = (queueArr) => {
    if (queueArr.length === 0) return 0;
    return queueArr[0]; // Return the first task's duration (FIFO processing)
  };

  // ==================== PROGRESS TRACKING STATE ====================
  
  /**
   * Current progress values for each queue's active task - dynamically managed
   * Values decrease over time to simulate task processing
   * When progress reaches 0, the task is considered complete and removed
   */
  const [progress, setProgress] = useState(() => {
    const initialProgress = {};
    ['high1', 'high2', 'regular1', 'regular2', 'regular3', 'regular4'].forEach(queueName => {
      initialProgress[queueName] = 0;
    });
    return initialProgress;
  });
  
  /**
   * Stores the initial duration of each queue's current task - dynamically managed
   * Used to calculate progress percentage for visual progress bars
   * Reset to 0 when a task completes
   */
  const [initialDuration, setInitialDuration] = useState(() => {
    const initialDurations = {};
    ['high1', 'high2', 'regular1', 'regular2', 'regular3', 'regular4'].forEach(queueName => {
      initialDurations[queueName] = 0;
    });
    return initialDurations;
  });

  // ==================== DYNAMIC QUEUE MANAGEMENT FUNCTIONS ====================
  
  /**
   * Adds a new high priority queue
   */
  const addHighPriorityQueue = () => {
    const newQueueName = `high${highPriorityQueues.length + 1}`;
    
    // Add to high priority queue list
    setHighPriorityQueues(prev => [...prev, newQueueName]);
    
    // Add to subQueues
    setSubQueues(prev => ({ ...prev, [newQueueName]: [] }));
    
    // Add to progress tracking
    setProgress(prev => ({ ...prev, [newQueueName]: 0 }));
    setInitialDuration(prev => ({ ...prev, [newQueueName]: 0 }));
    
    // Mark as newly created to prevent immediate load balancing
    setNewlyCreatedQueues(prev => new Set([...prev, newQueueName]));
    
    // Remove from newly created after a short delay to allow load balancing
    setTimeout(() => {
      setNewlyCreatedQueues(prev => {
        const newSet = new Set(prev);
        newSet.delete(newQueueName);
        return newSet;
      });
    }, 1000); // 1 second delay
  };

  /**
   * Removes the last high priority queue (if more than 1 exists)
   * Redistributes any remaining tasks to other high priority queues
   */
  const removeHighPriorityQueue = () => {
    if (highPriorityQueues.length <= 1) return; // Keep at least one high priority queue
    
    const queueToRemove = highPriorityQueues[highPriorityQueues.length - 1];
    const tasksToRedistribute = subQueues[queueToRemove] || [];
    const currentTask = progress[queueToRemove] > 0 ? progress[queueToRemove] : null;
    
    // If there are tasks to redistribute, move them to the remaining high priority queues
    if (tasksToRedistribute.length > 0 || currentTask) {
      setSubQueues(prev => {
        const newQueues = { ...prev };
        const remainingHighQueues = highPriorityQueues.slice(0, -1); // All except the one being removed
        
        // Find the high priority queue with the lowest sum for redistribution
        let targetQueue = remainingHighQueues[0];
        let minSum = newQueues[targetQueue].reduce((sum, taskValue) => sum + taskValue, 0);
        
        remainingHighQueues.forEach(queueName => {
          const queueSum = newQueues[queueName].reduce((sum, taskValue) => sum + taskValue, 0);
          if (queueSum < minSum) {
            targetQueue = queueName;
            minSum = queueSum;
          }
        });
        
        // Add current processing task back to the queue if it exists
        const allTasksToMove = [];
        if (currentTask) {
          allTasksToMove.push(currentTask); // Add the currently processing task
        }
        allTasksToMove.push(...tasksToRedistribute); // Add all waiting tasks
        
        // Move all tasks to the target queue
        newQueues[targetQueue] = [...newQueues[targetQueue], ...allTasksToMove];
        
        // Remove the queue
        delete newQueues[queueToRemove];
        return newQueues;
      });
    } else {
      // No tasks to redistribute, just remove the queue
      setSubQueues(prev => {
        const newQueues = { ...prev };
        delete newQueues[queueToRemove];
        return newQueues;
      });
    }
    
    // Remove from high priority queue list
    setHighPriorityQueues(prev => prev.slice(0, -1));
    
    // Remove from progress tracking
    setProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[queueToRemove];
      return newProgress;
    });
    setInitialDuration(prev => {
      const newDuration = { ...prev };
      delete newDuration[queueToRemove];
      return newDuration;
    });
    
    // Clean up from newly created queues set
    setNewlyCreatedQueues(prev => {
      const newSet = new Set(prev);
      newSet.delete(queueToRemove);
      return newSet;
    });
  };

  /**
   * Adds a new regular priority queue
   */
  const addRegularPriorityQueue = () => {
    const newQueueName = `regular${regularPriorityQueues.length + 1}`;
    
    // Add to regular priority queue list
    setRegularPriorityQueues(prev => [...prev, newQueueName]);
    
    // Add to subQueues
    setSubQueues(prev => ({ ...prev, [newQueueName]: [] }));
    
    // Add to progress tracking
    setProgress(prev => ({ ...prev, [newQueueName]: 0 }));
    setInitialDuration(prev => ({ ...prev, [newQueueName]: 0 }));
    
    // Mark as newly created to prevent immediate load balancing
    setNewlyCreatedQueues(prev => new Set([...prev, newQueueName]));
    
    // Remove from newly created after a short delay to allow load balancing
    setTimeout(() => {
      setNewlyCreatedQueues(prev => {
        const newSet = new Set(prev);
        newSet.delete(newQueueName);
        return newSet;
      });
    }, 1000); // 1 second delay
  };

  /**
   * Removes the last regular priority queue (if more than 1 exists)
   * Redistributes any remaining tasks to other regular priority queues
   */
  const removeRegularPriorityQueue = () => {
    if (regularPriorityQueues.length <= 1) return; // Keep at least one regular priority queue
    
    const queueToRemove = regularPriorityQueues[regularPriorityQueues.length - 1];
    const tasksToRedistribute = subQueues[queueToRemove] || [];
    const currentTask = progress[queueToRemove] > 0 ? progress[queueToRemove] : null;
    
    // If there are tasks to redistribute, move them to the remaining regular priority queues
    if (tasksToRedistribute.length > 0 || currentTask) {
      setSubQueues(prev => {
        const newQueues = { ...prev };
        const remainingRegularQueues = regularPriorityQueues.slice(0, -1); // All except the one being removed
        
        // Find the regular priority queue with the lowest sum for redistribution
        let targetQueue = remainingRegularQueues[0];
        let minSum = newQueues[targetQueue].reduce((sum, taskValue) => sum + taskValue, 0);
        
        remainingRegularQueues.forEach(queueName => {
          const queueSum = newQueues[queueName].reduce((sum, taskValue) => sum + taskValue, 0);
          if (queueSum < minSum) {
            targetQueue = queueName;
            minSum = queueSum;
          }
        });
        
        // Add current processing task back to the queue if it exists
        const allTasksToMove = [];
        if (currentTask) {
          allTasksToMove.push(currentTask); // Add the currently processing task
        }
        allTasksToMove.push(...tasksToRedistribute); // Add all waiting tasks
        
        // Move all tasks to the target queue
        newQueues[targetQueue] = [...newQueues[targetQueue], ...allTasksToMove];
        
        // Remove the queue
        delete newQueues[queueToRemove];
        return newQueues;
      });
    } else {
      // No tasks to redistribute, just remove the queue
      setSubQueues(prev => {
        const newQueues = { ...prev };
        delete newQueues[queueToRemove];
        return newQueues;
      });
    }
    
    // Remove from regular priority queue list
    setRegularPriorityQueues(prev => prev.slice(0, -1));
    
    // Remove from progress tracking
    setProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[queueToRemove];
      return newProgress;
    });
    setInitialDuration(prev => {
      const newDuration = { ...prev };
      delete newDuration[queueToRemove];
      return newDuration;
    });
    
    // Clean up from newly created queues set
    setNewlyCreatedQueues(prev => {
      const newSet = new Set(prev);
      newSet.delete(queueToRemove);
      return newSet;
    });
  };

  // ==================== PROGRESS BAR ANIMATION EFFECT ====================
  
  /**
   * Effect hook that handles the continuous decrementation of progress bars
   * 
   * Animation Details:
   * - Updates every 40ms for smooth visual progress
   * - Decrements progress by 0.4 units per interval
   * - Only runs when decrementation is not paused
   * - Automatically stops when progress reaches 0
   * 
   * Dependencies:
   * - subQueues: Re-runs when queue contents change
   * - decrementPaused: Pauses/resumes based on recent task admissions
   */
  useEffect(() => {
    // Skip progress updates if decrementation is paused (e.g., after admitting a task)
    if (decrementPaused) return;
    
    // Set up interval for smooth progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => {
        const updated = { ...prev };
        
        // Update progress for all queues dynamically
        [...highPriorityQueues, ...regularPriorityQueues].forEach(q => {
          // Only decrement if:
          // 1. Queue has tasks waiting
          // 2. Current progress is greater than 0
          if (subQueues[q].length > 0 && prev[q] > 0) {
            // Decrement progress by 0.4, ensuring it doesn't go below 0
            // Round to 2 decimal places to prevent floating point precision issues
            updated[q] = Math.max(0, Math.round((prev[q] - 0.4) * 100) / 100);
          } else {
            // Reset progress to 0 if queue is empty or progress already at 0
            updated[q] = 0;
          }
        });
        
        return updated;
      });
    }, 40); // 40ms interval for smooth 25fps animation
    
    // Cleanup function to clear interval when component unmounts or dependencies change
    return () => clearInterval(interval);
  }, [subQueues, decrementPaused, highPriorityQueues, regularPriorityQueues]);

  // ==================== TASK COMPLETION EFFECT ====================
  
  /**
   * Effect hook that handles task completion and removal from queues
   * 
   * Completion Logic:
   * - Monitors progress values for all queues
   * - When progress reaches exactly 0, the task is considered complete
   * - Removes completed tasks from their respective queues
   * - Resets initial duration to prepare for the next task
   * 
   * Safeguards:
   * - Only removes tasks if initialDuration > 0 (prevents instant removal of new tasks)
   * - Only processes queues that have tasks waiting
   * 
   * Dependencies:
   * - progress: Triggers when any queue's progress changes
   * - subQueues: Triggers when queue contents change
   * - initialDuration: Triggers when initial durations are set/reset
   */
  useEffect(() => {
    // Check all queues for completed tasks dynamically
    [...highPriorityQueues, ...regularPriorityQueues].forEach(q => {
      // Task completion conditions:
      // 1. Queue has at least one task
      // 2. Progress has reached exactly 0 (task is complete)
      // 3. Initial duration is greater than 0 (task was properly initialized)
      if (subQueues[q].length > 0 && progress[q] === 0 && initialDuration[q] > 0) {
        // Remove the completed task (first task in queue - FIFO)
        setSubQueues(sq => ({
          ...sq,
          [q]: sq[q].slice(1) // Remove first element, keep the rest
        }));
        
        // Reset initial duration for this queue to prepare for next task
        setInitialDuration(prev => ({ ...prev, [q]: 0 }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, subQueues, initialDuration, highPriorityQueues, regularPriorityQueues]);

  // ==================== DYNAMIC LOAD BALANCING EFFECT ====================
  
  /**
   * Effect hook that implements work-stealing/load balancing between queues
   * 
   * Load Balancing Logic:
   * - When a queue becomes idle (no tasks and no active work), it can help other queues
   * - High priority queues only help other high priority queues
   * - Regular priority queues only help other regular priority queues
   * - Tasks are moved from the most loaded queue to the idle queue
   * 
   * This ensures all queues finish around the same time while maintaining priority separation
   */
  useEffect(() => {
    const highQueues = highPriorityQueues;
    const regularQueues = regularPriorityQueues;
    
    const redistributeTasks = (queueGroup) => {
      // Find idle queues (no tasks and no active work) - exclude newly created queues
      const idleQueues = queueGroup.filter(q => 
        subQueues[q].length === 0 && progress[q] === 0 && initialDuration[q] === 0 &&
        !newlyCreatedQueues.has(q) // Exclude newly created queues from load balancing
      );
      
      // Find busy queues (has multiple tasks waiting) - exclude newly created queues
      const busyQueues = queueGroup.filter(q => 
        subQueues[q].length > 1 && !newlyCreatedQueues.has(q)
      );
      
      // If we have both idle and busy queues, redistribute
      if (idleQueues.length > 0 && busyQueues.length > 0) {
        // Find the queue with the highest sum of task values
        let busiestQueue = busyQueues[0];
        let maxSum = subQueues[busiestQueue].reduce((sum, taskValue) => sum + taskValue, 0);
        
        busyQueues.forEach(q => {
          const queueSum = subQueues[q].reduce((sum, taskValue) => sum + taskValue, 0);
          if (queueSum > maxSum) {
            busiestQueue = q;
            maxSum = queueSum;
          }
        });
        
        // Only redistribute if the busiest queue has tasks and significant workload
        if (subQueues[busiestQueue].length > 1 && maxSum > 0) {
          const idleQueue = idleQueues[0];
          
          // Move the last task from busiest queue to idle queue
          setSubQueues(prev => {
            const newQueues = { ...prev };
            const taskToMove = newQueues[busiestQueue].pop(); // Remove last task
            if (taskToMove !== undefined) {
              newQueues[idleQueue] = [taskToMove, ...newQueues[idleQueue]]; // Add to front of idle queue
            }
            return newQueues;
          });
        }
      }
    };
    
    // Apply load balancing to both high and regular priority queue groups
    redistributeTasks(highQueues);
    redistributeTasks(regularQueues);
    
  }, [subQueues, progress, initialDuration, highPriorityQueues, regularPriorityQueues, newlyCreatedQueues]); // Trigger when queue states change

  // ==================== NEW TASK INITIALIZATION EFFECT ====================
  
  /**
   * Effect hook that initializes progress tracking for newly admitted tasks
   * 
   * Initialization Logic:
   * - Monitors all queues for new tasks that haven't started processing
   * - Sets initial progress value equal to the task's duration value
   * - Records initial duration for progress bar percentage calculations
   * 
   * Conditions for initialization:
   * - Queue must have at least one task
   * - Current progress must be 0 (no active task)
   * - Initial duration must be 0 (no task was previously being processed)
   * 
   * This ensures that each new task starts with full progress equal to its duration
   * and gradually decrements to 0 over time for visual processing simulation
   * 
   * Dependencies:
   * - subQueues: Triggers when new tasks are admitted
   * - progress: Ensures we don't reinitialize active tasks
   * - initialDuration: Prevents reinitializing already initialized tasks
   */
  useEffect(() => {
    // Check all queues for newly admitted tasks that need initialization dynamically
    [...highPriorityQueues, ...regularPriorityQueues].forEach(q => {
      // New task initialization conditions:
      // 1. Queue has at least one task waiting
      // 2. Current progress is 0 (no task currently being processed)
      // 3. Initial duration is 0 (no previous task data lingering)
      if (subQueues[q].length > 0 && (progress[q] === 0 && initialDuration[q] === 0)) {
        // Initialize progress with the first task's duration value
        setProgress(prev => ({ ...prev, [q]: subQueues[q][0] }));
        
        // Store the initial duration for progress bar percentage calculation
        setInitialDuration(prev => ({ ...prev, [q]: subQueues[q][0] }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subQueues, progress, initialDuration, highPriorityQueues, regularPriorityQueues]);

  // ==================== COMPONENT RENDER ====================
  
  return (
    // Main application container with full viewport height and padding
    <div className="App" style={{ background: '#fff', minHeight: '100vh', padding: '40px' }}>
      {/* Central content container with max width and border */}
      <div style={{ maxWidth: 1100, margin: '0 auto', border: '1px solid #ccc', background: '#fff', borderRadius: 8, display: 'flex', flexDirection: 'row', padding: 30 }}>
        
        {/* ==================== LEFT SECTION: MAIN TASK QUEUE ==================== */}
        <div style={{ flex: 2, borderRight: '1px solid #ccc', paddingRight: 30 }}>
          
          {/* Task Generator Buttons - Side by Side */}
          <div style={{ 
            marginBottom: 20, 
            display: 'flex', 
            gap: 10, 
            justifyContent: 'flex-start',
            alignItems: 'center'
          }}>
            {/* High Priority Task Button */}
            <button
              style={{ 
                padding: '12px 16px', 
                userSelect: 'none', 
                backgroundColor: '#e57373', 
                color: 'white', 
                border: 'none', 
                borderRadius: 6,
                fontSize: 13,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '140px',
                height: '44px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#d32f2f'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#e57373'}
              onClick={() => {
                // Generate high priority task with random duration (1-200)
                const value = Math.floor(Math.random() * 200); // Task duration/complexity
                
                // Add high priority task to the end of the main queue
                setQueue(q => [...q, { value, type: 'high' }]);
              }}
            >
              ADD HP TASK
            </button>

            {/* Random Task Button - Centered */}
            <button
              style={{ 
                padding: '12px 16px', 
                userSelect: 'none', 
                backgroundColor: '#2196F3', 
                color: 'white', 
                border: 'none', 
                borderRadius: 6,
                fontSize: 13,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '140px',
                height: '44px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1976D2'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2196F3'}
              onClick={() => {
                // Generate random task with random duration (1-200) and random priority
                const value = Math.floor(Math.random() * 200); // Task duration/complexity
                const type = Math.random() < 0.5 ? 'normal' : 'high'; // 50/50 chance for priority
                
                // Add new task to the end of the main queue
                setQueue(q => [...q, { value, type }]);
              }}
            >
              ADD RAN TASK
            </button>

            {/* Normal Priority Task Button */}
            <button
              style={{ 
                padding: '12px 16px', 
                userSelect: 'none', 
                backgroundColor: '#888', 
                color: 'white', 
                border: 'none', 
                borderRadius: 6,
                fontSize: 13,
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '140px',
                height: '44px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#666'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#888'}
              onClick={() => {
                // Generate normal priority task with random duration (1-200)
                const value = Math.floor(Math.random() * 200); // Task duration/complexity
                
                // Add normal priority task to the end of the main queue
                setQueue(q => [...q, { value, type: 'normal' }]);
              }}
            >
              ADD NP TASK
            </button>
          </div>
          
          {/* Main Queue Title */}
          <h3 style={{ textAlign: 'left' }}>Task Queue</h3>
          
          {/* Task Queue Display Area */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {queue.map((task, idx) => (
              <span
                key={idx}
                style={{
                  // Visual styling based on task priority
                  border: task.type === 'high' ? '1.5px solid #e57373' : '1px solid #222',
                  background: '#fff',
                  color: task.type === 'high' ? '#e57373' : '#222', // Red for high priority, black for normal
                  padding: '4px 10px',
                  borderRadius: 4
                }}
              >
                {task.value} {/* Display task duration/complexity value */}
              </span>
            ))}
          </div>
          
          {/* Task Admission Button */}
          <button 
            style={{ 
              marginBottom: 20, 
              padding: '12px 16px',
              userSelect: 'none',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '140px',
              height: '44px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
            onClick={admitTask}
          >
            ADMIT TASK
          </button>

          {/* ==================== DYNAMIC QUEUE MANAGEMENT ==================== */}
          <div style={{ marginTop: 20, padding: 16, border: '1px solid #ddd', borderRadius: 8, backgroundColor: '#f9f9f9' }}>
            <h4 style={{ margin: '0 0 12px 0', textAlign: 'left' }}>Queue Management</h4>
            
            {/* High Priority Queue Controls */}
            <div style={{ marginBottom: 12 }}>
              <strong style={{ fontSize: 14 }}>High Priority Queues ({highPriorityQueues.length}):</strong>
              <div style={{ marginTop: 6 }}>
                <button 
                  style={{ marginRight: 8, padding: '4px 8px', fontSize: 12, backgroundColor: '#e57373', color: 'white', border: 'none', borderRadius: 4 }}
                  onClick={addHighPriorityQueue}
                >
                  + Add High
                </button>
                <button 
                  style={{ padding: '4px 8px', fontSize: 12, backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: 4 }}
                  onClick={removeHighPriorityQueue}
                  disabled={highPriorityQueues.length <= 1}
                >
                  - Remove High
                </button>
              </div>
            </div>

            {/* Regular Priority Queue Controls */}
            <div>
              <strong style={{ fontSize: 14 }}>Regular Priority Queues ({regularPriorityQueues.length}):</strong>
              <div style={{ marginTop: 6 }}>
                <button 
                  style={{ marginRight: 8, padding: '4px 8px', fontSize: 12, backgroundColor: '#888', color: 'white', border: 'none', borderRadius: 4 }}
                  onClick={addRegularPriorityQueue}
                >
                  + Add Regular
                </button>
                <button 
                  style={{ padding: '4px 8px', fontSize: 12, backgroundColor: '#666', color: 'white', border: 'none', borderRadius: 4 }}
                  onClick={removeRegularPriorityQueue}
                  disabled={regularPriorityQueues.length <= 1}
                >
                  - Remove Regular
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* ==================== RIGHT SECTION: SUB-QUEUES PROCESSING AREA ==================== */}
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 30 }}>
          
          {/* ==================== DYNAMIC HIGH PRIORITY QUEUES ==================== */}
          {highPriorityQueues.map((queueName, index) => (
            <QueueComponent
              key={queueName}
              title={`High Priority Queue ${index + 1}`}
              tasks={subQueues[queueName] || []}
              progress={progress[queueName] || 0}
              initialDuration={initialDuration[queueName] || 0}
              isHighPriority={true}
            />
          ))}

          {/* ==================== DYNAMIC REGULAR PRIORITY QUEUES ==================== */}
          {regularPriorityQueues.map((queueName, index) => (
            <QueueComponent
              key={queueName}
              title={`Regular Priority Queue ${index + 1}`}
              tasks={subQueues[queueName] || []}
              progress={progress[queueName] || 0}
              initialDuration={initialDuration[queueName] || 0}
              isHighPriority={false}
            />
          ))}

          {/* ==================== INSTRUCTIONS FOR MANUAL CODING ==================== */}
          {/* 
          🚀 EASY MANUAL QUEUE ADDITION:
          
          To add queues programmatically, simply modify the initial state:
          
          1. For High Priority Queues:
             const [highPriorityQueues, setHighPriorityQueues] = useState(['high1', 'high2', 'high3']);
          
          2. For Regular Priority Queues:
             const [regularPriorityQueues, setRegularPriorityQueues] = useState(['regular1', 'regular2', 'regular3', 'regular4', 'regular5']);
          
          3. Update the initial state functions to include the new queue names:
             - subQueues useState initialization
             - progress useState initialization  
             - initialDuration useState initialization
          
          That's it! The system will automatically handle:
          ✅ Load balancing across all queues
          ✅ Progress tracking for new queues
          ✅ Dynamic work-stealing between queues
          ✅ UI rendering of new queues
          ✅ Task admission routing
          */}
          
        </div>
      </div> 
    </div>
  );
}

// ==================== COMPONENT EXPORT ====================
export default App;
