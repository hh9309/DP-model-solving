import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// API routes FIRST
app.post("/api/ai-insights", async (req, res) => {
  const { problemType, params, dpTable, backtrackingPath } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    // Return a beautiful heuristic insight because the API key is not yet set
    return res.json({
      success: true,
      isFallback: true,
      insight: getHeuristicInsight(problemType, params, dpTable, backtrackingPath)
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `你是一个算法教学导师，正在指导学生学习动态规划。
针对当前用户输入的动态规划问题，请提供结构化、深度的 AI 洞察报告。

当前问题类型: ${problemType}
问题参数: ${JSON.stringify(params)}
最终 DP 状态表格最后一列值/或代表值: ${JSON.stringify(dpTable ? dpTable[dpTable.length - 1] : "未计算")}
回溯最优路径选择: ${JSON.stringify(backtrackingPath || "未计算")}

请根据以上输入，生成包含以下部分的 markdown 报告（使用简体中文）：
1. **状态空间与剪枝分析**：分析当前状态空间规模（如 N×W 或 N×M）。分析本问题是否存在可剪枝或提早退出的分支？如何降低实际运行时的常数复杂度？
2. **边界与特殊警告**：检查当前输入是否存在死锁、越界、或特定数学失效风险（例如：背包容量为0、负权重、空字符、全是非正数等）。如果有，请指出；如果没有，也请提供一种可能导致边界异常的极端边界测试用例及其预防机制。
3. **状态依赖树与优化路径**：分析该状态转移是自底向上（迭代填表）还是自顶向下（记忆化搜索）的最优。分析此问题如何进行空间压缩（如二维变一维滚动数组）？其状态更新顺序（例如：必须逆序遍历容量）为什么是这样的，写出空间压缩后的伪代码。

请用专业、亲和力强、条理清晰的学术语言撰写，不要使用自我夸大的词汇，保持客观严谨。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({
      success: true,
      insight: response.text || "未能生成洞察，请稍后重试。"
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.json({
      success: true,
      isFallback: true,
      error: error.message,
      insight: getHeuristicInsight(problemType, params, dpTable, backtrackingPath)
    });
  }
});

function getHeuristicInsight(problemType: string, params: any, dpTable: any, backtrackingPath: any) {
  if (problemType === 'knapsack') {
    const weights = params.weights || [];
    const values = params.values || [];
    const capacity = params.capacity || 0;
    const hasNegative = weights.some((w: number) => w < 0) || values.some((v: number) => v < 0);
    const zeroCapacity = capacity === 0;

    return `### 1. 状态空间与剪枝分析
* **状态规模分析**：当前物品数 $N = ${weights.length}$，背包容量 $W = ${capacity}$，总状态数 $O(N \\times W) = ${weights.length * capacity}$。
* **常数优化剪枝**：
  - **可行性剪枝**：在填表过程中，当容量 $j < w[i-1]$ 时，可以直接赋值 $dp[i][j] = dp[i-1][j]$，跳过复杂的 \`max\` 取值计算。
  - **前缀和剪枝**：如果剩余所有物品的价值总和加上当前已选价值，已经小于目前已知的最大价值，可以提前剪枝（常用于分支限界或记忆化搜索中）。

### 2. 边界与特殊警告
* **当前输入审查**：${hasNegative ? "⚠️ **警告**：检测到输入中包含负权重或负价值。标准的 01 背包动态规划方程假设物品属性非负。若权重为负，在没有经过平移转换的情况下，可能导致索引溢出或无后效性破坏。" : "✅ **安全**：当前输入的物品权重及价值均为正数，满足 01 背包无后效性约束。"}
* **特殊边界警告**：${zeroCapacity ? "⚠️ **零容量警告**：当前背包容量为 0，最优解显然为 0，DP 状态表将全为 0，属于退化的边缘用例。" : "💡 极端情况：如果 $W$ 极大（例如 $10^9$）而 $N$ 很小，直接填 $O(N \\times W)$ 的表会导致内存溢出（MLE）。此时应采用**超大背包问题**的优化策略（如双向搜索或基于价值的 DP，状态数变为 $O(N \\times \\sum V)$）。"}

### 3. 状态依赖与空间压缩路径
* **自底向上 vs 自顶向下**：
  - 当前可视化采用**自底向上(Bottom-Up)** 的迭代填表，按部就班填充二维表格。
  - **自顶向下(Top-Down) + 记忆化**：在状态树极其稀疏时（即很多 $dp[i][j]$ 状态根本不可能被访问到），记忆化搜索（Memoization）效率通常远高于迭代填表，因为它可以避免计算不可达的状态。
* **空间复杂度压缩 $O(W)$**：
  - 二维状态转移方程：$dp[i][j] = \\max(dp[i-1][j], dp[i-1][j-w[i]] + v[i])$。
  - 观察发现，$dp[i][j]$ 仅依赖于上一行的正上方格子 $dp[i-1][j]$ 和左上方格子 $dp[i-1][j-w[i]]$。
  - 因此可将空间压缩为一维数组 \`dp[j]\`。为防止同一物品被重复选择（退化为完全背包），**必须逆序**（从 $W$ 到 $w[i]$）进行更新：
  \`\`\`python
  for i in range(N):
      for j in range(W, weights[i] - 1, -1): # 必须逆序
          dp[j] = max(dp[j], dp[j - weights[i]] + values[i])
  \`\`\`
  逆序更新确保了在计算 \`dp[j]\` 时，右侧依赖的 \`dp[j-weights[i]]\` 仍保存着“上一阶段”（即未考虑第 $i$ 个物品）的值。`;
  } else if (problemType === 'lcs') {
    const s1 = params.s1 || "";
    const s2 = params.s2 || "";
    return `### 1. 状态空间与剪枝分析
* **状态规模分析**：字符串 $S_1$ 长度 $N = ${s1.length}$，字符串 $S_2$ 长度 $M = ${s2.length}$，状态空间 $O(N \\times M) = ${s1.length * s2.length}$。
* **常数优化剪枝**：
  - **首尾公共子串预剪枝**：若两字符串有共同的前缀或后缀，可先将其截取出来（如 $S_1 = \\text{"ab"}\\dots\\text{"cd"}$，$S_2 = \\text{"ab"}\\dots\\text{"cd"}$），仅对中间不同部分进行 DP 计算，计算完成后在结果上直接加上前缀和后缀长度。这种预处理能极大地减小实际 DP 矩阵的大小。

### 2. 边界与特殊警告
* **空串异常**：${s1.length === 0 || s2.length === 0 ? "⚠️ **空串警告**：输入的字符串之一为空，最长公共子序列长度必然为 0。" : "✅ 正常输入。两字符串均非空。"}
* **高重复字符退化**：如果输入字符串全由单字符构成（例如 \`AAAAA\` 和 \`AAAAAA\`），则最优决策路径将非常单一且充斥重叠，可以直接通过双指针线性 $O(N)$ 解决，无需 $O(N \\times M)$ 的 DP。

### 3. 状态依赖与空间压缩路径
* **转移依赖树**：
  - $dp[i][j]$ 依赖于左上方 $dp[i-1][j-1]$（当字符匹配时），或者依赖于正上方 $dp[i-1][j]$ 和左侧 $dp[i][j-1]$（当不匹配时）。
* **空间压缩至 $O(\\min(N, M))$**：
  - 观察发现，计算当前行只需要上一行的数据。因此只需保留两行（当前行和上一行），空间复杂度可压缩为 $2 \\times \\min(N, M)$。
  - 进一步，通过引入一个临时变量 \`prev\` 暂存原本会被覆盖的 $dp[i-1][j-1]$（即左上方格子），我们可以仅用一个单行数组 \`dp[j]\` 并在正序更新中完成填表：
  \`\`\`python
  dp = [0] * (M + 1)
  for i in range(1, N + 1):
      prev = 0 # 相当于 dp[i-1][j-1]
      for j in range(1, M + 1):
          temp = dp[j] # 暂存上方的 dp[i-1][j]
          if s1[i-1] == s2[j-1]:
              dp[j] = prev + 1
          else:
              dp[j] = max(dp[j], dp[j-1])
          prev = temp
  \`\`\`
  这种精妙的“临时变量滑动更新”是一维空间压缩在非对称依赖时的经典范式。`;
  } else {
    const s1 = params.s1 || "";
    const s2 = params.s2 || "";
    return `### 1. 状态空间与剪枝分析
* **状态规模分析**：源字符串 $S_1$ 长度 $N = ${s1.length}$，目标字符串 $S_2$ 长度 $M = ${s2.length}$，状态空间 $O(N \\times M) = ${s1.length * s2.length}$。
* **常数优化与剪枝 (Ukkonen 算法)**：
  - 在实际拼写检查等应用中，我们往往只关心编辑距离是否在某个上限 $K$（如 2 或 3）以内。
  - 采用 **Ukkonen 剪枝算法**，我们只需要计算 DP 矩阵中主对角线周围宽度为 $2K + 1$ 的带状区域（即 $|i - j| \\le K$ 的格子），超出该范围的格子其编辑距离必然超过 $K$，因而无需计算。这可将时间复杂度降到 $O(K \\times \\min(N, M))$。

### 2. 边界与特殊警告
* **极端输入**：${s1 === s2 ? "✅ **完全匹配**：两字符串完全一致，编辑距离为 0。" : "💡 正常输入。两字符存在差异，需要进行编辑操作。"}
* **完全相异**：若两串完全不重合（如 \`ABC\` 和 \`XYZ\`），编辑距离即为最大长度 $\\max(N, M)$。初始化时，第一行 $dp[0][j] = j$（连续插入）和第一列 $dp[i][0] = i$（连续删除）是该算法的核心边界。若漏掉初始化，状态转移将完全错乱。

### 3. 状态依赖与空间压缩路径
* **多维决策机制**：
  - 编辑距离是最具代表性的“多路决策”DP，每个格子 $dp[i][j]$ 从三个方向转移而来：
    1. **删除操作**：来自上方 $dp[i-1][j] + 1$
    2. **插入操作**：来自左方 $dp[i][j-1] + 1$
    3. **替换操作**（或无操作）：来自左上方 $dp[i-1][j-1] + (s_1[i-1] == s_2[j-1] ? 0 : 1)$
* **空间压缩**：
  - 当前位置只依赖于当前行的左侧格子、上一行的上方格子及左上方格子。
  - 可以将其压缩到单行一维数组 \`dp[j]\`（长度为 $M+1$），同样需要一个额外变量 \`prev\` 来记录左上方的值（即未更新前的 \`dp[j-1]\`）：
  \`\`\`python
  dp = list(range(M + 1)) # 初始化第一行 [0, 1, ..., M]
  for i in range(1, N + 1):
      prev = dp[0] # 相当于上一行最左侧 of dp[i-1][0]
      dp[0] = i    # 对应当前行最左侧 of dp[i][0] = i
      for j in range(1, M + 1):
          temp = dp[j] # 暂存上方的 dp[i-1][j]
          if s1[i-1] == s2[j-1]:
              dp[j] = prev
          else:
              dp[j] = min(prev + 1,   # 替换
                          dp[j] + 1,  # 删除
                          dp[j-1] + 1)# 插入
          prev = temp
  \`\`\`
  在动画演进中，观察这种一维滚动的更新顺序和 \`prev\` 暂存器的值变换，能最直观地体现内存重用的美感。`;
  }
}

// Vite and static file serving configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
