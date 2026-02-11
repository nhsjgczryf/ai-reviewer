interface ReviewConfig {
  depth?: string;
  focusAreas?: string[];
  style?: string;
}

interface CodeAnalysis {
  lineCount: number;
  functions: { name: string; startLine: number; endLine: number }[];
  classes: { name: string; startLine: number; endLine: number }[];
  hasErrorHandling: boolean;
  hasConsoleLog: boolean;
  hasHardcodedSecrets: boolean;
  hasSqlInjection: boolean;
  hasEqualityIssues: boolean;
  hasVarDeclarations: boolean;
  hasNoResponseCheck: boolean;
  longFunctions: { name: string; startLine: number; endLine: number; length: number }[];
  secretLine: number | null;
  sqlLine: number | null;
  eqLine: number | null;
  varLine: number | null;
  fetchLine: number | null;
  passwordLine: number | null;
}

function analyzeCode(code: string, language: string): CodeAnalysis {
  const lines = code.split('\n');
  const lineCount = lines.length;
  const functions: CodeAnalysis['functions'] = [];

  const funcPatterns: Record<string, RegExp> = {
    javascript: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\(.*\)\s*=>))/,
    typescript: /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\(.*\)\s*=>))/,
    python: /^\s*(?:async\s+)?def\s+(\w+)/,
    java: /(?:public|private|protected|static|\s)+[\w<>\[\]]+\s+(\w+)\s*\(/,
    go: /^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)/,
    rust: /^\s*(?:pub\s+)?fn\s+(\w+)/,
  };
  const pattern = funcPatterns[language] || funcPatterns.javascript;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(pattern);
    if (match) {
      const name = match[1] || match[2] || 'anonymous';
      let endLine = i + 1;
      let braceCount = 0;
      let started = false;
      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') { braceCount++; started = true; }
          if (ch === '}') braceCount--;
        }
        if (started && braceCount <= 0) { endLine = j + 1; break; }
        if (j === lines.length - 1) endLine = j + 1;
      }
      functions.push({ name, startLine: i + 1, endLine });
    }
  }

  const classes: CodeAnalysis['classes'] = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/class\s+(\w+)/);
    if (match) {
      let endLine = i + 1;
      let braceCount = 0;
      let started = false;
      for (let j = i; j < lines.length; j++) {
        for (const ch of lines[j]) {
          if (ch === '{') { braceCount++; started = true; }
          if (ch === '}') braceCount--;
        }
        if (started && braceCount <= 0) { endLine = j + 1; break; }
        if (j === lines.length - 1) endLine = j + 1;
      }
      classes.push({ name: match[1], startLine: i + 1, endLine });
    }
  }

  const findLine = (pat: RegExp) => {
    for (let i = 0; i < lines.length; i++) {
      if (pat.test(lines[i])) return i + 1;
    }
    return null;
  };

  return {
    lineCount, functions, classes,
    hasErrorHandling: /try\s*\{|\.catch\(|except\s|rescue\s/.test(code),
    hasConsoleLog: /console\.(log|debug|info|warn)\s*\(/.test(code),
    hasHardcodedSecrets: /["'](sk-|api[_-]?key|password|secret|token)[^"']*["']/i.test(code),
    hasSqlInjection: /["'`]SELECT\s.*\+\s*\w|["'`]DELETE\s.*\+\s*\w/i.test(code),
    hasEqualityIssues: /[^!=]==[^=]/.test(code),
    hasVarDeclarations: /\bvar\s+/.test(code),
    hasNoResponseCheck: /await\s+fetch\(/.test(code) && !/\.ok\b|\.status\b/.test(code),
    longFunctions: functions.filter((f) => f.endLine - f.startLine > 20).map((f) => ({ ...f, length: f.endLine - f.startLine })),
    secretLine: findLine(/["'](sk-|api[_-]?key|token)[^"']*["']/i),
    sqlLine: findLine(/["'`](?:SELECT|DELETE)\s/i),
    eqLine: findLine(/[^!=]==[^=]/),
    varLine: findLine(/\bvar\s+/),
    fetchLine: findLine(/await\s+fetch\(/),
    passwordLine: findLine(/password/i),
  };
}

export function generateMockReview(code: string, language: string, config: ReviewConfig) {
  if (language === 'latex') return generateLatexMockReview(code, config);
  return generateCodeMockReview(code, language, config);
}

function generateCodeMockReview(code: string, language: string, config: ReviewConfig) {
  const a = analyzeCode(code, language);
  const criticals = (a.hasSqlInjection ? 1 : 0) + (a.hasHardcodedSecrets ? 1 : 0);
  const majors = (a.hasNoResponseCheck ? 1 : 0) + (a.hasEqualityIssues ? 1 : 0) + (!a.hasErrorHandling && a.functions.length > 1 ? 1 : 0) + (a.passwordLine ? 1 : 0);
  const minors = (a.hasVarDeclarations ? 1 : 0) + a.longFunctions.length + (a.hasConsoleLog ? 1 : 0);
  const score = Math.max(1, Math.min(10, Math.round(10 - criticals * 3 - majors * 1.5 - minors * 0.5)));
  const scoreLabel = score >= 8 ? '良好' : score >= 6 ? '尚可' : score >= 4 ? '需改进' : '较差';

  const fnNames = a.functions.map((f) => `\`${f.name}\``).join('、');
  const clsNames = a.classes.map((c) => `\`${c.name}\``).join('、');
  const s: string[] = [];

  // ── 概览 ──
  s.push(`# 代码评审报告\n`);
  s.push(`## 一、概览\n`);

  const parts: string[] = [];
  if (a.functions.length > 0) parts.push(`${a.functions.length} 个函数（${fnNames}）`);
  if (a.classes.length > 0) parts.push(`${a.classes.length} 个类（${clsNames}）`);

  s.push(`**代码意图**：本代码包含${parts.join('和') || `${a.lineCount} 行代码`}，${a.hasSqlInjection ? '涉及数据库查询操作，' : ''}${a.hasNoResponseCheck ? '包含 HTTP 请求，' : ''}整体呈现为一个数据处理与服务层模块。\n`);
  s.push(`**整体质量**：${score}/10 — ${scoreLabel}\n`);

  if (criticals > 0 || majors > 0) {
    s.push(`**风险概览**：代码存在 ${criticals} 个严重安全漏洞${majors > 0 ? `和 ${majors} 个重要问题` : ''}。${!a.hasErrorHandling ? '同时完全缺少错误处理机制。' : ''}在未经大幅修改的情况下，不建议将该代码部署到任何生产环境。\n`);
  } else {
    s.push(`**风险概览**：未发现严重问题，代码结构基本合理。建议关注以下细节改进。\n`);
  }

  // ── 架构与设计 ──
  s.push(`---\n\n## 二、架构与设计分析\n`);
  if (a.classes.length > 0) {
    s.push(`### 模块化\n\n代码采用面向对象与函数式混合风格，包含类 ${clsNames} 和独立函数 ${fnNames}。然而，各部分之间缺乏明确的模块边界和依赖管理。例如，\`${a.classes[0]?.name}\` 直接持有数据库连接引用，未通过接口或依赖注入进行解耦，这导致代码难以进行单元测试和后续替换。\n`);
  } else {
    s.push(`### 模块化\n\n代码包含 ${a.functions.length} 个顶层函数，采用纯函数式组织方式。函数之间耦合度较低，但缺乏清晰的分层结构——数据获取、业务逻辑和数据变换混杂在一起，不利于后续维护和扩展。\n`);
  }
  s.push(`### 抽象边界\n\n${a.functions.length > 3 ? '函数数量较多但缺乏分层抽象。数据访问、业务逻辑、数据转换等关注点混杂在同一层级中，建议引入 Repository / Service / Controller 等分层模式。' : '当前代码规模较小，抽象层次尚可。但随着功能增长，建议尽早引入分层架构以保持可维护性。'}\n`);
  s.push(`### 可扩展性\n\n${a.classes.length > 0 ? `\`${a.classes[0]?.name}\` 类直接操作 SQL 字符串，与特定数据库实现紧密耦合。若需切换数据库或增加缓存策略，需要大幅重写。建议引入 ORM 或 Repository 模式以提升灵活性。` : '当前函数式结构比较直接，但如果需要新增缓存、日志、备选数据源等功能，需要进行较大的结构调整。建议为关键操作定义接口。'}\n`);

  // ── 关键问题 ──
  s.push(`---\n\n## 三、关键问题\n`);
  let n = 0;

  if (a.hasSqlInjection) { n++; s.push(
`### ${n}. 🔴 严重：SQL 注入漏洞（第 ${a.sqlLine} 行附近）

**问题描述**：代码通过字符串拼接方式构建 SQL 查询语句，例如 \`"SELECT * FROM users WHERE id = " + id\`。攻击者可以通过构造恶意输入（如 \`1; DROP TABLE users--\`）执行任意 SQL 命令。

**影响**：这是 OWASP Top 10 中排名最高的安全漏洞之一。攻击者可以：
- 读取数据库中所有用户数据（包括密码、邮箱等敏感信息）
- 修改或删除数据库中的任意记录
- 在某些配置下甚至可以执行操作系统命令

**修改建议**：使用参数化查询替代字符串拼接：

\`\`\`javascript
// 修改前（危险）
this.db.query("SELECT * FROM users WHERE id = " + id);

// 修改后（安全）
this.db.query("SELECT * FROM users WHERE id = ?", [id]);
\`\`\`

同时建议引入 ORM（如 Prisma、Sequelize）从根本上避免手写 SQL。
`); }

  if (a.hasHardcodedSecrets) { n++; s.push(
`### ${n}. 🔴 严重：硬编码密钥/令牌（第 ${a.secretLine} 行）

**问题描述**：代码中直接以明文形式写入了 API 密钥或令牌（如 \`"sk-1234567890abcdef"\`）。这些敏感信息一旦提交到版本控制系统，将永久留存在提交历史中。

**影响**：
- 如果代码仓库被公开（即使短暂），密钥将立即暴露
- 攻击者可利用泄露的密钥访问第三方服务、产生费用或窃取数据
- 即使删除文件，Git 历史中仍可找到密钥

**修改建议**：
1. 立即吊销当前暴露的密钥并重新生成
2. 使用环境变量管理敏感配置：
\`\`\`javascript
// 修改前
token: "sk-1234567890abcdef"

// 修改后
token: process.env.API_TOKEN
\`\`\`
3. 在 \`.gitignore\` 中添加 \`.env\` 文件
4. 考虑使用 Vault 或 AWS Secrets Manager 等密钥管理服务
`); }

  if (a.passwordLine) { n++; s.push(
`### ${n}. 🟠 重要：敏感数据泄露风险（第 ${a.passwordLine} 行附近）

**问题描述**：\`password\` 等敏感字段被直接包含在输出数据中。在 \`processUserData\` 函数中，用户密码被原样复制到结果对象并返回，没有进行任何过滤或脱敏处理。

**影响**：如果该函数的返回值被用于 API 响应或日志输出，用户密码将直接暴露给前端或日志系统，构成严重的数据泄露风险。这同时违反 GDPR、个人信息保护法等数据隐私法规。

**修改建议**：
1. 在返回数据时显式排除敏感字段：
\`\`\`javascript
const { password, ...safeData } = user;
result.push({ ...safeData, name: fullName });
\`\`\`
2. 或使用 DTO（数据传输对象）模式，明确定义哪些字段可以对外暴露
`); }

  if (a.hasNoResponseCheck) { n++; s.push(
`### ${n}. 🟠 重要：HTTP 请求缺少错误处理（第 ${a.fetchLine} 行）

**问题描述**：\`fetchData\` 函数直接调用 \`fetch()\` 后立即解析 JSON，既未检查响应状态码（\`response.ok\`），也未添加 \`try/catch\` 捕获网络异常。

**影响**：
- 当服务器返回 4xx/5xx 错误时，\`response.json()\` 可能抛出异常或返回错误格式的数据
- 网络超时、DNS 解析失败等场景会导致未捕获的 Promise rejection
- 调用方无法区分"成功获取空数据"和"请求失败"两种情况

**修改建议**：
\`\`\`javascript
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`请求失败: HTTP \${response.status}\`);
    }
    return await response.json();
  } catch (error) {
    console.error('数据获取失败:', error);
    throw error;
  }
}
\`\`\`
`); }

  if (a.hasEqualityIssues) { n++; s.push(
`### ${n}. 🟠 重要：使用松散相等比较 \`==\`（第 ${a.eqLine} 行）

**问题描述**：代码使用了 \`==\`（松散相等）而非 \`===\`（严格相等）进行比较。松散相等会触发 JavaScript 的隐式类型转换，导致许多反直觉的结果。

**影响**：类型强制转换可能导致微妙的逻辑错误，特别是在权限判断场景中：
- \`"0" == false\` → \`true\`（可能导致权限绕过）
- \`null == undefined\` → \`true\`
- \`"" == 0\` → \`true\`

在 \`isAdmin: user.role == "admin"\` 这类权限判断中，使用松散比较尤其危险。

**修改建议**：将所有 \`==\` 替换为 \`===\`，并在项目中配置 ESLint 规则 \`eqeqeq\` 自动强制执行。
`); }

  if (!a.hasErrorHandling && a.functions.length > 1) { n++; s.push(
`### ${n}. 🟠 重要：完全缺少错误处理机制

**问题描述**：代码中没有任何 \`try/catch\` 块或其他错误处理模式。所有数据库操作、网络请求和数据处理均假设必定成功。

**影响**：在生产环境中，数据库连接中断、网络超时、用户输入异常等情况频繁发生。缺少错误处理意味着任何运行时错误都会直接导致程序崩溃，且无法提供有意义的错误信息给上层调用方。

**修改建议**：
- 为所有 I/O 操作（数据库查询、网络请求）添加 \`try/catch\` 包裹
- 定义统一的错误处理策略（如自定义错误类型、错误码体系）
- 在关键操作点添加日志记录，便于问题排查
`); }

  if (a.hasVarDeclarations) { n++; s.push(
`### ${n}. 🔵 次要：使用 \`var\` 声明变量（第 ${a.varLine} 行起）

**问题描述**：代码中大量使用 \`var\` 声明变量。\`var\` 具有函数作用域和变量提升特性，在现代 JavaScript 开发中已被 \`const\` 和 \`let\` 取代。

**影响**：\`var\` 的函数作用域可能在循环和条件块中引发意外行为（经典的闭包陷阱），增加代码理解和调试难度。

**修改建议**：将所有 \`var\` 替换为 \`const\`（不需要重新赋值的变量）或 \`let\`（需要重新赋值的变量）。作为经验法则，默认使用 \`const\`，只在确实需要重新赋值时使用 \`let\`。
`); }

  // ── 改进建议 ──
  s.push(`---\n\n## 四、改进建议\n`);
  s.push(`### 重构建议\n`);
  if (a.longFunctions.length > 0) s.push(`- 拆分过长的函数 ${a.longFunctions.map((f) => `\`${f.name}\`（${f.length} 行）`).join('、')}，每个函数应只承担单一职责\n`);
  if (a.classes.length > 0 && a.hasSqlInjection) s.push(`- 引入 Repository/DAO 模式，将数据访问逻辑从业务逻辑中分离\n- 考虑使用 ORM（如 Prisma、TypeORM），从根本上避免手写 SQL\n`);
  if (a.functions.length > 3) s.push(`- 将相关函数按职责分组到不同模块中，建立清晰的模块接口\n`);
  s.push(`- 使用 TypeScript 替代 JavaScript，通过类型系统在编译期捕获更多错误\n`);

  s.push(`\n### 测试建议\n`);
  for (const fn of a.functions.slice(0, 3)) s.push(`- 为 \`${fn.name}()\` 编写单元测试，覆盖正常路径、边界条件和异常场景\n`);
  if (a.hasSqlInjection) s.push(`- 添加安全测试用例，验证 SQL 注入防护对恶意输入的有效性\n`);
  if (!a.hasErrorHandling) s.push(`- 测试错误路径：网络故障、无效输入、空数据集等场景\n`);

  s.push(`\n### 安全与性能建议\n`);
  if (a.hasSqlInjection) s.push(`- **紧急**：立即将所有 SQL 查询迁移到参数化语句\n`);
  if (a.hasHardcodedSecrets) s.push(`- **紧急**：移除所有硬编码密钥，改用环境变量或密钥管理服务\n`);
  if (a.hasNoResponseCheck) s.push(`- 为 HTTP 请求添加超时配置和重试逻辑，考虑引入熔断器模式\n`);
  s.push(`- 为所有对外接口添加输入验证和参数校验\n`);
  s.push(`- 考虑引入速率限制以防止接口滥用\n`);

  return {
    markdown: s.join('\n'),
    metadata: {
      reviewDepth: config.depth || 'standard',
      focusAreas: config.focusAreas || [],
      timestamp: new Date().toISOString(),
      linesReviewed: a.lineCount,
    },
  };
}

function generateLatexMockReview(code: string, config: ReviewConfig) {
  const lines = code.split('\n');
  const lineCount = lines.length;
  const hasAbstract = /\\begin\{abstract\}/.test(code);
  const hasIntro = /\\section\{.*(?:intro|引言)/i.test(code);
  const hasBib = /\\bibliography|\\begin\{thebibliography\}|\\printbibliography/.test(code);
  const hasFigure = /\\begin\{figure\}/.test(code);
  const hasTable = /\\begin\{table\}/.test(code);
  const hasEquation = /\\begin\{equation\}|\\begin\{align\}|\$\$/.test(code);
  const sectionCount = (code.match(/\\section\{/g) || []).length;
  const citeCount = (code.match(/\\cite\{/g) || []).length;
  const titleMatch = code.match(/\\title\{([^}]+)\}/);
  const title = titleMatch ? titleMatch[1] : '（未检测到标题）';

  const s: string[] = [];
  s.push(`# 论文评审报告\n`);
  s.push(`## 一、概览\n`);
  s.push(`**论文标题**：${title}\n`);
  s.push(`**基本信息**：全文 ${lineCount} 行 LaTeX 源码，包含 ${sectionCount} 个章节、${citeCount} 处引用${hasFigure ? '、含图表' : ''}${hasEquation ? '、含公式' : ''}。\n`);
  s.push(`**整体评价**：论文结构${hasAbstract && hasIntro && hasBib ? '基本完整' : '存在缺失'}，${citeCount > 10 ? '引用数量适中' : '引用偏少，建议补充更多相关工作'}。以下为详细评审意见。\n`);

  s.push(`---\n\n## 二、论文结构与逻辑\n`);
  s.push(`### 章节结构\n\n`);
  if (!hasAbstract) s.push(`- ⚠️ 未检测到摘要（\`\\begin{abstract}\`），摘要是论文最重要的部分之一，必须补充\n`);
  if (!hasIntro) s.push(`- ⚠️ 未检测到引言章节，建议添加一个清晰的引言部分阐述研究背景和动机\n`);
  if (!hasBib) s.push(`- ⚠️ 未检测到参考文献部分，请添加参考文献列表\n`);
  s.push(`- 全文共 ${sectionCount} 个章节，${sectionCount >= 4 ? '结构较为完整' : '章节数偏少，建议补充方法、实验、结论等核心章节'}\n`);
  s.push(`\n### 论证逻辑\n\n建议检查各章节之间的逻辑衔接是否流畅，确保：\n- 研究动机与问题定义清晰对应\n- 方法设计直接回应所提出的问题\n- 实验设计能够验证所声称的贡献\n- 结论部分准确总结贡献并指出局限性\n`);
  s.push(`\n### 创新性\n\n请确保论文明确阐述了与已有工作的区别和核心创新点。建议在引言末尾以列表形式总结本文的主要贡献（contributions）。\n`);

  s.push(`---\n\n## 三、具体问题\n`);
  let n = 0;
  if (!hasAbstract) { n++; s.push(`### ${n}. 🔴 严重：缺少摘要\n\n摘要是审稿人和读者最先阅读的部分。缺少摘要会严重影响论文的第一印象和可检索性。建议添加 150–250 词的摘要，涵盖研究背景、方法、主要结果和结论。\n`); }
  if (citeCount < 5) { n++; s.push(`### ${n}. 🟠 重要：引用不足（仅 ${citeCount} 处）\n\n当前引用数量偏少，可能给审稿人留下文献调研不充分的印象。建议：\n- 在引言中增加对相关工作的综述\n- 在方法和实验部分引用对比方法的原始论文\n- 总引用数建议不少于 15–20 篇\n`); }
  if (!hasFigure && !hasTable) { n++; s.push(`### ${n}. 🟠 重要：缺少图表\n\n论文中未包含任何图表。对于技术论文，图表是展示方法流程、实验结果和对比分析的核心手段。建议至少添加：\n- 方法流程图或架构图\n- 实验结果对比表格\n- 关键指标的可视化图表\n`); }
  if (n === 0) s.push(`未发现严重的结构性问题。请对照上述结构分析进行细节完善。\n`);

  s.push(`---\n\n## 四、改进建议\n`);
  s.push(`### 结构调整\n- 确保"摘要 → 引言 → 相关工作 → 方法 → 实验 → 结论"的完整流程\n- 各章节开头添加过渡段落，增强行文连贯性\n`);
  s.push(`\n### 论证补充\n- 增加与 baseline 方法的定量对比实验\n- 补充消融实验（ablation study）以验证各模块的贡献\n- 添加对实验结果的深入分析和讨论\n`);
  s.push(`\n### 写作与引用\n- 检查全文语法和术语一致性\n- 确保所有图表均有编号、标题和正文引用\n- 补充参考文献，建议使用 BibTeX 管理引用\n`);

  return {
    markdown: s.join('\n'),
    metadata: {
      reviewDepth: config.depth || 'standard',
      focusAreas: config.focusAreas || [],
      timestamp: new Date().toISOString(),
      linesReviewed: lineCount,
    },
  };
}
