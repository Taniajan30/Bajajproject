import { processHierarchies } from './process_hierarchies.js';
import assert from 'assert';

const sampleInput = [
  "A->B", "A->C", "B->D", "C->E", "E->F",
  "X->Y", "Y->Z", "Z->X",
  "P->Q", "Q->R",
  "G->H", "G->H", "G->I",
  "hello", "1->2", "A->"
];

const identity = {
  user_id: "johndoe_17091999",
  email_id: "john.doe@college.edu",
  college_roll_number: "21CS1001"
};

const result = processHierarchies(sampleInput, identity);

console.log("Processing Results:");
console.log(JSON.stringify(result, null, 2));

// Assertions
try {
  // Test duplicate edges
  assert.deepStrictEqual(result.duplicate_edges, ["G->H"]);

  // Test invalid entries
  assert.deepStrictEqual(result.invalid_entries, ["hello", "1->2", "A->"]);

  // Test summary
  assert.strictEqual(result.summary.total_trees, 3);
  assert.strictEqual(result.summary.total_cycles, 1);
  assert.strictEqual(result.summary.largest_tree_root, "A");

  // Test hierarchies
  assert.strictEqual(result.hierarchies.length, 4);

  // First component (Root A)
  const rootA = result.hierarchies[0];
  assert.strictEqual(rootA.root, "A");
  assert.strictEqual(rootA.depth, 4);
  assert.deepStrictEqual(rootA.tree, { "A": { "B": { "D": {} }, "C": { "E": { "F": {} } } } });

  // Second component (Root X, Cycle)
  const rootX = result.hierarchies[1];
  assert.strictEqual(rootX.root, "X");
  assert.strictEqual(rootX.has_cycle, true);
  assert.deepStrictEqual(rootX.tree, {});

  // Third component (Root P)
  const rootP = result.hierarchies[2];
  assert.strictEqual(rootP.root, "P");
  assert.strictEqual(rootP.depth, 3);
  assert.deepStrictEqual(rootP.tree, { "P": { "Q": { "R": {} } } });

  // Fourth component (Root G)
  const rootG = result.hierarchies[3];
  assert.strictEqual(rootG.root, "G");
  assert.strictEqual(rootG.depth, 2);
  assert.deepStrictEqual(rootG.tree, { "G": { "H": {}, "I": {} } });

  console.log("\n========================================================");
  console.log("Success: All assertions passed! Backend logic is 100% correct.");
  console.log("========================================================");
} catch (error) {
  console.error("Test failed:", error.message);
  process.exit(1);
}
