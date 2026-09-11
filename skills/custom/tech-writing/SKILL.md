---
name: tech-writing
description: >-
  技术写作（中英双语）：生成或改写博客、技术文档、产品文案、周刊摘要、报告分析、
  知识教程、评论。准确优先，降低阅读成本，去掉 AI 腔。用户要求写或润色技术文章、
  文档、周刊、教程、产品文案，或中英文写作/改写时使用。Not for 纯代码生成、
  数据查询、非写作任务。
when_to_use: >-
  tech-writing, 中文写作, 英文写作, 技术文档, 产品文案, 周刊, 教程, 润色, 改写
user-invocable: true
metadata:
  source_url: https://github.com/miantiao-me/aigc-weekly/blob/master/agent/.opencode/skills/chinese-writing/SKILL.md
  author: rockcookies
  version: 3.0.0
---

# Tech Writing (中英双语)

用于生成、改写、润色高质量技术内容，覆盖中文和英文两种语言。

核心目标（语言无关，两种语言通用）：

> **准确 > 清晰 > 自然 > 有个性 > 有文采**
> **Accuracy > Clarity > Naturalness > Voice > Style**

不要为了"像人"而刻意口语化，也不要为了"专业"而堆砌术语——这条原则对中文和英文写作同样成立。

**运行顺序**：

1. **Frame**（§2）— 内部确定文体、读者、目的、语气、语言。
2. **Language rules**（§7）— 只加载本次所用语言对应的细则文件。
3. **Draft or revise**（§1、§3–6；改写任务再加 §8）— 按通用原则写作；周刊/报告/产品文案见 §6。
4. **Self-check**（§10）— 对照清单与质量标准后再输出。

---

## 1. 总体原则 / General Principles

### 1.1 先保证信息，再考虑文风

写作时按以下优先级处理：

1. **事实正确**
2. **表达清楚**
3. **结构合理**
4. **符合目标读者**
5. **语气自然**
6. **增加风格和个性**

任何风格要求都不能破坏前面的规则。

例如：

* 不能为了口语化而牺牲技术准确性。
* 不能为了简洁而丢失关键条件。
* 不能为了"去 AI 味"而故意写出不自然的句子。
* 不能为了增加观点而凭空创造事实。

This priority order holds regardless of language: get the facts right first, then worry about tone.

---

## 2. 写作前先判断任务 / Before Writing

**完成标准：** 文体、读者、目的、语气、语言五项都已在内部确定，再写正文。

生成内容前，先在内部确定以下五件事（第五件是语言）：

### 2.1 文体 / Genre

从以下类型中选择最接近的一种：

* 技术文章 / Technical article
* 技术文档 / Technical documentation
* 产品介绍 / Product copy
* 周刊 / 资讯 / Newsletter, digest
* 报告 / 分析 / Report, analysis
* 教程 / 教学 / Tutorial
* 观点 / 评论 / Opinion, commentary
* 营销文案 / Marketing copy
* 普通说明 / Plain explanation

不要把不同文体混成同一种语气。

### 2.2 目标读者 / Audience

判断读者大致属于：

* 普通用户 / General users
* 开发者 / Developers
* 技术管理者 / Technical managers
* 产品 / 业务人员 / Product & business people
* 专业领域读者 / Domain experts

默认优先保证**目标读者能快速理解**，而不是展示作者知道多少术语。

### 2.3 文章目的 / Purpose

先确定主要任务：

告知、解释、教学、分析、说服、总结、推荐、对比、记录
(inform, explain, teach, analyze, persuade, summarize, recommend, compare, record)

一篇文章可以有多个目标，但必须有一个主目标。

### 2.4 语气 / Tone

根据文体选择语气：

| 场景 / Context | 推荐语气 / Recommended tone |
| --- | --- |
| 技术文档 / Docs | 准确、克制、直接 / precise, restrained, direct |
| 技术文章 / Tech article | 专业、自然、有观点 / professional, natural, opinionated |
| 教程 / Tutorial | 清楚、耐心、少废话 / clear, patient, no filler |
| 周刊 / Newsletter | 简洁、轻快、信息密度高 / terse, brisk, information-dense |
| 报告 / Report | 客观、审慎、有结论 / objective, careful, conclusive |
| 产品文案 / Product copy | 清晰、有吸引力，但避免夸张 / clear, appealing, not hype-y |
| 观点评论 / Opinion | 明确、克制，可以有个人判断 / direct, restrained, opinion allowed |

### 2.5 语言 / Language

明确本次输出用中文还是英文，或两者都要。如果用户给的是英文原文要求改写，
默认继续用英文输出；反之亦然。不要在没有要求的情况下切换语言。

---

## 3. 通用语言原则 / Universal Language Principles

以下原则两种语言都适用，具体词汇层面的规则见第 7 节。

### 3.1 直接表达 / Say it directly

优先使用简单、直接的句子，避免空洞的引子句。

中文：

避免「在当前快速发展的技术背景下，我们可以看到……」
改为「AI Agent 正在改变后端开发方式。」

英文：

避免 "In today's rapidly evolving technology landscape, we can see that..."
改为 "AI agents are changing how backend systems get built."

### 3.2 一句话只承担一个主要意思 / One idea per sentence

如果一句话同时包含背景、原因、结果、转折、观点，优先拆句，不要为了减少句号
把大量逻辑塞进一个长句。这条对英文同样适用——不要用一堆从句和分词短语
把三四个意思焊在一句话里。

### 3.3 长短句交替 / Vary sentence length

不要让整篇文章的句子长度和结构高度一致。可以连续出现几个短句，也可以偶尔
使用一个较长的句子解释复杂关系。目标是自然，而不是刻意制造"人类节奏"。
英文写作中，连续使用相同长度、相同开头结构的句子（尤其是都以主语开头的
简单句）同样会显得机械。

### 3.4 主动表达优先 / Prefer active voice

中文：优先「OpenAI 发布了新模型」而不是「新模型由 OpenAI 发布」。

英文：优先 "OpenAI released a new model" 而不是 "A new model was released by OpenAI."

技术文档中，如果被动语态更准确（强调对象而非施动者），可以正常使用，
不必机械规避——两种语言都是如此。

### 3.5 少用抽象形容词，多给具体信息 / Facts over adjectives

避免「性能非常强大」，改为「在这个测试集上，吞吐量从 2,000 req/s 提升到 3,500 req/s。」

避免 "The performance is incredibly powerful"，改为 "Throughput went from 2,000 req/s
to 3,500 req/s on this benchmark."

原则：**能够用事实说明，就不要只用形容词评价。**

---

## 4. 观点与事实 / Facts vs. Opinions

### 4.1 明确区分事实与观点

事实：「项目使用 Apache-2.0 协议。」/ "The project is Apache-2.0 licensed."
观点：「我认为它更适合企业内部基础设施。」/ "I think it's a better fit for internal infra."

不要把观点包装成事实。

### 4.2 避免模糊来源

避免「有业内人士认为……」「网上普遍认为……」「行业报告显示……」，
避免 "some believe...", "it's widely thought...", "reports suggest..."，
除非给出具体来源。更好的表达：「根据 Anthropic 官方博客……」/ "According to Anthropic's blog..."

### 4.3 可以有观点，但不要伪装成共识

推荐「我的判断是，这个方案更适合中大型团队」/ "My take: this fits mid-to-large teams better"，
而不是「很多人都认为这是最佳方案」/ "Many people consider this the best approach"，
除非确实有依据。

---

## 5. 技术写作 / Technical Writing Specifics

### 5.1 结构 / Structure

默认采用：**结论 → 背景 → 原理 → 实践 → 权衡 → 结论**
(Conclusion → Context → How it works → Practice → Trade-offs → Conclusion)

不必每篇文章都完整包含所有章节。重要的是读者尽早知道"这是什么"和"为什么值得看"。

### 5.2 技术方案优先给结论 / Lead with the recommendation

不要先写大量背景。

中文：「如果项目已经使用 Go，我更推荐 Redis + Ristretto，而不是自己实现 LRU。」
英文："If you're already on Go, reach for Redis + Ristretto instead of hand-rolling an LRU cache."

然后解释：为什么、什么时候适合、有什么代价、什么情况下不要用。

### 5.3 示例优先于空泛解释 / Examples over vague claims

不要「这个设计具有良好的扩展性」/ "This design is highly extensible"，改为：

「新增 MQ 适配器时，只需要实现 `Transport` 接口，不需要修改 Scheduler 核心逻辑。」
"Adding a new MQ adapter only requires implementing the `Transport` interface — the
scheduler core doesn't change."

### 5.4 术语首次出现时解释 / Define terms on first use

中文：「CAS（Compare-And-Swap）是一种无锁并发操作，用于检查某个值在读取后是否发生变化。」
英文："CAS (compare-and-swap) is a lock-free operation that checks whether a value
changed since it was last read."

之后直接使用缩写，不要反复解释。

---

## 6. 周刊 / 报告 / 产品文案 / Newsletter, Report, Product Copy

### 6.1 周刊标题 / Newsletter headlines

原则：简洁、具体、信息优先、不制造悬念、不夸大影响。

中文一般控制在 15～20 字以内；英文控制在一行以内（约 8～12 词）。

推荐：「OpenAI 发布 GPT-5.2」/ "OpenAI ships GPT-5.2"
不推荐：「这可能是今年 AI 圈最重要的一次更新」/ "This might be the biggest AI update of the year"

### 6.2 条目结构 / Item structure

默认：**项目 / 产品 / 事件 + 核心变化 + 为什么值得关注**
(What it is + what changed + why it matters)，通常 2～5 句话，不要把新闻稿完整复述一遍。

按类型切入：

* 新产品/工具：它是什么 → 做什么 → 适合谁
* 模型发布：更新了什么 → 哪些指标变化 → 对开发者有什么影响
* 开源项目：解决什么问题 → 核心能力 → 当前成熟度
* 融资/收购：谁投了 → 金额/估值 → 为什么值得关注
* 行业动态：发生了什么 → 为什么重要 → 可能影响什么

### 6.3 链接 / Links

优先把链接放在实体名称或关键词上，两种语言一致：

中文推荐：「[Bun](https://bun.sh/) 发布新版本，新增……」
英文推荐："[Bun](https://bun.sh/) shipped a new release that adds..."

不推荐把链接单独放在"查看原文 / read more"这类词上，除非任务明确要求。

### 6.4 报告与分析 / Reports & analysis

报告更重视：**事实 → 分析 → 判断 → 风险**，不要把报告写成宣传文案。

中文推荐：「当前方案能够覆盖现有业务，但在多租户和故障恢复方面仍存在限制。」
英文推荐："The current design covers existing use cases, but multi-tenancy and
failure recovery are still limited."

分析最好明确区分：已知事实、推测、判断、不确定性
(known facts / speculation / judgment / uncertainty)。

### 6.5 产品文案 / Product copy

应该回答：**这是什么 → 对用户有什么用 → 为什么值得选择**
(What it is → what it does for the user → why it's worth choosing)

避免中文的「极致、革命性、领先、全新、重新定义、赋能、打造、引领」，
以及对应的英文空话「revolutionary, cutting-edge, next-generation, game-changing,
seamless, empower, unlock」。优先展示功能、场景、数字、使用效果、差异。

不要「打造下一代智能开发体验」/ "Building the next-generation dev experience"，
改为「自动生成接口类型和测试代码，减少重复开发」/ "Auto-generates API types and
test code, so you write less boilerplate."

---

## 7. 分语言细则 / Language-Specific Rules

**完成标准：** 只加载本次写作所用语言对应的那一份；不必两份都读。

* 中文 → [references/zh.md](references/zh.md)
* English → [references/en.md](references/en.md)

---

## 8. 改写任务 / Revision Tasks

**完成标准：** 四档优先级按序做完，且没有新增原文没有的事实。

当用户提供原文要求润色或翻译改写时（两种语言通用）：

### 第一优先级：保留原意

不要擅自增加不存在的事实、修改数字、修改结论、改变作者立场。如果是跨语言
改写（例如把中文原文译成英文技术文章），同样不能悄悄加入原文没有的判断。

### 第二优先级：删除

删除空话、重复、套话、过长修饰、不必要的转折——参照第 7 节对应语言的
"去 AI 味"清单执行。

### 第三优先级：优化

优化结构、节奏、词汇、逻辑、标点。

### 第四优先级：按上下文增加必要的标题、小标题、段落划分、列表。

---

## 9. 不确定信息 / When Facts Are Missing

不要编，不要用模糊表达掩盖未知信息。优先：

「目前缺少足够信息判断。」/ "There isn't enough information here to say."
「公开资料没有明确说明这一点。」/ "Public sources don't clarify this."
「这里需要区分官方信息与社区推测。」/ "Worth separating official statements from
community speculation here."

如果任务允许检索，应该先查证。

---

## 10. 自检 / Self-Check Before Output

**完成标准：** 输出满足清楚、具体、自然、克制、有观点（该有时）、有信息密度；
删掉不增加信息的句子，能换成事实的形容词已换成事实。

输出前执行一次内部检查，两种语言通用：

### A. 信息检查 / Information

* 是否回答了用户真正的问题？
* 是否存在没有依据的事实？
* 是否把推测写成事实？
* 是否遗漏关键条件？

### B. 结构检查 / Structure

* 开头是否尽快进入主题？
* 每个段落是否只有一个主要意图？
* 是否存在重复表达？
* 是否有不必要的小标题？

### C. 语言检查 / Language

* 是否有明显 AI 套话（参照第 7 节对应语言清单）？
* 是否有连续相似句式？
* 是否堆砌形容词？
* 是否为了"高级"而使用生僻词，或英文里堆砌大词？
* 是否存在不自然的同义词替换？

### D. 风格检查 / Style

* 是否符合目标读者？
* 是否符合文章类型？
* 技术内容是否保持准确？
* 是否过度口语化，或过度正式？

### E. 最终删减 / Final cut

完成初稿后再问一次：**删掉这句话会不会损失信息？** 如果不会，删除。
再问一次：**这个形容词能不能换成事实？** 可以的话，改成事实。

写完以后，把文章当作一个真实作者写给真实读者的内容重新读一遍（无论中文还是英文）。

如果一句话只是为了显得专业、显得深刻、显得完整、显得有文采、显得像 AI 文章，
而没有增加信息，就删掉。

如果一句话虽然简单，但准确、自然、有效，就保留。

> If a sentence only exists to sound professional, sound deep, sound complete, sound
> stylish, or sound like an AI wrote it — and it adds no information — cut it.
> If a sentence is plain but accurate, natural, and effective — keep it.
