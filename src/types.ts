export type ProblemType = 'knapsack' | 'shortest_path' | 'equipment' | 'production_inventory' | 'markov_portfolio' | 'resource_allocation';

export interface KnapsackParams {
  weights: number[];
  values: number[];
  capacity: number;
}

export interface ShortestPathParams {
  grid: number[][]; // N x M grid of costs
}

export interface EquipmentParams {
  years: number; // T
  purchaseCost: number; // P
  operatingCosts: number[]; // size MaxAge+1, e.g. [2, 4, 7, 11, 16] for age 0, 1, 2, 3, 4
  resaleValues: number[]; // size MaxAge+1, e.g. [8, 6, 4, 2, 0] for age 0, 1, 2, 3, 4
}

export interface ProductionInventoryParams {
  periods: number;
  demands: number[];
  setupCost: number;
  unitCost: number;
  holdingCost: number;
  maxInventory: number;
}

export interface MarkovPortfolioParams {
  projects: number;
  budget: number;
  returns: number[][]; // size projects x (budget + 1)
}

export interface ResourceAllocationParams {
  projects: number; // N
  totalResource: number; // M
  returns: number[][]; // size projects x (totalResource + 1)
}

export interface PrecursorCell {
  row: number;
  col: number;
  type: 'up' | 'left' | 'diag' | 'jump';
  label: string;
  value: number;
}

export interface DPStep {
  stepIndex: number;
  i: number; // Row index (0-based)
  j: number; // Col index (0-based)
  dpTable: (number | null)[][]; // Snapshot of the 2D DP Table at this moment
  rollingArray?: number[]; // Snapshot of the 1D rolling array at this moment (for knapsack / lcs space compression)
  rollingArrayPrevious?: number[]; // Snapshot of the 1D rolling array from previous iteration (for comparison)
  precursors: PrecursorCell[]; // Cells that this calculation relies on
  description: string; // Explanatory text in Chinese
  decision: 'init' | 'pick' | 'leave' | 'match' | 'mismatch' | 'insert' | 'delete' | 'replace' | 'none';
  highlightedCodeLine: number; // Line index (0-based) in the shown Python snippet
  currentVal: number;
}

export interface BacktrackNode {
  row: number;
  col: number;
  selected?: boolean;
  action?: string; // 'pick' | 'leave' | 'match' | 'insert' | 'delete' | 'replace' | 'start'
}

// ----------------------------------------------------
// 01 Knapsack Step Generator
// ----------------------------------------------------
export function generateKnapsackSteps(params: KnapsackParams): { steps: DPStep[], finalTable: number[][], backtrackPath: BacktrackNode[] } {
  const { weights, values, capacity } = params;
  const N = weights.length;
  const steps: DPStep[] = [];

  // Initialize a completely empty table
  const initTable = (): (number | null)[][] => {
    const table: (number | null)[][] = [];
    for (let i = 0; i <= N; i++) {
      table.push(new Array(capacity + 1).fill(null));
    }
    return table;
  };

  const table = initTable();
  let stepIndex = 0;

  // Python Line Numbers for reference:
  // 0: def solve_dp(weights, values, capacity):
  // 1:     n = len(weights)
  // 2:     dp = [[0] * (capacity + 1) for _ in range(n + 1)]
  // 3:     for i in range(1, n + 1):
  // 4:         for j in range(1, capacity + 1):
  // 5:             if weights[i-1] <= j:
  // 6:                 dp[i][j] = max(dp[i-1][j], dp[i-1][j-weights[i-1]] + values[i-1])
  // 7:             else:
  // 8:                 dp[i][j] = dp[i-1][j]
  // 9:     return dp[n][capacity]

  // Step 1: Initialize dp table boundaries (dp[i][0] = 0, dp[0][j] = 0)
  // Let's make an explicit step for setting up the 0th row and column
  const initialTable = initTable();
  for (let j = 0; j <= capacity; j++) {
    initialTable[0][j] = 0;
  }
  for (let i = 0; i <= N; i++) {
    initialTable[i][0] = 0;
  }

  steps.push({
    stepIndex: stepIndex++,
    i: 0,
    j: 0,
    dpTable: JSON.parse(JSON.stringify(initialTable)),
    precursors: [],
    description: "初始化边界：第 0 行（不选任何物品）和第 0 列（背包容量为 0）的所有状态值初始化为 0。",
    decision: 'init',
    highlightedCodeLine: 2,
    currentVal: 0
  });

  // Keep a running copy of the table that we mutate
  const currentTable = JSON.parse(JSON.stringify(initialTable));

  // Pre-fill rolling array for space complexity compression visualization
  let rolling = new Array(capacity + 1).fill(0);

  for (let i = 1; i <= N; i++) {
    const w = weights[i - 1];
    const v = values[i - 1];
    
    // We also record the rolling array updates
    // In actual rolling array, at row i, we update j from capacity down to w
    const nextRolling = [...rolling];

    for (let j = 1; j <= capacity; j++) {
      const precursors: PrecursorCell[] = [];
      let val = 0;
      let decision: 'pick' | 'leave' = 'leave';
      let desc = '';
      let codeLine = 8;

      const upVal = currentTable[i - 1][j] || 0;
      precursors.push({
        row: i - 1,
        col: j,
        type: 'up',
        label: `不选物品${i}: dp[${i-1}][${j}]`,
        value: upVal
      });

      if (w <= j) {
        const diagVal = currentTable[i - 1][j - w] || 0;
        const optionPick = diagVal + v;
        precursors.push({
          row: i - 1,
          col: j - w,
          type: 'diag',
          label: `选择物品${i}: dp[${i-1}][${j-w}] + ${v}`,
          value: optionPick
        });

        if (optionPick > upVal) {
          val = optionPick;
          decision = 'pick';
          desc = `计算 dp[${i}][${j}]。物品 ${i} (重量 ${w}，价值 ${v}) 小于背包当前容量 ${j}。\\n可以选择该物品，获得的最大总价值为：前一阶段剩余容量 ${j-w} 的价值 (${diagVal}) + 当前物品价值 (${v}) = ${optionPick}。这比不选该物品的值 (${upVal}) 更优。最终决定【选择】。`;
        } else {
          val = upVal;
          decision = 'leave';
          desc = `计算 dp[${i}][${j}]。虽然物品 ${i} (重量 ${w}，价值 ${v}) 小于背包容量 ${j}，但是选择它的总价值 (${optionPick}) 小于或等于不选择它的价值 (${upVal})。因此决定【不选】。`;
        }
        codeLine = 6;
      } else {
        val = upVal;
        decision = 'leave';
        desc = `计算 dp[${i}][${j}]。物品 ${i} (重量 ${w}，价值 ${v}) 超过背包当前容量 ${j}。\\n无法容纳，只能决定【不选】，直接继承上一阶段相同容量的值：dp[${i-1}][${j}] = ${upVal}。`;
        codeLine = 8;
      }

      currentTable[i][j] = val;

      // Update the rolling array representation for this cell
      // For rolling visualization, we update j from capacity down to weight
      // If we are visualizing rolling, we only write to nextRolling if j >= w (for reverse loop)
      // To keep it simple, we record the rolling state exactly as it would look during iteration i
      if (j >= w) {
        nextRolling[j] = Math.max(rolling[j], rolling[j - w] + v);
      }

      steps.push({
        stepIndex: stepIndex++,
        i,
        j,
        dpTable: JSON.parse(JSON.stringify(currentTable)),
        rollingArray: [...nextRolling],
        rollingArrayPrevious: [...rolling],
        precursors,
        description: desc,
        decision,
        highlightedCodeLine: codeLine,
        currentVal: val
      });
    }

    rolling = nextRolling;
  }

  // Final complete table
  const finalTable: number[][] = currentTable.map((row: any) => row.map((val: any) => val || 0));

  // Compute backtracking path
  const backtrackPath: BacktrackNode[] = [];
  let curI = N;
  let curJ = capacity;
  backtrackPath.push({ row: curI, col: curJ, action: 'start' });

  while (curI > 0 && curJ > 0) {
    const w = weights[curI - 1];
    const v = values[curI - 1];
    if (finalTable[curI][curJ] !== finalTable[curI - 1][curJ]) {
      // Picked
      backtrackPath.push({ row: curI, col: curJ, selected: true, action: 'pick' });
      curJ -= w;
      curI -= 1;
    } else {
      // Left
      backtrackPath.push({ row: curI, col: curJ, selected: false, action: 'leave' });
      curI -= 1;
    }
  }
  // Remaining items on boundaries are not picked
  while (curI > 0) {
    backtrackPath.push({ row: curI, col: 0, selected: false, action: 'leave' });
    curI -= 1;
  }

  return { steps, finalTable, backtrackPath };
}

// ----------------------------------------------------
// Shortest Path (Grid Minimum Path Cost) Step Generator
// ----------------------------------------------------
export function generateShortestPathSteps(params: ShortestPathParams): { steps: DPStep[], finalTable: number[][], backtrackPath: BacktrackNode[] } {
  const { grid } = params;
  const N = grid.length;
  const M = grid[0].length;
  const steps: DPStep[] = [];

  const initTable = (): (number | null)[][] => {
    const table: (number | null)[][] = [];
    for (let i = 0; i < N; i++) {
      table.push(new Array(M).fill(null));
    }
    return table;
  };

  const currentTable = initTable();
  let stepIndex = 0;

  // Step 0: [0][0]
  currentTable[0][0] = grid[0][0];
  steps.push({
    stepIndex: stepIndex++,
    i: 0,
    j: 0,
    dpTable: JSON.parse(JSON.stringify(currentTable)),
    precursors: [],
    description: `初始化起点 dp[0][0] = grid[0][0] = ${grid[0][0]}。累计初始路径开销即为起点成本。`,
    decision: 'init',
    highlightedCodeLine: 3,
    currentVal: grid[0][0]
  });

  // Step 1: Initialize first row dp[0][j]
  for (let j = 1; j < M; j++) {
    const leftVal = currentTable[0][j - 1] as number;
    const val = leftVal + grid[0][j];
    currentTable[0][j] = val;
    steps.push({
      stepIndex: stepIndex++,
      i: 0,
      j,
      dpTable: JSON.parse(JSON.stringify(currentTable)),
      precursors: [{
        row: 0,
        col: j - 1,
        type: 'left',
        label: `左侧格点 dp[0][${j-1}]`,
        value: leftVal
      }],
      description: `计算 dp[0][${j}]。由于位于第 0 行，只能从左侧 dp[0][${j-1}] (${leftVal}) 移动到达，加上当前格成本 ${grid[0][j]}，累计开销为 ${val}。`,
      decision: 'leave',
      highlightedCodeLine: 5,
      currentVal: val
    });
  }

  // Step 2: Initialize first col and standard cells row by row
  for (let i = 1; i < N; i++) {
    // Column 0
    const upVal = currentTable[i - 1][0] as number;
    const valCol0 = upVal + grid[i][0];
    currentTable[i][0] = valCol0;
    steps.push({
      stepIndex: stepIndex++,
      i,
      j: 0,
      dpTable: JSON.parse(JSON.stringify(currentTable)),
      precursors: [{
        row: i - 1,
        col: 0,
        type: 'up',
        label: `上方格点 dp[${i-1}][0]`,
        value: upVal
      }],
      description: `计算 dp[${i}][0]。由于位于第 0 列，只能从上方 dp[${i-1}][0] (${upVal}) 移动到达，加上当前格成本 ${grid[i][0]}，累计开销为 ${valCol0}。`,
      decision: 'leave',
      highlightedCodeLine: 7,
      currentVal: valCol0
    });

    // Rest of columns
    for (let j = 1; j < M; j++) {
      const upVal = currentTable[i - 1][j] as number;
      const leftVal = currentTable[i][j - 1] as number;
      const minPrev = Math.min(upVal, leftVal);
      const val = grid[i][j] + minPrev;
      currentTable[i][j] = val;

      steps.push({
        stepIndex: stepIndex++,
        i,
        j,
        dpTable: JSON.parse(JSON.stringify(currentTable)),
        precursors: [
          {
            row: i - 1,
            col: j,
            type: 'up',
            label: `上方累计 dp[${i-1}][${j}]`,
            value: upVal
          },
          {
            row: i,
            col: j - 1,
            type: 'left',
            label: `左侧累计 dp[${i}][${j-1}]`,
            value: leftVal
          }
        ],
        description: `计算 dp[${i}][${j}]。可自上方 [${i-1}][${j}] (${upVal}) 或左侧 [${i}][${j-1}] (${leftVal}) 转移。选择较小开销 ${minPrev} 并加上当前格成本 ${grid[i][j]}，得 ${val}。`,
        decision: leftVal <= upVal ? 'pick' : 'leave',
        highlightedCodeLine: 9,
        currentVal: val
      });
    }
  }

  const finalTable: number[][] = currentTable.map((row) => row.map((val) => val || 0));

  // Compute backtracking path
  const backtrackPath: BacktrackNode[] = [];
  let curI = N - 1;
  let curJ = M - 1;
  backtrackPath.push({ row: curI, col: curJ, action: 'start' });

  while (curI > 0 || curJ > 0) {
    if (curI === 0) {
      backtrackPath.push({ row: curI, col: curJ - 1, selected: true, action: 'match' });
      curJ -= 1;
    } else if (curJ === 0) {
      backtrackPath.push({ row: curI - 1, col: curJ, selected: true, action: 'match' });
      curI -= 1;
    } else {
      const upVal = finalTable[curI - 1][curJ];
      const leftVal = finalTable[curI][curJ - 1];
      if (upVal <= leftVal) {
        backtrackPath.push({ row: curI - 1, col: curJ, selected: true, action: 'match' });
        curI -= 1;
      } else {
        backtrackPath.push({ row: curI, col: curJ - 1, selected: true, action: 'match' });
        curJ -= 1;
      }
    }
  }

  return { steps, finalTable, backtrackPath };
}

// ----------------------------------------------------
// Equipment Replacement (设备更新决策) Step Generator
// ----------------------------------------------------
export function generateEquipmentSteps(params: EquipmentParams): { steps: DPStep[], finalTable: number[][], backtrackPath: BacktrackNode[] } {
  const { years, purchaseCost, operatingCosts, resaleValues } = params;
  const T = years;
  const MaxAge = 4; // Columns: Age 1, 2, 3, 4
  const steps: DPStep[] = [];

  const initTable = (): (number | null)[][] => {
    const table: (number | null)[][] = [];
    for (let i = 0; i <= T; i++) {
      table.push(new Array(MaxAge).fill(null));
    }
    return table;
  };

  const currentTable = initTable();
  let stepIndex = 0;

  // Step 0: Year 0
  currentTable[0][0] = 0; // age 1 is 0 cost
  steps.push({
    stepIndex: stepIndex++,
    i: 0,
    j: 0,
    dpTable: JSON.parse(JSON.stringify(currentTable)),
    precursors: [],
    description: `初始状态：第 0 年末，设备服役年龄为 1 年，累计运营净成本为 0。其他年龄状态不可达。`,
    decision: 'init',
    highlightedCodeLine: 3,
    currentVal: 0
  });

  const costTable = initTable();
  costTable[0][0] = 0;

  for (let t = 1; t <= T; t++) {
    // First, compute Keep decisions for age x = 2 to 4 (index 1 to 3)
    for (let xIndex = 1; xIndex < MaxAge; xIndex++) {
      const prevVal = costTable[t - 1][xIndex - 1];
      if (prevVal !== null && prevVal !== Infinity) {
        const opCost = operatingCosts[xIndex - 1] || 0;
        const keepVal = prevVal + opCost;
        costTable[t][xIndex] = keepVal;
        currentTable[t][xIndex] = keepVal;

        steps.push({
          stepIndex: stepIndex++,
          i: t,
          j: xIndex,
          dpTable: JSON.parse(JSON.stringify(currentTable)),
          precursors: [{
            row: t - 1,
            col: xIndex - 1,
            type: 'diag',
            label: `上年末年龄 ${xIndex}: dp[${t-1}][${xIndex}]`,
            value: prevVal
          }],
          description: `计算 dp[${t}][${xIndex + 1}] (保持)。设备上年末年龄 ${xIndex} 年，今年【保持】，年末年龄增至 ${xIndex + 1}。运行维护成本 op[${xIndex - 1}] = ${opCost}。累计开销为 ${keepVal}。`,
          decision: 'leave',
          highlightedCodeLine: 9,
          currentVal: keepVal
        });
      }
    }

    // Now, compute Replace decision for age x = 1 (index 0)
    let minVal = Infinity;
    let bestPrevX = -1;
    const replacePrecursors: PrecursorCell[] = [];

    for (let prevX = 0; prevX < MaxAge; prevX++) {
      const prevVal = costTable[t - 1][prevX];
      if (prevVal !== null && prevVal !== Infinity) {
        const resale = resaleValues[prevX] || 0;
        const op0 = operatingCosts[0] || 0;
        const totalOptionCost = prevVal + purchaseCost - resale + op0;

        replacePrecursors.push({
          row: t - 1,
          col: prevX,
          type: 'up',
          label: `从上年末年龄 ${prevX + 1} 替换`,
          value: totalOptionCost
        });

        if (totalOptionCost < minVal) {
          minVal = totalOptionCost;
          bestPrevX = prevX;
        }
      }
    }

    if (minVal !== Infinity) {
      costTable[t][0] = minVal;
      currentTable[t][0] = minVal;

      steps.push({
        stepIndex: stepIndex++,
        i: t,
        j: 0,
        dpTable: JSON.parse(JSON.stringify(currentTable)),
        precursors: replacePrecursors,
        description: `计算 dp[${t}][1] (置换买新)。比对上年末各年龄替换开销，从年龄 ${bestPrevX + 1} 换旧买新（购入费 ${purchaseCost}，折旧回收 ${resaleValues[bestPrevX]}，运行费 ${operatingCosts[0]}）最划算，累计开销为 ${minVal}。`,
        decision: 'pick',
        highlightedCodeLine: 6,
        currentVal: minVal
      });
    }
  }

  const finalTable: number[][] = costTable.map((row) => row.map((val) => val === null || val === Infinity ? 0 : val));

  // Backtracking
  const backtrackPath: BacktrackNode[] = [];
  
  let minValAtT = Infinity;
  let bestCol = 0;
  for (let j = 0; j < MaxAge; j++) {
    const val = costTable[T][j];
    if (val !== null && val < minValAtT) {
      minValAtT = val;
      bestCol = j;
    }
  }

  let curT = T;
  let curXIndex = bestCol;
  backtrackPath.push({ row: curT, col: curXIndex, action: 'start' });

  while (curT > 0) {
    if (curXIndex > 0) {
      backtrackPath.push({ row: curT - 1, col: curXIndex - 1, selected: true, action: 'leave' });
      curXIndex -= 1;
      curT -= 1;
    } else {
      let foundPrevX = 0;
      for (let prevX = 0; prevX < MaxAge; prevX++) {
        const prevVal = costTable[curT - 1][prevX];
        if (prevVal !== null && prevVal !== Infinity) {
          const resale = resaleValues[prevX] || 0;
          const op0 = operatingCosts[0] || 0;
          const totalOptionCost = prevVal + purchaseCost - resale + op0;
          if (Math.abs(totalOptionCost - costTable[curT][0]) < 1e-5) {
            foundPrevX = prevX;
            break;
          }
        }
      }
      backtrackPath.push({ row: curT - 1, col: foundPrevX, selected: true, action: 'pick' });
      curXIndex = foundPrevX;
      curT -= 1;
    }
  }

  return { steps, finalTable, backtrackPath };
}

// ----------------------------------------------------
// Production & Inventory Control (生产与库存控制问题) Step Generator
// ----------------------------------------------------
export function generateProductionInventorySteps(params: ProductionInventoryParams): { steps: DPStep[], finalTable: number[][], backtrackPath: BacktrackNode[] } {
  const { periods, demands, setupCost, unitCost, holdingCost, maxInventory } = params;
  const steps: DPStep[] = [];
  
  const initTable = (): (number | null)[][] => {
    const table: (number | null)[][] = [];
    for (let i = 0; i <= periods; i++) {
      table.push(new Array(maxInventory + 1).fill(null));
    }
    return table;
  };

  const currentTable = initTable();
  let stepIndex = 0;

  // Year 0
  currentTable[0][0] = 0;
  steps.push({
    stepIndex: stepIndex++,
    i: 0,
    j: 0,
    dpTable: JSON.parse(JSON.stringify(currentTable)),
    precursors: [],
    description: "初始化状态：第 0 期（起步阶段）期末库存为 0，累计库存与生产成本为 0。其他期末库存状态不可达。",
    decision: 'init',
    highlightedCodeLine: 3,
    currentVal: 0
  });

  const costTable = initTable();
  costTable[0][0] = 0;

  for (let t = 1; t <= periods; t++) {
    const demand = demands[t - 1];
    for (let s = 0; s <= maxInventory; s++) {
      let minVal = Infinity;
      let bestPrevS = -1;
      const precursors: PrecursorCell[] = [];

      for (let prevS = 0; prevS <= maxInventory; prevS++) {
        const prevVal = costTable[t - 1][prevS];
        if (prevVal !== null && prevVal !== Infinity) {
          const x = s + demand - prevS; // production
          if (x >= 0) {
            const prodCost = x > 0 ? setupCost + unitCost * x : 0;
            const holdCost = holdingCost * s;
            const totalStepCost = prevVal + prodCost + holdCost;

            precursors.push({
              row: t - 1,
              col: prevS,
              type: 'up',
              label: `上期末库存 ${prevS} (生产 ${x})`,
              value: totalStepCost
            });

            if (totalStepCost < minVal) {
              minVal = totalStepCost;
              bestPrevS = prevS;
            }
          }
        }
      }

      if (minVal !== Infinity) {
        costTable[t][s] = minVal;
        currentTable[t][s] = minVal;
        
        const bestX = s + demand - bestPrevS;
        steps.push({
          stepIndex: stepIndex++,
          i: t,
          j: s,
          dpTable: JSON.parse(JSON.stringify(currentTable)),
          precursors,
          description: `计算 dp[${t}][${s}]。本期需求量为 ${demand}，期末目标库存为 ${s}。通过对比上期末库存，选择上期末库存为 ${bestPrevS} 且本期生产量为 ${bestX} 的决策最合理。生产成本为 ${bestX > 0 ? setupCost + unitCost * bestX : 0}，库存保管费为 ${holdingCost * s}，本期最低累计成本为 ${minVal}。`,
          decision: 'pick',
          highlightedCodeLine: 6,
          currentVal: minVal
        });
      } else {
        costTable[t][s] = Infinity;
        currentTable[t][s] = Infinity;
      }
    }
  }

  const finalTable: number[][] = costTable.map((row) => row.map((val) => val === null || val === Infinity ? 999999 : val));

  // Backtracking
  const backtrackPath: BacktrackNode[] = [];
  let minValAtEnd = Infinity;
  let bestS = 0;
  for (let s = 0; s <= maxInventory; s++) {
    const val = costTable[periods][s];
    if (val !== null && val < minValAtEnd) {
      minValAtEnd = val;
      bestS = s;
    }
  }

  let curT = periods;
  let curS = bestS;
  backtrackPath.push({ row: curT, col: curS, action: 'start' });

  while (curT > 0) {
    const demand = demands[curT - 1];
    let bestPrevS = 0;
    for (let prevS = 0; prevS <= maxInventory; prevS++) {
      const prevVal = costTable[curT - 1][prevS];
      if (prevVal !== null && prevVal !== Infinity) {
        const x = curS + demand - prevS;
        if (x >= 0) {
          const prodCost = x > 0 ? setupCost + unitCost * x : 0;
          const holdCost = holdingCost * curS;
          const totalStepCost = prevVal + prodCost + holdCost;
          if (Math.abs(totalStepCost - (costTable[curT][curS] || 0)) < 1e-5) {
            bestPrevS = prevS;
            break;
          }
        }
      }
    }
    const x = curS + demand - bestPrevS;
    backtrackPath.push({ row: curT - 1, col: bestPrevS, selected: true, action: `生产 ${x} 辆/件` });
    curS = bestPrevS;
    curT -= 1;
  }

  return { steps, finalTable, backtrackPath };
}

// ----------------------------------------------------
// Investment Portfolio (马尔可夫决策过程与投资组合) Step Generator
// ----------------------------------------------------
export function generateMarkovPortfolioSteps(params: MarkovPortfolioParams): { steps: DPStep[], finalTable: number[][], backtrackPath: BacktrackNode[] } {
  const { projects, budget, returns } = params;
  const steps: DPStep[] = [];
  
  const initTable = (): (number | null)[][] => {
    const table: (number | null)[][] = [];
    for (let i = 0; i <= projects; i++) {
      table.push(new Array(budget + 1).fill(null));
    }
    return table;
  };

  const currentTable = initTable();
  let stepIndex = 0;

  // Initialize Row 0
  for (let j = 0; j <= budget; j++) {
    currentTable[0][j] = 0;
  }
  
  steps.push({
    stepIndex: stepIndex++,
    i: 0,
    j: 0,
    dpTable: JSON.parse(JSON.stringify(currentTable)),
    precursors: [],
    description: "初始化边界：在不投资任何项目（阶段0）时，不论分配多少预算，总收益均初始化为 0。",
    decision: 'init',
    highlightedCodeLine: 2,
    currentVal: 0
  });

  const costTable = initTable();
  for (let j = 0; j <= budget; j++) {
    costTable[0][j] = 0;
  }

  for (let i = 1; i <= projects; i++) {
    for (let j = 0; j <= budget; j++) {
      let maxVal = -Infinity;
      let bestX = -1;
      const precursors: PrecursorCell[] = [];

      for (let x = 0; x <= j; x++) {
        const prevVal = costTable[i - 1][j - x];
        if (prevVal !== null && prevVal !== -Infinity) {
          const r = returns[i - 1][x] || 0;
          const totalVal = prevVal + r;

          precursors.push({
            row: i - 1,
            col: j - x,
            type: 'diag',
            label: `分配给前 ${i-1} 项目 ${j-x} 预算 + 本项目分配 ${x}`,
            value: totalVal
          });

          if (totalVal > maxVal) {
            maxVal = totalVal;
            bestX = x;
          }
        }
      }

      costTable[i][j] = maxVal;
      currentTable[i][j] = maxVal;

      steps.push({
        stepIndex: stepIndex++,
        i,
        j,
        dpTable: JSON.parse(JSON.stringify(currentTable)),
        precursors,
        description: `计算 dp[${i}][${j}]。对项目 ${i} 尝试分配 $0 \\dots ${j}$ 预算。最优决策为：给该项目分配预算 ${bestX} (直接收益 ${returns[i-1][bestX]})，给前 ${i-1} 个项目分配预算 ${j - bestX} (收益 ${costTable[i-1][j - bestX]})，总计最大期望回报为 ${maxVal}。`,
        decision: 'pick',
        highlightedCodeLine: 6,
        currentVal: maxVal
      });
    }
  }

  const finalTable: number[][] = costTable.map((row) => row.map((val) => val === null || val === -Infinity ? 0 : val));

  // Backtracking
  const backtrackPath: BacktrackNode[] = [];
  let curI = projects;
  let curJ = budget;
  backtrackPath.push({ row: curI, col: curJ, action: 'start' });

  while (curI > 0) {
    let bestX = 0;
    for (let x = 0; x <= curJ; x++) {
      const prevVal = costTable[curI - 1][curJ - x];
      if (prevVal !== null && prevVal !== -Infinity) {
        const r = returns[curI - 1][x] || 0;
        if (Math.abs(prevVal + r - (costTable[curI][curJ] || 0)) < 1e-5) {
          bestX = x;
          break;
        }
      }
    }
    backtrackPath.push({ row: curI - 1, col: curJ - bestX, selected: true, action: `投资项目 ${curI} 额度 ${bestX}` });
    curJ -= bestX;
    curI -= 1;
  }

  return { steps, finalTable, backtrackPath };
}

// ----------------------------------------------------
// Resource Allocation Problem (资源分配问题) Step Generator
// ----------------------------------------------------
export function generateResourceAllocationSteps(params: ResourceAllocationParams): { steps: DPStep[], finalTable: number[][], backtrackPath: BacktrackNode[] } {
  const { projects, totalResource, returns } = params;
  const steps: DPStep[] = [];
  
  const initTable = (): (number | null)[][] => {
    const table: (number | null)[][] = [];
    for (let i = 0; i <= projects; i++) {
      table.push(new Array(totalResource + 1).fill(null));
    }
    return table;
  };

  const currentTable = initTable();
  let stepIndex = 0;

  // Initialize Row 0 (0 projects allocated)
  for (let j = 0; j <= totalResource; j++) {
    currentTable[0][j] = 0;
  }
  
  steps.push({
    stepIndex: stepIndex++,
    i: 0,
    j: 0,
    dpTable: JSON.parse(JSON.stringify(currentTable)),
    precursors: [],
    description: "初始化边界条件：不向任何项目分配资源（第0个项目）时，不论总资源量是多少，其期望累计收益均为 0。",
    decision: 'init',
    highlightedCodeLine: 1,
    currentVal: 0
  });

  const costTable = initTable();
  for (let j = 0; j <= totalResource; j++) {
    costTable[0][j] = 0;
  }

  for (let i = 1; i <= projects; i++) {
    for (let j = 0; j <= totalResource; j++) {
      let maxVal = -Infinity;
      let bestX = -1;
      const precursors: PrecursorCell[] = [];

      for (let x = 0; x <= j; x++) {
        const prevVal = costTable[i - 1][j - x];
        if (prevVal !== null && prevVal !== -Infinity) {
          const r = returns[i - 1]?.[x] || 0;
          const totalVal = prevVal + r;

          precursors.push({
            row: i - 1,
            col: j - x,
            type: 'diag',
            label: `前置状态 dp[${i-1}][${j-x}] (${prevVal}) + 本项目分配 ${x} 资源收益 (${r})`,
            value: totalVal
          });

          if (totalVal > maxVal) {
            maxVal = totalVal;
            bestX = x;
          }
        }
      }

      costTable[i][j] = maxVal;
      currentTable[i][j] = maxVal;

      steps.push({
        stepIndex: stepIndex++,
        i,
        j,
        dpTable: JSON.parse(JSON.stringify(currentTable)),
        precursors,
        description: `计算前 ${i} 个项目分配 ${j} 个资源的最优收益 dp[${i}][${j}]。比对分配给本项目 x = 0 到 ${j} 资源时的组合收益，确定最佳分配资源量 x = ${bestX} (本项目收益为 ${returns[i - 1]?.[bestX] || 0})，最大累计总收益为 ${maxVal}。`,
        decision: 'pick',
        highlightedCodeLine: 4,
        currentVal: maxVal
      });
    }
  }

  const finalTable: number[][] = costTable.map((row) => row.map((val) => val === null || val === -Infinity ? 0 : val));

  // Backtracking
  const backtrackPath: BacktrackNode[] = [];
  let curJ = totalResource;
  let curI = projects;

  while (curI > 0) {
    let bestX = 0;
    const currentVal = costTable[curI][curJ] || 0;
    for (let x = 0; x <= curJ; x++) {
      const prevVal = costTable[curI - 1][curJ - x];
      if (prevVal !== null && prevVal !== -Infinity) {
        const r = returns[curI - 1]?.[x] || 0;
        if (Math.abs(prevVal + r - currentVal) < 1e-5) {
          bestX = x;
          break;
        }
      }
    }

    backtrackPath.push({
      row: curI,
      col: curJ,
      selected: true,
      action: `项目 ${curI} 分配 ${bestX} 单位资源（获得单项收益 ${returns[curI - 1]?.[bestX] || 0}），剩余 ${curJ - bestX} 单位资源分配给前 ${curI - 1} 个项目。`
    });

    curJ -= bestX;
    curI -= 1;
  }

  backtrackPath.push({
    row: 0,
    col: curJ,
    selected: true,
    action: `回到边界，剩余资源 ${curJ} 单位。全分配完毕，得到最优总收益为 ${finalTable[projects][totalResource]}。`
  });

  return { steps, finalTable, backtrackPath };
}
