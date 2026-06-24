import React, { useState } from 'react';

// Sample input matching the challenge description
const sampleInput = `[
  "A->B", "A->C", "B->D", "C->E", "E->F",
  "X->Y", "Y->Z", "Z->X",
  "P->Q", "Q->R",
  "G->H", "G->H", "G->I",
  "hello", "1->2", "A->"
]`;

// Recursive Tree Node Component
function TreeNodeItem({ nodeLabel, nodeChildren, isRoot = false }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const childrenKeys = Object.keys(nodeChildren || {});
  const hasChildren = childrenKeys.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="tree-node-item">
        <div 
          className={`tree-node-content ${isRoot ? 'root-node' : ''}`}
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          {hasChildren && (
            <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>
              ▶
            </span>
          )}
          <span>{nodeLabel}</span>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="tree-node-wrapper">
          <div className="tree-node-connector" />
          {childrenKeys.map(child => (
            <TreeNodeItem key={child} nodeLabel={child} nodeChildren={nodeChildren[child]} />
          ))}
        </div>
      )}
    </div>
  );
}

// Tree Visualizer Container
function TreeVisualizer({ treeData }) {
  const rootKey = Object.keys(treeData || {})[0];
  if (!rootKey) return <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Empty tree structure</p>;

  return (
    <div className="tree-node-wrapper" style={{ marginLeft: 0 }}>
      <TreeNodeItem nodeLabel={rootKey} nodeChildren={treeData[rootKey]} isRoot={true} />
    </div>
  );
}

function App() {
  const [apiUrl, setApiUrl] = useState(
    import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:5000/bfhl'
          : '/bfhl')
  );
  const [inputText, setInputText] = useState(sampleInput);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [activeTab, setActiveTab] = useState('tree');
  const [copied, setCopied] = useState(false);

  const loadSample = () => {
    setInputText(sampleInput);
    setError(null);
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    let parsedData = [];

    // Parse logic
    try {
      const trimmed = inputText.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        // Try parsing as JSON array
        parsedData = JSON.parse(trimmed);
      } else {
        // Parse as comma or newline-separated values
        parsedData = trimmed
          .split(/[\n,;]+/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }

      if (!Array.isArray(parsedData)) {
        throw new Error("Input must be a valid array of strings (e.g. ['A->B', 'C->D'])");
      }
    } catch (err) {
      setError(`Failed to parse input: ${err.message}. Please input a valid JSON array or a comma-separated list of edges.`);
      setLoading(false);
      return;
    }

    // Call API
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ data: parsedData })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || `HTTP error! Status: ${res.status}`);
      }

      setResponse(result);
    } catch (err) {
      console.error(err);
      setError(`API Request Failed: ${err.message}. Make sure your backend API is running and CORS is enabled.`);
    } finally {
      setLoading(false);
    }
  };

  // Helper to trace cycle path for visualizer
  const getCycleRepresentation = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem', fontWeight: '500' }}>
          ⚠️ Circular relationship detected.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          This component has no valid root because all nodes have at least one parent (in-degree &ge; 1).
        </p>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Header with SEO structure: 1 H1 per page */}
      <header>
        <div className="brand">
          <h1 id="app-title">Hierarchical Node Tree Analyzer</h1>
          <p>Process, validate, and visualize directed node hierarchies and circular dependencies</p>
        </div>
        
        {response && (
          <div className="student-badge" id="student-badge">
            <div className="name" id="student-name">{response.user_id}</div>
            <div className="info" id="student-email">{response.email_id}</div>
            <div className="info" id="student-roll">{response.college_roll_number}</div>
          </div>
        )}
      </header>

      <main className="main-grid">
        {/* Left Input Panel */}
        <section className="glass-card" aria-label="Input Configuration">
          <h2 className="card-title">
            <span>⚙️</span> Configuration & Input
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="api-url-input" className="form-label">
                API Endpoint URL
              </label>
              <input
                id="api-url-input"
                type="text"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'rgba(10, 15, 30, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem'
                }}
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="http://localhost:5000/bfhl"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edges-input" className="form-label">
                <span>Input Edge List (JSON Array or CSV)</span>
                <button type="button" className="helper-btn" onClick={loadSample} id="load-sample-btn">
                  Load Example Payload
                </button>
              </label>
              <textarea
                id="edges-input"
                className="input-field"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='["A->B", "A->C", "B->D"]'
                required
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading} id="submit-btn">
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Analyze Hierarchies</span>
              )}
            </button>
          </form>

          {error && (
            <div className="error-alert" id="error-message">
              <span>❌</span>
              <div>{error}</div>
            </div>
          )}

          <div className="instructions-card">
            <h3>Format Rules</h3>
            <ul className="instructions-list">
              <li>Each edge must match the format <strong>X-&gt;Y</strong> (uppercase A-Z).</li>
              <li>Self-loops (e.g. <strong>A-&gt;A</strong>) are treated as invalid entries.</li>
              <li>Repeated duplicate edges are listed in <code>duplicate_edges</code>.</li>
              <li>Diamond parents (e.g. <strong>A-&gt;D</strong> and <strong>B-&gt;D</strong>) discard the second-encountered edge.</li>
            </ul>
          </div>
        </section>

        {/* Right Output Panel */}
        <section className="glass-card" aria-label="Analysis Results">
          <h2 className="card-title">
            <span>📊</span> Analysis Results
          </h2>

          {!response ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              gap: '1rem'
            }} id="placeholder-view">
              <span style={{ fontSize: '3rem' }}>🌿</span>
              <p>Enter your edge list and click "Analyze Hierarchies" to visualize results.</p>
            </div>
          ) : (
            <div className="output-panel" id="results-panel">
              {/* Summary Stats */}
              <div className="summary-grid" id="summary-section">
                <div className="summary-card">
                  <div className="summary-value trees" id="stat-trees">{response.summary.total_trees}</div>
                  <div className="summary-label">Valid Trees</div>
                </div>
                <div className="summary-card">
                  <div className="summary-value cycles" id="stat-cycles">{response.summary.total_cycles}</div>
                  <div className="summary-label">Cyclic Groups</div>
                </div>
                <div className="summary-card">
                  <div className="summary-value largest" id="stat-largest-root">
                    {response.summary.largest_tree_root || 'N/A'}
                  </div>
                  <div className="summary-label">Largest Root</div>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="tabs-header">
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'tree' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tree')}
                  id="tab-tree-btn"
                >
                  Interactive Trees
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activeTab === 'json' ? 'active' : ''}`}
                  onClick={() => setActiveTab('json')}
                  id="tab-json-btn"
                >
                  Raw JSON Response
                </button>
              </div>

              {/* Tab: Tree Visualizer */}
              {activeTab === 'tree' && (
                <div className="tree-visualizer-container" id="tree-tab-content">
                  {response.hierarchies.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No components found in input edges.</p>
                  ) : (
                    response.hierarchies.map((hierarchy, index) => (
                      <div key={index} className="tree-card" id={`hierarchy-card-${index}`}>
                        <div className="tree-card-header">
                          <div className="tree-card-title">
                            <span>{hierarchy.has_cycle ? '🔄' : '🌳'}</span>
                            <span>Root: {hierarchy.root}</span>
                          </div>
                          <span className={`tree-card-badge ${hierarchy.has_cycle ? 'cycle' : ''}`}>
                            {hierarchy.has_cycle ? 'Cycle' : `Depth: ${hierarchy.depth}`}
                          </span>
                        </div>
                        
                        {hierarchy.has_cycle ? (
                          getCycleRepresentation()
                        ) : (
                          <TreeVisualizer treeData={hierarchy.tree} />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab: Raw JSON */}
              {activeTab === 'json' && (
                <div className="json-box-wrapper" id="json-tab-content">
                  <button type="button" className="copy-btn" onClick={handleCopy} id="copy-json-btn">
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </button>
                  <pre className="code-block">
                    <code>{JSON.stringify(response, null, 2)}</code>
                  </pre>
                </div>
              )}

              <div className="section-divider" />

              {/* Invalid Entries Section */}
              <div id="invalid-entries-section">
                <div className="badge-section-title">Invalid Format Entries ({response.invalid_entries.length})</div>
                {response.invalid_entries.length === 0 ? (
                  <p style={{ color: 'var(--text-dark)', fontSize: '0.8rem' }}>None</p>
                ) : (
                  <div className="badge-list">
                    {response.invalid_entries.map((entry, idx) => (
                      <span key={idx} className="badge invalid">{entry}</span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ margin: '1rem 0' }} />

              {/* Duplicate Edges Section */}
              <div id="duplicate-edges-section">
                <div className="badge-section-title">Duplicate Edges ({response.duplicate_edges.length})</div>
                {response.duplicate_edges.length === 0 ? (
                  <p style={{ color: 'var(--text-dark)', fontSize: '0.8rem' }}>None</p>
                ) : (
                  <div className="badge-list">
                    {response.duplicate_edges.map((edge, idx) => (
                      <span key={idx} className="badge duplicate">{edge}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
