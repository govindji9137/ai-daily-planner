import React, { useState, useEffect, useRef } from 'react';

const FloatingTimer = ({ onClose }) => {
  const [position, setPosition] = useState({ x: window.innerWidth - 300, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef(null);
  
  const [inputHours, setInputHours] = useState('00');
  const [inputMinutes, setInputMinutes] = useState('25');
  const [inputSeconds, setInputSeconds] = useState('00');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const beep = (startTime) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'square'; 
        oscillator.frequency.setValueAtTime(880, startTime); 
        gainNode.gain.setValueAtTime(0.2, startTime); // Louder square wave

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2); 
      };

      // Triple beep
      beep(audioCtx.currentTime);
      beep(audioCtx.currentTime + 0.4);
      beep(audioCtx.currentTime + 0.8);

      setTimeout(() => {
        audioCtx.close();
      }, 1500); 
    } catch (e) {
      console.error('AudioContext not supported', e);
    }
  };

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      playBeep();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleMouseDown = (e) => {
    if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button') return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragRef.current.startX,
      y: e.clientY - dragRef.current.startY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const applyTime = () => {
    const h = parseInt(inputHours || 0);
    const m = parseInt(inputMinutes || 0);
    const s = parseInt(inputSeconds || 0);
    setTimeLeft((h * 3600) + (m * 60) + s);
  };

  const toggleTimer = () => {
    if (isEditing) {
      setIsEditing(false);
      applyTime();
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    applyTime();
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="glass-panel"
      style={{
        ...styles.container, 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    >
      <button style={styles.closeBtn} onClick={(e) => {e.stopPropagation(); onClose();}}>×</button>
      
      <div style={styles.header}>
        <span style={styles.dot}></span>
        Current Focus
      </div>
      
      <div style={styles.timeDisplay}>
        {isEditing ? (
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'}}>
            <input 
              type="number" style={styles.timeInput}
              value={inputHours} onChange={(e) => setInputHours(e.target.value)}
              placeholder="HH"
            />
            <span style={{fontSize: '20px'}}>:</span>
            <input 
              type="number" style={styles.timeInput}
              value={inputMinutes} onChange={(e) => setInputMinutes(e.target.value)}
              placeholder="MM" autoFocus
            />
            <span style={{fontSize: '20px'}}>:</span>
            <input 
              type="number" style={styles.timeInput}
              value={inputSeconds} onChange={(e) => setInputSeconds(e.target.value)}
              placeholder="SS"
            />
          </div>
        ) : (
          <div 
            onClick={() => { if(!isActive) setIsEditing(true); }} 
            style={{cursor: isActive ? 'default' : 'pointer'}}
            title={!isActive ? "Click to edit time" : ""}
          >
            {formatTime(timeLeft)}
          </div>
        )}
      </div>
      
      <div style={styles.controls}>
        <button className="glass-button" style={styles.btn} onClick={(e) => {e.stopPropagation(); toggleTimer();}}>
          {isActive ? 'Pause' : 'Start'}
        </button>
        <button className="glass-button secondary" style={styles.btn} onClick={(e) => {e.stopPropagation(); resetTimer();}}>
          Reset
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    width: '240px',
    padding: '20px',
    zIndex: 1000,
    userSelect: 'none',
    boxShadow: '0 15px 35px rgba(0,0,0,0.5), 0 0 20px rgba(138, 43, 226, 0.4)',
    border: '1px solid rgba(138, 43, 226, 0.3)'
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '20px',
    cursor: 'pointer',
    lineHeight: '1'
  },
  header: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px'
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: 'var(--accent-secondary)',
    boxShadow: '0 0 8px var(--accent-secondary)'
  },
  timeDisplay: {
    fontSize: '36px',
    fontWeight: '700',
    textAlign: 'center',
    margin: '15px 0',
    fontVariantNumeric: 'tabular-nums'
  },
  timeInput: {
    width: '45px',
    fontSize: '20px',
    fontWeight: '700',
    textAlign: 'center',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--accent-primary)',
    color: 'white',
    borderRadius: '6px',
    padding: '2px',
    outline: 'none'
  },
  controls: {
    display: 'flex',
    gap: '10px'
  },
  btn: {
    flex: 1,
    padding: '8px',
    fontSize: '14px'
  }
};

export default FloatingTimer;
