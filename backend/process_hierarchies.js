export function processHierarchies(dataArray, identity = {}) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const valid_edges = [];

  const seen_edges = new Set();
  const seen_duplicate_edges = new Set();

  if (!Array.isArray(dataArray)) {
    dataArray = [];
  }

  // 1. Parse and filter invalid and duplicate edges
  for (const rawEntry of dataArray) {
    if (typeof rawEntry !== 'string') {
      invalid_entries.push(String(rawEntry));
      continue;
    }
    const entry = rawEntry.trim();
    
    // Regex for X->Y where X and Y are single uppercase letters A-Z
    const match = entry.match(/^([A-Z])->([A-Z])$/);
    if (!match) {
      invalid_entries.push(rawEntry);
      continue;
    }

    const [, u, v] = match;
    if (u === v) {
      // Self-loop is invalid
      invalid_entries.push(rawEntry);
      continue;
    }

    const edgeStr = `${u}->${v}`;
    if (seen_edges.has(edgeStr)) {
      if (!seen_duplicate_edges.has(edgeStr)) {
        duplicate_edges.push(edgeStr);
        seen_duplicate_edges.add(edgeStr);
      }
    } else {
      seen_edges.add(edgeStr);
      valid_edges.push({ u, v, edgeStr });
    }
  }

  // 2. Build graph with Multi-parent resolution
  const parentOf = {};
  const adj = {}; // parent -> children list
  const adjUndirected = {}; // node -> neighbors list
  const allNodes = new Set();

  for (const { u, v } of valid_edges) {
    // If child v already has a parent, discard this edge (first-parent wins)
    if (v in parentOf) {
      continue;
    }
    
    parentOf[v] = u;
    allNodes.add(u);
    allNodes.add(v);

    if (!adj[u]) adj[u] = [];
    adj[u].push(v);

    if (!adjUndirected[u]) adjUndirected[u] = [];
    if (!adjUndirected[v]) adjUndirected[v] = [];
    adjUndirected[u].push(v);
    adjUndirected[v].push(u);
  }

  // 3. Find weakly connected components (groups)
  const visited = new Set();
  const components = [];

  for (const node of allNodes) {
    if (!visited.has(node)) {
      const component = [];
      const queue = [node];
      visited.add(node);
      while (queue.length > 0) {
        const curr = queue.shift();
        component.push(curr);
        for (const neighbor of adjUndirected[curr] || []) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      components.push(component);
    }
  }

  // 4. Sort components by their first-encountered edge in valid_edges
  const componentWithOrder = components.map(comp => {
    const compSet = new Set(comp);
    let firstEdgeIdx = Infinity;
    for (let i = 0; i < valid_edges.length; i++) {
      const { u, v } = valid_edges[i];
      if (compSet.has(u)) {
        firstEdgeIdx = i;
        break;
      }
    }
    return { comp, firstEdgeIdx };
  });

  componentWithOrder.sort((a, b) => a.firstEdgeIdx - b.firstEdgeIdx);

  // 5. Process each component to construct trees or identify cycles
  const hierarchies = [];
  let total_trees = 0;
  let total_cycles = 0;
  let maxTreeDepth = -1;
  let largest_tree_root = "";

  for (const { comp } of componentWithOrder) {
    // Find nodes in component with in-degree 0 (no parent in parentOf)
    const roots = comp.filter(node => !parentOf[node]);

    if (roots.length === 1) {
      // Valid Tree
      const root = roots[0];
      total_trees++;

      const getDepth = (node) => {
        const children = adj[node] || [];
        if (children.length === 0) return 1;
        let maxChildDepth = 0;
        for (const child of children) {
          maxChildDepth = Math.max(maxChildDepth, getDepth(child));
        }
        return 1 + maxChildDepth;
      };

      const depth = getDepth(root);

      const buildTree = (node) => {
        const treeNode = {};
        const children = adj[node] || [];
        const sortedChildren = [...children].sort();
        for (const child of sortedChildren) {
          treeNode[child] = buildTree(child);
        }
        return treeNode;
      };

      const tree = { [root]: buildTree(root) };

      hierarchies.push({
        root,
        tree,
        depth
      });

      if (depth > maxTreeDepth) {
        maxTreeDepth = depth;
        largest_tree_root = root;
      } else if (depth === maxTreeDepth) {
        if (root < largest_tree_root) {
          largest_tree_root = root;
        }
      }
    } else {
      // Cyclic Group (roots.length === 0)
      total_cycles++;
      const sortedNodes = [...comp].sort();
      const root = sortedNodes[0];

      hierarchies.push({
        root,
        tree: {},
        has_cycle: true
      });
    }
  }

  return {
    user_id: identity.user_id || "fullname_ddmmyyyy",
    email_id: identity.email_id || "college_email@college.edu",
    college_roll_number: identity.college_roll_number || "21CS1001",
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: {
      total_trees,
      total_cycles,
      largest_tree_root: largest_tree_root || null
    }
  };
}
