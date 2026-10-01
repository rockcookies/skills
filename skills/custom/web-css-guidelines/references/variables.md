# CSS 变量与 @property

用变量做主题、组件定制、数据驱动样式，或排障 var() 回落、"变量不可过渡"时读。calc/min/max/clamp 的算术细节归 [layout-flow.md](./layout-flow.md)；流式适配公式见 [responsive-logical.md](./responsive-logical.md)；完整配方见 [patterns.md](./patterns.md)。

## 变量 = 自定义属性 + var()，作用域即继承

CSS 变量是"自定义属性 `--x` + 变量函数 `var()`"的统称。声明即普通属性：继承、级联、优先级全套适用——它是运行时属性，可被 JS、媒体查询、伪类随时改写，不是 Sass 那种编译期替换。

- 全局变量放 `:root`；组件变量就近声明在使用子树上。
- 作用域即继承：只能被自身与后代取用；子元素声明的变量对父级不可见。
- 变量照常参与级联：同名变量按选择器权重与就近原则覆盖，子树内声明胜过 `:root`。
- 命名比选择器宽松：允许数字开头、中文、连续短横线；`$ [ ] ^ ( ) % "` 需反斜杠转义。
- Shadow DOM 唯一穿透通道：外部普通 CSS 进不了 Shadow DOM，自定义属性却能继承进去——这是 Web 组件样式定制的标准接口。

```css
:root { --gap: 16px; }
.compact { --gap: 8px; }        /* 子树内覆盖全局 */
.row { gap: var(--gap); }
```

```css
/* 页面侧：只设变量，不写组件内部样式 */
:root { --primary: #2a80eb; }
ui-button { --ui-button-border: 1px solid var(--primary); }
```

```css
/* 组件 Shadow DOM 内部：var() 消费，fallback 即组件默认样式 */
ui-button {
  border: var(--ui-button-border, 1px solid #ccc);
  background: var(--ui-button-background, #f5f6f7);
}
```

反模式：把 `--变量` 当 Sass 变量用——它的价值恰恰在运行时可动态改写；在子元素定义变量指望父级取用——继承只向下。

## fallback 只救"一定无效"

var() 的 fallback 只在第一个参数"一定无效"时启用，共三种情况：

- 未定义：取用点找不到这个变量。
- 空值：`--x:;`——声明了，但值为空。
- 全局关键字：`--x: inherit`（initial / unset / revert 同理）。

"可能有效"的值一律采用第一参——哪怕它对该属性渲染非法，回落的是该属性的初始值/继承值，不是 fallback。

| var(--x, fb) 中 --x 的值 | var() 解析 | 最终渲染 |
| --- | --- | --- |
| 未定义 | 用 fallback | fallback |
| 正常值 | 用 --x | 合法则正常；非法回落初始/继承值 |
| 空格（`--x: ;`） | 用 --x（可能有效） | 多数属性回落初始值 |
| 全局关键字 | 一定无效，用 fallback | fallback |

```css
--x: ;                 /* 空值：一定无效 */
--y: inherit;          /* 全局关键字：一定无效 */
color: var(--x, red);  /* red */
--color: 20px;
background-color: var(--color, deeppink);
/* 渲染为 transparent（background-color 初始值），不是 deeppink */
```

尾随拼接同样非法：`var(--size)px`（`--size: 20`）展开为 `20 px`（带空格），font-size 回落继承值——不是 20px。数值转长度必须 `calc(var(--size) * 1px)`，或直接把单位存进变量。

排障 var() 的渲染结果时按此流程走：

1. `--x` 是否"一定无效"（未定义 / 空值 / 全局关键字）？是 → 用 fallback，到此为止。
2. 否则用 `--x` 的值代入声明。
3. 代入后的声明对该属性合法 → 正常渲染。
4. 非法 → 按 unset 语义回落：非继承属性取初始值，继承属性取继承值——不经过 fallback。

反模式：指望 fallback 兜住非法值——`var(--color, red)` 遇 `--color: 20px` 得到 transparent 而不是 red。

## 空格开关：一个变量切换多个属性

机理：`--open: ;`（值为一个空格）属于"可能有效"——渲染回落；改成全局关键字 `inherit` 属于"一定无效"——fallback 生效。一个变量在两态间切换，即可同时改写多个属性，替代"每属性写两遍"。

```css
button {
  --open: ;   /* 关闭态：空格值，可能有效 */
  border: 1px solid var(--open, rgba(0, 0, 0, .1));
  box-shadow: var(--open, inset 0 1px 2px rgba(0, 0, 0, .1));
  background: var(--open, linear-gradient(#0003, transparent));
}
button:active { --open: inherit; }  /* 一定无效 → 全部 fallback 同时生效 */
```

这是组件变体（按压态、展开态）的惯用法：状态只落在变量上，属性声明只写一遍。进一步，变量组合还能模拟 CSS 尚未提供的语法（如用空格开关模拟 attr() 式的"值注入"），把组件 API 收敛成几个 `--` 开关。

## 边界特性：钳制出 if/else

机理：opacity、颜色的 alpha 通道、hsl 的 lightness 等数值超范围时按边界解析（`opacity: -999` → 0，亮度 200% → 100%）。把它与 calc、变量组合，超阈值的算式会被自动钳到边界——CSS 里原生的条件分支。

- 钳制属性：opacity、`<alpha-value>`、hsl 的 L——超出 [0, 1] / [0%, 100%] 就贴边。
- 系数取极大（999999）让阈值两侧分别落进"巨大正值/巨大负值"，再由钳制收成两个离散结果。
- 算式符号决定哪侧钳到哪端；阈值由中间项（0.5、50）控制。

```css
/* 亮度 >0.5 时算式为巨大负数 → L 钳到 0%（黑字）；≤0.5 钳到 100%（白字） */
.button { color: hsl(0, 0%, calc((var(--lightness) - 0.5) * -999999%)); }

/* <50% 为负 → opacity 钳到 0（隐藏）；≥50% 钳到 1（显示） */
.pie-half { opacity: calc(99999 * (var(--percent) - 50)); }
```

text-shadow、border 等可用同法按阈值显隐。自动配色按钮、静态饼图的完整配方见 [patterns.md](./patterns.md)。

## 变量 + calc + counter：数据驱动样式

机理：变量是值通道，calc 负责算术，counter-reset 能把变量值搬进 content——三者组合让 HTML 内联的一个变量驱动整套样式，CSS 声明零分支。这也是 JS/CSS 的职责分界：JS 只改一个变量，所有取用点自动跟随。

- JS 交互：`element.style.setProperty('--x', v)` 写；`getComputedStyle(el).getPropertyValue('--x')` 读。
- HTML 内联 `style="--percent: 40"` 是数据驱动样式的常用入口。
- 变量进 content 需 counter 中转，且值必须是整数。

```css
.bar::before {
  width: calc(1% * var(--percent));        /* 变量驱动宽度 */
  counter-reset: progress var(--percent);  /* 变量进 content 的桥 */
  content: counter(progress) "%";
}
```

```html
<!-- 数据入口：模板只写变量，不写样式 -->
<div class="bar" style="--percent: 40"></div>
```

## 主题系统机理

换肤的本质是只改变量：主题变量集中在 `:root`，深色模式用 prefers-color-scheme 媒体查询覆盖同名变量，全站取用点自动跟随——零 JS。

```css
:root { --bg: #fff; --fg: #1f2328; }
@media (prefers-color-scheme: dark) {
  :root { --bg: #0d1117; --fg: #e6edf3; }
}
html[data-theme="dark"] { --bg: #0d1117; --fg: #e6edf3; }  /* 手动切换覆盖系统 */
body { background: var(--bg); color: var(--fg); }
```

要点：JS 换肤就是 `setProperty` 改 `:root` 变量或切换 data-theme；取用点（body、组件、Shadow DOM 内部）一行不用动。

深色模式的完整配方（图片自适应、混合模式方案）见 [patterns.md](./patterns.md)。

## @property：给变量装类型

机理：未注册的变量是任意 token 串，浏览器不知道它是颜色还是长度，没有插值路径，永远不能过渡。@property 注册 syntax / inherits / initial-value 后变量获得数据类型，从而可参与 transition / animation——渐变本身不可过渡，注册两端颜色变量是渐变动画的官方解。这是数据类型思维的落地：类型决定能力。

```css
@property --start-color {
  syntax: '<color>';
  inherits: false;
  initial-value: deepskyblue;  /* syntax 非 '*' 时必填，漏写注册无效 */
}
.button {
  background: linear-gradient(var(--start-color), deeppink);
  transition: --start-color .3s;
}
.button:hover { --start-color: deeppink; }
```

- syntax 合法值：`<length>` / `<percentage>` / `<color>` / `<angle>` / `<number>` / `<integer>` / `<image>` / `+`（列表）/ `|`（或）。
- JS 侧等价物：

```js
CSS.registerProperty({
  name: '--start-color',
  syntax: '<color>',
  inherits: false,
  initialValue: 'deepskyblue',
});
```

- 注册后变量仍是变量：var()、fallback、级联、继承语义照旧，只是多了类型与插值能力。
- inherits 取舍：主题类变量（颜色/间距）取 true 且放 :root；局部动画变量取 false，防止向外泄漏。

| | 未注册变量 | @property 注册后 |
| --- | --- | --- |
| 值的本质 | 任意 token 串 | 带 syntax 类型 |
| transition / animation | 不可能（无插值路径） | 可插值 |
| 未定义时的兜底 | 走 var() fallback | initial-value |
| 继承 | 始终继承 | 由 inherits 决定 |

```css
/* 渐变角度动画：transform 之外又一个注册才可过渡的维度 */
@property --angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 45deg;
}
.badge {
  background: conic-gradient(from var(--angle), deepskyblue, deeppink);
  transition: --angle .4s;
}
.badge:hover { --angle: 225deg; }
```

反模式：指望未注册变量走 transition——token 串没有类型就没有插值；@property 漏写 initial-value 导致整条注册失效。

## Houdini 全景

@property 属于 Houdini 的 Properties & Values API；Paint API（`paint()` 自绘 `<image>`）、Layout API、Typed OM 等其余模块归 [interaction-advanced.md](./interaction-advanced.md)。
