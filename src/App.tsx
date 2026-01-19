import { useState } from 'react'
import './App.css'

interface Block {
  name: string;
  [key: string]: any;
}

interface Materials {
  [material: string]: number;
}

function App() {
  const [materials, setMaterials] = useState<Materials>({})
  const [fileName, setFileName] = useState<string>('')
  const [error, setError] = useState<string>('')

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
        json.blocks.forEach((block: Block) => {
          if (block.name) {
            materialCounts[block.name] = (materialCounts[block.name] || 0) + 1
          }
        })

        setMaterials(materialCounts)
      } catch (err) {
        setError(`Failed to parse JSON: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setMaterials({})
      }
    }
    reader.readAsText(file)
  }

  const sortedMaterials = Object.entries(materials)
    .sort((a, b) => b[1] - a[1])

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="navbar bg-primary text-primary-content">
        <div className="flex-1">
          <div className="btn btn-ghost text-xl">BlockReader</div>
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
                      <th>Material</th>
                      <th className="text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedMaterials.map(([material, count]) => (
                      <tr key={material}>
                        <td className="font-medium">{material}</td>
                        <td className="text-right">
                          <span className="badge badge-lg badge-primary">{count}</span>
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
                    {Object.values(materials).reduce((a, b) => a + b, 0)}
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
