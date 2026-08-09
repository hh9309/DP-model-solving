import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  SkipBack, 
  Sparkles, 
  Scissors, 
  Activity, 
  TrendingUp, 
  Lightbulb 
} from 'lucide-react';

interface TreeNode {
  id: string;
  x: number;
  y: number;
  label: string;
  stage: number;
  initialVal?: string | number;
}

interface TreeEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
}

interface StepData {
  stepIndex: number;
  title: string;
  description: string;
  phase: 'idle' | 'forward' | 'backward' | 'done';
  activeNodes: string[];
  activeEdges: string[];
  prunedEdges: string[];
  optimalEdges: string[];
  nodeValues: Record<string, number>;
  comparison?: {
    nodeId: string;
    formula: string;
    winner: string;
    loser: string;
  };
}

const treeNodes: TreeNode[] = [
  // Stage 0
  { id: 'S', x: 60, y: 200, label: '起点 S', stage: 0 },
  // Stage 1
  { id: 'A1', x: 240, y: 110, label: '状态 A1', stage: 1 },
  { id: 'A2', x: 240, y: 290, label: '状态 A2', stage: 1 },
  // Stage 2
  { id: 'B1', x: 440, y: 65, label: '状态 B1', stage: 2 },
  { id: 'B2', x: 440, y: 155, label: '状态 B2', stage: 2 },
  { id: 'B3', x: 440, y: 245, label: '状态 B3', stage: 2 },
  { id: 'B4', x: 440, y: 335, label: '状态 B4', stage: 2 },
  // Stage 3 (Leaf nodes)
  { id: 'C1', x: 640, y: 45, label: '12', stage: 3, initialVal: 12 },
  { id: 'C2', x: 640, y: 85, label: '18', stage: 3, initialVal: 18 },
  { id: 'C3', x: 640, y: 135, label: '15', stage: 3, initialVal: 15 },
  { id: 'C4', x: 640, y: 175, label: '25', stage: 3, initialVal: 25 },
  { id: 'C5', x: 640, y: 225, label: '9', stage: 3, initialVal: 9 },
  { id: 'C6', x: 640, y: 265, label: '22', stage: 3, initialVal: 22 },
  { id: 'C7', x: 640, y: 315, label: '30', stage: 3, initialVal: 30 },
  { id: 'C8', x: 640, y: 355, label: '14', stage: 3, initialVal: 14 },
];

const treeEdges: TreeEdge[] = [
  // S to Stage 1
  { id: 'S_A1', from: 'S', to: 'A1', weight: 4 },
  { id: 'S_A2', from: 'S', to: 'A2', weight: 3 },
  // Stage 1 to Stage 2
  { id: 'A1_B1', from: 'A1', to: 'B1', weight: 5 },
  { id: 'A1_B2', from: 'A1', to: 'B2', weight: 2 },
  { id: 'A2_B3', from: 'A2', to: 'B3', weight: 8 },
  { id: 'A2_B4', from: 'A2', to: 'B4', weight: 1 },
  // Stage 2 to Stage 3 (C)
  { id: 'B1_C1', from: 'B1', to: 'C1', weight: 12 },
  { id: 'B1_C2', from: 'B1', to: 'C2', weight: 18 },
  { id: 'B2_C3', from: 'B2', to: 'C3', weight: 15 },
  { id: 'B2_C4', from: 'B2', to: 'C4', weight: 25 },
  { id: 'B3_C5', from: 'B3', to: 'C5', weight: 9 },
  { id: 'B3_C6', from: 'B3', to: 'C6', weight: 22 },
  { id: 'B4_C7', from: 'B4', to: 'C7', weight: 30 },
  { id: 'B4_C8', from: 'B4', to: 'C8', weight: 14 },
];

const steps: StepData[] = [
  {
    stepIndex: 0,
    title: "贝尔曼倒推实验装置就绪",
    description: "点击下方播放按钮开始决策推演。本动画旨在解构运筹优化中最核心的“多阶段决策网格生长”与“贝尔曼逆向剪枝”动态机理，带您领略全局最优策略如何自未来倒推锁定。",
    phase: 'idle',
    activeNodes: [],
    activeEdges: [],
    prunedEdges: [],
    optimalEdges: [],
    nodeValues: {},
  },
  {
    stepIndex: 1,
    title: "【正向生长】第 1 阶段未来分叉探寻",
    description: "多阶段决策始于初始状态 S (阶段 0)。系统向前探索可能的分支决策，迅速向右侧分裂生成状态 A1 (转折代价 4) 与 A2 (转折代价 3)。每一条分支都是在不确定未来中的决策尝试。",
    phase: 'forward',
    activeNodes: ['S', 'A1', 'A2'],
    activeEdges: ['S_A1', 'S_A2'],
    prunedEdges: [],
    optimalEdges: [],
    nodeValues: {},
  },
  {
    stepIndex: 2,
    title: "【正向生长】第 2 阶段多决策通道爆裂扩散",
    description: "树状状态网络继续深入。状态 A1 的下一步面临 B1、B2 两个子抉择；A2 的下一步派生出 B3、B4。分支数量呈倍数膨胀。如果不做剪枝裁剪，未来的状态组合规模将呈雪崩式累积。",
    phase: 'forward',
    activeNodes: ['S', 'A1', 'A2', 'B1', 'B2', 'B3', 'B4'],
    activeEdges: ['S_A1', 'S_A2', 'A1_B1', 'A1_B2', 'A2_B3', 'A2_B4'],
    prunedEdges: [],
    optimalEdges: [],
    nodeValues: {},
  },
  {
    stepIndex: 3,
    title: "【正向生长】全量决策空间完全铺开 (维度灾难)",
    description: "决策拓扑长至最后一层叶子节点。在终期（阶段 3），所有的末端物理收益（C1 至 C8，如 12、18、25 等值）赫然呈现。全图共有 8 条完整的从起点贯穿到终点的路径分支。若采用蛮力贪心或暴力搜索，计算负担极大。现在，大幕开启——看动态规划如何逆向斩断冗余！",
    phase: 'forward',
    activeNodes: ['S', 'A1', 'A2', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'],
    activeEdges: ['S_A1', 'S_A2', 'A1_B1', 'A1_B2', 'A2_B3', 'A2_B4', 'B1_C1', 'B1_C2', 'B2_C3', 'B2_C4', 'B3_C5', 'B3_C6', 'B4_C7', 'B4_C8'],
    prunedEdges: [],
    optimalEdges: [],
    nodeValues: {},
  },
  {
    stepIndex: 4,
    title: "【逆向剪枝】状态 B1 局部最优抉择 (收益 18 胜出)",
    description: "动画焦点瞬间移动到最右侧的 B1 节点。由于 B1 的未来只能决策到 C1 (12) 或 C2 (18)。为了最大化收益，我们果断决定保留 C2。此时分支 B1 → C1 (12) 彻底熄灭被无情剪枝！B1 状态的最高剩余收益被锁定并写为 18。",
    phase: 'backward',
    activeNodes: ['B1', 'C1', 'C2'],
    activeEdges: ['B1_C1', 'B1_C2'],
    prunedEdges: ['B1_C1'],
    optimalEdges: ['B1_C2'],
    nodeValues: { B1: 18 },
    comparison: { nodeId: 'B1', formula: 'V(B1) = max(C1: 12, C2: 18) = 18', winner: 'B1_C2', loser: 'B1_C1' }
  },
  {
    stepIndex: 5,
    title: "【逆向剪枝】状态 B2 局部最优抉择 (收益 25 胜出)",
    description: "焦点转移到 B2 节点：可往 C3 (15) 或 C4 (25)。25 显著大于 15。我们剪去劣质分支 B2 → C3，保留并点亮最完美抉择 B2 → C4。B2 节点的累积期望收益被更新写入 25。",
    phase: 'backward',
    activeNodes: ['B2', 'C3', 'C4'],
    activeEdges: ['B2_C3', 'B2_C4'],
    prunedEdges: ['B1_C1', 'B2_C3'],
    optimalEdges: ['B1_C2', 'B2_C4'],
    nodeValues: { B1: 18, B2: 25 },
    comparison: { nodeId: 'B2', formula: 'V(B2) = max(C3: 15, C4: 25) = 25', winner: 'B2_C4', loser: 'B2_C3' }
  },
  {
    stepIndex: 6,
    title: "【逆向剪枝】状态 B3 局部最优抉择 (收益 22 胜出)",
    description: "继续逆推 B3 节点的选择路径：可到 C5 (9) 或 C6 (22)。22 轻松获胜。通道 B3 → C5 瞬间褪色并断开连接（剪枝），B3 节点的值被稳固记录为 22。",
    phase: 'backward',
    activeNodes: ['B3', 'C5', 'C6'],
    activeEdges: ['B3_C5', 'B3_C6'],
    prunedEdges: ['B1_C1', 'B2_C3', 'B3_C5'],
    optimalEdges: ['B1_C2', 'B2_C4', 'B3_C6'],
    nodeValues: { B1: 18, B2: 25, B3: 22 },
    comparison: { nodeId: 'B3', formula: 'V(B3) = max(C5: 9, C6: 22) = 22', winner: 'B3_C6', loser: 'B3_C5' }
  },
  {
    stepIndex: 7,
    title: "【逆向剪枝】状态 B4 局部最优抉择 (收益 30 胜出)",
    description: "最后一组叶子节点 B4 被估算：往 C7 (30) 还是 C8 (14)？选择 30。分支 B4 → C8 被打上红叉并剪除，点亮 B4 → C7。B4 状态最优值记录为 30。第二阶段到第三阶段的局部最优全部锚定！",
    phase: 'backward',
    activeNodes: ['B4', 'C7', 'C8'],
    activeEdges: ['B4_C7', 'B4_C8'],
    prunedEdges: ['B1_C1', 'B2_C3', 'B3_C5', 'B4_C8'],
    optimalEdges: ['B1_C2', 'B2_C4', 'B3_C6', 'B4_C7'],
    nodeValues: { B1: 18, B2: 25, B3: 22, B4: 30 },
    comparison: { nodeId: 'B4', formula: 'V(B4) = max(C7: 30, C8: 14) = 30', winner: 'B4_C7', loser: 'B4_C8' }
  },
  {
    stepIndex: 8,
    title: "【逆向倒推】回溯第 1 阶段：状态 A1 决策价值权衡",
    description: "时间向左倒流！评估状态 A1 处的决策：\n• 若走 B1 通道：转移动能收益为 5，再加上 B1 自保的最高收益 18，共得 5 + 18 = 23。\n• 若走 B2 通道：转移动能收益为 2，再加上 B2 锁定的最佳未来 25，共得 2 + 25 = 27。\n权衡之下，27 胜出！我们选择走向 B2。分支 A1 → B1 顿时断开（由于 B1 被抛弃，由 B1 出发的任何下游链路也随之失去意义），A1 的估值确定为 27。",
    phase: 'backward',
    activeNodes: ['A1', 'B1', 'B2'],
    activeEdges: ['A1_B1', 'A1_B2'],
    prunedEdges: ['B1_C1', 'B2_C3', 'B3_C5', 'B4_C8', 'A1_B1'],
    optimalEdges: ['B1_C2', 'B2_C4', 'B3_C6', 'B4_C7', 'A1_B2'],
    nodeValues: { B1: 18, B2: 25, B3: 22, B4: 30, A1: 27 },
    comparison: { nodeId: 'A1', formula: 'V(A1) = max(B1: 5+18, B2: 2+25) = 27', winner: 'A1_B2', loser: 'A1_B1' }
  },
  {
    stepIndex: 9,
    title: "【逆向倒推】回溯第 1 阶段：状态 A2 决策价值权衡",
    description: "类似地，估算 A2 的最大化未来利益：\n• 选择 A2_B3 路径：转移回报为 8，加 B3 最佳利益 22，得 8 + 22 = 30。\n• 选择 A2_B4 路径：转移回报为 1，加 B4 最佳利益 30，得 1 + 30 = 31。\n31 微微胜出！A2 决定不走 B3，走 B4 决策。分支 A2 → B3 被无情熄灭剪除。A2 的最优期望收益正式记录为 31。",
    phase: 'backward',
    activeNodes: ['A2', 'B3', 'B4'],
    activeEdges: ['A2_B3', 'A2_B4'],
    prunedEdges: ['B1_C1', 'B2_C3', 'B3_C5', 'B4_C8', 'A1_B1', 'A2_B3'],
    optimalEdges: ['B1_C2', 'B2_C4', 'B3_C6', 'B4_C7', 'A1_B2', 'A2_B4'],
    nodeValues: { B1: 18, B2: 25, B3: 22, B4: 30, A1: 27, A2: 31 },
    comparison: { nodeId: 'A2', formula: 'V(A2) = max(B3: 8+22, B4: 1+30) = 31', winner: 'A2_B4', loser: 'A2_B3' }
  },
  {
    stepIndex: 10,
    title: "【全局汇聚】终极权衡：初始起点 S 处的最终审判",
    description: "时空回到初始起点 0 (S 节点)，做最后的全局决策融合：\n• 决策走向 A1 通路：启动成本/代价为 4 + A1 的锁定期望值 27 = 31。\n• 决策走向 A2 通路：启动成本/代价为 3 + A2 的锁定期望值 31 = 34。\n最优结果毫无疑问是走向 A2 的 34！至此，最后一条次优主干 S → A1 被熄灭剪枝。整张决策网在起点 S 的最优累计期望值确定为 34。",
    phase: 'backward',
    activeNodes: ['S', 'A1', 'A2'],
    activeEdges: ['S_A1', 'S_A2'],
    prunedEdges: ['B1_C1', 'B2_C3', 'B3_C5', 'B4_C8', 'A1_B1', 'A2_B3', 'S_A1'],
    optimalEdges: ['B1_C2', 'B2_C4', 'B3_C6', 'B4_C7', 'A1_B2', 'A2_B4', 'S_A2'],
    nodeValues: { B1: 18, B2: 25, B3: 22, B4: 30, A1: 27, A2: 31, S: 34 },
    comparison: { nodeId: 'S', formula: 'V(S) = max(A1: 4+27, A2: 3+31) = 34', winner: 'S_A2', loser: 'S_A1' }
  },
  {
    stepIndex: 11,
    title: "【完美收敛】最优决策策略主干闪耀！",
    description: "恭喜！决策倒推圆满完成。在整棵密密麻麻的指数可能分支树中，次优分支被全部剪枝淡化，唯一一条全局最完美的战略路径「S → A2 → B4 → C7」被渲染成了耀眼的脉冲绿色。这证明了动态规划（Bellman 倒推原理）的伟大：不重复探寻、自未来决策、步步精简、一气呵成！",
    phase: 'done',
    activeNodes: [],
    activeEdges: [],
    prunedEdges: ['B1_C1', 'B2_C3', 'B3_C5', 'B4_C8', 'A1_B1', 'A2_B3', 'S_A1'],
    optimalEdges: ['B1_C2', 'B2_C4', 'B3_C6', 'B4_C7', 'A1_B2', 'A2_B4', 'S_A2'],
    nodeValues: { B1: 18, B2: 25, B3: 22, B4: 30, A1: 27, A2: 31, S: 34 },
  }
];

export function BackwardInductionAnimation() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1800); // Ms per step
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeStepData = steps[currentStep];

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed]);

  const handlePlayPause = () => {
    if (currentStep === steps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleStepNext = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
  };

  const handleStepPrev = () => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  // Check if an edge is part of the final optimal mainline S -> A2 -> B4 -> C7
  const isFinalMainlineEdge = (edgeId: string) => {
    const mainline = ['S_A2', 'A2_B4', 'B4_C7'];
    return mainline.includes(edgeId);
  };

  const isFinalMainlineNode = (nodeId: string) => {
    const mainline = ['S', 'A2', 'B4', 'C7'];
    return mainline.includes(nodeId);
  };

  return (
    <div id="backward-induction-animation-module" className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mt-6 flex flex-col gap-5 animate-fadeIn">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 animate-pulse">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              状态树逆向剪枝与贝尔曼倒推动画 (Backward Induction & Pruning)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              动态推演：直观演绎如何运用贝尔曼最优化原理进行局部状态压缩与多阶段树枝裁切
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 border border-slate-200/60 px-2 py-0.5 rounded font-mono">
            Phase: {activeStepData.phase === 'idle' ? '准备推演' : activeStepData.phase === 'forward' ? '正向生长探寻' : activeStepData.phase === 'backward' ? '逆向贝尔曼剪枝' : '完美决策收敛'}
          </span>
          <span className="text-xs text-indigo-600 font-mono font-bold">
            Step: {currentStep} / {steps.length - 1}
          </span>
        </div>
      </div>

      {/* SVG TREE DECISION CANVAS */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-950 shadow-inner relative overflow-hidden flex flex-col items-center">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:30px_30px] opacity-15 pointer-events-none" />
        
        {/* Outer ambient glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />

        <div className="w-full overflow-x-auto scrollbar-thin">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 700 400" 
            className="min-w-[680px] md:min-w-full select-none h-[400px] block mx-auto"
          >
            <defs>
              {/* Dynamic Line Marker */}
              <marker
                id="tree-arrow"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
              </marker>
              <marker
                id="tree-arrow-active"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="5"
                markerHeight="5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#6366f1" />
              </marker>
              <marker
                id="tree-arrow-optimal"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
              </marker>
            </defs>

            {/* EDGES / PATHS */}
            {treeEdges.map((edge) => {
              const fromNode = treeNodes.find(n => n.id === edge.from)!;
              const toNode = treeNodes.find(n => n.id === edge.to)!;
              
              // Calculate visibility based on step index and forward growth
              // We only show edges whose 'toNode' stage is <= the current growth stage reached.
              const isForwardVisible = currentStep >= 1 && (
                (toNode.stage === 1 && currentStep >= 1) ||
                (toNode.stage === 2 && currentStep >= 2) ||
                (toNode.stage === 3 && currentStep >= 3)
              );

              if (!isForwardVisible) return null;

              const isActive = activeStepData.activeEdges.includes(edge.id);
              const isPruned = activeStepData.prunedEdges.includes(edge.id);
              const isOptimal = activeStepData.optimalEdges.includes(edge.id);
              const isMainline = currentStep === steps.length - 1 && isFinalMainlineEdge(edge.id);

              let strokeColor = '#334155'; // Dark slate grey for default
              let strokeWidth = '1.5';
              let strokeDash = '';
              let filterGlow = '';
              let marker = 'url(#tree-arrow)';

              if (isPruned) {
                strokeColor = '#1e293b'; // Heavily dimmed / broken
                strokeWidth = '1.0';
                strokeDash = '5 4';
                marker = '';
              } else if (isMainline) {
                strokeColor = '#10b981'; // Brilliant Emerald green for final optimal strategy trunk
                strokeWidth = '4';
                filterGlow = 'drop-shadow(0 0 4px rgba(16,185,129,0.6))';
                marker = 'url(#tree-arrow-optimal)';
              } else if (isOptimal) {
                // If the edge was chosen as locally optimal in previous backward steps
                // S_A1, etc.
                if (currentStep === steps.length - 1) {
                  // If final step, we only highlight the actual mainline. Rest are dimmed
                  strokeColor = '#475569';
                  strokeWidth = '1.5';
                } else {
                  strokeColor = '#10b981'; // Locally optimal
                  strokeWidth = '3';
                  filterGlow = 'drop-shadow(0 0 3px rgba(16,185,129,0.4))';
                  marker = 'url(#tree-arrow-optimal)';
                }
              } else if (isActive) {
                strokeColor = '#818cf8'; // Interactive blue-purple active focus
                strokeWidth = '3.5';
                filterGlow = 'drop-shadow(0 0 3px rgba(129,140,248,0.5))';
                marker = 'url(#tree-arrow-active)';
              }

              return (
                <g key={`tree-edge-${edge.id}`}>
                  {/* Glowing background under active/mainline lines */}
                  {(isActive || isMainline || (isOptimal && currentStep < steps.length - 1)) && (
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke={isMainline ? '#10b981' : isOptimal ? '#10b981' : '#6366f1'}
                      strokeWidth={parseFloat(strokeWidth) + 4}
                      className="opacity-15"
                      style={{ filter: 'blur(2px)' }}
                    />
                  )}
                  
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    markerEnd={marker}
                    className="transition-all duration-500 ease-in-out"
                    style={{ filter: filterGlow }}
                  />

                  {/* Edge Transition Costs / Rewards Label */}
                  {toNode.stage < 3 && (
                    <g transform={`translate(${(fromNode.x + toNode.x) / 2}, ${(fromNode.y + toNode.y) / 2 - 12})`}>
                      <rect 
                        x="-12" 
                        y="-8" 
                        width="24" 
                        height="15" 
                        rx="3" 
                        fill="#0f172a" 
                        stroke={isActive ? '#818cf8' : isMainline ? '#10b981' : isOptimal && currentStep < steps.length - 1 ? '#10b981' : '#1e293b'} 
                        strokeWidth="1"
                        className="transition-all duration-300"
                      />
                      <text
                        fill={isActive ? '#a5b4fc' : isMainline ? '#34d399' : isOptimal && currentStep < steps.length - 1 ? '#34d399' : '#64748b'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                        y="2"
                      >
                        +{edge.weight}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* NODES */}
            {treeNodes.map((node) => {
              // Node visibility
              const isVisible = currentStep >= 1 && (
                (node.stage === 0) ||
                (node.stage === 1 && currentStep >= 1) ||
                (node.stage === 2 && currentStep >= 2) ||
                (node.stage === 3 && currentStep >= 3)
              );

              if (!isVisible) return null;

              const isFocused = activeStepData.activeNodes.includes(node.id);
              const isOptimal = activeStepData.optimalEdges.some(eId => eId.split('_')[1] === node.id || eId.split('_')[0] === node.id);
              const isMainline = currentStep === steps.length - 1 && isFinalMainlineNode(node.id);

              // Check if any of its upstream edges are pruned
              // If ALL upstream choices are pruned, the node itself is fully dimmed out
              const isPrunedState = activeStepData.phase === 'backward' && 
                node.stage > 0 && 
                treeEdges.filter(e => e.to === node.id).every(e => activeStepData.prunedEdges.includes(edgeIdFromNodeAndEdge(e.id, activeStepData.prunedEdges)));

              // Check if we have a state value calculated for this node
              const hasVal = activeStepData.nodeValues[node.id] !== undefined;
              const valDisplay = hasVal ? activeStepData.nodeValues[node.id] : null;

              let circleFill = '#0f172a';
              let circleStroke = '#334155';
              let strokeWidth = '1.5';
              let scale = '1';
              let ringColor = 'transparent';

              if (isMainline) {
                circleFill = '#064e3b'; // Emerald dark
                circleStroke = '#10b981'; // Bright green
                strokeWidth = '2.5';
                scale = '1.15';
                ringColor = 'rgba(16,185,129,0.3)';
              } else if (isFocused) {
                circleFill = '#1e1b4b'; // Deep Indigo
                circleStroke = '#6366f1'; // Indigo
                strokeWidth = '3';
                scale = '1.2';
                ringColor = 'rgba(99,102,241,0.4)';
              } else if (hasVal) {
                if (currentStep === steps.length - 1) {
                  // final state, non-mainline are grayed out slightly
                  circleFill = '#0f172a';
                  circleStroke = '#475569';
                } else {
                  circleFill = '#022c22'; // Emerald state lock
                  circleStroke = '#10b981';
                  strokeWidth = '2';
                }
              } else if (isPrunedState) {
                circleFill = '#020617';
                circleStroke = '#1e293b';
                scale = '0.9';
              }

              return (
                <g 
                  key={`tree-node-${node.id}`} 
                  transform={`translate(${node.x}, ${node.y}) scale(${scale})`}
                  className="transition-all duration-500 ease-in-out"
                >
                  {/* Pulse visual ring for focus */}
                  {isFocused && (
                    <circle
                      r="22"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="1.5"
                      className="animate-ping opacity-25"
                    />
                  )}
                  {isMainline && (
                    <circle
                      r="22"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="1.5"
                      className="animate-pulse opacity-40"
                    />
                  )}

                  {/* Main Circle node */}
                  {node.stage < 3 ? (
                    // Regular stage nodes
                    <circle
                      r="16"
                      fill={circleFill}
                      stroke={circleStroke}
                      strokeWidth={strokeWidth}
                      className="shadow-md"
                    />
                  ) : (
                    // Leaf nodes - drawn as clean elegant squares/diamonds
                    <rect
                      x="-13"
                      y="-13"
                      width="26"
                      height="26"
                      rx="4"
                      fill={isFocused ? '#1e1b4b' : isMainline ? '#064e3b' : '#0f172a'}
                      stroke={isFocused ? '#6366f1' : isMainline ? '#10b981' : '#334155'}
                      strokeWidth={isFocused ? '2.5' : '1.5'}
                    />
                  )}

                  {/* Node Label / ID Text */}
                  <text
                    fill={isPrunedState ? '#334155' : isFocused ? '#c7d2fe' : isMainline ? '#a7f3d0' : '#94a3b8'}
                    fontSize="9"
                    fontWeight="extrabold"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                    y={node.stage < 3 ? '-22' : '-18'}
                  >
                    {node.label}
                  </text>

                  {/* Inner Node Text / Accumulator Value */}
                  {node.stage < 3 ? (
                    <text
                      fill={hasVal ? '#34d399' : isFocused ? '#818cf8' : '#475569'}
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                      y="3.5"
                    >
                      {hasVal ? `V:${valDisplay}` : node.id}
                    </text>
                  ) : (
                    <text
                      fill={isFocused ? '#818cf8' : isMainline ? '#10b981' : '#f8fafc'}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                      y="3.5"
                    >
                      {node.initialVal}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* DYNAMIC BELLMAN RESOLVING SUB-CONSOLE */}
        {activeStepData.comparison && (
          <div className="w-full mt-3 bg-slate-950/90 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 animate-slideUp z-20 backdrop-blur-sm">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="p-1.5 rounded bg-indigo-500/10 text-indigo-400">
                <Scissors className="w-4 h-4 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-500 font-mono tracking-wider">
                  贝尔曼最优化当前计算
                </span>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  {activeStepData.comparison.formula}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono w-full sm:w-auto justify-end">
              <span className="text-rose-400 font-semibold line-through bg-rose-950/30 px-2.5 py-1 rounded border border-rose-900/30">
                已剪枝: {activeStepData.comparison.loser}
              </span>
              <span className="text-emerald-400 font-extrabold bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-500/30 animate-pulse">
                已保留: {activeStepData.comparison.winner}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* LOWER PANEL: STEP TEXTUAL EXPLANATION */}
      <div className="bg-slate-50 rounded-xl p-4.5 border border-slate-150/80 flex flex-col sm:flex-row gap-4 items-start">
        <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0 mt-0.5">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            {activeStepData.title}
          </h4>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
            {activeStepData.description}
          </p>
        </div>
      </div>

      {/* CONTROLLERS BUTTONS */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleReset}
            disabled={currentStep === 0}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition"
            title="重置到初始状态"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleStepPrev}
            disabled={currentStep === 0}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition"
            title="上一步"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={handlePlayPause}
            className={`px-4 py-2 rounded-lg text-white font-semibold text-xs flex items-center gap-1.5 shadow transition-all ${
              isPlaying 
                ? 'bg-amber-500 hover:bg-amber-600' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>暂停倒推</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>{currentStep === steps.length - 1 ? '重新演播' : '自动推演'}</span>
              </>
            )}
          </button>
          <button
            onClick={handleStepNext}
            disabled={currentStep === steps.length - 1}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition"
            title="下一步"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* RATE SPEED SLIDER */}
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500">
            倒推步进间隔
          </span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="800"
              max="3500"
              step="300"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
              className="w-24 accent-slate-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] font-mono font-bold text-slate-600">
              {(speed / 1000).toFixed(1)}s
            </span>
          </div>
        </div>

        {/* PROGRESS MINI BAR */}
        <div className="hidden md:flex items-center gap-1">
          {steps.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              onClick={() => {
                setIsPlaying(false);
                setCurrentStep(idx);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                idx === currentStep
                  ? 'bg-indigo-600 scale-125 ring-2 ring-indigo-500/20'
                  : idx < currentStep
                  ? 'bg-emerald-500'
                  : 'bg-slate-200 hover:bg-slate-300'
              }`}
              title={`步骤 ${idx}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper utility function inside file to keep TS happy without complex exports
function edgeIdFromNodeAndEdge(edgeId: string, prunedEdges: string[]): string {
  return prunedEdges.includes(edgeId) ? edgeId : '';
}
