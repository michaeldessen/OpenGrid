import { useState, useEffect, useRef } from 'react'

export default function ImprovisationalStructureGenerator() {
  // State variables
  const [playerNames, setPlayerNames] = useState(['Lisa', 'Rebecca', 'Michael', 'Willie', 'Shivangi', 'Chieh'])
  const [columns, setColumns] = useState(8)
  const [minPlayers, setMinPlayers] = useState(1)
  const [maxAdditionalPlayers, setMaxAdditionalPlayers] = useState(1)
  const [sliderPosition, setSliderPosition] = useState(-1)
  const [sliderActive, setSliderActive] = useState(false)
  const [sliderVisible, setSliderVisible] = useState(true)
  const [sliderDuration, setSliderDuration] = useState(30)
  const [generatedTable, setGeneratedTable] = useState([])
  const [selectedCell, setSelectedCell] = useState(null)
  const [cellMode, setCellMode] = useState('cell') // 'none' or 'cell'
  
  const sliderInterval = useRef(null)
  const fileInputRef = useRef(null)
  
  // Initialize table on first load
  useEffect(() => {
    generateEmptyTable()
  }, [playerNames, columns])
  
  // Slider animation
  useEffect(() => {
    if (sliderActive && sliderVisible) {
      sliderInterval.current = setInterval(() => {
        setSliderPosition(prev => {
          const newPos = prev + 1
          if (newPos >= columns) {
            setSliderActive(false)
            return -1
          }
          return newPos
        })
      }, (sliderDuration * 1000) / columns)
    } else if (!sliderActive && sliderInterval.current) {
      clearInterval(sliderInterval.current)
    }
    
    return () => {
      if (sliderInterval.current) clearInterval(sliderInterval.current)
    }
  }, [sliderActive, sliderVisible, columns, sliderDuration])
  
  // Generate empty table
  const generateEmptyTable = () => {
    const newTable = playerNames.map(name => Array(columns).fill(''))
    setGeneratedTable(newTable)
  }
  
  // Fill table with cues randomly based on parameters
  const fillTable = () => {
    const newTable = [...generatedTable]
    
    for (let col = 0; col < columns; col++) {
      // Calculate how many players to assign in this column
      const additionalPlayers = Math.floor(Math.random() * (maxAdditionalPlayers + 1))
      const totalPlayers = Math.min(minPlayers + additionalPlayers, playerNames.length)
      
      // Create array of player indices and shuffle it
      const playerIndices = Array.from({ length: playerNames.length }, (_, i) => i)
      for (let i = playerIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [playerIndices[i], playerIndices[j]] = [playerIndices[j], playerIndices[i]]
      }
      
      // Clear column first
      for (let row = 0; row < playerNames.length; row++) {
        newTable[row][col] = ''
      }
      
      // Assign cues to selected players
      for (let i = 0; i < totalPlayers; i++) {
        const playerIdx = playerIndices[i]
        newTable[playerIdx][col] = 'X'
      }
    }
    
    setGeneratedTable(newTable)
  }
  
  // Handle player names from file
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split('\n')
      const names = lines
        .filter(line => line.trim())
        .map(line => {
          const match = line.match(/\d+,\s*\d+\s+([^;]+);/)
          return match ? match[1].trim() : null
        })
        .filter(Boolean)
      
      if (names.length > 0) {
        setPlayerNames(names)
      }
    }
    reader.readAsText(file)
  }
  
  // Toggle cell state
  const toggleCell = (rowIdx, colIdx) => {
    const newTable = [...generatedTable]
    newTable[rowIdx][colIdx] = newTable[rowIdx][colIdx] ? '' : 'X'
    setGeneratedTable(newTable)
  }
  
  // Clear all cells
  const clearAllCells = () => {
    generateEmptyTable()
  }
  
  // Start/reset slider
  const startSlider = () => {
    setSliderPosition(0)
    setSliderActive(true)
  }
  
  // Pause slider
  const pauseSlider = () => {
    setSliderActive(false)
  }
  
  // Reset slider
  const resetSlider = () => {
    setSliderPosition(-1)
    setSliderActive(false)
  }
  
  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-100 max-w-6xl mx-auto rounded-lg">
      <h1 className="text-2xl font-bold text-center">Improvisational Structure Generator</h1>
      
      {/* Setup Panel */}
      <div className="bg-yellow-100 p-4 rounded-lg">
        <h2 className="font-bold mb-3">Setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">Player Names File</label>
            <div className="flex gap-2">
              <input 
                type="file" 
                accept=".txt" 
                onChange={handleFileUpload} 
                ref={fileInputRef}
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                className="bg-blue-100 border border-gray-400 px-3 py-1 rounded"
              >
                Open File
              </button>
              <button 
                onClick={() => setPlayerNames([])}
                className="bg-gray-200 border border-gray-400 px-3 py-1 rounded"
              >
                Clear Names
              </button>
            </div>
          </div>
          
          <div>
            <label className="block mb-1">Number of Columns</label>
            <input 
              type="number" 
              min="1" 
              max="20" 
              value={columns} 
              onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
              className="border border-gray-400 px-3 py-1 rounded w-16"
            />
          </div>
          
          <div>
            <label className="block mb-1">Reset Table/Slider</label>
            <div className="flex gap-2">
              <button 
                onClick={clearAllCells}
                className="bg-gray-200 border border-gray-400 px-3 py-1 rounded"
              >
                Clear All
              </button>
              <button 
                onClick={resetSlider}
                className="bg-red-100 border border-gray-400 px-3 py-1 rounded"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Slider Controls */}
      <div className="bg-yellow-100 p-4 rounded-lg">
        <h2 className="font-bold mb-3">Slider</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">Duration (seconds)</label>
            <input 
              type="number" 
              min="1" 
              value={sliderDuration} 
              onChange={(e) => setSliderDuration(parseInt(e.target.value) || 30)}
              className="border border-gray-400 px-3 py-1 rounded w-16"
            />
          </div>
          
          <div>
            <label className="block mb-1">Visibility</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setSliderVisible(true)}
                className={`border px-3 py-1 rounded ${sliderVisible ? 'bg-orange-400 text-white' : 'bg-gray-200'}`}
              >
                Show
              </button>
              <button 
                onClick={() => setSliderVisible(false)}
                className={`border px-3 py-1 rounded ${!sliderVisible ? 'bg-gray-500 text-white' : 'bg-gray-200'}`}
              >
                Hide
              </button>
            </div>
          </div>
          
          <div>
            <label className="block mb-1">Controls</label>
            <div className="flex gap-2">
              <button 
                onClick={startSlider} 
                className="bg-green-200 border border-gray-400 px-3 py-1 rounded"
              >
                Start
              </button>
              <button 
                onClick={pauseSlider}
                className="bg-blue-200 border border-gray-400 px-3 py-1 rounded"
              >
                Pause
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Table Configuration */}
      <div className="bg-yellow-100 p-4 rounded-lg">
        <h2 className="font-bold mb-3">Table</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">Min Players per Column</label>
            <input 
              type="number" 
              min="0" 
              max={playerNames.length} 
              value={minPlayers} 
              onChange={(e) => setMinPlayers(parseInt(e.target.value) || 0)}
              className="border border-gray-400 px-3 py-1 rounded w-16"
            />
          </div>
          
          <div>
            <label className="block mb-1">Max Additional Players</label>
            <input 
              type="number" 
              min="0" 
              max={playerNames.length} 
              value={maxAdditionalPlayers} 
              onChange={(e) => setMaxAdditionalPlayers(parseInt(e.target.value) || 0)}
              className="border border-gray-400 px-3 py-1 rounded w-16"
            />
          </div>
          
          <div>
            <label className="block mb-1">Fill Table</label>
            <button 
              onClick={fillTable}
              className="bg-red-400 text-white border border-gray-400 px-3 py-1 rounded"
            >
              Fill
            </button>
          </div>
        </div>
      </div>
      
      {/* Cell Options */}
      <div className="bg-yellow-100 p-4 rounded-lg">
        <h2 className="font-bold mb-3">Cell Mode</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCellMode('none')}
              className={`border px-3 py-1 rounded ${cellMode === 'none' ? 'bg-orange-400 text-white' : 'bg-gray-200'}`}
            >
              None
            </button>
            <button 
              onClick={() => setCellMode('cell')}
              className={`border px-3 py-1 rounded ${cellMode === 'cell' ? 'bg-gray-500 text-white' : 'bg-gray-200'}`}
            >
              Cell
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Table Display */}
      <div className="overflow-x-auto">
        <table className="border-collapse border w-full">
          <thead>
            <tr>
              <th className="border border-gray-400 p-2 bg-gray-100">Players</th>
              {Array.from({ length: columns }, (_, i) => (
                <th key={i} className="border border-gray-400 p-2 bg-gray-100 w-12 text-center">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {playerNames.map((name, rowIdx) => (
              <tr key={rowIdx}>
                <td className="border border-gray-400 p-2 bg-gray-100 font-medium">
                  {name}
                </td>
                {Array.from({ length: columns }, (_, colIdx) => (
                  <td 
                    key={colIdx} 
                    className={`border border-gray-400 p-0 text-center relative h-12 w-12
                      ${colIdx === sliderPosition && sliderVisible ? 'bg-yellow-200' : 'bg-white'}
                    `}
                    onClick={() => toggleCell(rowIdx, colIdx)}
                  >
                    {generatedTable[rowIdx]?.[colIdx] && (
                      <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">
                        X
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
