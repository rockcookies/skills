---
name: web-css-guidelines
description: >-
  CSS 机理与方案速查（源自张鑫旭《CSS世界》《CSS新世界》）：流布局与盒模型（width:auto、
  margin 合并、BFC）、内联对齐（line-height/vertical-align/strut）、flex/grid、定位与层叠
  （z-index 七阶）、渐变/滤镜/遮罩、显隐与响应式。写、审、排障 CSS 时使用——图片底部间隙、
  margin 合并位移、z-index 失灵、垂直居中选型等症状出现时，即使没有明说。
  Not for 类名与标识符命名（→ web-code-style）、UnoCSS/Tailwind 配置（→ antfu/unocss）。
when_to_use: >-
  css 布局, 垂直居中, line-height, vertical-align, 基线, 图片底部间隙, margin 合并, BFC,
  浮动, 清除浮动, z-index, 层叠上下文, flex, grid, 绝对定位, sticky, 隐藏元素, 渐变, 滤镜,
  clip-path, mask, CSS 变量, 响应式, 安全区, 滚动穿透
user-invocable: true
metadata:
  author: rockcookies
  source: 张鑫旭《CSS世界》《CSS新世界》（book-to-skill 生成后重写合并）
  version: 1.0.0
---

**范围：** CSS 的机理（为什么这样表现）与方案选型（该用哪个）：布局、对齐、层叠、视觉特效、显隐、响应式。类名与标识符命名见 `web-code-style`；原子化 CSS 的配置与工具类写法见 `antfu/unocss`。排障先查 [cheatsheet.md](./references/cheatsheet.md) 症状速诊，再按路由进机理文件。

**模式：**

- **Coding** — 写/选型时按下方路由读对应 references，按机理文件的规则组织代码；要可复制配方直接读 patterns.md。
- **Debugging** — 症状驱动：先查 cheatsheet.md 征兆速诊定位病根，再进机理文件看处方。
- **Review** — 审 CSS 时对照各文件的反模式表：z-index 滥用、宽度写死、flex 末行死角、动画碰重排属性、隐藏方案选错。

只读与当前任务相关的文件，不要一次全读；跨文件主题先读 cheatsheet.md 定位。

---

# Web CSS Guidelines

> 仓内 `AGENTS.md`、本地约定与相邻代码现状优先于本 skill。兼容性以 caniuse 现状为准（源书数据截至 2021 前后）。

## 按任务/症状读对应 references

| 任务 / 症状 | 读 |
|---|---|
| 宽度行为怪、margin 不生效/合并、padding、BFC、浮动与清浮动、calc/clamp | [layout-flow.md](./references/layout-flow.md) |
| flex/grid/columns/Shapes、卡片网格、末行对齐 | [layout-flex-grid.md](./references/layout-flex-grid.md) |
| line-height/vertical-align、基线、图片底部间隙、图文对齐 | [inline-box.md](./references/inline-box.md) |
| absolute/relative/fixed/sticky、居中定位、锚点、scroll-snap | [positioning.md](./references/positioning.md) |
| z-index 失灵、层叠顺序、覆盖冲突、isolation | [stacking.md](./references/stacking.md) |
| 字体、行高继承、white-space、下划线、着重号、可变字体 | [typography.md](./references/typography.md) |
| background、渐变、border 图形、border-image、border-radius | [background-border.md](./references/background-border.md) |
| transform 3D、transition/animation、动画性能 | [transform-animation.md](./references/transform-animation.md) |
| filter/毛玻璃/混合模式、mask、clip-path、路径运动 | [filters-masks.md](./references/filters-masks.md) |
| 显示/隐藏选型、替换元素、object-fit | [visibility-media.md](./references/visibility-media.md) |
| 媒体查询、clamp 适配、安全区、逻辑属性、writing-mode | [responsive-logical.md](./references/responsive-logical.md) |
| 滚动穿透、pointer-events、contain、长列表渲染、SVG 描边动画 | [interaction-advanced.md](./references/interaction-advanced.md) |
| CSS 变量、@property、变量开关与主题 | [variables.md](./references/variables.md) |
| 直接要可复制配方 | [patterns.md](./references/patterns.md) |
| 症状排障入口 / 决策树 / 阈值表 | [cheatsheet.md](./references/cheatsheet.md) |
| 术语定义 | [glossary.md](./references/glossary.md) |

## 核心框架速览（术语锚点）

一线定义，正文以术语复用；机理在标注的归属文件：

- **流** — 引导元素排列的看不见的水流；块级管结构、内联管内容，特殊布局是对流的破坏与保护。〔layout-flow〕
- **造物主视角** — CSS 为图文展示而生；费解表现先问"为图文展示为何如此设计"。〔layout-flow〕
- **鑫三无** — 无宽度、无图片、无浮动；设了具体宽度，流动性就死。〔layout-flow〕
- **双盒子** — 外在盒子决定能否一行显示，内在盒子承载宽高；width/height 只作用于内在盒子。〔layout-flow〕
- **strut（幽灵空白节点）** — 行框盒子行首的 0 宽假想内联盒；内联怪象先找它。〔inline-box〕
- **大值特性** — 行框盒子高度听最大的 line-height。〔inline-box〕
- **结界** — BFC 与层叠上下文的共用隐喻：内部翻江倒海不影响外部。〔layout-flow / stacking〕
- **无依赖绝对定位** — 不设方位值的 absolute 停在原地，免 relative 免 z-index。〔positioning〕
- **流体特性** — 对立方位同时定位后 margin/auto 全部恢复，居中一行搞定。〔positioning〕
- **不犯二准则** — 页面主体 z-index ≤2，浮层用层级计数器（默认 9）。〔stacking〕
- **分家产模型** — flex-basis 分基础、grow 分富余、shrink 摊不足；缩写不按默认值补全。〔layout-flex-grid〕
- **黏性约束矩形** — sticky 的效果空间 = 包含块 ∩ 流盒。〔positioning〕
- **数据类型思维** — 属性值 = `<尖括号类型>` 组合，学一次类型处处生效。〔glossary〕
- **边界特性** — 数值超范围按边界钳制；配变量实现 CSS if/else。〔variables〕
- **空格开关** — `--x: ;` 与 `--x: inherit` 切换整组 fallback。〔variables〕
- **未定义行为** — 规范空白处的浏览器差异：适配而非修复。〔cheatsheet〕

## 依赖

本 skill 依赖以下技能的规则文件。涉及对应问题时先读再判断，不在此复制其内容，规则冲突时以它们为准：

- `web-code-style/references/naming-core.md` — CSS 类名与标识符命名。写或审类名时先读。
- `antfu/unocss/SKILL.md` — UnoCSS 原子类与配置。仓内启用原子化 CSS 时先读。
