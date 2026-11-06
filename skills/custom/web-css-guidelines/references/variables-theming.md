# CSS 变量、主题与深色模式（V 系列）

**完成：** 当前任务命中的 V-ID 已对照并落到代码；不要通读未命中章节。

目录：作用域与 `@theme` V-01 · fallback V-02 · 空格开关 V-03 · 数据驱动 V-04 · `@property` V-05 · 深色模式 V-06 · 语义 token V-07 · 现代色彩 V-08 · 变量不是 Sass V-09 · Shadow DOM V-10 · `@layer` V-11 · 自定义工具类 V-12

## V-01 作用域 = 继承；Tailwind v4 的两个"家"
- 自定义属性是**继承属性**：全局放 `:root`；只在子树生效就定义在子树根；**子元素定义的变量父级读不到**（作用域只向下）。
- **Tailwind v4 区分两类变量**：
  - 需要**生成工具类**的设计 token（颜色、字体、间距、圆角、阴影、断点、缓动、动画）→ 放 `@theme`（`--color-*`、`--font-*`、`--text-*`、`--spacing`、`--radius-*`、`--shadow-*`、`--breakpoint-*`…），自动得到 `bg-brand`、`font-display` 等。
  - 只在运行时读取、不需要工具类的变量（z-index 层级、动态进度、主题底层值）→ 放 `:root`（或 `@layer base`）。
  ```css
  @import "tailwindcss";
  @theme {
    --color-brand: oklch(0.62 0.19 260);
    --font-display: "Inter", ui-sans-serif, sans-serif;
    --text-fluid: clamp(1rem, 0.8rem + 1vw, 1.5rem);   /* → text-fluid */
  }
  :root { --z-modal: 40; }
  ```
- 引用变量：`bg-(--my-color)`、`w-(--w)`、`z-(--z-modal)`（v4 圆括号语法，替代 v3 的 `bg-[--my-color]`）。
- 一个 token 一个事实源：同一个值只在一处定义。

## V-02 `var()` 的 fallback 只救"一定无效"
- fallback 只在变量**未定义、值为空、或为全局关键字**时生效。`--color:20px` 配 `background-color` 是"可能有效但在使用时无效"，会回落为属性初始值（如 `transparent`），**不会**走 fallback。
- **不要**用 `var(--n)px` 拼单位（得到 `20 px`，非法，静默回落）。写 `calc(var(--n) * 1px)`。
  - Tailwind：`w-[calc(var(--n)*1px)]`
- 变量名宽松（可数字开头/中文），仍应制定命名规范；特殊字符需转义。
## V-03 空格开关（一个变量切换多个属性）
- 值为单个空格的 `--open: ;` 属于"可能有效"：`var()` 会被替换成空白，使用它的属性在计算时失效并回落到初始值（= **关闭态**）；`--open: initial` / `inherit` 属于"一定无效"，会触发每个 `var()` 自己的 fallback（= **开启态**）。
  ```css
  .box { --open: ;   padding: var(--open, 1rem);  border: var(--open, 1px solid); }  /* 关闭 */
  .box.is-open { --open: initial; }                                                  /* 开启：各属性取自己的 fallback */
  ```
- 技巧偏冷门，团队不熟悉时优先用 `data-*` 属性 + 变体（`data-open:p-4 data-open:border`）。

## V-04 数据驱动样式（变量 + calc + counter）
- JS 只改一个变量，样式自己算：
  ```html
  <div class="h-2 w-[calc(1%*var(--percent))] bg-primary" style="--percent: 40"></div>
  ```
  React：`style={{ '--percent': 40 } as React.CSSProperties}`
- 数值显示：`counter-reset: p var(--percent); content: counter(p)`（counter 只能整数）。
- 变量是**运行时**属性，可被 JS、媒体查询、伪类动态改写——这是它相对 Sass 变量的价值。
## V-05 `@property`：让变量可过渡 / 可动画
- 未注册的自定义属性是"任意 token 串"，**永远不能过渡**。注册类型后即可：
  ```css
  @property --c { syntax: '<color>'; inherits: false; initial-value: #09f; }
  .btn { background: linear-gradient(var(--c), #000); transition: --c .3s; }
  .btn:hover { --c: #f30; }
  ```
- `syntax` 非 `"*"` 时必须写 `initial-value`，否则注册无效。
- 这是"渐变 hover 平滑过渡"的官方解（渐变本身是 `<image>`，不可过渡）。Baseline Newly available（2024-07）。Tailwind v4 自身也依赖 `@property`。
- Tailwind 写法：注册写在全局 CSS；使用 `[transition:--c_.3s]` / `hover:[--c:#f30]`。
- 备选（无需 `@property`）：双层背景 + `opacity` 过渡。
## V-06 深色模式
- 原则：**变量 + 变体**，不要为每个元素手写两套颜色。
- Tailwind v4 的 `dark:` 默认跟随 `prefers-color-scheme`。要手动切换（`.dark` 类或 `data-theme`）：
  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  ```
- 推荐结构（语义变量 + `@theme inline`，同时拿到工具类和换肤能力）：
  ```css
  :root  { --background: oklch(1 0 0);    --foreground: oklch(0.2 0 0); }
  .dark  { --background: oklch(0.15 0 0); --foreground: oklch(0.98 0 0); }
  @theme inline {
    --color-background: var(--background);
    --color-foreground: var(--foreground);
  }
  ```
  用法：`bg-background text-foreground`，无需 `dark:` 逐个覆盖。
- 声明配色方案让原生控件/滚动条同步：`color-scheme: light dark`（Tailwind：`[color-scheme:light_dark]`）。`light-dark(a, b)` 函数 `[补]` Newly available。
- 图片太刺眼：提供双图（`<picture>` + `media`），或 `mix-blend-mode:difference` 做适配。
- 动画/过渡对深浅切换要克制，避免整页颜色闪烁；尊重 `prefers-reduced-motion`（见 R-06）。
- 常规实践

## V-07 语义 token，而非色值命名
- 变量名描述**用途**（`--primary`、`--surface`、`--border`、`--ring`、`--destructive`），不描述颜色本身（`--blue-500`）。组件读语义变量，品牌换色只改一处。
- 色阶（`--color-brand-50…950`）放 `@theme`；语义层（`--primary`）指向色阶，放 `:root` / `.dark`。
- 多主题 / 多品牌：在容器上覆盖一组语义变量即可，子树自动换肤（继承）。

## V-08 现代色彩 `[补]`
- 优先 `oklch()`（感知均匀，调色阶、深浅模式更好控制）；Tailwind v4 默认调色板即 OKLCH。
- 派生颜色用 `color-mix(in oklab, var(--primary) 20%, transparent)`；Tailwind 的 `bg-primary/20` 在变量颜色上会编译成 `color-mix`（所以 v4 基线要求 `color-mix()`）。
- 透明度叠加是乘积：父 `opacity` × 子 `opacity`；混合公式 `fg×α + bg×(1−α)`。`opacity` 会作用于整棵子树，只想让背景透明用 `bg-black/50`，不要用 `opacity`。
- 透明能力：`bg-transparent` / `border-transparent` / `text-transparent`（现代下均可用）。

## V-09 变量不是 Sass 变量
- 不要把 `--x` 当编译期常量：它能被 JS（`style.setProperty`）、媒体查询、伪类、容器查询改写，这才是用它的理由。
- 编译期的常量（断点、固定阶梯）交给 `@theme`；运行期会变的才用 `:root` 变量。

## V-10 Shadow DOM / 微前端穿透
- 组件库、Web Component、微前端的主题定制，唯一的穿透通道是 CSS 变量继承：对外暴露变量作为"主题 API"，不要依赖外部选择器钻进去。

## V-11 `@layer`：控制优先级而不是堆 `!important` `[补]`
- Tailwind v4 的层顺序：`theme, base, components, utilities`（后者优先）。自写组件样式放 `@layer components`，会被工具类自然覆盖；覆盖基础元素样式放 `@layer base`。
- 与第三方样式（如 antd 的 CSS-in-JS）共存：先声明顺序，让它们落在可预期的位置。
  ```css
  @layer theme, base, antd, components, utilities;
  ```
  再让第三方样式输出到对应 layer：antd 的 cssinjs `StyleProvider layer` 自 5.17.0 起支持，层声明要写在 `@import 'tailwindcss'` 之前，子树需包一层 `ConfigProvider` ✔复核；细节见 tailwind-v4.md 第 8 节。
- 不要靠选择器权重竞赛或 `!important`；v4 的强制写法是后缀 `!`（`bg-red-500!`）。

## V-12 `@utility`、`@apply`、`@reference`
- v3 的 `@layer utilities { .x {} }` 在 v4 改为 `@utility x { … }`（可带响应式/状态变体）。
  ```css
  @utility content-auto { content-visibility: auto; contain-intrinsic-size: auto 500px; }
  ```
- `@apply` 只用于不能改 HTML 的地方（CSS Module、第三方 DOM）；在 CSS Module/独立样式里引用主题：`@reference "../app.css";`。
- 组件的重复写法优先抽**组件**（React/Vue），其次才是 `@utility`/`@apply`。
