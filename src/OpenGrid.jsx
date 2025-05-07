import React, { useState, useEffect, useRef, useCallback } from 'react';
import './OpenGrid.css';

export default function OpenGrid() {
  // State variables
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5']);
  const [newPlayerInput, setNewPlayerInput] = useState('');
  const [columns, setColumns] = useState(8);
  const [minPlayers, setMinPlayers] = useState(1);
  const [maxAdditionalPlayers, setMaxAdditionalPlayers] = useState(1);
  const [sliderActive, setSliderActive] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState(30);
  const [generatedTable, setGeneratedTable] = useState([]);
  const [settingsCollapsed, setSettingsCollapsed] = useState(false);
  const [cueMode, setCueMode] = useState('none'); // 'none', 'player', or 'timed'
  const [playerCues, setPlayerCues] = useState([]);
  const [progressBarPosition, setProgressBarPosition] = useState(0);
  const [pacingMode, setPacingMode] = useState('even'); // 'even' or 'uneven'
  const [columnDurations, setColumnDurations] = useState([]);
  const [sliderCompleted, setSliderCompleted] = useState(false);
  
  const sliderInterval = useRef(null);
  const fileInputRef = useRef(null);

  // Generate empty table
  const generateEmptyTable = useCallback(() => {
    const newTable = playerNames.map(name => Array(columns).fill(''));
    setGeneratedTable(newTable);
  }, [playerNames, columns]);

  // Generate column durations based on pacing mode
  const generateColumnDurations = useCallback(() => {
    if (columns <= 1) return;
    
    const totalDuration = totalDurationSeconds;
    const columnCount = columns - 1; // Exclude player column
    
    if (pacingMode === 'even') {
      // Even distribution
      const evenDuration = totalDuration / columnCount;
      setColumnDurations(Array(columnCount).fill(evenDuration));
    } else {
      // Uneven distribution
      const durations = [];
      let remainingDuration = totalDuration;
      
      for (let i = 0; i < columnCount - 1; i++) {
        // Random duration between 0.2 and 2 times the average duration
        const avgDuration = remainingDuration / (columnCount - i);
        const duration = avgDuration * (0.2 + Math.random() * 1.8);
        durations.push(duration);
        remainingDuration -= duration;
      }
      
      // Add the remaining duration to the last column
      durations.push(remainingDuration);
      
      setColumnDurations(durations);
    }
}, [columns, totalDurationSeconds, pacingMode]);

  // Get cumulative duration at each column
  const getCumulativeDurations = useCallback(() => {
    const cumulative = [0]; // Start with 0
    let sum = 0;
    for (let i = 0; i < columnDurations.length; i++) {
      sum += columnDurations[i];
      cumulative.push(sum);
    }
    return cumulative;
  }, [columnDurations]);

  // Calculate which cells should have player cues
  const calculatePlayerCues = useCallback(() => {
    const cues = [];
    
    // Start from the second column (index 1)
    for (let col = 1; col < columns; col++) {
      const colChanges = [];
      
      for (let row = 0; row < playerNames.length; row++) {
        const currentState = generatedTable[row][col] ? true : false;
        const previousState = generatedTable[row][col-1] ? true : false;
        
        // If player state changed (on to off, or off to on)
        if (currentState !== previousState) {
          colChanges.push(row);
        }
      }
      
      // If there are changes, select one player to be the cue
      if (colChanges.length > 0) {
        // Randomly select one player who changed state
        const randomIndex = Math.floor(Math.random() * colChanges.length);
        cues.push({ col, row: colChanges[randomIndex] });
      }
    }
    
    setPlayerCues(cues);
  }, [columns, playerNames, generatedTable]);

  // Fill table with on/off states fairly distributed among players
  const fillTable = () => {
    const newTable = [...generatedTable];
    
    // Track how many active cells each player has
    const playerCellCounts = Array(playerNames.length).fill(0);
    
    // Start from column 1 (index 1), skipping the first column
    for (let col = 1; col < columns; col++) {
      // Calculate how many players to assign in this column
      const additionalPlayers = Math.floor(Math.random() * (maxAdditionalPlayers + 1));
      const totalPlayers = Math.min(minPlayers + additionalPlayers, playerNames.length);
      
      // Sort players by number of active cells (ascending) to prioritize players with fewer active states
      const playerIndices = Array.from({ length: playerNames.length }, (_, i) => i)
        .sort((a, b) => playerCellCounts[a] - playerCellCounts[b]);
      
      // Clear column first
      for (let row = 0; row < playerNames.length; row++) {
        newTable[row][col] = '';
      }
      
      // Assign active states to selected players (prioritizing those with fewer active states)
      for (let i = 0; i < totalPlayers; i++) {
        const playerIdx = playerIndices[i];
        newTable[playerIdx][col] = 'on';
        playerCellCounts[playerIdx]++;
      }
    }
    
    setGeneratedTable(newTable);
  };

  // Handle player names from file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const names = text.split(/[\n,]/) // Split by newline or comma
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      if (names.length > 0) {
        setPlayerNames(names);
      }
    };
    reader.readAsText(file);
  };

  // Handle manually adding players
  const handleAddPlayers = () => {
    if (!newPlayerInput.trim()) return;
    
    const newPlayers = newPlayerInput
      .split(',')
      .map(name => name.trim())
      .filter(name => name);
    
    if (newPlayers.length > 0) {
      setPlayerNames([...playerNames, ...newPlayers]);
      setNewPlayerInput('');
    }
  };

  // Handle removing a player
  const removePlayer = (index) => {
    const newPlayers = [...playerNames];
    newPlayers.splice(index, 1);
    setPlayerNames(newPlayers);
  };

  // Handle player reordering
  const movePlayer = (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === playerNames.length - 1)) {
      return;
    }
    
    const newPlayers = [...playerNames];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap positions
    const temp = newPlayers[index];
    newPlayers[index] = newPlayers[targetIndex];
    newPlayers[targetIndex] = temp;
    setPlayerNames(newPlayers);
  };

  // Toggle cell state
  const toggleCell = (rowIdx, colIdx) => {
    const newTable = [...generatedTable];
    newTable[rowIdx][colIdx] = newTable[rowIdx][colIdx] ? '' : 'on';
    setGeneratedTable(newTable);
  };

  // Clear all cells
  const clearAllCells = () => {
    generateEmptyTable();
  };

  // Start/reset slider for timed cues
  const startSlider = () => {
    setProgressBarPosition(0);
    setSliderActive(true);
    setSliderCompleted(false);  // Reset this when starting the slider
    generateColumnDurations();
  };

  // Pause slider
  const pauseSlider = () => {
    setSliderActive(false);
  };

  // Reset slider
  const resetSlider = () => {
    setProgressBarPosition(0);
    setSliderActive(false);
    setSliderCompleted(false);  // Reset this when resetting the slider
  };

  // Check if a cell should display player cue
  const shouldShowPlayerCue = (rowIdx, colIdx) => {
    return cueMode === 'player' && playerCues.some(cue => cue.row === rowIdx && cue.col === colIdx);
  };

  // Initialize table on first load
  useEffect(() => {
    generateEmptyTable();
    generateColumnDurations();
 }, [playerNames, columns, pacingMode, totalDurationSeconds, generateEmptyTable, generateColumnDurations]);

  // Slider animation for timed cues
  useEffect(() => {
    if (sliderActive && cueMode === 'timed') {
      const startTime = Date.now();
      const cumulativeDurations = getCumulativeDurations();
      
      sliderInterval.current = setInterval(() => {
        const elapsedTime = (Date.now() - startTime) / 1000;
        
        if (elapsedTime >= totalDurationSeconds) {
  setProgressBarPosition(100);
  setSliderActive(false);
  setSliderCompleted(true);
  clearInterval(sliderInterval.current);
  return;
}
        
        // Find the current column based on elapsed time
        let currentColumn = 0;
        while (currentColumn < cumulativeDurations.length - 1 && 
               elapsedTime > cumulativeDurations[currentColumn + 1]) {
          currentColumn++;
        }
        
        // Calculate progress within the current column
        const columnStartTime = cumulativeDurations[currentColumn];
        const columnDuration = columnDurations[currentColumn];
        const columnProgress = (elapsedTime - columnStartTime) / columnDuration;
        
        // Calculate overall progress
        const overallProgress = (currentColumn + columnProgress) / (columns - 1);
        setProgressBarPosition(overallProgress * 100);
        
      }, 33); // ~30 fps update
    } else if (!sliderActive && sliderInterval.current) {
      clearInterval(sliderInterval.current);
    }
    
    return () => {
      if (sliderInterval.current) clearInterval(sliderInterval.current);
    };
  }, [sliderActive, cueMode, totalDurationSeconds, columnDurations, columns, getCumulativeDurations]);

  // Update player cues when table changes
  useEffect(() => {
    if (cueMode === 'player') {
      calculatePlayerCues();
    } else {
      setPlayerCues([]);
    }
  }, [generatedTable, cueMode, calculatePlayerCues]);

  return (
    <div className="app-container">
      {/* Main Container */}
      <div className="main-layout">
        {/* Settings Panel (Left Side) */}
        <div className={`settings-panel ${settingsCollapsed ? 'collapsed' : ''}`}>
          {/* Collapse/Expand Toggle */}
          <button 
            onClick={() => setSettingsCollapsed(!settingsCollapsed)}
            className="collapse-toggle-button"
            aria-label={settingsCollapsed ? "Expand settings" : "Collapse settings"}
          >
            {settingsCollapsed ? '>' : '<'}
          </button>
          
          {!settingsCollapsed && (
            <div className="settings-content">
              {/* Players Management */}
              <div className="settings-section">
                <h2 className="section-title">Players</h2>
                
                {/* Add Players */}
                <div className="control-group">
                  <label>Add Players</label>
                  <div className="input-with-button">
                    <input 
                      type="text" 
                      value={newPlayerInput} 
                      onChange={(e) => setNewPlayerInput(e.target.value)}
                      placeholder="Names, separated by commas"
                      className="text-input"
                    />
                    <button 
                      onClick={handleAddPlayers}
                      className="add-button"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                {/* File Upload */}
                <div className="control-group">
                  <label>Player Names File</label>
                  <div className="button-group">
                    <input 
                      type="file" 
                      accept=".txt,.csv" 
                      onChange={handleFileUpload} 
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <button 
                      onClick={() => fileInputRef.current.click()}
                      className="file-button"
                    >
                      Open File
                    </button>
                    <button 
                      onClick={() => setPlayerNames([])}
                      className="clear-button"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                {/* Player List */}
                <div className="control-group">
                  <label>Current Players</label>
                  <div className="player-list-container">
                    {playerNames.length === 0 ? (
                      <div className="no-players">No players added</div>
                    ) : (
                      <ul className="player-list">
                        {playerNames.map((name, index) => (
                          <li key={index} className="player-item">
                            <span className="player-name">{name}</span>
                            <div className="player-controls">
                              <button 
                                onClick={() => movePlayer(index, 'up')}
                                disabled={index === 0}
                                className={`move-button ${index === 0 ? 'disabled' : ''}`}
                                aria-label="Move player up"
                              >
                                ↑
                              </button>
                              <button 
                                onClick={() => movePlayer(index, 'down')}
                                disabled={index === playerNames.length - 1}
                                className={`move-button ${index === playerNames.length - 1 ? 'disabled' : ''}`}
                                aria-label="Move player down"
                              >
                                ↓
                              </button>
                              <button 
                                onClick={() => removePlayer(index)}
                                className="remove-button"
                                aria-label="Remove player"
                              >
                                ×
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Table Configuration */}
              <div className="settings-section">
                <h2 className="section-title">Table</h2>
                
                <div className="table-controls-row">
                  <div className="control-group">
                    <label>Columns</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="20" 
                      value={columns} 
                      onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
                      className="number-input"
                    />
                  </div>
                  
                  <div className="control-group">
                    <label>Min Players</label>
                    <input 
                      type="number" 
                      min="0" 
                      max={playerNames.length} 
                      value={minPlayers} 
                      onChange={(e) => setMinPlayers(parseInt(e.target.value) || 0)}
                      className="number-input"
                    />
                  </div>
                  
                  <div className="control-group">
                    <label>Max Additional</label>
                    <input 
                      type="number" 
                      min="0" 
                      max={playerNames.length} 
                      value={maxAdditionalPlayers} 
                      onChange={(e) => setMaxAdditionalPlayers(parseInt(e.target.value) || 0)}
                      className="number-input"
                    />
                  </div>
                </div>
                
                <div className="table-buttons-row">
                  <button 
                    onClick={fillTable}
                    className="fill-button"
                  >
                    Fill Table
                  </button>
                  <button 
                    onClick={clearAllCells}
                    className="clear-button"
                  >
                    Clear Table
                  </button>
                </div>
              </div>
              
              {/* Timing Cues Controls */}
              <div className="settings-section">
                <h2 className="section-title">Timing</h2>
                
                <div className="cue-mode-selector">
                  <button 
                    onClick={() => setCueMode('none')}
                    className={`cue-toggle-button ${cueMode === 'none' ? 'active' : ''}`}
                  >
                    No cues
                  </button>
                  <button 
                    onClick={() => setCueMode('player')}
                    className={`cue-toggle-button ${cueMode === 'player' ? 'active' : ''}`}
                  >
                    Player cues
                  </button>
                  <button 
                    onClick={() => setCueMode('timed')}
                    className={`cue-toggle-button ${cueMode === 'timed' ? 'active' : ''}`}
                  >
                    Timed cues
                  </button>
                </div>
                
                {cueMode === 'timed' && (
                  <>
                    <div className="control-group mt-10">
                      <div className="settings-row">
                        <div>
  <label>Piece duration</label>
  <div className="time-input-container">
    <input 
      type="number" 
      min="0" 
      max="90"
      value={durationMinutes} 
      onChange={(e) => {
        const mins = Math.min(90, Math.max(0, parseInt(e.target.value) || 0));
        setDurationMinutes(mins);
        setTotalDurationSeconds(mins * 60 + durationSeconds);
      }}
      className="time-input"
    />
    <span className="time-label">min</span>
    <input 
      type="number" 
      min="0" 
      max="59"
      value={durationSeconds} 
      onChange={(e) => {
        const secs = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
        setDurationSeconds(secs);
        setTotalDurationSeconds(durationMinutes * 60 + secs);
      }}
      className="time-input"
    />
    <span className="time-label">sec</span>
  </div>
  <input
    type="range"
    min="30"
    max="5400"
    value={totalDurationSeconds}
    onChange={(e) => {
      const total = parseInt(e.target.value);
      setTotalDurationSeconds(total);
      setDurationMinutes(Math.floor(total / 60));
      setDurationSeconds(total % 60);
    }}
    className="time-slider"
  />
</div>
                        
                        <div className="pacing-controls">
                          <label>Pacing</label>
                          <div className="button-group">
                            <button 
                              onClick={() => setPacingMode('even')}
                              className={`pacing-button ${pacingMode === 'even' ? 'active' : ''}`}
                            >
                              Even
                            </button>
                            <button 
                              onClick={() => setPacingMode('uneven')}
                              className={`pacing-button ${pacingMode === 'uneven' ? 'active' : ''}`}
                            >
                              Uneven
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Main Table Display (Right Side) */}
        <div className={`table-container ${settingsCollapsed ? 'full-width' : ''}`}>
          <div className="table-wrapper">
            <table className="main-table">
              <thead>
                <tr>
                  <th className="player-header">Players</th>
                  {Array.from({ length: columns - 1 }, (_, i) => (
                    <th key={i} className="column-header">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {playerNames.map((name, rowIdx) => (
                  <tr key={rowIdx}>
                    <td className="player-cell">
                      {name}
                    </td>
                    {Array.from({ length: columns - 1 }, (_, colIdx) => {
                      const adjustedColIdx = colIdx + 1; // Skip player column in data array
                      return (
                        <td 
                          key={colIdx} 
                          className={`
                             grid-cell 
                             ${shouldShowPlayerCue(rowIdx, adjustedColIdx) ? 'player-cue' : ''}
                          `}
                          onClick={() => toggleCell(rowIdx, adjustedColIdx)}
                        >
                          {generatedTable[rowIdx]?.[adjustedColIdx] && (
                            <div className="player-on"></div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Progress bar with controls */}
{cueMode === 'timed' && (
  <div className="progress-wrapper">
    <div className="progress-controls">
      <button 
        onClick={startSlider} 
        className="icon-button play-icon-button"
        aria-label="Start"
      >
        <div className="icon-play"></div>
      </button>
      <div className="button-group">
        <button 
          onClick={pauseSlider}
          className="icon-button pause-icon-button"
          aria-label="Pause"
        >
          <div className="icon-pause">
            <div className="icon-pause-bar"></div>
            <div className="icon-pause-bar"></div>
          </div>
        </button>
        <button 
          onClick={resetSlider}
          className="icon-button reset-icon-button"
          aria-label="Reset"
        >
          ↺
        </button>
      </div>
    </div>
    <div className="progress-container">
      <div 
        className="progress-bar"
        style={{
          width: `${progressBarPosition}%`,
          transition: 'width 0.1s linear'
        }}
      />
    </div>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
}