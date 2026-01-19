import { useState, useEffect, useRef } from 'react'
import './App.css'
import itemLangData from './assets/item.json'

interface Block {
  x: number;
  y: number;
  z: number;
  name: string;
  rotation?: number;
  [key: string]: any;
}

interface MaterialInfo {
  count: number;
  type: 'block' | 'fluid';
}

interface Materials {
  [material: string]: MaterialInfo;
}

interface BlockColors {
  [blockName: string]: string;
}

function App() {
  const [activeTab, setActiveTab] = useState<'count' | 'layers'>('count')
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null)
  const [materials, setMaterials] = useState<Materials>(() => {
    const saved = localStorage.getItem('materials')
    return saved ? JSON.parse(saved) : {}
  })
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('checkedItems')
    return saved ? JSON.parse(saved) : {}
  })
  const [langMap, setLangMap] = useState<Record<string, string>>({})
  const [blocks, setBlocks] = useState<Block[]>([])
  const [blockColors, setBlockColors] = useState<BlockColors>(() => {
    const saved = localStorage.getItem('blockColors')
    return saved ? JSON.parse(saved) : {}
  })
  const isLoadingFromStorage = useRef(true)

  // Load language file and blocks from localStorage on mount
  useEffect(() => {
    setLangMap(itemLangData)
    const savedBlocks = localStorage.getItem('blocks')
    if (savedBlocks) {
      try {
        setBlocks(JSON.parse(savedBlocks))
      } catch (err) {
        console.error('Failed to load blocks from localStorage:', err)
      }
    }
  }, [])

  // Mark that loading is complete
  useEffect(() => {
    isLoadingFromStorage.current = false
  }, [])

  // Save blocks to localStorage whenever they change
  useEffect(() => {
    if (blocks.length > 0) {
      localStorage.setItem('blocks', JSON.stringify(blocks))
    }
  }, [blocks])

  // Save block colors to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(blockColors).length > 0) {
      localStorage.setItem('blockColors', JSON.stringify(blockColors))
    }
  }, [blockColors])

  // Save materials to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(materials).length > 0) {
      localStorage.setItem('materials', JSON.stringify(materials))
    }
  }, [materials])

  // Save checked items to localStorage whenever they change
  useEffect(() => {
    if (!isLoadingFromStorage.current) {
      localStorage.setItem('checkedItems', JSON.stringify(checkedItems))
    }
  }, [checkedItems])

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError('')

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string)
        
        // Check if blocks array exists
        if (!json.blocks || !Array.isArray(json.blocks)) {
          setError('JSON must contain a "blocks" array')
          setMaterials({})
          return
        }

        // Count materials
        const materialCounts: Materials = {}
        
        // Process blocks
        json.blocks.forEach((block: Block) => {
          if (block.name && !block.name.toLowerCase().includes('empty')) {
            if (!materialCounts[block.name]) {
              materialCounts[block.name] = { count: 0, type: 'block' }
            }
            materialCounts[block.name].count += 1
          }
        })

        // Process fluids if they exist
        if (json.fluids && Array.isArray(json.fluids)) {
          json.fluids.forEach((fluid: Block) => {
            if (fluid.name && !fluid.name.toLowerCase().includes('empty')) {
              if (!materialCounts[fluid.name]) {
                materialCounts[fluid.name] = { count: 0, type: 'fluid' }
              }
              materialCounts[fluid.name].count += 1
            }
          })
        }

        setMaterials(materialCounts)
        setBlocks(json.blocks)
        ensureBlockColors(json.blocks)
      } catch (err) {
        setError(`Failed to parse JSON: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setMaterials({})
        setBlocks([])
      }
    }
    reader.readAsText(file)
  }

  const sortedMaterials = Object.entries(materials)
    .sort((a, b) => b[1].count - a[1].count)

  const toggleChecked = (material: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [material]: !prev[material]
    }))
  }

  const getDisplayName = (materialKey: string): string => {
    return langMap[materialKey] || materialKey
  }

  // Generate a consistent color from a block name using hash
  const generateColorFromName = (name: string): string => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      const char = name.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    
    // Convert hash to HSL color for better color distribution
    const hue = Math.abs(hash % 360)
    const saturation = 65 + (Math.abs(hash) % 20)
    const lightness = 45 + (Math.abs(hash) % 15)
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  // Get or create colors for all blocks
  const ensureBlockColors = (blocksToColor: Block[]) => {
    const newColors = { ...blockColors }
    let hasNewColors = false
    
    blocksToColor.forEach(block => {
      if (block.name && !newColors[block.name]) {
        newColors[block.name] = generateColorFromName(block.name)
        hasNewColors = true
      }
    })
    
    if (hasNewColors) {
      setBlockColors(newColors)
    }
  }

  // Get unique layers from blocks
  const uniqueLayers = Array.from(new Set(blocks.map(b => b.y))).sort((a, b) => a - b)

  // Get blocks for selected layer
  const blocksOnLayer = selectedLayer !== null 
    ? blocks.filter(b => b.y === selectedLayer)
    : []

  // Calculate global grid bounds across all layers
  const getGlobalGridBounds = () => {
    if (blocks.length === 0) return { minX: 0, maxX: 0, minZ: 0, maxZ: 0 }
    const xValues = blocks.map(b => b.x)
    const zValues = blocks.map(b => b.z)
    return {
      minX: Math.min(...xValues),
      maxX: Math.max(...xValues),
      minZ: Math.min(...zValues),
      maxZ: Math.max(...zValues)
    }
  }

  // Create a grid mapping for quick block lookup
  const getBlockGridMap = () => {
    const map = new Map<string, Block>()
    blocksOnLayer.forEach(block => {
      map.set(`${block.x},${block.z}`, block)
    })
    return map
  }

  const globalBounds = getGlobalGridBounds()
  const blockMap = getBlockGridMap()
  const totalBlocks = blocks.length

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="navbar bg-primary text-primary-content">
        <div className="flex-1">
          <div className="text-xl">Hytale Block Reader</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        {/* Tabs */}
        <div role="tablist" className="tabs tabs-lift tabs-xl">
          <button
            role="tab"
            className={`btn tab ${activeTab === 'count' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('count')}
            aria-selected={activeTab === 'count'}
          >
            Block Count
          </button>
          <button
            role="tab"
            className={`btn tab ${activeTab === 'layers' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('layers')}
            aria-selected={activeTab === 'layers'}
          >
            Layer Viewer
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'count' && (
          <div role="tabpanel" className="bg-base-200 shadow-lg rounded-b-lg">
            <div className="card">
              <div className="card-body">
                <h2 className="card-title mb-4">Block Count</h2>
                <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                  <div className="stat">
                    <div className="stat-title">Total Blocks</div>
                    <div className="stat-value text-primary text-4xl">{totalBlocks}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Total Layers</div>
                    <div className="stat-value text-secondary text-4xl">{uniqueLayers.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div role="tabpanel" className="bg-base-200 shadow-lg rounded-b-lg">
            <div className="card">
              <div className="card-body">
                <h2 className="card-title mb-4">Layer Viewer</h2>
              
                {/* Layer Selector */}
                <div className="form-control w-full max-w-xs mb-6">
                  <label className="label">
                    <span className="label-text">Select Layer (Y)</span>
                  </label>
                  <select
                    value={selectedLayer ?? ''}
                    onChange={(e) => setSelectedLayer(e.target.value ? parseInt(e.target.value) : null)}
                    className="select select-bordered w-full max-w-xs"
                  >
                    <option value="">Choose a layer...</option>
                    {uniqueLayers.map(layer => (
                      <option key={layer} value={layer}>
                        Layer {layer} ({blocks.filter(b => b.y === layer).length} blocks)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid Visualization */}
                {selectedLayer !== null && blocksOnLayer.length > 0 ? (
                  <div className="overflow-auto p-4 bg-base-300">
                    <div
                      className="inline-block relative"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${globalBounds.maxZ - globalBounds.minZ + 1}, minmax(0, 1fr))`,
                        gap: '1px',
                        backgroundColor: '#4b5563',
                        padding: '4px'
                      }}
                    >
                      {Array.from({ length: globalBounds.maxX - globalBounds.minX + 1 }).map((_, xIdx) => {
                        return Array.from({ length: globalBounds.maxZ - globalBounds.minZ + 1 }).map((_, zIdx) => {
                          const x = globalBounds.minX + xIdx
                          const z = globalBounds.minZ + zIdx
                          const block = blockMap.get(`${x},${z}`)
                          
                          return (
                            <div
                              key={`${x},${z}`}
                              className={`w-[64px] h-[64px] m-[1px] cursor-pointer transition-opacity hover:opacity-75 ${
                                block ? 'border border-gray-400' : ''
                              }`}
                              style={{
                                backgroundColor: block ? blockColors[block.name] || '#e5e7eb' : 'transparent'
                              }}
                              title={block ? `${block.name} (${x}, ${selectedLayer}, ${z})` : `Empty (${x}, ${selectedLayer}, ${z})`}
                            />
                          )
                        })
                      })}
                    </div>
                    <div className="mt-4 text-sm text-base-content opacity-70">
                      <p>Layer {selectedLayer}: {blocksOnLayer.length} blocks</p>
                      <p>Grid: {globalBounds.maxX - globalBounds.minX + 1} × {globalBounds.maxZ - globalBounds.minZ + 1}</p>
                    </div>
                  </div>
                ) : selectedLayer !== null ? (
                  <div className="alert alert-info">
                    <span>No blocks found on layer {selectedLayer}</span>
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <span>Select a layer to view blocks</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="card bg-base-200 shadow-lg my-6">
          <div className="card-body">
            <h2 className="card-title mb-4">Import JSON File</h2>
            
            {/* File Input */}
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text">Select JSON file</span>
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="file-input file-input-bordered w-full max-w-xs"
              />
              {fileName && (
                <label className="label">
                  <span className="label-text-alt">📄 {fileName}</span>
                </label>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div role="alert" className="alert alert-error mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2m8-8l2 2m0 0l2 2m-2-2l-2 2m2-2l2-2" /></svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Materials List */}
        {Object.keys(materials).length > 0 && (
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body">
              <h2 className="card-title mb-4">Materials Used</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th className="w-12"></th>
                      <th>Material</th>
                      <th className="text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMaterials.map(([material, materialInfo]) => (
                      <tr key={material}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={checkedItems[material] || false}
                            onChange={() => toggleChecked(material)}
                          />
                        </td>
                        <td><span className='font-medium'>{getDisplayName(material)}</span> - {material}</td>
                        <td className="text-right">
                          <span className={`badge badge-lg ${materialInfo.type === 'block' ? 'badge-primary' : 'badge-secondary'}`}>{materialInfo.count}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Summary Stats */}
              <div className="stats stats-vertical lg:stats-horizontal shadow mt-6 w-full">
                <div className="stat">
                  <div className="stat-title">Total Blocks</div>
                  <div className="stat-value text-primary">
                    {Object.values(materials).reduce((a, b) => a + b.count, 0)}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Unique Materials</div>
                  <div className="stat-value text-secondary">
                    {Object.keys(materials).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {Object.keys(materials).length === 0 && !error && (
          <div className="card bg-base-200 shadow-lg">
            <div className="card-body items-center text-center">
              <svg className="w-16 h-16 text-base-content opacity-50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <h3 className="font-bold text-lg">No data yet</h3>
              <p className="text-base-content opacity-70">Import a JSON file to see material counts</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
