import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  RotateCcw, 
  Brain, 
  Code, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Layers, 
  Sparkles, 
  Info, 
  FileText,
  ChevronRight,
  HelpCircle,
  Plus,
  Trash2,
  BookOpen,
  Terminal,
  Check,
  Copy,
  Settings,
  X,
  Cpu,
  Zap,
  GitBranch
} from 'lucide-react';

import { 
  ProblemType, 
  KnapsackParams, 
  ShortestPathParams, 
  EquipmentParams, 
  ProductionInventoryParams,
  MarkovPortfolioParams,
  ResourceAllocationParams,
  DPStep, 
  BacktrackNode,
  generateKnapsackSteps, 
  generateShortestPathSteps, 
  generateEquipmentSteps,
  generateProductionInventorySteps,
  generateMarkovPortfolioSteps,
  generateResourceAllocationSteps
} from './types';

import { getHeuristicReport } from './utils/heuristics';
import { BackwardInductionAnimation } from './components/BackwardInductionAnimation';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceDot
} from 'recharts';

const PRESET_CATALOG: Record<ProblemType, Array<{
  id: string;
  title: string;
  desc: string;
  badge: string;
  badgeColor: string;
  icon: any;
  preview: string;
}>> = {
  knapsack: [
    {
      id: 'classic',
      title: '资本预算与投资组合决策',
      desc: '运筹学经典资金配资问题，在有限预算约束下，如何筛选最强获利组合，使边际收益总和最大化。',
      badge: '资产配置',
      badgeColor: 'bg-indigo-50 border-indigo-100 text-indigo-700',
      icon: Sparkles,
      preview: 'N=4, W=8'
    },
    {
      id: 'gold',
      title: '远洋集装箱舱位吨位装载',
      desc: '物流运筹学配载决策。货物重吨与体积各异，如何在货轮排水量上限内装载高报关价值的集装箱。',
      badge: '物流配载',
      badgeColor: 'bg-amber-50 border-amber-100 text-amber-700',
      icon: Layers,
      preview: 'N=4, W=10'
    },
    {
      id: 'subset',
      title: '虚拟电厂多能互补负荷分配',
      desc: '现代能源运筹，各供能单元额定出力与成本等比例，退化为探究子集最大出力的稳定边缘。',
      badge: '能源调度',
      badgeColor: 'bg-emerald-50 border-emerald-100 text-emerald-700',
      icon: Brain,
      preview: 'N=4, W=10'
    },
    {
      id: 'greedy',
      title: '应急救援物资边际效用非线性',
      desc: '传统单位体积性价比贪心分配策略会在此处失效，运筹学中用于强力证明动态规划的全局最优性。',
      badge: '贪心失效',
      badgeColor: 'bg-rose-50 border-rose-100 text-rose-700',
      icon: AlertTriangle,
      preview: 'N=4, W=9'
    },
    {
      id: 'polar',
      title: '网仓高轻抛极轻重混装箱',
      desc: '智能仓储装箱博弈，高价轻抛货物与高重中价物品共存，评估算法对货位边缘空间的高效抢占。',
      badge: '仓储装箱',
      badgeColor: 'bg-sky-50 border-sky-100 text-sky-700',
      icon: TrendingUp,
      preview: 'N=4, W=10'
    },
    {
      id: 'zero',
      title: '空载极限制约仿真',
      desc: '检验运筹系统在零可用吨位（容量W=0）下的无解安全边界，确保算法初始化状态安全。',
      badge: '零容边界',
      badgeColor: 'bg-slate-50 border-slate-200 text-slate-600',
      icon: Code,
      preview: 'N=3, W=0'
    },
    {
      id: 'negative',
      title: '鲁棒性故障负权防御机制',
      desc: '输入异常数据负值，检验运筹排程决策引擎的边界防御能力与输入过滤的健壮性。',
      badge: '异常检测',
      badgeColor: 'bg-red-50 border-red-100 text-red-700',
      icon: HelpCircle,
      preview: 'N=3, W=5'
    }
  ],
  shortest_path: [
    {
      id: 'classic',
      title: '多阶段物流网络最短路径决策',
      desc: '运筹学经典路径规划。每个网格代表一个物流节点及其过境税，求解自起点 (0,0) 至终点最小成本路径。',
      badge: '路径规划',
      badgeColor: 'bg-indigo-50 border-indigo-100 text-indigo-700',
      icon: Sparkles,
      preview: '4×4 矩阵'
    },
    {
      id: 'obstacle',
      title: '避障运筹与惩罚壁垒路径绕行',
      desc: '含有高昂阻碍成本的异构网格，检验动态规划在面对高惩罚权值时的最优智能绕避决策。',
      badge: '智能避障',
      badgeColor: 'bg-rose-50 border-rose-100 text-rose-700',
      icon: AlertTriangle,
      preview: '4×4 高成本'
    },
    {
      id: 'uniform',
      title: '均质工业网流平权对齐分配',
      desc: '所有过境节点成本均等，验证状态转移方程在完美对称矩阵下的路径分歧与多解稳定性。',
      badge: '平权对齐',
      badgeColor: 'bg-emerald-50 border-emerald-100 text-emerald-700',
      icon: Brain,
      preview: '3×3 均等成本'
    }
  ],
  equipment: [
    {
      id: 'classic',
      title: '资产折旧与更新周期经典案例',
      desc: '经典设备更新周期决策。买新设备成本为 10，每年运保费递增，折旧残值递减，求最佳置换时刻。',
      badge: '置换决策',
      badgeColor: 'bg-indigo-50 border-indigo-100 text-indigo-700',
      icon: Sparkles,
      preview: 'T=4, P=10'
    },
    {
      id: 'depreciation',
      title: '断崖式折旧残值高频置换决策',
      desc: '设备残值第一年发生断崖式下跌（折旧极快），诱导决策引擎做出在极早年份进行更新的决策。',
      badge: '高频置换',
      badgeColor: 'bg-rose-50 border-rose-100 text-rose-700',
      icon: AlertTriangle,
      preview: 'T=4, P=12'
    },
    {
      id: 'durable',
      title: '长寿命低运维长期维持决策',
      desc: '长寿命高耐久设备。运行维护费用极低，诱导决策引擎做出全程保持（不置换）的决策。',
      badge: '长期维持',
      badgeColor: 'bg-emerald-50 border-emerald-100 text-emerald-700',
      icon: Brain,
      preview: 'T=5, P=15'
    }
  ],
  production_inventory: [
    {
      id: 'classic',
      title: '多期生产与库存平衡决策经典案例',
      desc: '在已知未来需求下，平衡固定启动生产成本和单位库存保管费，求解总开销最小的排产计划。',
      badge: '库存控制',
      badgeColor: 'bg-indigo-50 border-indigo-100 text-indigo-700',
      icon: Sparkles,
      preview: '4期, 容量4'
    },
    {
      id: 'high_setup',
      title: '极高生产启动费合并批次决策',
      desc: '生产启动（Setup）固定费用极高，诱导系统进行批次合并：在前期集中大量生产，后期零生产，靠库存满足需求。',
      badge: '大批生产',
      badgeColor: 'bg-rose-50 border-rose-100 text-rose-700',
      icon: AlertTriangle,
      preview: '4期, 启动费15'
    }
  ],
  markov_portfolio: [
    {
      id: 'classic',
      title: '预算在异构风险项目中配置的最优组合',
      desc: '非线性边际回报特征。在国债（稳健）、地产（中高）、科技股（极高）分配 4 单位预算的最优方案。',
      badge: '投资组合',
      badgeColor: 'bg-indigo-50 border-indigo-100 text-indigo-700',
      icon: Sparkles,
      preview: '3项目, 预算4'
    },
    {
      id: 'uniform_invest',
      title: '对称递减收益平权均分案例',
      desc: '所有项目的收益率曲线完全一致且边际效用递减，验证 DP 在完美均衡条件下的分配均匀性。',
      badge: '平权投资',
      badgeColor: 'bg-emerald-50 border-emerald-100 text-emerald-700',
      icon: Brain,
      preview: '3项目, 预算3'
    }
  ],
  resource_allocation: [
    {
      id: 'classic',
      title: '经典生产研发资源最优配置案例',
      desc: '边际效用递减特征。在3个不同的研发项目分配 4 单位科研专家，探寻能实现企业总收益最大化的资源分配方案。',
      badge: '研发配置',
      badgeColor: 'bg-indigo-50 border-indigo-100 text-indigo-700',
      icon: Sparkles,
      preview: '3项目, 4单位'
    },
    {
      id: 'exponential',
      title: '高启动门槛的非线性暴利项目配置',
      desc: '第1单位投资颗粒无收，第2、3单位产生非线性暴利。检验动态规划在面对贪心局部最优阻碍时，是否能做出集中资金配置的智能决策。',
      badge: '门槛暴利',
      badgeColor: 'bg-rose-50 border-rose-100 text-rose-700',
      icon: AlertTriangle,
      preview: '3项目, 3单位'
    }
  ]
};

export default function App() {
  // ----------------------------------------------------
  // State Management
  // ----------------------------------------------------
  const [problemType, setProblemType] = useState<ProblemType>('knapsack');
  
  // Custom inputs state
  const [knapsackParams, setKnapsackParams] = useState<KnapsackParams>({
    weights: [2, 3, 4, 5],
    values: [3, 4, 5, 6],
    capacity: 8
  });
  
  const [shortestPathParams, setShortestPathParams] = useState<ShortestPathParams>({
    grid: [
      [2, 3, 1, 4],
      [1, 5, 2, 2],
      [4, 2, 6, 1],
      [3, 1, 2, 3]
    ]
  });
  
  const [equipmentParams, setEquipmentParams] = useState<EquipmentParams>({
    years: 4,
    purchaseCost: 10,
    operatingCosts: [2, 4, 7, 11, 16],
    resaleValues: [8, 6, 4, 2, 0]
  });

  const [productionInventoryParams, setProductionInventoryParams] = useState<ProductionInventoryParams>({
    periods: 4,
    demands: [2, 3, 2, 4],
    setupCost: 5,
    unitCost: 2,
    holdingCost: 1,
    maxInventory: 4
  });

  const [markovPortfolioParams, setMarkovPortfolioParams] = useState<MarkovPortfolioParams>({
    projects: 3,
    budget: 4,
    returns: [
      [0, 3, 5, 6, 7],
      [0, 2, 6, 8, 9],
      [0, 1, 4, 7, 10]
    ]
  });

  const [resourceAllocationParams, setResourceAllocationParams] = useState<ResourceAllocationParams>({
    projects: 3,
    totalResource: 4,
    returns: [
      [0, 3, 5, 6, 7],
      [0, 2, 6, 8, 9],
      [0, 1, 4, 7, 10]
    ]
  });

  // Active step indices
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(800); // ms per step
  
  // UI States
  const [activeTab, setActiveTab] = useState<'guide' | 'ai' | 'python' | 'performance' | 'export' | 'knowledge'>('guide');
  const [simN, setSimN] = useState<number>(4);
  const [simW, setSimW] = useState<number>(8);
  const [showSpaceOpt, setShowSpaceOpt] = useState<boolean>(false);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [backtraceActive, setBacktraceActive] = useState<boolean>(true);
  
  // AI Insights State
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiProgressText, setAiProgressText] = useState<string>('');

  // AI Interactive Q&A State
  const [aiAnswer, setAiAnswer] = useState<string>('');
  const [isAnswerLoading, setIsAnswerLoading] = useState<boolean>(false);
  const [answerProgressText, setAnswerProgressText] = useState<string>('');
  
  // LLM Config states
  const [llmApiKey, setLlmApiKey] = useState<string>(() => localStorage.getItem('llm_api_key') || '');
  const [llmModel, setLlmModel] = useState<string>(() => {
    const m = localStorage.getItem('llm_model');
    return m === 'deepseek-r1' ? 'deepseek-v4-pro' : (m || 'gemini-1.5-flash');
  });
  const [llmCustomEndpoint, setLlmCustomEndpoint] = useState<string>(() => localStorage.getItem('llm_custom_endpoint') || '');
  const [showLlmSettings, setShowLlmSettings] = useState<boolean>(false);
  const [userLlmQuestion, setUserLlmQuestion] = useState<string>('');

  // 1D Scrolling array configuration
  const [knapsackSpace1D, setKnapsackSpace1D] = useState<boolean>(false);

  // Resize key to trigger SVG line redraw
  const [resizeKey, setResizeKey] = useState<number>(0);
  const [lines, setLines] = useState<any[]>([]);

  // Track the actual steps and backtracking path
  const [steps, setSteps] = useState<DPStep[]>([]);
  const [backtrackPath, setBacktrackPath] = useState<BacktrackNode[]>([]);
  const [finalTable, setFinalTable] = useState<number[][]>([]);

  // Input fields state (for manual edits before submission)
  const [weightInput, setWeightInput] = useState<string>('2,3,4,5');
  const [valueInput, setValueInput] = useState<string>('3,4,5,6');
  const [capacityInput, setCapacityInput] = useState<number>(8);

  // Shortest path grid raw inputs
  const [gridRowInput, setGridRowInput] = useState<number>(4);
  const [gridColInput, setGridColInput] = useState<number>(4);
  const [gridCostInput, setGridCostInput] = useState<number[][]>([
    [2, 3, 1, 4],
    [1, 5, 2, 2],
    [4, 2, 6, 1],
    [3, 1, 2, 3]
  ]);

  // Equipment inputs
  const [equipYearsInput, setEquipYearsInput] = useState<number>(4);
  const [equipPurchaseInput, setEquipPurchaseInput] = useState<number>(10);
  const [equipOpInput, setEquipOpInput] = useState<string>('2,4,7,11,16');
  const [equipResaleInput, setEquipResaleInput] = useState<string>('8,6,4,2,0');

  // Production Inventory raw inputs
  const [prodPeriodsInput, setProdPeriodsInput] = useState<number>(4);
  const [prodDemandsInput, setProdDemandsInput] = useState<string>('2,3,2,4');
  const [prodSetupInput, setProdSetupInput] = useState<number>(5);
  const [prodUnitInput, setProdUnitInput] = useState<number>(2);
  const [prodHoldingInput, setProdHoldingInput] = useState<number>(1);
  const [prodMaxInvInput, setProdMaxInvInput] = useState<number>(4);

  // Investment Portfolio inputs
  const [portProjectsInput, setPortProjectsInput] = useState<number>(3);
  const [portBudgetInput, setPortBudgetInput] = useState<number>(4);
  const [portReturnsInput, setPortReturnsInput] = useState<string>('0,3,5,6,7\n0,2,6,8,9\n0,1,4,7,10');

  // Resource Allocation inputs
  const [resProjectsInput, setResProjectsInput] = useState<number>(3);
  const [resTotalResourceInput, setResTotalResourceInput] = useState<number>(4);
  const [resReturnsInput, setResReturnsInput] = useState<string>('0,3,5,6,7\n0,2,6,8,9\n0,1,4,7,10');

  // Python Code verification & execution states
  const [customPythonCode, setCustomPythonCode] = useState<string>('');
  const [pythonOutput, setPythonOutput] = useState<string>('');
  const [isPyRunning, setIsPyRunning] = useState<boolean>(false);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  // Timer Ref for Autoplay
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ----------------------------------------------------
  // Recalculate DP steps when parameters or type changes
  // ----------------------------------------------------
  useEffect(() => {
    let result: { steps: DPStep[], finalTable: number[][], backtrackPath: BacktrackNode[] };
    if (problemType === 'knapsack') {
      result = generateKnapsackSteps(knapsackParams);
    } else if (problemType === 'shortest_path') {
      result = generateShortestPathSteps(shortestPathParams);
    } else if (problemType === 'equipment') {
      result = generateEquipmentSteps(equipmentParams);
    } else if (problemType === 'production_inventory') {
      result = generateProductionInventorySteps(productionInventoryParams);
    } else if (problemType === 'markov_portfolio') {
      result = generateMarkovPortfolioSteps(markovPortfolioParams);
    } else {
      result = generateResourceAllocationSteps(resourceAllocationParams);
    }

    setSteps(result.steps);
    setFinalTable(result.finalTable);
    setBacktrackPath(result.backtrackPath);
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setAiInsight(''); // Reset AI report on parameter change
  }, [problemType, knapsackParams, shortestPathParams, equipmentParams, productionInventoryParams, markovPortfolioParams, resourceAllocationParams]);

  // Handle Autoplay timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playSpeed);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, steps.length, playSpeed]);

  // Handle Resize triggers
  useEffect(() => {
    const handleResize = () => setResizeKey((k) => k + 1);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync simulation scale variables when baseline changes
  useEffect(() => {
    let currentN = 4;
    let currentW = 8;
    if (problemType === 'knapsack') {
      currentN = knapsackParams.weights.length;
      currentW = knapsackParams.capacity;
    } else if (problemType === 'shortest_path') {
      currentN = shortestPathParams.grid.length;
      currentW = shortestPathParams.grid[0].length;
    } else {
      currentN = equipmentParams.years + 1;
      currentW = 4; // 4 ages
    }
    setSimN(currentN || 4);
    setSimW(currentW || 8);
  }, [problemType, knapsackParams, shortestPathParams, equipmentParams]);

  const activeStep = steps[currentStepIndex] || {
    stepIndex: 0,
    i: 0,
    j: 0,
    dpTable: [],
    precursors: [],
    description: '',
    decision: 'init',
    highlightedCodeLine: 0,
    currentVal: 0
  };

  // ----------------------------------------------------
  // Trace dependencies of the current step
  // ----------------------------------------------------
  useEffect(() => {
    const tableContainer = document.getElementById('table-container');
    if (!tableContainer || !activeStep) {
      setLines([]);
      return;
    }

    // Delay slightly to ensure cell DOM elements are fully rendered
    const timer = setTimeout(() => {
      const currentCellEl = document.getElementById(`cell-${activeStep.i}-${activeStep.j}`);
      if (!currentCellEl) {
        setLines([]);
        return;
      }

      const containerRect = tableContainer.getBoundingClientRect();
      const currentRect = currentCellEl.getBoundingClientRect();
      const currentCenter = {
        x: currentRect.left + currentRect.width / 2 - containerRect.left,
        y: currentRect.top + currentRect.height / 2 - containerRect.top
      };

      const newLines: any[] = [];
      activeStep.precursors.forEach((prec) => {
        const precCellEl = document.getElementById(`cell-${prec.row}-${prec.col}`);
        if (precCellEl) {
          const precRect = precCellEl.getBoundingClientRect();
          const precCenter = {
            x: precRect.left + precRect.width / 2 - containerRect.left,
            y: precRect.top + precRect.height / 2 - containerRect.top
          };
          newLines.push({
            x1: precCenter.x,
            y1: precCenter.y,
            x2: currentCenter.x,
            y2: currentCenter.y,
            label: prec.label,
            type: prec.type,
            value: prec.value
          });
        }
      });
      setLines(newLines);
    }, 50);

    return () => clearTimeout(timer);
  }, [currentStepIndex, problemType, showSpaceOpt, resizeKey, steps]);

  // ----------------------------------------------------
  // Preset Handlers
  // ----------------------------------------------------
  const applyPreset = (preset: string) => {
    setIsPlaying(false);
    if (problemType === 'knapsack') {
      if (preset === 'classic') {
        const p = { weights: [2, 3, 4, 5], values: [3, 4, 5, 6], capacity: 8 };
        setKnapsackParams(p);
        setWeightInput('2,3,4,5');
        setValueInput('3,4,5,6');
        setCapacityInput(8);
      } else if (preset === 'gold') {
        const p = { weights: [2, 3, 5, 7], values: [2, 8, 15, 25], capacity: 10 };
        setKnapsackParams(p);
        setWeightInput('2,3,5,7');
        setValueInput('2,8,15,25');
        setCapacityInput(10);
      } else if (preset === 'subset') {
        const p = { weights: [3, 4, 5, 6], values: [3, 4, 5, 6], capacity: 10 };
        setKnapsackParams(p);
        setWeightInput('3,4,5,6');
        setValueInput('3,4,5,6');
        setCapacityInput(10);
      } else if (preset === 'greedy') {
        const p = { weights: [2, 3, 5, 7], values: [3, 5, 8, 12], capacity: 9 };
        setKnapsackParams(p);
        setWeightInput('2,3,5,7');
        setValueInput('3,5,8,12');
        setCapacityInput(9);
      } else if (preset === 'polar') {
        const p = { weights: [1, 5, 6, 9], values: [10, 10, 12, 20], capacity: 10 };
        setKnapsackParams(p);
        setWeightInput('1,5,6,9');
        setValueInput('10,10,12,20');
        setCapacityInput(10);
      } else if (preset === 'zero') {
        const p = { weights: [2, 3, 4], values: [3, 4, 5], capacity: 0 };
        setKnapsackParams(p);
        setWeightInput('2,3,4');
        setValueInput('3,4,5');
        setCapacityInput(0);
      } else if (preset === 'negative') {
        const p = { weights: [2, -1, 4], values: [3, 5, -2], capacity: 5 };
        setKnapsackParams(p);
        setWeightInput('2,-1,4');
        setValueInput('3,5,-2');
        setCapacityInput(5);
      }
    } else if (problemType === 'shortest_path') {
      if (preset === 'classic') {
        const p = {
          grid: [
            [2, 3, 1, 4],
            [1, 5, 2, 2],
            [4, 2, 6, 1],
            [3, 1, 2, 3]
          ]
        };
        setShortestPathParams(p);
        setGridRowInput(4);
        setGridColInput(4);
        setGridCostInput(p.grid);
      } else if (preset === 'obstacle') {
        const p = {
          grid: [
            [1, 2, 99, 1],
            [99, 1, 99, 2],
            [1, 1, 2, 1],
            [2, 99, 99, 1]
          ]
        };
        setShortestPathParams(p);
        setGridRowInput(4);
        setGridColInput(4);
        setGridCostInput(p.grid);
      } else if (preset === 'uniform') {
        const p = {
          grid: [
            [2, 2, 2],
            [2, 2, 2],
            [2, 2, 2]
          ]
        };
        setShortestPathParams(p);
        setGridRowInput(3);
        setGridColInput(3);
        setGridCostInput(p.grid);
      }
    } else if (problemType === 'equipment') {
      if (preset === 'classic') {
        const p = {
          years: 4,
          purchaseCost: 10,
          operatingCosts: [2, 4, 7, 11, 16],
          resaleValues: [8, 6, 4, 2, 0]
        };
        setEquipmentParams(p);
        setEquipYearsInput(4);
        setEquipPurchaseInput(10);
        setEquipOpInput('2,4,7,11,16');
        setEquipResaleInput('8,6,4,2,0');
      } else if (preset === 'depreciation') {
        const p = {
          years: 4,
          purchaseCost: 12,
          operatingCosts: [3, 5, 8, 12, 18],
          resaleValues: [4, 2, 1, 0, 0]
        };
        setEquipmentParams(p);
        setEquipYearsInput(4);
        setEquipPurchaseInput(12);
        setEquipOpInput('3,5,8,12,18');
        setEquipResaleInput('4,2,1,0,0');
      } else if (preset === 'durable') {
        const p = {
          years: 5,
          purchaseCost: 15,
          operatingCosts: [1, 1.5, 2, 2.5, 3, 3.5],
          resaleValues: [12, 10, 8, 6, 4, 2]
        };
        setEquipmentParams(p);
        setEquipYearsInput(5);
        setEquipPurchaseInput(15);
        setEquipOpInput('1,1.5,2,2.5,3,3.5');
        setEquipResaleInput('12,10,8,6,4,2');
      }
    } else if (problemType === 'production_inventory') {
      if (preset === 'classic') {
        const p = { periods: 4, demands: [2, 3, 2, 4], setupCost: 5, unitCost: 2, holdingCost: 1, maxInventory: 4 };
        setProductionInventoryParams(p);
        setProdPeriodsInput(4);
        setProdDemandsInput('2,3,2,4');
        setProdSetupInput(5);
        setProdUnitInput(2);
        setProdHoldingInput(1);
        setProdMaxInvInput(4);
      } else if (preset === 'high_setup') {
        const p = { periods: 4, demands: [2, 3, 2, 4], setupCost: 15, unitCost: 2, holdingCost: 1, maxInventory: 4 };
        setProductionInventoryParams(p);
        setProdPeriodsInput(4);
        setProdDemandsInput('2,3,2,4');
        setProdSetupInput(15);
        setProdUnitInput(2);
        setProdHoldingInput(1);
        setProdMaxInvInput(4);
      }
    } else if (problemType === 'markov_portfolio') {
      if (preset === 'classic') {
        const p = {
          projects: 3,
          budget: 4,
          returns: [
            [0, 3, 5, 6, 7],
            [0, 2, 6, 8, 9],
            [0, 1, 4, 7, 10]
          ]
        };
        setMarkovPortfolioParams(p);
        setPortProjectsInput(3);
        setPortBudgetInput(4);
        setPortReturnsInput('0,3,5,6,7\n0,2,6,8,9\n0,1,4,7,10');
      } else if (preset === 'uniform_invest') {
        const p = {
          projects: 3,
          budget: 3,
          returns: [
            [0, 3, 5, 6, 7],
            [0, 3, 5, 6, 7],
            [0, 3, 5, 6, 7]
          ]
        };
        setMarkovPortfolioParams(p);
        setPortProjectsInput(3);
        setPortBudgetInput(3);
        setPortReturnsInput('0,3,5,6,7\n0,3,5,6,7\n0,3,5,6,7');
      }
    } else if (problemType === 'resource_allocation') {
      if (preset === 'classic') {
        const p = {
          projects: 3,
          totalResource: 4,
          returns: [
            [0, 3, 5, 6, 7],
            [0, 2, 6, 8, 9],
            [0, 1, 4, 7, 10]
          ]
        };
        setResourceAllocationParams(p);
        setResProjectsInput(3);
        setResTotalResourceInput(4);
        setResReturnsInput('0,3,5,6,7\n0,2,6,8,9\n0,1,4,7,10');
      } else if (preset === 'exponential') {
        const p = {
          projects: 3,
          totalResource: 3,
          returns: [
            [0, 0, 5, 8],
            [0, 0, 4, 9],
            [0, 0, 6, 10]
          ]
        };
        setResourceAllocationParams(p);
        setResProjectsInput(3);
        setResTotalResourceInput(3);
        setResReturnsInput('0,0,5,8\n0,0,4,9\n0,0,6,10');
      }
    }
  };

  // Sync manual input state when problem selection changes
  useEffect(() => {
    if (problemType === 'knapsack') {
      setWeightInput(knapsackParams.weights.join(','));
      setValueInput(knapsackParams.values.join(','));
      setCapacityInput(knapsackParams.capacity);
    } else if (problemType === 'shortest_path') {
      setGridRowInput(shortestPathParams.grid.length);
      setGridColInput(shortestPathParams.grid[0].length);
      setGridCostInput(shortestPathParams.grid);
    } else if (problemType === 'equipment') {
      setEquipYearsInput(equipmentParams.years);
      setEquipPurchaseInput(equipmentParams.purchaseCost);
      setEquipOpInput(equipmentParams.operatingCosts.join(','));
      setEquipResaleInput(equipmentParams.resaleValues.join(','));
    } else if (problemType === 'production_inventory') {
      setProdPeriodsInput(productionInventoryParams.periods);
      setProdDemandsInput(productionInventoryParams.demands.join(','));
      setProdSetupInput(productionInventoryParams.setupCost);
      setProdUnitInput(productionInventoryParams.unitCost);
      setProdHoldingInput(productionInventoryParams.holdingCost);
      setProdMaxInvInput(productionInventoryParams.maxInventory);
    } else if (problemType === 'markov_portfolio') {
      setPortProjectsInput(markovPortfolioParams.projects);
      setPortBudgetInput(markovPortfolioParams.budget);
      setPortReturnsInput(markovPortfolioParams.returns.map(r => r.join(',')).join('\n'));
    } else if (problemType === 'resource_allocation') {
      setResProjectsInput(resourceAllocationParams.projects);
      setResTotalResourceInput(resourceAllocationParams.totalResource);
      setResReturnsInput(resourceAllocationParams.returns.map(r => r.join(',')).join('\n'));
    }
  }, [problemType]);

  // Handle custom parameter submission
  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPlaying(false);
    if (problemType === 'knapsack') {
      const parsedWeights = weightInput.split(',').map((x) => parseInt(x.trim(), 10)).filter((x) => !isNaN(x));
      const parsedValues = valueInput.split(',').map((x) => parseInt(x.trim(), 10)).filter((x) => !isNaN(x));
      // Truncate/balance lists
      const minLen = Math.min(parsedWeights.length, parsedValues.length);
      const balancedWeights = parsedWeights.slice(0, minLen);
      const balancedValues = parsedValues.slice(0, minLen);
      
      setKnapsackParams({
        weights: balancedWeights,
        values: balancedValues,
        capacity: Math.max(0, capacityInput)
      });
    } else if (problemType === 'shortest_path') {
      const rows = Math.min(6, Math.max(1, gridRowInput));
      const cols = Math.min(6, Math.max(1, gridColInput));
      
      const newGrid: number[][] = [];
      for (let i = 0; i < rows; i++) {
        const row: number[] = [];
        for (let j = 0; j < cols; j++) {
          const val = (gridCostInput[i] && gridCostInput[i][j] !== undefined) ? gridCostInput[i][j] : 1;
          row.push(val);
        }
        newGrid.push(row);
      }
      setShortestPathParams({ grid: newGrid });
    } else if (problemType === 'equipment') {
      const years = Math.min(8, Math.max(1, equipYearsInput));
      const p = Math.max(0, equipPurchaseInput);
      const ops = equipOpInput.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      const resales = equipResaleInput.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      
      const finalOps: number[] = [];
      const finalResales: number[] = [];
      for (let i = 0; i <= years; i++) {
        finalOps.push(ops[i] !== undefined ? ops[i] : (ops[ops.length - 1] || 1) + (i - ops.length + 1) * 2);
        finalResales.push(resales[i] !== undefined ? resales[i] : Math.max(0, (resales[resales.length - 1] || 0) - (i - resales.length + 1) * 2));
      }
      
      setEquipmentParams({
        years,
        purchaseCost: p,
        operatingCosts: finalOps,
        resaleValues: finalResales
      });
    } else if (problemType === 'production_inventory') {
      const p = Math.min(6, Math.max(1, prodPeriodsInput));
      const demands = prodDemandsInput.split(',').map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x));
      const finalDemands: number[] = [];
      for (let i = 0; i < p; i++) {
        finalDemands.push(demands[i] !== undefined ? demands[i] : 2);
      }
      setProductionInventoryParams({
        periods: p,
        demands: finalDemands,
        setupCost: Math.max(0, prodSetupInput),
        unitCost: Math.max(0, prodUnitInput),
        holdingCost: Math.max(0, prodHoldingInput),
        maxInventory: Math.max(1, prodMaxInvInput)
      });
    } else if (problemType === 'markov_portfolio') {
      const proj = Math.min(5, Math.max(1, portProjectsInput));
      const bud = Math.min(10, Math.max(1, portBudgetInput));
      const rowsInput = portReturnsInput.split('\n').map(l => l.trim()).filter(Boolean);
      const parsedReturns: number[][] = [];
      for (let i = 0; i < proj; i++) {
        const row = (rowsInput[i] || '').split(',').map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x));
        const finalRow: number[] = [];
        for (let j = 0; j <= bud; j++) {
          finalRow.push(row[j] !== undefined ? row[j] : j * 2);
        }
        parsedReturns.push(finalRow);
      }
      setMarkovPortfolioParams({
        projects: proj,
        budget: bud,
        returns: parsedReturns
      });
    } else if (problemType === 'resource_allocation') {
      const proj = Math.min(5, Math.max(1, resProjectsInput));
      const resVal = Math.min(6, Math.max(1, resTotalResourceInput));
      const rowsInput = resReturnsInput.split('\n').map(l => l.trim()).filter(Boolean);
      const parsedReturns: number[][] = [];
      for (let i = 0; i < proj; i++) {
        const row = (rowsInput[i] || '').split(',').map(x => parseInt(x.trim(), 10)).filter(x => !isNaN(x));
        const finalRow: number[] = [];
        for (let j = 0; j <= resVal; j++) {
          finalRow.push(row[j] !== undefined ? row[j] : j * 2);
        }
        parsedReturns.push(finalRow);
      }
      setResourceAllocationParams({
        projects: proj,
        totalResource: resVal,
        returns: parsedReturns
      });
    }
  };

  // ----------------------------------------------------
  // Trigger AI Smart Analysis API (Browser-side direct calls for GitHub compatibility)
  // ----------------------------------------------------
  const requestAiInsight = async () => {
    if (!llmApiKey) {
      setShowLlmSettings(true);
      setAiInsight('💡 **提示：所有大模型功能调用必须在输入 API-Key 后才能启动。**\n\n已为您自动打开右上角的大模型设置面板，请在其中填入 API Key 即可开启智能洞察与即时对话功能！');
      setActiveTab('ai');
      return;
    }

    setIsAiLoading(true);
    setAiProgressText('评估问题状态空间...');
    setActiveTab('ai');
    
    // Simulate interactive educational step-wise loader
    const stages = [
      { text: '评估状态空间规模...', delay: 400 },
      { text: '校对输入边界及极值用例...', delay: 800 },
      { text: '推演前驱决策树并评估剪枝可行性...', delay: 700 },
      { text: '撰写空间压缩优化路径分析...', delay: 600 }
    ];

    let stageIdx = 0;
    const progressTimer = setInterval(() => {
      if (stageIdx < stages.length) {
        setAiProgressText(stages[stageIdx].text);
        stageIdx++;
      }
    }, 600);

    const activeParams = 
      problemType === 'knapsack' ? knapsackParams :
      problemType === 'shortest_path' ? shortestPathParams :
      problemType === 'equipment' ? equipmentParams :
      problemType === 'production_inventory' ? productionInventoryParams :
      problemType === 'markov_portfolio' ? markovPortfolioParams :
      resourceAllocationParams;

    const systemPrompt = `你是一个算法教学导师，正在指导学生学习动态规划。
针对当前用户输入的动态规划问题，请提供结构化、深度的 智能决策分析报告。

当前问题类型: ${problemType}
问题参数: ${JSON.stringify(activeParams)}
最终 DP 状态表格最后一列值/或代表值: ${JSON.stringify(finalTable ? finalTable[finalTable.length - 1] : "未计算")}
回溯最优路径选择: ${JSON.stringify(backtrackPath || "未计算")}

请根据以上输入，生成包含以下部分的 markdown 报告（使用简体中文）：
1. **状态空间与剪枝分析**：分析当前状态空间规模。分析本问题是否存在可剪枝或提早退出的分支？如何降低实际运行时的常数复杂度？
2. **边界与特殊警告**：检查当前输入是否存在死锁、越界、或特定失效风险。如果存在，请指出并提供一种可能导致边界异常的极端边界测试用例及其预防机制。
3. **状态依赖树与优化路径**：分析该状态转移是自底向上（迭代填表）还是自顶向下（记忆化搜索）的最优。分析此问题如何进行空间压缩？写出空间压缩后的伪代码。`;

    const fullPrompt = `${systemPrompt}\n\n请帮我生成当前决策输入参数下的智能分析报告。`;

    try {
      let responseText = '';
      if (llmModel === 'gemini-1.5-flash') {
        const baseUrl = llmCustomEndpoint.replace(/\/+$/, '') || 'https://generativelanguage.googleapis.com';
        const url = `${baseUrl}/v1beta/models/gemini-1.5-flash:generateContent?key=${llmApiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
          })
        });
        const data = await res.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          responseText = data.candidates[0].content.parts[0].text;
        } else if (data?.error?.message) {
          throw new Error(data.error.message);
        } else {
          throw new Error('未返回有效数据，请检查 API Key 或网络连通性。');
        }
      } else {
        // DeepSeek-V4-Pro
        const baseUrl = llmCustomEndpoint.replace(/\/+$/, '') || 'https://api.deepseek.com';
        const url = `${baseUrl}/v1/chat/completions`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llmApiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-v4-pro',
            messages: [{ role: 'user', content: fullPrompt }]
          })
        });
        const data = await res.json();
        if (data?.choices?.[0]?.message?.content) {
          const reasoning = data.choices[0].message.reasoning_content || '';
          responseText = reasoning 
            ? `> **思维链 (Reasoning Chain):**\n> ${reasoning.split('\n').join('\n> ')}\n\n${data.choices[0].message.content}`
            : data.choices[0].message.content;
        } else if (data?.error?.message) {
          throw new Error(data.error.message);
        } else {
          throw new Error('未返回有效数据，请确认 API Key 并检查 DeepSeek 官方服务状态。');
        }
      }

      clearInterval(progressTimer);
      setAiInsight(responseText);
    } catch (err: any) {
      clearInterval(progressTimer);
      console.error('LLM API error:', err);
      const fallbackReport = getHeuristicReport(problemType, activeParams, finalTable, backtrackPath);
      setAiInsight(`⚠️ **API 呼叫失败**: ${err.message || '网络连接异常'}\n\n已为您自动切换至**本地智能离线评估模块**生成的深度解析报告：\n\n---\n\n${fallbackReport}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ----------------------------------------------------
  // Trigger AI Interactive Q&A (Direct independent LLM calls)
  // ----------------------------------------------------
  const requestAiAnswer = async (question: string) => {
    if (!llmApiKey) {
      setShowLlmSettings(true);
      setAiAnswer('💡 **提示：所有大模型功能调用必须在输入 API-Key 后才能启动。**\n\n已为您自动打开右上角的大模型设置面板，请在其中填入 API Key 即可开启即时提问解答功能！');
      setActiveTab('ai');
      return;
    }

    setIsAnswerLoading(true);
    setAnswerProgressText('大模型正在分析您的提问并推演最优状态转移...');
    setActiveTab('ai');

    const activeParams = 
      problemType === 'knapsack' ? knapsackParams :
      problemType === 'shortest_path' ? shortestPathParams :
      problemType === 'equipment' ? equipmentParams :
      problemType === 'production_inventory' ? productionInventoryParams :
      problemType === 'markov_portfolio' ? markovPortfolioParams :
      resourceAllocationParams;

    const systemPrompt = `你是一个高级算法教学导师，正在指导学生学习动态规划。
针对当前用户输入的动态规划问题，请结合当前问题配置与状态表格给出针对性的、通俗易懂的专业解答。

当前问题类型: ${problemType}
问题参数: ${JSON.stringify(activeParams)}
最终 DP 状态表格最后一列值/或代表值: ${JSON.stringify(finalTable ? finalTable[finalTable.length - 1] : "未计算")}
回溯最优路径选择: ${JSON.stringify(backtrackPath || "未计算")}`;

    const fullPrompt = `${systemPrompt}\n\n【学生问题】: ${question}\n\n请针对以上具体问题与当前的算法上下文，给出通俗易懂的深度分析和解答（使用简体中文，支持 Markdown 与 LaTeX 公式）：`;

    try {
      let responseText = '';
      if (llmModel === 'gemini-1.5-flash') {
        const baseUrl = llmCustomEndpoint.replace(/\/+$/, '') || 'https://generativelanguage.googleapis.com';
        const url = `${baseUrl}/v1beta/models/gemini-1.5-flash:generateContent?key=${llmApiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }]
          })
        });
        const data = await res.json();
        if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
          responseText = data.candidates[0].content.parts[0].text;
        } else if (data?.error?.message) {
          throw new Error(data.error.message);
        } else {
          throw new Error('未返回有效数据，请检查 API Key 或网络连通性。');
        }
      } else {
        // DeepSeek-V4-Pro
        const baseUrl = llmCustomEndpoint.replace(/\/+$/, '') || 'https://api.deepseek.com';
        const url = `${baseUrl}/v1/chat/completions`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${llmApiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-v4-pro',
            messages: [{ role: 'user', content: fullPrompt }]
          })
        });
        const data = await res.json();
        if (data?.choices?.[0]?.message?.content) {
          const reasoning = data.choices[0].message.reasoning_content || '';
          responseText = reasoning 
            ? `> **思维链 (Reasoning Chain):**\n> ${reasoning.split('\n').join('\n> ')}\n\n${data.choices[0].message.content}`
            : data.choices[0].message.content;
        } else if (data?.error?.message) {
          throw new Error(data.error.message);
        } else {
          throw new Error('未返回有效数据，请确认 API Key 并检查 DeepSeek 官方服务状态。');
        }
      }

      setAiAnswer(responseText);
    } catch (err: any) {
      console.error('LLM Q&A API error:', err);
      setAiAnswer(`⚠️ **API 提问失败**: ${err.message || '网络连接异常'}\n\n大模型导师在线服务遇到异常，请检查 API Key 配置或网络通道。`);
    } finally {
      setIsAnswerLoading(false);
    }
  };

  // ----------------------------------------------------
  // Generate & Download Experimental Report (Markdown)
  // ----------------------------------------------------
  // ----------------------------------------------------
  // Python Code Verification & Dynamic Execution
  // ----------------------------------------------------
  const getPythonCodeForCurrentParams = () => {
    if (problemType === 'knapsack') {
      return `def solve_knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, capacity + 1):
            if weights[i-1] <= j:
                dp[i][j] = max(dp[i-1][j], dp[i-1][j-weights[i-1]] + values[i-1])
            else:
                dp[i][j] = dp[i-1][j]
                
    print("DP 矩阵 (DP Table):")
    for r in dp:
        print(r)
        
    return dp[n][capacity]

# 当前运筹学输入参数
weights = [${knapsackParams.weights.join(', ')}]
values = [${knapsackParams.values.join(', ')}]
capacity = ${knapsackParams.capacity}

# 执行计算并赋予 ans 变量
ans = solve_knapsack(weights, values, capacity)
print(f"\\n最佳决策最大总收益: {ans}")
`;
    } else if (problemType === 'shortest_path') {
      return `def solve_shortest_path(grid):
    n, m = len(grid), len(grid[0])
    dp = [[0] * m for _ in range(n)]
    dp[0][0] = grid[0][0]
    for j in range(1, m):
        dp[0][j] = dp[0][j-1] + grid[0][j]
    for i in range(1, n):
        dp[i][0] = dp[i-1][0] + grid[i][0]
        for j in range(1, m):
            dp[i][j] = grid[i][j] + min(dp[i-1][j], dp[i][j-1])
            
    print("DP 矩阵 (DP Table):")
    for r in dp:
        print(r)
        
    return dp[n-1][m-1]

# 当前运筹学输入参数
grid = ${JSON.stringify(shortestPathParams.grid)}

# 执行计算并赋予 ans 变量
ans = solve_shortest_path(grid)
print(f"\\n最佳决策最小累计开销: {ans}")
`;
    } else if (problemType === 'equipment') {
      return `def solve_equipment(years, P, op, resale):
    # dp[t][x] represents minimum net cost at year t for age x (1-based index)
    # x ranges from 1 to 4 (index 0 to 3)
    dp = [[float('inf')] * 4 for _ in range(years + 1)]
    dp[0][0] = 0
    
    for t in range(1, years + 1):
        # First Keep options: dp[t][x] = dp[t-1][x-1] + op[x-1] for age x > 1 (index 1 to 3)
        for x in range(1, 4):
            dp[t][x] = dp[t-1][x-1] + op[x-1]
            
        # Replace options: dp[t][0] (age 1)
        min_replace = float('inf')
        for prev_x in range(4):
            if dp[t-1][prev_x] != float('inf'):
                opt_cost = dp[t-1][prev_x] + P - resale[prev_x] + op[0]
                if opt_cost < min_replace:
                    min_replace = opt_cost
        dp[t][0] = min_replace
        
    print("DP 矩阵 (DP Table - 每一行为第 t 年，每一列为年龄 1-4 岁):")
    for r in dp:
        # replace inf with None for printing
        print([None if x == float('inf') else x for x in r])
        
    # Find min in last row
    return min(dp[years])

# 当前运筹学输入参数
years = ${equipmentParams.years}
P = ${equipmentParams.purchaseCost}
operating_costs = ${JSON.stringify(equipmentParams.operatingCosts)}
resale_values = ${JSON.stringify(equipmentParams.resaleValues)}

# 执行计算并赋予 ans 变量
ans = solve_equipment(years, P, operating_costs, resale_values)
print(f"\\n最佳决策最小运营净成本: {ans}")
`;
    } else if (problemType === 'production_inventory') {
      return `def solve_production_inventory(periods, demands, setup_cost, unit_cost, holding_cost, max_inventory):
    dp = [[float('inf')] * (max_inventory + 1) for _ in range(periods + 1)]
    dp[0][0] = 0
    
    for t in range(1, periods + 1):
        demand = demands[t-1]
        for s in range(max_inventory + 1):
            for prev_s in range(max_inventory + 1):
                if dp[t-1][prev_s] != float('inf'):
                    x = s + demand - prev_s
                    if x >= 0:
                        prod_cost = (setup_cost + unit_cost * x) if x > 0 else 0
                        hold_cost = holding_cost * s
                        cost = dp[t-1][prev_s] + prod_cost + hold_cost
                        if cost < dp[t][s]:
                            dp[t][s] = cost
                            
    print("DP 矩阵 (DP Table - 每一行为第 t 期，每一列为库存状态 0 到 max_inventory):")
    for r in dp:
        print([None if x == float('inf') else x for x in r])
        
    return dp[periods][0]

# 当前运筹学输入参数
periods = ${productionInventoryParams.periods}
demands = [${productionInventoryParams.demands.join(', ')}]
setup_cost = ${productionInventoryParams.setupCost}
unit_cost = ${productionInventoryParams.unitCost}
holding_cost = ${productionInventoryParams.holdingCost}
max_inventory = ${productionInventoryParams.maxInventory}

# 执行计算并赋予 ans 变量
ans = solve_production_inventory(periods, demands, setup_cost, unit_cost, holding_cost, max_inventory)
print(f"\\n最佳决策最小累计成本: {ans}")
`;
    } else if (problemType === 'markov_portfolio') {
      return `def solve_markov_portfolio(projects, budget, returns):
    dp = [[0] * (budget + 1) for _ in range(projects + 1)]
    
    for i in range(1, projects + 1):
        for j in range(budget + 1):
            max_val = 0
            for k in range(j + 1):
                ret = returns[i-1][k] if k < len(returns[i-1]) else returns[i-1][-1]
                val = dp[i-1][j-k] + ret
                if val > max_val:
                    max_val = val
            dp[i][j] = max_val
            
    print("DP 矩阵 (DP Table - 每一行为项目 0 到 N, 每一列为累计预算):")
    for r in dp:
        print(r)
        
    return dp[projects][budget]

# 当前运筹学输入参数
projects = ${markovPortfolioParams.projects}
budget = ${markovPortfolioParams.budget}
returns = ${JSON.stringify(markovPortfolioParams.returns)}

# 执行计算并赋予 ans 变量
ans = solve_markov_portfolio(projects, budget, returns)
print(f"\\n最佳决策最大总期望回报: {ans}")
`;
    } else {
      return `def solve_resource_allocation(projects, budget, returns):
    dp = [[0] * (budget + 1) for _ in range(projects + 1)]
    
    for i in range(1, projects + 1):
        for j in range(budget + 1):
            max_val = 0
            for k in range(j + 1):
                ret = returns[i-1][k] if k < len(returns[i-1]) else returns[i-1][-1]
                val = dp[i-1][j-k] + ret
                if val > max_val:
                    max_val = val
            dp[i][j] = max_val
            
    print("DP 矩阵 (DP Table - 每一行为项目 0 到 N, 每一列为累计已分配资源):")
    for r in dp:
        print(r)
        
    return dp[projects][budget]

# 当前运筹学输入参数
projects = ${resourceAllocationParams.projects}
budget = ${resourceAllocationParams.totalResource}
returns = ${JSON.stringify(resourceAllocationParams.returns)}

# 执行计算并赋予 ans 变量
ans = solve_resource_allocation(projects, budget, returns)
print(f"\\n最佳决策最大总期望收益: {ans}")
`;
    }
  };

  const runPythonCode = async (code: string) => {
    setIsPyRunning(true);
    setPythonOutput('⏳ 正在启动 WebAssembly Python 运行环境 (首次加载约需数秒)...');
    try {
      // 1. Ensure pyodide is loaded
      if (!(window as any).loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('无法从 CDN 加载 Pyodide。请检查网络连接。'));
          document.head.appendChild(script);
        });
      }

      // 2. Initialize pyodide if not already initialized
      if (!(window as any).pyodideInstance) {
        setPythonOutput('⏳ 正在初始化 WebAssembly 运行沙箱...');
        (window as any).pyodideInstance = await (window as any).loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/'
        });
      }

      const pyodide = (window as any).pyodideInstance;

      // 3. Setup standard output capture
      let stdoutBuffer = '';
      pyodide.setStdout({
        batched: (text: string) => {
          stdoutBuffer += text + '\n';
        }
      });

      setPythonOutput('🏃 正在执行 Python 计算...');
      
      // 4. Run the code
      await pyodide.runPythonAsync(code);

      // 5. Read outputs and return values
      let outputMsg = stdoutBuffer;
      
      // Also try to read 'ans' variable if it was defined
      try {
        const ansVal = pyodide.globals.get('ans');
        if (ansVal !== undefined) {
          outputMsg += `\n[提取返回值 ans]: ${ansVal}`;
        }
      } catch (e) {
        // ignore
      }

      if (!outputMsg.trim()) {
        outputMsg = '运行成功 (无任何标准输出或返回值)';
      }

      setPythonOutput(outputMsg);
    } catch (err: any) {
      setPythonOutput(`❌ 运行出错:\n${err.message || err}`);
    } finally {
      setIsPyRunning(false);
    }
  };

  const generateReportMarkdown = () => {
    const getVisualLength = (str: string): number => {
      let len = 0;
      for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 127) {
          len += 2;
        } else {
          len += 1;
        }
      }
      return len;
    };

    const padString = (str: string, targetLength: number, alignLeft = true): string => {
      const visualLen = getVisualLength(str);
      const diff = targetLength - visualLen;
      if (diff <= 0) return str;
      const padding = ' '.repeat(diff);
      return alignLeft ? str + padding : padding + str;
    };

    const generateASCIITable = (rowLabels: string[], colLabels: string[], data: any[][]) => {
      const numRows = data.length;
      const numCols = colLabels.length;
      const firstColHeader = "i \\ j";
      const colWidths: number[] = [];
      
      let maxFirstColWidth = firstColHeader.length;
      rowLabels.forEach(label => {
        maxFirstColWidth = Math.max(maxFirstColWidth, getVisualLength(label));
      });
      colWidths.push(maxFirstColWidth);

      for (let j = 0; j < numCols; j++) {
        let maxColWidth = getVisualLength(colLabels[j]);
        for (let i = 0; i < numRows; i++) {
          const cellVal = data[i]?.[j] === 999999 || data[i]?.[j] === Infinity || data[i]?.[j] === undefined ? '∞' : String(data[i][j]);
          maxColWidth = Math.max(maxColWidth, getVisualLength(cellVal));
        }
        colWidths.push(maxColWidth);
      }

      let borderLine = '+';
      colWidths.forEach(w => {
        borderLine += '-'.repeat(w + 2) + '+';
      });

      let ascii = '';
      ascii += borderLine + '\n';
      
      let headerRow = '| ' + padString(firstColHeader, colWidths[0], true) + ' |';
      for (let j = 0; j < numCols; j++) {
        headerRow += ' ' + padString(colLabels[j], colWidths[j + 1], false) + ' |';
      }
      ascii += headerRow + '\n';
      ascii += borderLine + '\n';

      for (let i = 0; i < numRows; i++) {
        let dataRow = '| ' + padString(rowLabels[i], colWidths[0], true) + ' |';
        for (let j = 0; j < numCols; j++) {
          const cellVal = data[i]?.[j] === 999999 || data[i]?.[j] === Infinity || data[i]?.[j] === undefined ? '∞' : String(data[i][j]);
          dataRow += ' ' + padString(cellVal, colWidths[j + 1], false) + ' |';
        }
        ascii += dataRow + '\n';
      }
      
      ascii += borderLine + '\n';
      return ascii;
    };

    const relevantPath = backtrackPath;

    let md = `# 动态规划算法实验分析报告 (Dynamic Programming Analysis Report)\n\n`;
    md += `* **生成时间**: ${new Date().toLocaleString()}\n`;
    md += `* **实验案例**: ${getProblemTitle()}\n`;
    md += `* **运行模式**: 浏览器 WebAssembly 虚拟机沙箱验证\n\n`;

    md += `## 1. 实验参数与输入设置 (Experimental Parameters)\n\n`;
    if (problemType === 'knapsack') {
      md += `* **背包最大容量 (Capacity)**: ${knapsackParams.capacity}\n\n`;
      md += `### 1.1 物品属性明细表\n\n`;
      md += `| 物品编号 | 重量 (Weight) | 价值 (Value) | 价值密度 (Value Density) |\n`;
      md += `| --- | --- | --- | --- |\n`;
      knapsackParams.weights.forEach((w, i) => {
        const v = knapsackParams.values[i];
        const d = w > 0 ? (v / w).toFixed(2) : '∞';
        md += `| 物品 ${i + 1} | ${w} | ${v} | ${d} |\n`;
      });
    } else if (problemType === 'shortest_path') {
      md += `### 1.1 网络拓扑网格权重表\n\n`;
      let tableHeader = '| 起点 \\ 终点 | ';
      shortestPathParams.grid[0].forEach((_, j) => {
        tableHeader += `列 ${j} | `;
      });
      md += tableHeader + '\n| --- | ' + shortestPathParams.grid[0].map(() => '---').join(' | ') + ' |\n';
      shortestPathParams.grid.forEach((row, i) => {
        md += `| **行 ${i}** | ${row.join(' | ')} |\n`;
      });
    } else if (problemType === 'equipment') {
      md += `* **置换役龄限制 (Years)**: ${equipmentParams.years} 年\n`;
      md += `* **新机购置售价 (Purchase Cost)**: ${equipmentParams.purchaseCost}\n\n`;
      md += `### 1.1 设备运行维护与残值回收对照表\n\n`;
      md += `| 役龄 (年龄) | 运行维护成本 (Operating Cost) | 折旧转售残值回收 (Resale Value) |\n`;
      md += `| --- | --- | --- |\n`;
      const maxAge = Math.max(equipmentParams.operatingCosts.length, equipmentParams.resaleValues.length);
      for (let i = 0; i < maxAge; i++) {
        const op = equipmentParams.operatingCosts[i] !== undefined ? equipmentParams.operatingCosts[i] : '-';
        const re = equipmentParams.resaleValues[i] !== undefined ? equipmentParams.resaleValues[i] : '-';
        md += `| ${i + 1} 岁 | ${op} | ${re} |\n`;
      }
    } else if (problemType === 'production_inventory') {
      md += `* **生产计划期数 (Periods)**: ${productionInventoryParams.periods} 期\n`;
      md += `* **最大存储限制 (Max Inventory)**: ${productionInventoryParams.maxInventory}\n`;
      md += `* **单期固定生产成本 (Setup Cost)**: ${productionInventoryParams.setupCost}\n`;
      md += `* **单期边际生产成本 (Incremental Cost)**: ${productionInventoryParams.unitCost}\n`;
      md += `* **单件期末维持存储费用 (Holding Cost)**: ${productionInventoryParams.holdingCost}\n\n`;
      md += `### 1.1 各期预测需求量明细表\n\n`;
      md += `| 计划期数 | ` + productionInventoryParams.demands.map((_, i) => `第 ${i + 1} 期`).join(' | ') + ` |\n`;
      md += `| --- | ` + productionInventoryParams.demands.map(() => '---').join(' | ') + ` |\n`;
      md += `| **预测需求量** | ` + productionInventoryParams.demands.join(' | ') + ` |\n`;
    } else if (problemType === 'markov_portfolio') {
      md += `* **资产组合总预算 (Budget)**: ${markovPortfolioParams.budget} 元\n\n`;
      md += `### 1.1 各资产配资期望收益表 (Returns Matrix)\n\n`;
      let tableHeader = '| 投资项目 \\ 分配资金 | ';
      for (let j = 0; j <= markovPortfolioParams.budget; j++) {
        tableHeader += `${j} 元 | `;
      }
      md += tableHeader + '\n| --- | ' + Array.from({ length: markovPortfolioParams.budget + 1 }).map(() => '---').join(' | ') + ' |\n';
      markovPortfolioParams.returns.forEach((row, i) => {
        md += `| **项目 ${i + 1}** | ${row.join(' | ')} |\n`;
      });
    } else {
      md += `* **总分配资源限制 (Total Resource)**: ${resourceAllocationParams.totalResource} 单位\n\n`;
      md += `### 1.1 各子项目资源边际收益分配表 (Returns Matrix)\n\n`;
      let tableHeader = '| 子项目 \\ 分配资源 | ';
      for (let j = 0; j <= resourceAllocationParams.totalResource; j++) {
        tableHeader += `${j} 单位 | `;
      }
      md += tableHeader + '\n| --- | ' + Array.from({ length: resourceAllocationParams.totalResource + 1 }).map(() => '---').join(' | ') + ' |\n';
      resourceAllocationParams.returns.forEach((row, i) => {
        md += `| **项目 ${i + 1}** | ${row.join(' | ')} |\n`;
      });
    }
    md += `\n`;

    md += `## 2. 最终动态规划决策矩阵 (DP Table)\n\n`;
    
    // Generate standard markdown table
    let tableHeader = '| i \\ j | ';
    if (problemType === 'knapsack') {
      for (let j = 0; j <= knapsackParams.capacity; j++) tableHeader += `${j} | `;
      md += tableHeader + '\n| --- | ' + new Array(knapsackParams.capacity + 2).join('--- | ') + '\n';
      finalTable.forEach((row, i) => {
        let label = i === 0 ? '0 (空)' : `物${i}(w:${knapsackParams.weights[i-1]}, v:${knapsackParams.values[i-1]})`;
        let rowStr = `| **${label}** | `;
        row.forEach((val) => { rowStr += `${val} | `; });
        md += rowStr + '\n';
      });
    } else if (problemType === 'shortest_path') {
      const numCols = shortestPathParams.grid[0].length;
      for (let j = 0; j < numCols; j++) tableHeader += `列 ${j} | `;
      md += tableHeader + '\n| --- | ' + new Array(numCols + 2).join('--- | ') + '\n';
      finalTable.forEach((row, i) => {
        let rowStr = `| **行 ${i}** | `;
        row.forEach((val) => { rowStr += `${val} | `; });
        md += rowStr + '\n';
      });
    } else if (problemType === 'equipment') {
      tableHeader += '1 岁 | 2 岁 | 3 岁 | 4 岁 | ';
      md += tableHeader + '\n| --- | --- | --- | --- | --- |\n';
      finalTable.forEach((row, t) => {
        let rowStr = `| **第 ${t} 年** | `;
        row.forEach((val) => {
          rowStr += `${val === 999999 || val === Infinity ? '∞' : val} | `;
        });
        md += rowStr + '\n';
      });
    } else if (problemType === 'production_inventory') {
      for (let j = 0; j <= productionInventoryParams.maxInventory; j++) tableHeader += `库存 ${j} | `;
      md += tableHeader + '\n| --- | ' + new Array(productionInventoryParams.maxInventory + 2).join('--- | ') + '\n';
      finalTable.forEach((row, t) => {
        let rowStr = `| **第 ${t} 期** | `;
        row.forEach((val) => {
          rowStr += `${val === 999999 || val === Infinity ? '∞' : val} | `;
        });
        md += rowStr + '\n';
      });
    } else if (problemType === 'markov_portfolio') {
      for (let j = 0; j <= markovPortfolioParams.budget; j++) tableHeader += `预算 ${j} | `;
      md += tableHeader + '\n| --- | ' + new Array(markovPortfolioParams.budget + 2).join('--- | ') + '\n';
      finalTable.forEach((row, i) => {
        let label = i === 0 ? '0 (空)' : `项目 ${i}`;
        let rowStr = `| **${label}** | `;
        row.forEach((val) => { rowStr += `${val} | `; });
        md += rowStr + '\n';
      });
    } else {
      for (let j = 0; j <= resourceAllocationParams.totalResource; j++) tableHeader += `资源 ${j} | `;
      md += tableHeader + '\n| --- | ' + new Array(resourceAllocationParams.totalResource + 2).join('--- | ') + '\n';
      finalTable.forEach((row, i) => {
        let label = i === 0 ? '0 (空)' : `项目 ${i}`;
        let rowStr = `| **${label}** | `;
        row.forEach((val) => { rowStr += `${val} | `; });
        md += rowStr + '\n';
      });
    }
    md += `\n`;

    // Add ASCII representation for offline reading
    md += `### 2.2 离线纯文本 ASCII 决策矩阵（无渲染器环境下的对齐速查视图）\n\n`;

    let rLabels: string[] = [];
    let cLabels: string[] = [];
    if (problemType === 'knapsack') {
      rLabels = finalTable.map((_, i) => i === 0 ? '0 (空)' : `物${i}(w:${knapsackParams.weights[i-1]}, v:${knapsackParams.values[i-1]})`);
      cLabels = Array.from({ length: knapsackParams.capacity + 1 }, (_, j) => `${j}`);
    } else if (problemType === 'shortest_path') {
      rLabels = finalTable.map((_, i) => `行 ${i}`);
      cLabels = Array.from({ length: shortestPathParams.grid[0].length }, (_, j) => `列 ${j}`);
    } else if (problemType === 'equipment') {
      rLabels = finalTable.map((_, t) => `第 ${t} 年`);
      cLabels = ["1 岁", "2 岁", "3 岁", "4 岁"];
    } else if (problemType === 'production_inventory') {
      rLabels = finalTable.map((_, t) => `第 ${t} 期`);
      cLabels = Array.from({ length: productionInventoryParams.maxInventory + 1 }, (_, j) => `库存 ${j}`);
    } else if (problemType === 'markov_portfolio') {
      rLabels = finalTable.map((_, i) => i === 0 ? '0 (空)' : `项目 ${i}`);
      cLabels = Array.from({ length: markovPortfolioParams.budget + 1 }, (_, j) => `预算 ${j}`);
    } else {
      rLabels = finalTable.map((_, i) => i === 0 ? '0 (空)' : `项目 ${i}`);
      cLabels = Array.from({ length: resourceAllocationParams.totalResource + 1 }, (_, j) => `资源 ${j}`);
    }

    md += `\`\`\`text\n`;
    md += generateASCIITable(rLabels, cLabels, finalTable);
    md += `\`\`\`\n\n`;

    md += `## 3. 演进回溯决策链 (Backtracking Path)\n`;
    md += `通过自底向上填表完成后的最优状态，反向回溯至状态起点，解出的最优决策组合如下：\n\n`;
    
    if (problemType === 'knapsack') {
      const finalVal = finalTable[knapsackParams.weights.length] ? finalTable[knapsackParams.weights.length][knapsackParams.capacity] : 0;
      md += `* **最大期望累计价值**: ${finalVal}\n`;
      md += `* **决策链条演进描述**:\n`;
      relevantPath.forEach((node, idx) => {
        const itemIdx = node.row;
        if (node.action === 'pick') {
          md += `  ${idx + 1}. **选取** 物品 ${itemIdx} (重量: ${knapsackParams.weights[itemIdx - 1]}, 价值: ${knapsackParams.values[itemIdx - 1]}) -> 剩余背包容积由已填表状态转移推导而来。\n`;
        } else {
          md += `  ${idx + 1}. **跳过** 物品 ${itemIdx} -> 直接继承上一阶段在当前容量下的最优解。\n`;
        }
      });
    } else if (problemType === 'shortest_path') {
      const endRow = shortestPathParams.grid.length - 1;
      const endCol = shortestPathParams.grid[0].length - 1;
      const finalVal = finalTable[endRow] ? finalTable[endRow][endCol] : 0;
      md += `* **最小过境路径成本**: ${finalVal}\n`;
      md += `* **回溯路径路径点**:\n`;
      relevantPath.forEach((node, idx) => {
        md += `  ${idx + 1}. **到达网格 (${node.row}, ${node.col})**: 带来累计成本 ${finalTable[node.row][node.col]} (自身权重: ${shortestPathParams.grid[node.row][node.col]})，其来源是${node.action === 'up' ? '上方网格' : '左方网格'}。\n`;
      });
    } else if (problemType === 'equipment') {
      const finalVal = Math.min(...(finalTable[equipmentParams.years] || [0]));
      md += `* **最小置换运营成本**: ${finalVal}\n`;
      md += `* **回溯决策链详情**:\n`;
      relevantPath.forEach((node, idx) => {
        md += `  ${idx + 1}. **第 ${node.row} 年 (年龄: ${node.col + 1} 岁)**: 采取决策 **${node.action === 'keep' ? '保持 (Keep)' : '替换 (Replace)'}**，该阶段净成本累计为 ${finalTable[node.row][node.col]}。\n`;
      });
    } else if (problemType === 'production_inventory') {
      const finalVal = finalTable[productionInventoryParams.periods] ? finalTable[productionInventoryParams.periods][0] : 0;
      md += `* **最低生产与维护累计成本**: ${finalVal}\n`;
      md += `* **回溯决策链详情**:\n`;
      relevantPath.forEach((node, idx) => {
        md += `  ${idx + 1}. **第 ${node.row} 阶段 (期初库存: ${node.col})**: 采取生产或库存维持决策，该阶段最低累计成本为 ${finalTable[node.row][node.col]}。\n`;
      });
    } else if (problemType === 'markov_portfolio') {
      const finalVal = finalTable[markovPortfolioParams.returns.length] ? finalTable[markovPortfolioParams.returns.length][markovPortfolioParams.budget] : 0;
      md += `* **最大期望累计回报**: ${finalVal}\n`;
      md += `* **回溯决策链详情**:\n`;
      relevantPath.forEach((node, idx) => {
        md += `  ${idx + 1}. **对项目 ${node.row} 分配资金**: 最终累计收益达到 ${finalTable[node.row][node.col]}。\n`;
      });
    } else {
      const finalVal = finalTable[resourceAllocationParams.returns.length] ? finalTable[resourceAllocationParams.returns.length][resourceAllocationParams.totalResource] : 0;
      md += `* **最大期望累计收益**: ${finalVal}\n`;
      md += `* **回溯决策链详情**:\n`;
      relevantPath.forEach((node, idx) => {
        md += `  ${idx + 1}. **对项目 ${node.row} 分配资源**: 最终累计已分配收益达到 ${finalTable[node.row][node.col]}。\n`;
      });
    }
    md += `\n`;

    md += `## 4. 算法复杂度量化评测 (Complexity Profile)\n\n`;
    let rows = 0, cols = 0;
    if (problemType === 'knapsack') {
      rows = knapsackParams.weights.length;
      cols = knapsackParams.capacity;
    } else if (problemType === 'shortest_path') {
      rows = shortestPathParams.grid.length;
      cols = shortestPathParams.grid[0].length;
    } else if (problemType === 'equipment') {
      rows = equipmentParams.years;
      cols = 4;
    } else if (problemType === 'production_inventory') {
      rows = productionInventoryParams.periods;
      cols = productionInventoryParams.maxInventory;
    } else if (problemType === 'markov_portfolio') {
      rows = markovPortfolioParams.returns.length;
      cols = markovPortfolioParams.budget;
    } else {
      rows = resourceAllocationParams.returns.length;
      cols = resourceAllocationParams.totalResource;
    }
    md += `* **状态总量**: $(N+1) \\times (M+1) = ${rows + 1} \\times ${cols + 1} = ${(rows+1)*(cols+1)}$ 个元单元格。\n`;
    md += `* **理论时间复杂度**: $O(N \\times M)$ — 每一个状态的填充耗费 $O(1)$ 常数时间。\n`;
    md += `* **空间复杂度 (二维)**: $O(N \\times M)$ — 需要维护完整的决策转移二维矩阵。\n`;
    md += `* **空间压缩可能性**: 理论上可压缩为 $O(\\min(N, M))$ 的一维数组。通过正逆序或滑动暂存变量 \`prev\` 记录相邻状态即可，本系统的“空间压缩”选项已对此优化提供了完美的离线动效模拟。\n\n`;
    
    md += `## 5. 算法可视化与配色设计规范 (Visual Theme & Color Specification)\n\n`;
    md += `本分析系统的可视化交互界面针对不同的运筹决策模型，量身设计了专属的高对比度色彩体系，以便于在教学演示与科研分析中进行科学、直观的语义区分。当前实验案例的视觉规范如下：\n\n`;
    if (problemType === 'knapsack') {
      md += `* **适用实验案例**: 0-1 背包问题 (0/1 Knapsack)\n`;
      md += `* **主题色系**: 星瀚靛蓝 (Indigo Theme) — 展现经典决策美学。\n`;
      md += `* **色彩语义**: 激活焦点单元格使用亮靛蓝，状态转移的前置依赖单元格使用浅天蓝色背景进行高亮，回溯轨迹用沉稳的暗靛蓝色，标示出最优的选择策略路径。\n\n`;
    } else if (problemType === 'shortest_path') {
      md += `* **适用实验案例**: 多阶段网络最短路径 (Shortest Path)\n`;
      md += `* **主题色系**: 翡翠青绿 (Emerald Theme) — 代表网络节点的最优流动。\n`;
      md += `* **色彩语义**: 激活焦点单元格使用亮绿色，状态转移的上、左邻元采用轻薄荷绿显示依赖性，回溯决策路径使用高饱和度的深翡翠绿色实心标明最优行进流线。\n\n`;
    } else if (problemType === 'equipment') {
      md += `* **适用实验案例**: 设备更新决策 (Equipment Replacement)\n`;
      md += `* **主题色系**: 温暖琥珀金 (Amber Theme) — 折射固定资产折旧变现规律。\n`;
      md += `* **色彩语义**: 激活单元格采用金黄色高亮，前驱服役役龄转换路线由浅橙色箭头指示，回溯置换轨迹采用醇厚琥珀色，清晰展现“保持”与“买新”的最优轮替节点。\n\n`;
    } else if (problemType === 'production_inventory') {
      md += `* **适用实验案例**: 生产与库存控制决策 (Production & Inventory)\n`;
      md += `* **主题色系**: 罗兰紫薇 (Purple Theme) — 展现复杂的平衡运筹之美。\n`;
      md += `* **色彩语义**: 填表焦点单元格使用晶莹紫高亮，前置库存周期依赖性使用浅薰衣草紫底色，最终回溯生产排班用罗兰紫实心标注各阶段最优期末存货量。\n\n`;
    } else if (problemType === 'markov_portfolio') {
      md += `* **适用实验案例**: 马尔可夫投资组合配资 (Markov Portfolio)\n`;
      md += `* **主题色系**: 暮色瑰红 (Rose Theme) — 代表科学配资回报。\n`;
      md += `* **色彩语义**: 焦点配资单元格使用亮玫红高亮，预算扣减的前置依赖关系用粉红色底色展示，最优的资金投资配置比例在回溯阶段使用玫瑰红实心进行强调。\n\n`;
    } else {
      md += `* **适用实验案例**: 资源最优化指派决策 (Resource Allocation)\n`;
      md += `* **主题色系**: 晴空碧蓝 (Sky Theme) — 指示公共资源的科学指派流。\n`;
      md += `* **色彩语义**: 填表核心焦点采用明亮天蓝高亮，各档次边际效益的前置推导由蔚蓝色底色代表，最终的最优指派额度回溯链采用晴空蓝实心节点进行描绘。\n\n`;
    }
    
    md += `---\n*报告由《动态规划算法可视化分析系统》自动汇编，可作为研究或数据分析之教案使用。*`;
    return md;
  };

  const downloadReport = () => {
    const md = generateReportMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DP_${problemType}_Experiment_Report.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ----------------------------------------------------
  // Dynamic visual helper tags & names
  // ----------------------------------------------------
  const getProblemTitle = () => {
    switch(problemType) {
      case 'knapsack': return '0-1 背包问题 (0/1 Knapsack)';
      case 'shortest_path': return '网络最短路径规划 (Shortest Path)';
      case 'equipment': return '设备更新更新决策 (Equipment Replacement)';
      case 'production_inventory': return '生产与库存控制决策 (Production & Inventory Balancing)';
      case 'markov_portfolio': return '马尔可夫投资组合配资 (Markov Portfolio Investment)';
      case 'resource_allocation': return '资源最优化指派决策 (Optimal Resource Allocation)';
    }
  };

  // Render variables inside transition equations in real-time
  const renderFormulaWithValues = () => {
    if (problemType === 'knapsack') {
      const i = activeStep.i;
      const j = activeStep.j;
      if (i === 0 || j === 0) {
        return `DP[${i}][${j}] = 0 (边界状态直接初始化为0)`;
      }
      const w = knapsackParams.weights[i - 1];
      const v = knapsackParams.values[i - 1];
      const prevSameCap = activeStep.dpTable[i - 1]?.[j] ?? '?';
      if (w <= j) {
        const prevWithCap = activeStep.dpTable[i - 1]?.[j - w] ?? '?';
        const withItemVal = typeof prevWithCap === 'number' ? prevWithCap + v : '?';
        return `DP[${i}][${j}] = max(DP[${i-1}][${j}], DP[${i-1}][${j}-${w}] + ${v}) \n= max(${prevSameCap}, ${prevWithCap} + ${v}) \n= max(${prevSameCap}, ${withItemVal}) \n= ${activeStep.currentVal}`;
      } else {
        return `DP[${i}][${j}] = DP[${i-1}][${j}] (容量不足) \n= ${prevSameCap}`;
      }
    } else if (problemType === 'shortest_path') {
      const i = activeStep.i;
      const j = activeStep.j;
      const cost = shortestPathParams.grid[i]?.[j] ?? 0;
      if (i === 0 && j === 0) {
        return `DP[0][0] = grid[0][0] = ${cost}`;
      }
      if (i === 0) {
        const left = activeStep.dpTable[0]?.[j - 1] ?? '?';
        return `DP[0][${j}] = DP[0][${j-1}] + grid[0][${j}] \n= ${left} + ${cost} \n= ${activeStep.currentVal}`;
      }
      if (j === 0) {
        const up = activeStep.dpTable[i - 1]?.[0] ?? '?';
        return `DP[${i}][0] = DP[${i-1}][0] + grid[${i}][0] \n= ${up} + ${cost} \n= ${activeStep.currentVal}`;
      }
      const upVal = activeStep.dpTable[i - 1]?.[j] ?? '?';
      const leftVal = activeStep.dpTable[i]?.[j - 1] ?? '?';
      return `DP[${i}][${j}] = grid[${i}][${j}] + min(DP[${i-1}][${j}], DP[${i}][${j-1}]) \n= ${cost} + min(${upVal}, ${leftVal}) \n= ${activeStep.currentVal}`;
    } else {
      const t = activeStep.i;
      const x = activeStep.j; // age index 0 to 3 (corresponding to 1 to 4 years old)
      if (t === 0) {
        return `DP[0][${x}] = ${x === 0 ? 0 : '∞'} (第0年机器必为1岁(新购买)，其余非法)`;
      }
      
      const op = equipmentParams.operatingCosts[x] ?? 0;
      const P = equipmentParams.purchaseCost;
      
      if (x > 0) {
        // Keep option
        const prevCost = activeStep.dpTable[t - 1]?.[x - 1] ?? Infinity;
        const formattedPrev = prevCost === 999999 || prevCost === Infinity ? '∞' : prevCost;
        return `DP[${t}][${x}] = DP[${t-1}][${x-1}] + operatingCost[${x}] (保持决策) \n= ${formattedPrev} + ${op} \n= ${activeStep.currentVal}`;
      } else {
        // Replace option (x == 0, machine age becomes 1 year old)
        return `DP[${t}][0] = min_{prev_x} (DP[${t-1}][prev_x] + P - resale[prev_x] + operatingCost[0]) (替换决策) \n= ${activeStep.currentVal}`;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col transition-colors duration-200">
      
      {/* HEADER BAR */}
      <header id="app-header" className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-indigo-500 to-indigo-600 p-2.5 rounded-xl shadow-md text-white">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              动态规划算法可视化分析系统
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              以多维状态演进、前驱追溯连线、一维空间滚动数组及代码级同步跟踪为例
            </p>
          </div>
        </div>

        {/* LARGE MODEL QUICK COG SETTINGS */}
        <div className="flex items-center gap-3 md:ml-auto">
          <button
            onClick={() => setShowLlmSettings(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition shadow-sm ${
              llmApiKey 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="配置大模型 API Key 激活智能分析"
          >
            <Settings className={`w-4 h-4 ${llmApiKey ? 'text-emerald-500 animate-spin-slow' : 'text-slate-400'}`} />
            <span>{llmApiKey ? '大模型已激活' : '配置大模型'}</span>
          </button>
        </div>

        {/* ALGORITHM SELECTOR TABS */}
        <div className="flex flex-wrap items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/40 gap-1">
          <button
            id="tab-btn-knapsack"
            onClick={() => setProblemType('knapsack')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              problemType === 'knapsack'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            01背包问题
          </button>
          <button
            id="tab-btn-shortest-path"
            onClick={() => setProblemType('shortest_path')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              problemType === 'shortest_path'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            最短路径规划
          </button>
          <button
            id="tab-btn-equipment"
            onClick={() => setProblemType('equipment')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              problemType === 'equipment'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            设备更新决策
          </button>
          <button
            id="tab-btn-production-inventory"
            onClick={() => setProblemType('production_inventory')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              problemType === 'production_inventory'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            生产库存控制
          </button>
          <button
            id="tab-btn-markov-portfolio"
            onClick={() => setProblemType('markov_portfolio')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              problemType === 'markov_portfolio'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            马尔可夫决策与投资
          </button>
          <button
            id="tab-btn-resource-allocation"
            onClick={() => setProblemType('resource_allocation')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              problemType === 'resource_allocation'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            资源分配问题
          </button>
        </div>
      </header>

      {/* CORE WEBAPP LAYOUT: DOUBLE COLUMN */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: CONTROL & PARAMETER INPUT PANEL (4 cols) */}
        <section id="left-control-panel" className="lg:col-span-4 flex flex-col gap-6">
          
          {/* PARAMETER CONFIGURATION CARD */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></span>
                决策输入参数设置
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">INPUT_FORM</span>
            </div>

            {/* Manual Edit Input Form */}
            <form onSubmit={handleCustomSubmit} className="flex flex-col gap-4">
              {problemType === 'knapsack' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      物品重量列表 (半角逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      placeholder="e.g. 2,3,4,5"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      物品价值列表 (半角逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={valueInput}
                      onChange={(e) => setValueInput(e.target.value)}
                      placeholder="e.g. 3,4,5,6"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      背包限度容量 (1 至 10)
                    </label>
                    <input
                      type="number"
                      value={capacityInput}
                      min="0"
                      max="10"
                      onChange={(e) => setCapacityInput(parseInt(e.target.value, 10) || 0)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {problemType === 'shortest_path' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      网格尺寸 (1-6)
                    </label>
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400">行数:</span>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={gridRowInput}
                          onChange={(e) => {
                            const r = Math.min(6, Math.max(1, parseInt(e.target.value, 10) || 1));
                            setGridRowInput(r);
                            const newGrid = [...gridCostInput];
                            while (newGrid.length < r) {
                              newGrid.push(new Array(gridColInput).fill(1));
                            }
                            setGridCostInput(newGrid.slice(0, r));
                          }}
                          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] text-slate-400">列数:</span>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          value={gridColInput}
                          onChange={(e) => {
                            const c = Math.min(6, Math.max(1, parseInt(e.target.value, 10) || 1));
                            setGridColInput(c);
                            const newGrid = gridCostInput.map(row => {
                              const newRow = [...row];
                              while (newRow.length < c) newRow.push(1);
                              return newRow.slice(0, c);
                            });
                            setGridCostInput(newGrid);
                          }}
                          className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      网格单元过境开销 (可直接在此编辑网格成本值):
                    </label>
                    <div className="grid gap-1 border border-slate-100 p-2 rounded-lg bg-slate-50" style={{ gridTemplateColumns: `repeat(${gridColInput}, minmax(0, 1fr))` }}>
                      {Array.from({ length: gridRowInput }).map((_, r) => (
                        Array.from({ length: gridColInput }).map((_, c) => {
                          const val = (gridCostInput[r] && gridCostInput[r][c] !== undefined) ? gridCostInput[r][c] : 1;
                          return (
                            <input
                              key={`${r}-${c}`}
                              type="number"
                              min="0"
                              max="99"
                              value={val}
                              onChange={(e) => {
                                const costVal = Math.max(0, parseInt(e.target.value, 10) || 0);
                                const newGrid = gridCostInput.map((row, ri) => 
                                  ri === r ? row.map((cv, ci) => ci === c ? costVal : cv) : row
                                );
                                setGridCostInput(newGrid);
                              }}
                              className="w-full text-center text-xs font-bold border border-slate-200 rounded p-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          );
                        })
                      ))}
                    </div>
                  </div>
                </>
              )}

              {problemType === 'equipment' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      规划总期 (1-8年)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={equipYearsInput}
                      onChange={(e) => setEquipYearsInput(parseInt(e.target.value, 10) || 1)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      新设备购置开销 (P)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={equipPurchaseInput}
                      onChange={(e) => setEquipPurchaseInput(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      年运行维护费 (按设备役龄 1,2,3...岁顺序, 逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={equipOpInput}
                      onChange={(e) => setEquipOpInput(e.target.value)}
                      placeholder="e.g. 2,4,7,11,16"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      各年残值估值 (按设备役龄 1,2,3...岁顺序, 逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={equipResaleInput}
                      onChange={(e) => setEquipResaleInput(e.target.value)}
                      placeholder="e.g. 8,6,4,2,0"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </>
              )}

              {problemType === 'production_inventory' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      规划总期 (1-6 期)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={prodPeriodsInput}
                      onChange={(e) => setProdPeriodsInput(parseInt(e.target.value, 10) || 1)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      每期市场需求量 (逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={prodDemandsInput}
                      onChange={(e) => setProdDemandsInput(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        生产启动固定费
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={prodSetupInput}
                        onChange={(e) => setProdSetupInput(parseInt(e.target.value, 10) || 0)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        单件可变生产费
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={prodUnitInput}
                        onChange={(e) => setProdUnitInput(parseInt(e.target.value, 10) || 0)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        单件每期库存费
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={prodHoldingInput}
                        onChange={(e) => setProdHoldingInput(parseInt(e.target.value, 10) || 0)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        最大库存限制
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={prodMaxInvInput}
                        onChange={(e) => setProdMaxInvInput(parseInt(e.target.value, 10) || 1)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {problemType === 'markov_portfolio' && (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        投资项目数 (1-5)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={portProjectsInput}
                        onChange={(e) => setPortProjectsInput(parseInt(e.target.value, 10) || 1)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        投资总预算 (1-10)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={portBudgetInput}
                        onChange={(e) => setPortBudgetInput(parseInt(e.target.value, 10) || 1)}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      各项目不同预算回报值 (每行一个项目, 配额以逗号分隔)
                    </label>
                    <textarea
                      value={portReturnsInput}
                      onChange={(e) => setPortReturnsInput(e.target.value)}
                      rows={3}
                      className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-normal"
                      placeholder="e.g. 0,3,5,6,7"
                    />
                  </div>
                </>
              )}

              {problemType === 'resource_allocation' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      项目/活动总数 N (1-5 个)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={resProjectsInput}
                      onChange={(e) => setResProjectsInput(parseInt(e.target.value, 10) || 1)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      总资源数 M (1-6 单位)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={resTotalResourceInput}
                      onChange={(e) => setResTotalResourceInput(parseInt(e.target.value, 10) || 1)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      不同资源分配下的收益矩阵 (每行逗号分隔, 包含 0 至 M 的收益)
                    </label>
                    <textarea
                      value={resReturnsInput}
                      onChange={(e) => setResReturnsInput(e.target.value)}
                      rows={4}
                      className="w-full text-xs font-mono border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-normal"
                      placeholder="e.g. 0,3,5,6,7"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow transition duration-150"
              >
                应用自定义参数
              </button>
            </form>

            {/* PRESETS */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  经典科研教学案例库 ({PRESET_CATALOG[problemType].length} 个)
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">Presets Library</span>
              </div>
              <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                {PRESET_CATALOG[problemType].map((preset) => {
                  const IconComponent = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className="w-full text-left bg-white border border-slate-200 hover:border-indigo-500 hover:shadow-md hover:bg-indigo-50/10 p-3 rounded-xl flex items-start gap-3 transition-all cursor-pointer relative group"
                    >
                      <div className="p-2 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mt-0.5 flex-shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 transition-colors truncate">
                            {preset.title}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md border font-semibold flex-shrink-0 ${preset.badgeColor}`}>
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal line-clamp-2">
                          {preset.desc}
                        </p>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mt-2 pt-1.5 border-t border-slate-100/60">
                          <span className="bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded">参数: {preset.preview}</span>
                          <span className="text-indigo-500 font-semibold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            载入测试 <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP CONTROLLER CARD */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                填表步进控制器
              </h2>
              <span className="text-xs text-indigo-600 font-mono font-semibold">
                步数: {currentStepIndex} / {steps.length - 1}
              </span>
            </div>

            {/* Stepper Slider */}
            <div>
              <input
                type="range"
                min="0"
                max={steps.length - 1}
                value={currentStepIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentStepIndex(parseInt(e.target.value, 10));
                }}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>START</span>
                <span>COMPLETE</span>
              </div>
            </div>

            {/* Control Buttons row */}
            <div className="grid grid-cols-5 gap-1">
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(0);
                }}
                disabled={currentStepIndex === 0}
                className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 p-2 rounded-lg flex items-center justify-center transition"
                title="重置到起点"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((prev) => Math.max(0, prev - 1));
                }}
                disabled={currentStepIndex === 0}
                className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 p-2 rounded-lg flex items-center justify-center transition"
                title="上一步"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2 rounded-lg text-white flex items-center justify-center transition shadow-sm col-span-1 ${
                  isPlaying ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                title={isPlaying ? '暂停自动演进' : '自动播放'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
                }}
                disabled={currentStepIndex === steps.length - 1}
                className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 p-2 rounded-lg flex items-center justify-center transition"
                title="下一步"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(steps.length - 1);
                }}
                disabled={currentStepIndex === steps.length - 1}
                className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white p-2 rounded-lg flex items-center justify-center transition"
                title="一键填满表格"
              >
                完成
              </button>
            </div>

            {/* Play Speed slider */}
            <div className="flex items-center justify-between gap-4 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500">
                演进速率
              </span>
              <div className="flex items-center gap-2 flex-1 justify-end">
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="100"
                  value={2200 - playSpeed}
                  onChange={(e) => setPlaySpeed(2200 - parseInt(e.target.value, 10))}
                  className="w-24 accent-slate-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-[10px] font-mono font-bold text-slate-600">
                  {Math.round((1000 / playSpeed) * 10) / 10} 步/秒
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVE STEP INSIGHT CARD */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-indigo-600">
              <Info className="w-4.5 h-4.5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                当前转移过程详解
              </span>
            </div>
            
            {/* Step Decision Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">
                对应位置:
              </span>
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                DP[{activeStep.i}][{activeStep.j}]
              </span>
              
              {/* Decision badge */}
              {(() => {
                const dec = activeStep.decision;
                if (dec === 'init') return <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">初始化</span>;
                if (dec === 'pick') return <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">【选择】更优</span>;
                if (dec === 'leave') return <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">【放弃】更优</span>;
                if (dec === 'match') return <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">字符匹配 (+1)</span>;
                if (dec === 'mismatch') return <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">字符不匹配</span>;
                if (dec === 'replace') return <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full border border-indigo-200">最小代价: 【替换】</span>;
                if (dec === 'delete') return <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">最小代价: 【删除】</span>;
                if (dec === 'insert') return <span className="text-[10px] font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full border border-cyan-200">最小代价: 【插入】</span>;
                return null;
              })()}
            </div>

            {/* Description Text */}
            <div className="bg-slate-50 rounded-lg p-3 text-xs leading-relaxed text-slate-600 border border-slate-100/60 font-medium whitespace-pre-line">
              {activeStep.description || "填表演化尚未开始，点击“下一步”或“播放”按键查看状态递推。"}
            </div>

            {/* Active equation breakdown */}
            <div className="border-t border-slate-100 pt-3 flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                当前转移方程计算切片
              </span>
              <pre className="bg-slate-900 text-indigo-300 font-mono text-[11px] p-2.5 rounded-lg overflow-x-auto leading-normal whitespace-pre">
                {renderFormulaWithValues()}
              </pre>
            </div>
          </div>
        </section>

        {/* RIGHT COLUMN: VISUALIZATION CANVAS & DP TABLE (8 cols) */}
        <section id="right-visualization-canvas" className="lg:col-span-8 flex flex-col gap-6">
          
          {/* CONTROL SWITCHES PANEL */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                可视化控制选项
              </span>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              {/* Backtrace highlight toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={backtraceActive}
                  onChange={(e) => setBacktraceActive(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                显示回溯最优路径
              </label>

              {/* Space optimization toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={showSpaceOpt}
                  onChange={(e) => setShowSpaceOpt(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                展示一维空间滚动数组
              </label>
            </div>
          </div>

          {/* MAIN VISUAL CANVAS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-6 relative">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">
                  {getProblemTitle()} - 状态转移矩阵 (DP Table)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">2D_MATRIX_STAGE</span>
            </div>

            {/* THE DYNAMIC DP TABLE */}
            <div className="relative overflow-auto max-h-[420px] rounded-lg border border-slate-200" id="table-container">
              
              {/* SVG Connectors Arrow Overlay */}
              <svg 
                className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" 
                style={{ minHeight: '100%', minWidth: '100%' }}
              >
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
                  </marker>
                  <marker
                    id="arrow-backtrack"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                  </marker>
                </defs>

                {/* Render dynamic precursor lines */}
                {lines.map((line, idx) => (
                  <g key={`prec-line-${idx}`}>
                    <path
                      d={`M ${line.x1} ${line.y1} Q ${(line.x1 + line.x2) / 2} ${(line.y1 + line.y2) / 2 - 15} ${line.x2} ${line.y2}`}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      markerEnd="url(#arrow)"
                      className="animate-pulse"
                    />
                    <rect
                      x={(line.x1 + line.x2) / 2 - 12}
                      y={(line.y1 + line.y2) / 2 - 20}
                      width="24"
                      height="14"
                      rx="4"
                      fill="#0284c7"
                      className="opacity-95"
                    />
                    <text
                      x={(line.x1 + line.x2) / 2}
                      y={(line.y1 + line.y2) / 2 - 10}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {line.value}
                    </text>
                  </g>
                ))}

                {/* Draw dynamic Backtrace connection paths */}
                {backtraceActive && backtrackPath.length > 1 && backtrackPath.map((node, idx) => {
                  if (idx === backtrackPath.length - 1) return null;
                  const nextNode = backtrackPath[idx + 1];
                  const fromEl = document.getElementById(`cell-${node.row}-${node.col}`);
                  const toEl = document.getElementById(`cell-${nextNode.row}-${nextNode.col}`);
                  const tableContainer = document.getElementById('table-container');

                  if (fromEl && toEl && tableContainer) {
                    const containerRect = tableContainer.getBoundingClientRect();
                    const fromRect = fromEl.getBoundingClientRect();
                    const toRect = toEl.getBoundingClientRect();

                    const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
                    const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
                    const toX = toRect.left + toRect.width / 2 - containerRect.left;
                    const toY = toRect.top + toRect.height / 2 - containerRect.top;

                    return (
                      <line
                        key={`backtrace-line-${idx}`}
                        x1={fromX}
                        y1={fromY}
                        x2={toX}
                        y2={toY}
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeDasharray="1"
                        markerEnd="url(#arrow-backtrack)"
                      />
                    );
                  }
                  return null;
                })}
              </svg>

              {/* Render dynamic table structure depending on active problem */}
              <table className="w-full border-collapse bg-white relative z-0">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {/* Top-Left empty index cell */}
                    <th className="sticky top-0 left-0 bg-slate-100 z-30 p-3 text-center border-r border-b border-slate-200 text-xs font-bold text-slate-500 min-w-[110px]">
                      {problemType === 'knapsack' ? '阶段 i \\ 容量 j' : 
                       problemType === 'shortest_path' ? '行 i \\ 列 j' : 
                       problemType === 'equipment' ? '年度 t \\ 年龄 x' : 
                       problemType === 'production_inventory' ? '阶段 t \\ 库存 s' : 
                       problemType === 'markov_portfolio' ? '项目 i \\ 预算 j' : 
                       '项目 i \\ 资源 j'}
                    </th>
                    
                    {/* Render Columns depending on problem */}
                    {problemType === 'knapsack' ? (
                      Array.from({ length: knapsackParams.capacity + 1 }, (_, j) => (
                        <th key={`col-head-${j}`} className="p-3 text-center border-r border-b border-slate-200 text-xs font-bold text-slate-600 min-w-[55px]">
                          {j}
                        </th>
                      ))
                    ) : problemType === 'shortest_path' ? (
                      Array.from({ length: shortestPathParams.grid[0].length }, (_, j) => (
                        <th key={`col-head-${j}`} className="p-3 text-center border-r border-b border-slate-200 text-xs font-bold text-slate-600 min-w-[55px]">
                          列 {j}
                        </th>
                      ))
                    ) : problemType === 'equipment' ? (
                      Array.from({ length: 4 }, (_, j) => (
                        <th key={`col-head-${j}`} className="p-3 text-center border-r border-b border-slate-200 text-xs font-bold text-slate-600 min-w-[55px]">
                          {j + 1} 岁
                        </th>
                      ))
                    ) : problemType === 'production_inventory' ? (
                      Array.from({ length: productionInventoryParams.maxInventory + 1 }, (_, j) => (
                        <th key={`col-head-${j}`} className="p-3 text-center border-r border-b border-slate-200 text-xs font-bold text-slate-600 min-w-[55px]">
                          库存 {j}
                        </th>
                      ))
                    ) : problemType === 'markov_portfolio' ? (
                      Array.from({ length: markovPortfolioParams.budget + 1 }, (_, j) => (
                        <th key={`col-head-${j}`} className="p-3 text-center border-r border-b border-slate-200 text-xs font-bold text-slate-600 min-w-[55px]">
                          预算 {j}
                        </th>
                      ))
                    ) : (
                      Array.from({ length: resourceAllocationParams.totalResource + 1 }, (_, j) => (
                        <th key={`col-head-${j}`} className="p-3 text-center border-r border-b border-slate-200 text-xs font-bold text-slate-600 min-w-[55px]">
                          资源 {j}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>

                <tbody>
                  {/* Rows iteration */}
                  {activeStep.dpTable.map((row, rIdx) => {
                    // Row descriptor label
                    let rowLabel = '';
                    let rowDetail = '';
                    if (problemType === 'knapsack') {
                      rowLabel = rIdx === 0 ? '0 (空)' : `物品 ${rIdx}`;
                      rowDetail = rIdx === 0 ? '' : `w:${knapsackParams.weights[rIdx-1]}, v:${knapsackParams.values[rIdx-1]}`;
                    } else if (problemType === 'shortest_path') {
                      rowLabel = `行 ${rIdx}`;
                      rowDetail = `成本: [${shortestPathParams.grid[rIdx]?.join(',')}]`;
                    } else if (problemType === 'equipment') {
                      rowLabel = `第 ${rIdx} 年`;
                      rowDetail = rIdx === 0 ? '期初' : `运行中`;
                    } else if (problemType === 'production_inventory') {
                      rowLabel = rIdx === 0 ? '第 0 期 (期初)' : `第 ${rIdx} 期`;
                      rowDetail = rIdx === 0 ? '' : `需求: ${productionInventoryParams.demands[rIdx-1]}`;
                    } else if (problemType === 'markov_portfolio') {
                      rowLabel = rIdx === 0 ? '0 (不投资)' : `项目 ${rIdx}`;
                      rowDetail = rIdx === 0 ? '' : `收益: [${markovPortfolioParams.returns[rIdx-1]?.join(',')}]`;
                    } else {
                      rowLabel = rIdx === 0 ? '0 (不分配)' : `项目 ${rIdx}`;
                      rowDetail = rIdx === 0 ? '' : `收益: [${resourceAllocationParams.returns[rIdx-1]?.join(',')}]`;
                    }

                    return (
                      <tr key={`row-${rIdx}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        {/* Sticky left index column */}
                        <td className="sticky left-0 bg-slate-50 z-20 border-r border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          <div className="flex flex-col">
                            <span>{rowLabel}</span>
                            {rowDetail && <span className="text-[9px] text-indigo-500 font-mono">{rowDetail}</span>}
                          </div>
                        </td>

                        {/* Cells iteration */}
                        {row.map((cellVal, cIdx) => {
                          const isCurrent = activeStep.i === rIdx && activeStep.j === cIdx;
                          
                          // Check if cell is a precursor to the current step
                          const precursor = activeStep.precursors.find((p) => p.row === rIdx && p.col === cIdx);
                          
                          // Check if cell lies in backtrack path
                          const isBacktrace = backtraceActive && backtrackPath.some((b) => b.row === rIdx && b.col === cIdx);

                          let cellClass = 'p-3 text-center border-r border-slate-100 text-sm font-mono transition-all duration-150 ';
                          let badgeEl = null;

                          if (isCurrent) {
                            cellClass += 'bg-amber-100 border-2 border-amber-500 text-amber-900 font-extrabold ring-4 ring-amber-400/20 z-10 scale-105 shadow-md ';
                          } else if (precursor) {
                            if (precursor.type === 'up') {
                              cellClass += 'bg-blue-50 text-blue-800 border border-blue-300 font-semibold ';
                              badgeEl = <span className="absolute top-0.5 right-1 text-[8px] text-blue-500 font-bold font-sans">UP</span>;
                            } else if (precursor.type === 'left') {
                              cellClass += 'bg-purple-50 text-purple-800 border border-purple-300 font-semibold ';
                              badgeEl = <span className="absolute top-0.5 right-1 text-[8px] text-purple-500 font-bold font-sans">L</span>;
                            } else {
                              cellClass += 'bg-sky-50 text-sky-800 border border-sky-300 font-semibold ';
                              badgeEl = <span className="absolute top-0.5 right-1 text-[8px] text-sky-500 font-bold font-sans">DIAG</span>;
                            }
                          } else if (isBacktrace && currentStepIndex === steps.length - 1) {
                            // Only show full green backtrace when execution is finished
                            cellClass += 'bg-emerald-100/90 border border-emerald-400 text-emerald-900 font-semibold ';
                          } else if (cellVal !== null) {
                            cellClass += 'text-slate-700 bg-white';
                          } else {
                            cellClass += 'text-slate-300 bg-slate-50/40 italic';
                          }

                          return (
                            <td
                              id={`cell-${rIdx}-${cIdx}`}
                              key={`cell-${rIdx}-${cIdx}`}
                              className={`relative cursor-pointer select-none ${cellClass}`}
                              onMouseEnter={() => setHoveredCell({ r: rIdx, c: cIdx })}
                              onMouseLeave={() => setHoveredCell(null)}
                            >
                              {cellVal !== null ? cellVal : '-'}
                              {badgeEl}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* COLOR LEGENDS */}
            <div className="flex flex-wrap items-center justify-center gap-6 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-2">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="w-4 h-4 bg-amber-100 border-2 border-amber-400 rounded"></span>
                <span>当前计算单元</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="w-4 h-4 bg-sky-50 border border-sky-300 rounded"></span>
                <span>决策前驱单元 (依赖来源)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="w-4 h-4 bg-emerald-100 border border-emerald-400 rounded"></span>
                <span>最优解回溯决策链 (完整填表后显现)</span>
              </div>
            </div>

            {/* SPACE OPTIMIZATION SECTION (DYNAMIC INTERACTION) */}
            {showSpaceOpt && (
              <div className="border-t border-indigo-100 bg-indigo-50/30 rounded-xl p-5 flex flex-col gap-4 animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-4.5 h-4.5 text-indigo-600" />
                      一维空间压缩压缩滚动数组 $O(W)$ 动态演进
                    </h3>
                    <p className="text-xs text-indigo-700 mt-0.5">
                      观察当前状态行如何使用一维数组在原地进行覆盖重写
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                    MEMORY_EFFICIENT
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">
                      一维状态数组 `dp[j]` 视图:
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold italic">
                      {problemType === 'knapsack' ? '背包容量自右向左逆序更新' : '引入 prev 临时变量顺序更新'}
                    </span>
                  </div>

                  {/* 1D rolling array grid layout */}
                  <div className="overflow-x-auto p-1 bg-white border border-indigo-100 rounded-lg">
                    <div className="flex items-center gap-1 min-w-max p-2">
                      {activeStep.rollingArray ? activeStep.rollingArray.map((val, idx) => {
                        const isTarget = activeStep.j === idx;
                        const wasPrevious = activeStep.rollingArrayPrevious ? activeStep.rollingArrayPrevious[idx] : null;
                        const isDependency = problemType === 'knapsack' && activeStep.j - (knapsackParams.weights[activeStep.i - 1] || 0) === idx;

                        let blockClass = 'w-12 h-12 rounded-lg border flex flex-col items-center justify-center font-mono text-sm transition-all ';
                        if (isTarget) {
                          blockClass += 'bg-amber-100 border-2 border-amber-500 text-amber-950 font-bold scale-105 shadow-md';
                        } else if (isDependency) {
                          blockClass += 'bg-sky-100 border border-sky-400 text-sky-950 font-semibold';
                        } else if (idx > activeStep.j && problemType === 'knapsack') {
                          blockClass += 'bg-slate-100 text-slate-800 border-slate-200 opacity-60'; // Updated in current pass
                        } else {
                          blockClass += 'bg-indigo-50/50 text-indigo-900 border-indigo-100'; // Holds previous item state
                        }

                        return (
                          <div key={`rolling-1d-${idx}`} className={blockClass}>
                            <span className="text-[9px] text-slate-400 leading-none">j={idx}</span>
                            <span className="text-xs font-bold mt-0.5">{val}</span>
                          </div>
                        );
                      }) : (
                        <div className="text-xs text-slate-400 p-2 italic">请开始步进，一维状态滚动详情会自动展现。</div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs leading-relaxed text-indigo-950 bg-indigo-50/50 rounded-lg p-3 border border-indigo-100">
                    {problemType === 'knapsack' ? (
                      <span>
                        💡 <strong>01背包 1D 内存原理</strong>：为了避免将同一个物品在同一行中多次选取（即导致退化为完全背包），一维循环<b>必须由右至左（逆序）</b>遍历。
                        由于 <code className="bg-white/80 px-1 py-0.5 text-indigo-700 rounded font-mono">dp[j]</code> 依赖于 <code className="bg-white/80 px-1 py-0.5 text-indigo-700 rounded font-mono">dp[j - w_i]</code>，
                        从后往前覆盖意味着在算 <code className="bg-white/80 px-1 py-0.5 text-indigo-700 rounded font-mono">dp[j]</code> 时，
                        左侧的 <code className="bg-white/80 px-1 py-0.5 text-indigo-700 rounded font-mono">dp[j-w_i]</code> 依然保留着上一轮 $i-1$ 阶段的值。
                      </span>
                    ) : (
                      <span>
                        💡 <strong>非对称更新 1D 内存原理</strong>：在 LCS 或 编辑距离中，当前状态依赖于上一行上方、左方及左上方。
                        我们采用正序更新一维数组。通过引入一个临时变量 <code className="bg-white/80 px-1 py-0.5 text-indigo-700 rounded font-mono">prev</code>
                        暂存即将被覆盖的 <code className="bg-white/80 px-1 py-0.5 text-indigo-700 rounded font-mono">dp[i-1][j-1]</code>。
                        这体现了将空间复杂度压缩至最极致的算法设计思想。
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BACKWARD INDUCTION & TREE PRUNING ANIMATION MODULE */}
          <BackwardInductionAnimation />
        </section>
      </main>

      {/* BOTTOM SECTION: MULTI-DIMENSIONAL ANALYSIS PANEL (Tabs: Guide, AI, Python, Export) */}
      <footer className="max-w-7xl w-full mx-auto p-4 md:p-6 mt-auto">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* TAB HEADERS */}
          <div className="bg-slate-50 border-b border-slate-200 flex flex-wrap">
            <button
              id="analysis-tab-guide"
              onClick={() => setActiveTab('guide')}
              className={`px-6 py-4.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'guide'
                  ? 'border-indigo-600 bg-white text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Info className="w-4 h-4" />
              1. 理论建模与状态方程
            </button>
             <button
              id="analysis-tab-ai"
              onClick={() => {
                setActiveTab('ai');
                if (!aiInsight) requestAiInsight();
              }}
              className={`px-6 py-4.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'ai'
                  ? 'border-indigo-600 bg-white text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Brain className="w-4 h-4 text-purple-500 animate-bounce" />
              2. AI洞察
            </button>
            <button
              id="analysis-tab-python"
              onClick={() => setActiveTab('python')}
              className={`px-6 py-4.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'python'
                  ? 'border-indigo-600 bg-white text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Code className="w-4 h-4 text-amber-500" />
              3. Python 验证
            </button>
            <button
              id="analysis-tab-performance"
              onClick={() => setActiveTab('performance')}
              className={`px-6 py-4.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'performance'
                  ? 'border-indigo-600 bg-white text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-rose-500" />
              4. 性能趋势分析
            </button>
            <button
              id="analysis-tab-export"
              onClick={() => setActiveTab('export')}
              className={`px-6 py-4.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'export'
                  ? 'border-indigo-600 bg-white text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-500" />
              5. 报告导出
            </button>
            <button
              id="analysis-tab-knowledge"
              onClick={() => setActiveTab('knowledge')}
              className={`px-6 py-4.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'knowledge'
                  ? 'border-indigo-600 bg-white text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-500" />
              6. 知识导引
            </button>
          </div>

          {/* TAB CONTENT PANELS */}
          <div className="p-6">
            
            {/* TAB 1: 理论建模与状态方程 */}
            {activeTab === 'guide' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    DP 的灵魂：四个基本要素建模
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-xs mt-0.5">1</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">阶段 (Stages)</h4>
                        <p className="text-xs text-slate-500 leading-normal mt-0.5">
                          {problemType === 'knapsack' && '依次决定每一个候选商品（第 1 到第 N 个物品）的决策选择，随物品索引逐步向后推进。'}
                          {problemType === 'shortest_path' && '沿着二维网络网格，自起点位置 (0,0) 开始逐格向右下方向移动，每个坐标状态算作一个推演步骤。'}
                          {problemType === 'equipment' && '规划周期中的各个会计年度或运营时间点，由第一年逐年向后推进至规划截止年第 T 年。'}
                          {problemType === 'production_inventory' && '多期决策排程中的每个离散生产时间周期或季度，自第一期向第 T 期线性推进。'}
                          {problemType === 'markov_portfolio' && '依次决定投资预算在各个异构金融资产项目上的分配，从第 1 个项目推进到第 N 个项目。'}
                          {problemType === 'resource_allocation' && '依次确定固定资源在多个平行研发/生产子项目上的具体配置梯度，从第 1 个子项目推进到第 N 个子项目。'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-xs mt-0.5">2</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">状态 (States)</h4>
                        <p className="text-xs text-slate-500 leading-normal mt-0.5">
                          {problemType === 'knapsack' && '在考量当前第 i 个物品时，背包内部目前残余的可支配承重/物理容量空间上限 j。'}
                          {problemType === 'shortest_path' && '当前智能体或货流所停留在的特定网络节点坐标网格 (i, j) 及其累积过境成本值。'}
                          {problemType === 'equipment' && '在当前第 t 年初，设备已经连续投入使用的实际折旧役龄服役时间 x 岁。'}
                          {problemType === 'production_inventory' && '在当前规划期初或期末，仓库中存放并持有的真实物理存货储备量 s。'}
                          {problemType === 'markov_portfolio' && '在考量向当前投资产品配置时，账面上剩余可用来支配划拨的自由投资金/预算 j。'}
                          {problemType === 'resource_allocation' && '进入当前分配阶段时，手中拥有的尚待精细化分派的可用公共核心资源/专家人数总量 j。'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-xs mt-0.5">3</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">决策 (Decisions)</h4>
                        <p className="text-xs text-slate-500 leading-normal mt-0.5">
                          {problemType === 'knapsack' && '离散二叉决策：【纳入此商品】（折损当前容量并累加所得收益）或者【直接放弃】（继承同容量下前一阶段的最佳方案）。'}
                          {problemType === 'shortest_path' && '移动决策寻优：选择【自上方格 (i-1, j) 移入】或【自左侧格 (i, j-1) 移入】，从而最小化整体到达开销。'}
                          {problemType === 'equipment' && '资产置换权衡：选择【维持现状】（今年役龄递增1岁并支出日常高额维护费）或【置换买新】（折价变现旧设备并购入新机）。'}
                          {problemType === 'production_inventory' && '生产排班调度：规划本期【批量生产件数 x】，需在固定开产开销、件数可变成本与超期库存保有费之间取得平衡。'}
                          {problemType === 'markov_portfolio' && '多档次配资划拨：在当前持有的预算上限 j 内，决定【给当前理财项目分配金额 x (0 ≤ x ≤ j)】，获取最大化边际期望。'}
                          {problemType === 'resource_allocation' && '资源派指梯度：在现有资源额度 j 下，决定【对当前子项目指派资源量 x (0 ≤ x ≤ j)】，并与前驱剩余资源收益相加求大。'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-xs mt-0.5">4</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">策略与无后效性 (Markov Property)</h4>
                        <p className="text-xs text-slate-500 leading-normal mt-0.5">
                          {problemType === 'knapsack' && '一旦求得 DP[i][j] 的最优期望，后续物品的选择完全不依赖于此前的具体挑选顺序，只依据当前的剩余物理额度进行单向扩展。'}
                          {problemType === 'shortest_path' && '无论先前行进路线如何曲折，抵达当前坐标 (i, j) 之后通往最终终点的最小代价只跟当前点的累积开销相关，无历史后效。'}
                          {problemType === 'equipment' && '当确定了第 t 年初设备役龄为 x 岁的累积最低开销后，此后年度的更新置换策略不受以前年份置换的具体日期或历史波动影响。'}
                          {problemType === 'production_inventory' && '当期初（或期末）持有的物理库存 s 状态确定后，后续计划期的最优化排产决策只从这个库存量出发，先前周期的产能起伏不留影响。'}
                          {problemType === 'markov_portfolio' && '给前 i 个资产配置 j 预算所得的最大期望回报一经锁死，剩余资金在未来项目中的运作方案完全不受历史标的具体分配分布的影响。'}
                          {problemType === 'resource_allocation' && '在当前研发任务组合中，已分拨给前续项目的最优收益一经确定，后续阶段只从剩余资源基准中进行无后效演进，简化了配置树。'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                    当前问题的核心状态转移方程
                  </h3>

                  <div className="bg-slate-900 text-slate-100 p-5 rounded-xl border border-slate-800 flex flex-col gap-4">
                    {problemType === 'knapsack' ? (
                      <>
                        <div className="font-mono text-xs text-indigo-300">
                          DP[i][j] = max( DP[i-1][j], DP[i-1][j - w[i]] + v[i] )
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          当前物品是否能放入包内（$w[i] \le j$）时：
                          <br />• <strong>不选该物品</strong>: 继承 <code className="text-indigo-300 font-mono">DP[i-1][j]</code> 价值
                          <br />• <strong>选该物品</strong>: 消耗 $w[i]$ 容量并获得价值 $v[i]$，即前一物品在剩余容量的值：<code className="text-indigo-300 font-mono">DP[i-1][j - w[i]] + v[i]</code>
                          <br />两分支取最大值，实现重叠子问题的局部最优。
                        </p>
                      </>
                    ) : problemType === 'shortest_path' ? (
                      <>
                        <div className="font-mono text-xs text-indigo-300">
                          DP[i][j] = grid[i][j] + min( DP[i-1][j], DP[i][j-1] )
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          当前网格的最短到达代价由两部分决策汇聚而来：
                          <br />• <strong>从上方来</strong>: 成本为 <code className="text-indigo-300 font-mono">DP[i-1][j]</code>
                          <br />• <strong>从左侧来</strong>: 成本为 <code className="text-indigo-300 font-mono">DP[i][j-1]</code>
                          <br />加上当前网格的固定开销代价 $grid[i][j]$，自底向上累计，即可推算出任意格的最优权值和。
                        </p>
                      </>
                    ) : problemType === 'equipment' ? (
                      <>
                        <div className="font-mono text-xs text-indigo-300">
                          DP[t][x] = min( Keep_Cost, Replace_Cost )
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          设备役龄在规划阶段中的损耗替代方程：
                          <br />• <strong>保持现状 (x &gt; 0)</strong>: <code className="text-indigo-300 font-mono">DP[t-1][x-1] + operatingCosts[x]</code>
                          <br />• <strong>置换新机 (x == 0)</strong>: <code className="text-indigo-300 font-mono">min_prev(DP[t-1][prev_x] + P - resaleValues[prev_x] + operatingCosts[0])</code>
                          <br />衡量保持还是置换，使得累计总净成本支出最小。
                        </p>
                      </>
                    ) : problemType === 'production_inventory' ? (
                      <>
                        <div className="font-mono text-xs text-indigo-300">
                          DP[t][s] = min_x ( SetupCost(x) + UnitCost * x + HoldingCost * s_new + DP[t-1][s_new] )
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          本期期末库存 s_new = s + x - D_t，其中 s 为期初库存，x 为生产件数：
                          <br />• <strong>本期花费</strong>: 生产启动固定成本与可变件数费用，加本期库存保有成本。
                          <br />• <strong>继承开销</strong>: 加上上阶段期末库存状态的最优开销：<code className="text-indigo-300 font-mono">DP[t-1][s_new]</code>
                          <br />在所有可行生产配额中取最小值。
                        </p>
                      </>
                    ) : problemType === 'markov_portfolio' ? (
                      <>
                        <div className="font-mono text-xs text-indigo-300">
                          DP[i][j] = max_x ( DP[i-1][j-x] + returns[i-1][x] )
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          非线性边际回报特征的资产配置：
                          <br />• <strong>项目配置预算 (x)</strong>: 向当前第 i 个资产分配 x 单位预算，直接获得收益 <code className="text-indigo-300 font-mono">returns[i-1][x]</code>。
                          <br />• <strong>前置子结构继承</strong>: 剩余预算 $j - x$ 在前面 $i - 1$ 个理财资产上的最优分配收益：<code className="text-indigo-300 font-mono">DP[i-1][j-x]</code>。
                          <br />在所有可能的分配梯度 $0 \le x \le j$ 中寻找累加期望收益最大值。
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="font-mono text-xs text-indigo-300">
                          DP[i][j] = max_x ( DP[i-1][j-x] + returns[i-1][x] )
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          资源最优分配问题的状态转移方程：
                          <br />• <strong>子项目指派资源量 (x)</strong>: 尝试向第 i 个任务指派资源梯度量 x，获得直接边际产出 <code className="text-indigo-300 font-mono">returns[i-1][x]</code>。
                          <br />• <strong>历史状态继承</strong>: 剩余 $j - x$ 的可用资源分配给前置 $i - 1$ 个项目时累积的最大产出：<code className="text-indigo-300 font-mono">DP[i-1][j-x]</code>。
                          <br />遍历 $0 \le x \le j$ 的可能配置梯度，求得最大总研发/生产收益。
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AI 导师智能洞察 */}
            {activeTab === 'ai' && (
              <div className="animate-fadeIn min-h-[300px] flex flex-col gap-6">
                {/* Top Control Bar */}
                <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <h3 className="text-base font-bold text-slate-900">
                      AI 智能决策与互动导师
                    </h3>
                    <button
                      onClick={() => setShowLlmSettings(true)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                      title="配置大模型"
                    >
                      <Settings className="w-4 h-4 animate-spin-slow" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border border-slate-200/55">
                      模型: {llmModel === 'gemini-1.5-flash' ? 'Gemini 1.5 Flash' : 'DeepSeek-V4-Pro'}
                    </span>
                    <button
                      onClick={() => requestAiInsight()}
                      disabled={isAiLoading}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-150 transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      重新生成报告
                    </button>
                  </div>
                </div>

                {/* Split Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT COLUMN: AI REPORT */}
                  <div className="border border-slate-200/85 rounded-xl bg-white p-5 shadow-sm flex flex-col gap-4 relative min-h-[450px]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          当前决策配置智能报告
                        </h4>
                      </div>
                    </div>

                    {isAiLoading ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4">
                        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-xs font-semibold text-slate-700 animate-pulse">
                          {aiProgressText}
                        </div>
                        <p className="text-[10px] text-slate-400 text-center">正在读取并评估您的状态矩阵，请稍候...</p>
                      </div>
                    ) : aiInsight ? (
                      <div className="prose prose-sm max-w-none text-slate-600 prose-headings:text-slate-900 prose-headings:font-bold prose-code:text-indigo-600 prose-code:bg-slate-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-strong:text-slate-900 whitespace-pre-wrap max-h-[500px] overflow-y-auto pr-2">
                        <ReactMarkdown>{aiInsight}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-3 text-center">
                        <div className="p-3 rounded-full bg-slate-50 text-slate-400">
                          <Brain className="w-8 h-8" />
                        </div>
                        <span className="text-xs font-medium text-slate-500">尚无报告内容</span>
                        <p className="text-[11px] text-slate-400 max-w-[250px]">
                          点击上方“重新生成报告”按钮，即可拉取大模型进行实时矩阵分析。
                        </p>
                        <button
                          onClick={() => requestAiInsight()}
                          className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition-all"
                        >
                          立即生成报告
                        </button>
                      </div>
                    )}
                  </div>

                  {/* RIGHT COLUMN: Q&A */}
                  <div className="border border-slate-200/85 rounded-xl bg-white p-5 shadow-sm flex flex-col gap-4 min-h-[450px]">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-purple-50 text-purple-600">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          即时提问解答导师
                        </h4>
                      </div>
                    </div>

                    {/* INTERACTIVE STUDENT QUESTION INPUT */}
                    <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                      <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
                        支持针对当前问题的计算方案、状态方程或边界异常等细节进行即时追问。
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={userLlmQuestion}
                          onChange={(e) => setUserLlmQuestion(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isAnswerLoading && userLlmQuestion.trim()) {
                              requestAiAnswer(userLlmQuestion);
                            }
                          }}
                          placeholder="e.g. 这个背包问题为什么先填上一行？如何压缩空间复杂度？"
                          className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                        <button
                          onClick={() => {
                            if (!userLlmQuestion.trim()) {
                              alert('请输入具体的问题。');
                              return;
                            }
                            requestAiAnswer(userLlmQuestion);
                          }}
                          disabled={isAnswerLoading || !userLlmQuestion.trim()}
                          className="bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm whitespace-nowrap transition"
                        >
                          发送提问
                        </button>
                      </div>
                    </div>

                    {/* Q&A OUTPUT */}
                    <div className="flex-1 flex flex-col justify-between border border-slate-100 rounded-xl p-3.5 min-h-[220px] max-h-[380px] overflow-y-auto">
                      {isAnswerLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3">
                          <div className="w-7 h-7 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-[11px] font-semibold text-slate-600 text-center animate-pulse">
                            {answerProgressText}
                          </span>
                        </div>
                      ) : aiAnswer ? (
                        <div className="prose prose-sm max-w-none text-slate-600 prose-headings:text-slate-900 prose-headings:font-bold prose-code:text-purple-600 prose-code:bg-slate-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono whitespace-pre-wrap">
                          <ReactMarkdown>{aiAnswer}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2 text-slate-400">
                          <HelpCircle className="w-7 h-7 stroke-1" />
                          <span className="text-xs font-medium text-slate-500">暂无提问历史</span>
                          <p className="text-[10px] text-slate-400 max-w-[200px]">
                            在上方对话框中输入关于本决策参数的任意疑惑，AI 导师会直接对状态矩阵进行解读。
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PYTHON 验证 (在线执行与调试) */}
            {activeTab === 'python' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                {/* Left controls and editor panel (7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Code className="w-5 h-5 text-amber-500" />
                      Python 求解验证工作台 (在线可编辑、可执行)
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      系统已根据当前页面左侧设定的<strong>运筹学参数</strong>动态生成了最优子结构递推源码。你可以在下方直接修改代码，并点击运行，直接在浏览器内验证你的算法设计！
                    </p>
                  </div>

                  {/* Code Editor Box */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-slate-950">
                    <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-mono font-bold text-slate-300">solve_dp.py</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Reset current parameters button */}
                        <button
                          onClick={() => {
                            setCustomPythonCode(getPythonCodeForCurrentParams());
                            setPythonOutput('ℹ️ 已重新将当前左侧控制器的输入参数同步至代码中。');
                          }}
                          className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700/80"
                          title="使用当前运行参数重新生成代码"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          同步当前参数
                        </button>

                        {/* Copy Code Button */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(customPythonCode);
                            setCodeCopied(true);
                            setTimeout(() => setCodeCopied(false), 2000);
                          }}
                          className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 px-2 py-1 rounded bg-slate-800 border border-slate-700/80"
                        >
                          {codeCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-medium">已复制!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>复制源码</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={customPythonCode}
                      onChange={(e) => setCustomPythonCode(e.target.value)}
                      className="w-full h-96 p-4 bg-slate-950 text-slate-100 font-mono text-xs focus:outline-none focus:ring-0 leading-relaxed resize-none border-0"
                      spellCheck="false"
                      placeholder="# 请在此处编写或粘贴你的 Python 3 代码"
                    />

                    <div className="bg-slate-900/90 px-4 py-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        💡 支持标准 print() 及返回值 ans 的自动提取
                      </span>
                      
                      <button
                        onClick={() => runPythonCode(customPythonCode)}
                        disabled={isPyRunning}
                        className={`text-xs font-semibold px-5 py-2 rounded-lg flex items-center gap-2 shadow-md transition ${
                          isPyRunning 
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/10'
                        }`}
                      >
                        {isPyRunning ? (
                          <>
                            <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            <span>正在执行中...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>运行 Python 代码</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right sandbox terminal output panel (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-indigo-600" />
                      WebAssembly 极速执行终端 (Sandbox Terminal)
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      该验证沙箱完全在浏览器本地利用 <strong>Pyodide (WebAssembly)</strong> 编译并运行，无需调用后台服务器接口，100% 离线，安全、瞬时，且可在任何静态/容器环境运行。
                    </p>
                  </div>

                  {/* Terminal Screen Container */}
                  <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner flex flex-col flex-1 min-h-[300px]">
                    <div className="bg-slate-900/50 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span className="text-[10px] font-mono text-slate-500 ml-2">stdout_terminal_io</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-600">Python 3.11</span>
                    </div>

                    <div className="p-4 flex-1 font-mono text-xs overflow-y-auto max-h-[380px] text-slate-300 space-y-2 whitespace-pre-wrap">
                      {pythonOutput ? (
                        <div>{pythonOutput}</div>
                      ) : (
                        <div className="text-slate-500 italic">
                          {`>>> 终端就绪。
>>> 点击左侧的「运行 Python 代码」按钮，即可动态编译并测试运算。
>>> 代码中已全局搭载 numpy 级原生支持，你也可以自行更改输入或方程。`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: 性能趋势分析 */}
            {activeTab === 'performance' && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-rose-500" />
                        动态规划双维度复杂度演进与敏感性评测
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        通过实时调节下方的数据规模 Slider (N, W)，在多维度图表中同步探究时空复杂度在极限数据规模下的增长曲线。
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></span>
                      <span className="text-xs font-semibold text-indigo-700">实时演进计算器</span>
                    </div>
                  </div>

                  {/* SLIDERS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-slate-100 mt-2">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                          决策阶段维度 $N$ (物品数量 / 序列 1 长度)
                        </label>
                        <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          N = {simN}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="100"
                        value={simN}
                        onChange={(e) => setSimN(parseInt(e.target.value, 10))}
                        className="w-full accent-rose-500"
                      />
                      <span className="text-[10px] text-slate-400">
                        代表阶段或状态行数。滑动以模拟大规模计算。
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                          状态物理维度 $W$ (背包容量 / 序列 2 长度)
                        </label>
                        <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          W = {simW}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="500"
                        value={simW}
                        onChange={(e) => setSimW(parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400">
                        代表状态总宽度。该维度对一维空间优化影响最显著。
                      </span>
                    </div>
                  </div>

                  {/* complexity stats bento */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">填表时间复杂度</span>
                      <span className="text-sm font-extrabold text-slate-800 mt-1 font-mono">O(N × W)</span>
                      <span className="text-[9px] text-emerald-600 mt-1 font-medium">基本多项式时间</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">二维物理空间</span>
                      <span className="text-sm font-extrabold text-slate-800 mt-1 font-mono">O(N × W)</span>
                      <span className="text-[9px] text-amber-600 mt-1 font-medium">传统 2D 矩阵暂存</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">空间压缩极限</span>
                      <span className="text-sm font-extrabold text-slate-800 mt-1 font-mono">O(W)</span>
                      <span className="text-[9px] text-indigo-600 mt-1 font-medium">一维滚动数组覆盖</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">当前计算步数</span>
                      <span className="text-sm font-extrabold text-rose-600 mt-1 font-mono">{(simN * simW).toLocaleString()} 步</span>
                      <span className="text-[9px] text-rose-500 mt-1 font-medium">总迭代元运算</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col justify-between col-span-2 md:col-span-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">一维物理内存开销</span>
                      <span className="text-sm font-extrabold text-emerald-600 mt-1 font-mono">
                        {simW ? (Math.round(((simW + 1) * 4) / 10.24) / 100).toFixed(2) : '0.00'} KB
                      </span>
                      <span className="text-[9px] text-emerald-600 mt-1 font-medium">
                        比2D节约 {(100 - (((simW + 1) * 4) / ((simN + 1) * (simW + 1) * 4)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* VISUAL CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* CHART 1: Quadratic Expansion */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                        1. 双维等比例扩张下的二次增长曲线 O(N × W)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        展示当决策维度 N 与 状态维度 W 同时翻倍扩大时，单元填表步数的非线性抛物线型扩张（即二次多项式增长）。
                      </p>
                    </div>

                    <div className="h-64 w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={Array.from({ length: 10 }, (_, idx) => {
                            const k = idx + 1;
                            const n = k * simN;
                            const w = k * simW;
                            const steps = n * w;
                            const mem2D = Math.round(((n + 1) * (w + 1) * 4) / 1024 * 10) / 10;
                            return {
                              scale: `${k}x`,
                              "状态计算步数": steps,
                              "2D空间占用(KB)": mem2D,
                              "1D空间占用(KB)": Math.round(((w + 1) * 4) / 1024 * 100) / 100
                            };
                          })}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="scale" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                            itemStyle={{ color: '#fff', fontSize: '11px' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                          <Area type="monotone" dataKey="状态计算步数" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorSteps)" />
                          <Line type="monotone" dataKey="2D空间占用(KB)" stroke="#6366f1" strokeWidth={1.5} dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100/60 leading-relaxed">
                      📌 <strong>算法解析</strong>：在双维等比例扩展图谱中，当扩张倍数增大时，<strong>状态计算步数 (粉色区域)</strong> 呈抛物线增长。而二维物理空间由于大小为 $(N+1) \times (W+1)$ 同样按二次曲线上升，相比之下，一维压缩后的滚动数组空间仅是线性增长，极大节省了高维计算环境下的内存驻留。
                    </div>
                  </div>

                  {/* CHART 2: Variable Sensitivity */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                        2. 复杂度敏感性测试（单变量偏导线性敏感性）
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        探讨当仅改变其中一个物理维度时计算量的反应。X轴代表该变量相对于当前设定值的百分比 (0% 至 200%)。
                      </p>
                    </div>

                    <div className="h-64 w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={Array.from({ length: 11 }, (_, idx) => {
                            const pct = idx * 20;
                            const factor = pct / 100;
                            return {
                              percentage: `${pct}%`,
                              "固定 N 改变 W (计算步数)": Math.round(simN * (simW * factor)),
                              "固定 W 改变 N (计算步数)": Math.round((simN * factor) * simW)
                            };
                          })}
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="percentage" stroke="#94a3b8" fontSize={10} />
                          <YAxis stroke="#94a3b8" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                            labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                            itemStyle={{ color: '#fff', fontSize: '11px' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                          <Line type="monotone" dataKey="固定 N 改变 W (计算步数)" stroke="#0ea5e9" strokeWidth={2} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="固定 W 改变 N (计算步数)" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100/60 leading-relaxed">
                      📌 <strong>偏导数分析</strong>：若固定其中一维（如 N 保持不变），则步数 Steps(W) = N * W 是关于 W 的一阶线性函数（<strong>天蓝色实线</strong>）。
                      这表明，虽然动态规划在多变量下是二次的，但在控制单变量时，增长完全是线性的。
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: 报告预览与导出 */}
            {activeTab === 'export' && (
              <div className="flex flex-col gap-6 max-w-5xl mx-auto py-2 animate-fadeIn">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        一键汇编实验报告 & 在线预览
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        报告已根据你当前的<b>运筹学输入参数</b>、决策矩阵数值及回溯路径自动装载与排版。你可以在下方实时预览完整的 Markdown 报告，确认无误后点击右侧按钮直接下载。
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    <button
                      onClick={downloadReport}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-md hover:shadow-emerald-600/10 transition flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      下载 Markdown 实验报告
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono text-center sm:text-left">
                      格式: .md (带标准 LaTeX 公式)
                    </span>
                  </div>
                </div>

                {/* Live Report Preview Section */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 md:p-8 shadow-inner">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
                    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                      报告实时在线预览 (Live Report Preview)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">DP_LAB_REPORT.md</span>
                  </div>

                  {/* Document Paper Container */}
                  <div className="bg-white rounded-xl border border-slate-200/80 p-6 md:p-10 shadow-md max-w-4xl mx-auto">
                    <div className="prose prose-sm max-w-none text-slate-700 prose-headings:text-slate-900 prose-headings:font-bold prose-h1:text-xl prose-h2:text-base prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2 prose-h2:mt-6 prose-strong:text-slate-900 prose-code:text-emerald-700 prose-code:bg-slate-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-ul:list-disc prose-ul:pl-5 whitespace-pre-wrap leading-relaxed">
                      <ReactMarkdown>{generateReportMarkdown()}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: 知识导引 */}
            {activeTab === 'knowledge' && (
              <div className="animate-fadeIn space-y-6 max-w-5xl mx-auto py-2">
                <div className="bg-gradient-to-r from-indigo-50 to-sky-50 border border-indigo-100/80 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        运筹学动态规划 (Dynamic Programming) 知识体系图谱
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        动态规划是由美国数学家 <strong>理查德·贝尔曼 (Richard Bellman)</strong> 于 1950 年代提出，是一种通过将复杂问题分解为相对简单的子问题来求解的方法。它广泛应用于运筹学、优化控制、经济管理决策以及计算生物学。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
                    <div className="text-indigo-600 font-bold text-lg mb-2 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-xs flex items-center justify-center font-mono">1</span>
                      最优子结构
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">
                      原问题的最优解包含了子问题的最优解。也就是说，我们不需要枚举所有可能性，只需根据子问题的最优决策，就能直接合成上一层大问题的最优决策。
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
                    <div className="text-indigo-600 font-bold text-lg mb-2 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-xs flex items-center justify-center font-mono">2</span>
                      重叠子问题
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">
                      在递归推导中，相同的子问题会被重复计算多次。动态规划通过<strong>“空间换时间”</strong>，维护一张决策状态表（DP Table），每个子问题仅计算一次并将其持久化，极大地避免了指数级的重复开销。
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition">
                    <div className="text-indigo-600 font-bold text-lg mb-2 flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-xs flex items-center justify-center font-mono">3</span>
                      无后效性
                    </div>
                    <p className="text-xs text-slate-500 leading-normal">
                      “未来与过去无关，只受当前状态制约”。一旦某个阶段的状态被确定下来，此状态以后的演变和发展将不再受该状态以前决策过程的影响。
                    </p>
                  </div>
                </div>

                {/* AI Era Applications of DP */}
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                      大模型与 AI 时代：动态规划的黄金应用场景
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      传统经典优化算法不仅没有随着大模型崛起而没落，反而成为了现代大语言模型（LLM）、强化学习（RL）及智能体（Agent）系统的底层核心基石。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-2 hover:border-slate-700 transition">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs sm:text-sm">
                        <Cpu className="w-4 h-4 text-indigo-400" />
                        LLM 文本生成：束搜索 (Beam Search)
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                        在生成每一步单词（Token）时，并非每次只盲目选择概率最高的一个，而是通过<strong>束搜索（Beam Search）</strong>等动态规划剪枝策略，维护多条候选生成路径，以全局最优子结构求得整体最通顺、最符合上下文逻辑的长句文本。
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-2 hover:border-slate-700 transition">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                        <GitBranch className="w-4 h-4 text-emerald-400" />
                        推理与通用大模型（DeepSeek-V4-Pro / o1）的系统二思考
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                        推理大模型通过<strong>蒙特卡洛树搜索 (MCTS)</strong> 与<strong>贝尔曼方程 (Bellman Equation) 倒推</strong>，在内部展开庞大的思维树。通过状态值估算与决策回溯倒退，规划出正确推理路径。动态规划是实现大模型“自主纠错、深度推理”的最核心方法。
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-2 hover:border-slate-700 transition">
                      <div className="flex items-center gap-2 text-purple-400 font-bold text-xs sm:text-sm">
                        <Layers className="w-4 h-4 text-purple-400" />
                        强化学习与人类反馈对齐（RLHF）
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                        在通过人类反馈对大模型进行对齐（RLHF）时，模型的核心优化目标正是基于马尔可夫决策过程（MDP）。大名鼎鼎的近端策略优化（PPO）和价值梯度回溯推导，其数学本质全部植根于<strong>贝尔曼最优化原理 (Bellman Optimality Principle)</strong>。
                      </p>
                    </div>

                    <div className="bg-slate-950 border border-slate-800/80 p-5 rounded-xl space-y-2 hover:border-slate-700 transition">
                      <div className="flex items-center gap-2 text-sky-400 font-bold text-xs sm:text-sm">
                        <Zap className="w-4 h-4 text-sky-400" />
                        投机解码 (Speculative Decoding) 与 KV 缓存
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">
                        为了极速提升大模型推理性能，算力框架将超小模型（Draft Model）生成的低成本文本流，通过<strong>序列最大匹配度对齐算法（基于动态规划）</strong>在主大模型中进行一键并行快速验证，最大化了 GPU 的计算密度和生成速度。
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mathematical Framework Summary */}
                <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      <Code className="w-4 h-4 text-indigo-500" />
                      核心问题状态转移方程与数学推导速查
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold">STATE EQUATION MATRIX</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {/* 1. Knapsack */}
                    <div className="p-5 hover:bg-slate-50/40 transition">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            1. 0-1 背包问题 (0/1 Knapsack)
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">有限资源上限下的离散决策最优价值搭配博弈</p>
                        </div>
                        <span className="text-[10px] font-semibold bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono">Time: O(N*W) | Space: O(W)</span>
                      </div>
                      <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-100 space-y-2 overflow-x-auto">
                        <div className="text-indigo-400">// 状态定义: dp[i][j] 表示前 i 个物品在背包剩余容量为 j 时的最大累计总收益</div>
                        <div className="text-amber-300">if weights[i-1] &gt; j:</div>
                        <div className="pl-4 text-emerald-400">dp[i][j] = dp[i-1][j]  <span className="text-slate-500">// 背包容量不足，无法装入，直接承袭旧状态</span></div>
                        <div className="text-amber-300">else:</div>
                        <div className="pl-4 text-emerald-400">dp[i][j] = max( dp[i-1][j], dp[i-1][j - weights[i-1]] + values[i-1] )  <span className="text-slate-500">// 抉择：【不放入】与【放入本项目并损耗相应容量】取最大值</span></div>
                      </div>
                    </div>

                    {/* 2. Shortest Path */}
                    <div className="p-5 hover:bg-slate-50/40 transition">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            2. 网络最短路径规划 (Shortest Path Routing)
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">自网格起点 (0,0) 至目标坐标 (i,j) 的累计最低通过成本寻优</p>
                        </div>
                        <span className="text-[10px] font-semibold bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-mono">Time: O(Row*Col) | Space: O(Col)</span>
                      </div>
                      <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-100 space-y-2 overflow-x-auto">
                        <div className="text-indigo-400">// 状态定义: dp[i][j] 表示到达网络网格点 (i, j) 的累积最低通行开销</div>
                        <div className="text-amber-300">if i == 0 and j == 0:</div>
                        <div className="pl-4 text-emerald-400">dp[0][0] = grid[0][0]</div>
                        <div className="text-amber-300">elif i == 0: dp[0][j] = dp[0][j-1] + grid[0][j] <span className="text-slate-500">// 第一行边缘单向延伸</span></div>
                        <div className="text-amber-300">elif j == 0: dp[i][0] = dp[i-1][0] + grid[i][0] <span className="text-slate-500">// 第一列边缘单向延伸</span></div>
                        <div className="text-amber-300">else:</div>
                        <div className="pl-4 text-emerald-400">dp[i][j] = grid[i][j] + min( dp[i-1][j], dp[i][j-1] )  <span className="text-slate-500">// 决策：比较从上方移入与左方移入的最低路径累加开销</span></div>
                      </div>
                    </div>

                    {/* 3. Equipment Replacement */}
                    <div className="p-5 hover:bg-slate-50/40 transition">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                            3. 设备更新更新决策 (Equipment Replacement Decision)
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">规划周期内各年设备服役役龄在【保持现状】与【置换新机】之间的最优权衡</p>
                        </div>
                        <span className="text-[10px] font-semibold bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded font-mono">Time: O(T*Age) | Space: O(Age)</span>
                      </div>
                      <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-100 space-y-2 overflow-x-auto">
                        <div className="text-indigo-400">// 状态定义: dp[t][x] 表示第 t 年初设备服役年龄为 x 岁（服役第x年）时的最低累计运营净成本</div>
                        <div className="text-indigo-400">// 1. 保持决策 (Keep): 役龄累加 1 岁，支付当前役龄高额运行维护费 op_cost[x-1]</div>
                        <div className="text-emerald-400">dp[t][x] = dp[t-1][x-1] + operating_costs[x-1]  <span className="text-slate-500">// (对 x ≥ 2)</span></div>
                        <div className="text-indigo-400">// 2. 置换决策 (Replace): 变卖旧机（折抵回收价 resale[prev_x]），买新机（加购入费 purchase_cost 且今年役龄重归 1 岁）</div>
                        <div className="text-emerald-400">dp[t][0] = min( dp[t-1][prev_x] + purchase_cost - resale_values[prev_x] + operating_costs[0] ) <span className="text-slate-500">// 对所有上一代可行役龄寻优</span></div>
                      </div>
                    </div>

                    {/* 4. Production & Inventory Balancing */}
                    <div className="p-5 hover:bg-slate-50/40 transition">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            4. 生产与库存控制决策 (Production & Inventory Balancing)
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">在生产启动开点费用、可变生产费与多余库存保管费之间的最优多阶段平衡排产</p>
                        </div>
                        <span className="text-[10px] font-semibold bg-purple-50 border border-purple-100 text-purple-700 px-2 py-0.5 rounded font-mono">Time: O(T*S^2) | Space: O(S)</span>
                      </div>
                      <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-100 space-y-2 overflow-x-auto">
                        <div className="text-indigo-400">// 状态定义: dp[t][s] 表示第 t 期末保有库存量为 s 时的最低累计总成本</div>
                        <div className="text-indigo-400">// 本期生产量 x = s + demand - prev_s (prev_s 为上期末库存且必须满足 x &gt;= 0)</div>
                        <div className="text-indigo-400">// 本期生产成本 prod_cost = (setup_cost + unit_cost * x) if x &gt; 0 else 0; 保管费 hold_cost = holding_cost * s</div>
                        <div className="text-emerald-400">dp[t][s] = min( dp[t-1][prev_s] + prod_cost + hold_cost )  <span className="text-slate-500">// 遍历所有上一期可达的期末库存 prev_s</span></div>
                      </div>
                    </div>

                    {/* 5. Markov Portfolio Investment */}
                    <div className="p-5 hover:bg-slate-50/40 transition">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                            5. 马尔可夫投资组合配资 (Markov Portfolio Investment)
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">将总预算科学分配到多个具有非线性边际期望回报特征资产上的决策寻优</p>
                        </div>
                        <span className="text-[10px] font-semibold bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded font-mono">Time: O(N*B^2) | Space: O(B)</span>
                      </div>
                      <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-100 space-y-2 overflow-x-auto">
                        <div className="text-indigo-400">// 状态定义: dp[i][j] 表示前 i 个项目在可支配总预算 j 约束下的最大化累计期望回报</div>
                        <div className="text-indigo-400">// 本次配置决策 x 表示分配给当前第 i 个资产的资金量 (0 &le; x &le; j)，returns[i-1][x] 表示对应直接收益</div>
                        <div className="text-emerald-400">dp[i][j] = max( dp[i-1][j-x] + returns[i-1][x] )  <span className="text-slate-500">// 遍历当前可指派的所有预算档次梯度 x 并寻优</span></div>
                      </div>
                    </div>

                    {/* 6. Resource Allocation */}
                    <div className="p-5 hover:bg-slate-50/40 transition">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
                            6. 资源最优化指派决策 (Optimal Resource Allocation)
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">向多个独立研发或建设子任务派发固定公共物资、专家人次的总产出最大化指派</p>
                        </div>
                        <span className="text-[10px] font-semibold bg-sky-50 border border-sky-100 text-sky-700 px-2 py-0.5 rounded font-mono">Time: O(N*R^2) | Space: O(R)</span>
                      </div>
                      <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-100 space-y-2 overflow-x-auto">
                        <div className="text-indigo-400">// 状态定义: dp[i][j] 表示前 i 个子任务被指派总资源量为 j 时的最大累计期望收益</div>
                        <div className="text-indigo-400">// 本期决策 x 代表分配给当前第 i 个任务的物理资源量 (0 &le; x &le; j)，returns[i-1][x] 对应其边际效果值</div>
                        <div className="text-emerald-400">dp[i][j] = max( dp[i-1][j-x] + returns[i-1][x] )  <span className="text-slate-500">// 遍历指派当前任务的全部资源量选项 x 并与历史状态累计之和求大</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/60 flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
                    <Sparkles className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-xs text-indigo-900 leading-normal">
                    💡 <strong>运筹学决策建议</strong>：多阶段决策是运筹科学的重要基石。
                    在实际的大型项目配载、网络流同步、智能电网分配和基因大算力分析场景中，动态规划通过科学剪枝和状态持久，展现了其相比传统贪心算法和蛮力搜索的无与伦比优势。
                    您可以通过左上角的<strong>参数设定面板</strong>自定义您的算子，并在<strong>可视化网格</strong>中观察其前向推演与回溯链路的契合。
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </footer>

      {/* LARGE MODEL SETTINGS MODAL */}
      {showLlmSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scaleUp">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400 animate-spin-slow" />
                <h3 className="text-sm font-bold">大模型智能导师设置</h3>
              </div>
              <button 
                onClick={() => setShowLlmSettings(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4 text-slate-700">
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-[11px] text-indigo-900 leading-normal">
                📌 <strong>GitHub 静态部署支持</strong>：本项目已原生适配 GitHub Pages 等静态托管平台。
                为了保护 API 安全，<strong>所有大模型调用均直接在浏览器客户端安全进行</strong>，必须手工填入 API-Key 才能激活。
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  1. 手工输入 API-Key <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="password"
                  placeholder="请输入您的大模型 API-Key"
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. 选择大模型 (Gemini 1.5 Flash / DeepSeek-V4-Pro)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLlmModel('gemini-1.5-flash')}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all ${
                      llmModel === 'gemini-1.5-flash'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold">Gemini 1.5 Flash</span>
                    <span className="text-[10px] text-slate-400 font-normal">快速且高度精准</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLlmModel('deepseek-v4-pro')}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 transition-all ${
                      llmModel === 'deepseek-v4-pro'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold">DeepSeek-V4-Pro</span>
                    <span className="text-[10px] text-slate-400 font-normal">旗舰专业版与超强推理</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>自定义 API 代理终结点 (可选)</span>
                  <span className="text-[10px] text-slate-400 font-normal">若有内网穿透或代理可填</span>
                </label>
                <input 
                  type="text"
                  placeholder="e.g. https://api.openai-sb.com"
                  value={llmCustomEndpoint}
                  onChange={(e) => setLlmCustomEndpoint(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-600"
                />
              </div>

              <div className="mt-2 border-t border-slate-100 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLlmSettings(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2 px-4 rounded-lg transition"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!llmApiKey) {
                      alert('请填入大模型 API Key 才能保存确认。');
                      return;
                    }
                    localStorage.setItem('llm_api_key', llmApiKey);
                    localStorage.setItem('llm_model', llmModel);
                    localStorage.setItem('llm_custom_endpoint', llmCustomEndpoint);
                    setShowLlmSettings(false);
                    requestAiInsight();
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition"
                >
                  3. 确认大模型
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
