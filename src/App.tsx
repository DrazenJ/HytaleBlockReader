import { useState, useEffect, useRef } from 'react'
import './App.css'
import itemLangData from './assets/item.json'

interface Block {
  name: string;
  [key: string]: any;
}

interface MaterialInfo {
  count: number;
  type: 'block' | 'fluid';
}

interface Materials {
  [material: string]: MaterialInfo;
}

function App() {
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
  const isLoadingFromStorage = useRef(true)

  // Load language file on mount
  useEffect(() => {
    setLangMap(itemLangData)
  }, [])

  // Mark that loading is complete
  useEffect(() => {
    isLoadingFromStorage.current = false
  }, [])

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
      } catch (err) {
        setError(`Failed to parse JSON: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setMaterials({})
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
