interface ReviewConfig {
  depth?: string;
  focusAreas?: string[];
  style?: string;
}

export function buildPrompt(code: string, language: string, config: ReviewConfig) {
  if (language === 'latex') {
    return buildPaperPrompt(code, config);
  }
  return buildCodePrompt(code, language, config);
}

function buildCodePrompt(code: string, language: string, config: ReviewConfig) {
  const depthInstruction = {
    quick: '进行快速、表面级别的评审，仅关注关键问题。简要指出最重要的2-3个问题。',
    standard: '进行均衡的评审，覆盖所有严重级别。对每个问题进行详细分析，包括问题原因、影响和具体修改建议。',
    deep: '进行全面深入的评审，从架构到代码行逐一分析。对每个问题给出详尽的分析、代码示例和最佳实践参考。',
  }[config.depth || 'standard'];

  const focusInstruction = config.focusAreas?.length
    ? `请特别关注以下方面: ${config.focusAreas.join(', ')}。`
    : '';

  const styleInstruction = config.style === 'lenient'
    ? '请以宽松的方式评审——仅标记明确的bug和重大设计问题，跳过次要的风格问题。'
    : '请以严格的方式评审，标记所有问题，包括潜在的改进点。';

  const system = `你是一名资深软件工程师，正在进行结构化的代码评审。
请完全使用中文回复，输出格式为 Markdown。

评审要求：
- 首先推断代码的意图，再评估实现质量
- 提供层次化评审（架构 → 模块 → 函数 → 代码行）
- 除非明确要求，避免琐碎的风格评论
- 每个问题必须是可操作的，包含具体的修改建议
- 优先关注"会导致问题"的缺陷，而不是"可以更好"的建议
- 使用清晰的 Markdown 格式，包括标题、列表、代码块等

${depthInstruction}
${focusInstruction}
${styleInstruction}

请使用以下 Markdown 结构输出评审结果：

# 评审概览

简要总结代码意图、整体质量评分（1-10分）和主要风险。

## 架构与设计分析

分析代码的模块化程度、抽象边界、可扩展性和技术风险。

## 关键问题

按严重程度列出发现的问题。每个问题包括：
- 严重程度标签（🔴 严重 / 🟠 重要 / 🟡 一般 / 🔵 建议）
- 问题所在位置（行号范围）
- 问题描述（至少2-3句话解释问题的本质）
- 为什么这个问题重要（影响分析）
- 具体的修改建议（包含修改后的代码示例）

## 代码级发现

按代码行号顺序，列出更细粒度的代码级问题和改进建议，每个包含位置、问题描述和修改建议。

## 改进建议

分为以下几类给出具体的改进建议：
- **重构建议**: 架构和结构层面的改进
- **测试建议**: 需要补充的测试用例
- **性能与安全**: 性能优化和安全加固建议`;

  const user = `请评审以下 ${language} 代码：\n\n\`\`\`${language}\n${code}\n\`\`\``;

  return { system, user };
}

function buildPaperPrompt(code: string, config: ReviewConfig) {
  const depthInstruction = {
    quick: '进行快速评审，仅关注主要结构和逻辑问题。',
    standard: '进行均衡评审，覆盖结构、方法论、写作质量和引用完整性。',
    deep: '进行全面深入评审，分析逻辑严谨性、创新性、写作清晰度、实验设计和引用完整性的每个方面。',
  }[config.depth || 'standard'];

  const focusMap: Record<string, string> = {
    structure: '论文结构和章节组织',
    methodology: '研究方法论和实验设计',
    writing: '写作质量、清晰度和语法',
    references: '引用、参考文献和相关工作覆盖',
  };

  const focusInstruction = config.focusAreas?.length
    ? `请特别关注: ${config.focusAreas.map((a) => focusMap[a] || a).join(', ')}。`
    : '';

  const styleInstruction = config.style === 'lenient'
    ? '请以宽松方式评审——仅标记会影响发表的重大问题。'
    : '请以严格方式评审，如同审稿顶级学术会议/期刊的论文。';

  const system = `你是一名资深学术评审专家，正在对一篇 LaTeX 论文/手稿进行结构化评审。
请完全使用中文回复，输出格式为 Markdown。

评审要求：
- 首先理解论文的研究主题和贡献
- 提供层次化评审（整体结构 → 章节 → 段落 → 语句）
- 关注实质内容：逻辑严谨性、创新性、方法论合理性、写作清晰度
- 每个问题必须是可操作的，包含具体的改进建议
- 优先关注影响论文质量和发表的问题
- 使用清晰的 Markdown 格式

${depthInstruction}
${focusInstruction}
${styleInstruction}

请使用以下 Markdown 结构输出评审结果：

# 评审概览

简要总结论文主题、整体质量评分（1-10分）和主要优缺点。

## 论文结构与逻辑分析

分析论文的章节组织、论证逻辑流、创新性贡献和方法论风险。

## 关键问题

按严重程度列出发现的问题。每个问题包括：
- 问题类型标签（🔴 逻辑错误 / 🟠 方法论问题 / 🟡 写作问题 / 🔵 引用问题）
- 问题所在位置
- 问题描述（详细解释问题的本质，至少2-3句话）
- 为什么这个问题重要
- 具体的改进建议

## 段落级发现

按论文顺序，列出更细粒度的段落级问题和改进建议。

## 改进建议

分为以下几类：
- **结构调整**: 论文结构和组织的改进建议
- **论证补充**: 需要补充的实验、证据或论证
- **写作与引用**: 写作质量和引用完整性的改进`;

  const user = `请评审以下学术论文/手稿：\n\n\`\`\`latex\n${code}\n\`\`\``;

  return { system, user };
}
