# 滚动交互与渲染性能（滚动 / pointer / cursor / contain / SVG / Houdini）

管行为级 CSS 与低频高级特性：滚动体验、指针与选择行为、渲染隔离与屏外渲染、SVG 样式控制、Houdini。做弹层滚动、遮罩镂空、label 代言控件、长列表优化、描边动画时读。

## 滚动四件套

滚动体验的四类问题各有专属属性，不再需要 JS 滚动监听：

| 问题 | 解 |
| --- | --- |
| 锚点跳转生硬 | `scroll-behavior: smooth` |
| 弹层滚动穿透（滚到边缘带动 body） | `overscroll-behavior: contain` |
| 上方内容加载导致视口跳动 | `overflow-anchor`（默认 auto 已启用锚定，跳动元凶可局部设 none 关闭） |
| 轮播/整屏滚动停靠 | CSS Scroll Snap → [positioning.md](./positioning.md) |

```css
html { scroll-behavior: smooth; }
.modal { overscroll-behavior: contain; }
```

- `overscroll-behavior` 支持 x/y 分轴；`contain` 保留自身边缘反弹、只是不再外泄，`none` 连自身反弹都禁。
- scroll-behavior 属纯体验升级，直接用，不做分流。

## pointer-events

`pointer-events: none` 让元素对指针"不存在"；三条隐藏性格决定处方：

- 不拦键盘：Tab 仍聚焦、回车仍触发——真禁用必须用 `disabled` 属性。
- 无障碍受损：title 提示读不到，禁用态别只靠它。
- 继承性可复活：父 none、子 `pointer-events: auto` 局部恢复——遮罩镂空可点击的公式。

```css
/* 蒙层挡视线不挡点击，只有高亮区可点 */
.overlay { pointer-events: none; }
.overlay .spot { pointer-events: auto; }
```

反模式：把 pointer-events:none 当"完整禁用"——键盘照常触发；需要禁用语义时用 disabled + 样式表达。

## user-select 与 ::selection

- `user-select`：`auto` / `text` / `none` / `all`（点击任一处整段全选）/ `contain`；Safari 需 `-webkit-user-select` 双写。
- `::before` / `::after` 的 content 永远不可选。
- `user-select: none` 必须同步 `cursor: default`——文字光标却选不中，语义矛盾。
- `::selection` 定制选中态（color / background-color / caret-color），品牌化整站配色的常规动作。

```css
.code-block { user-select: all; cursor: default; }
.code-block ::selection { background: deepskyblue; color: #fff; }
```

## cursor 语义分类

光标是交互语义的预告，按语义选值而不是只会 pointer：

| 类别 | 值与要点 |
| --- | --- |
| 常规 | `auto`（默认值，按内容自适应）/ `default`（不是默认值）/ `none` |
| 状态 | `pointer`（链接与可点击）/ `help`（辅助说明，比 pointer 细腻）/ `progress` / `context-menu` |
| 选择 | `text` / `vertical-text` / `crosshair`（像素级框选、取色）/ `cell` |
| 拖曳 | `move` / `copy` / `alias` / `no-drop` / `not-allowed` |
| 拉伸 | 单向 `n/e/s/w/ne/nw/se/sw-resize`、双向 `ew/ns/nesw/nwse-resize`（对写两行兜底） |
| 缩放/抓取 | `zoom-in` / `zoom-out` / `grab` / `grabbing` |

- 模拟禁用态把 pointer 还原成 `default`，用视觉灰态表达；`not-allowed` 属拖曳语义，别用在禁用按钮上。
- `wait` 有死机既视感，处理中用 progress 或组件内动画。
- 可拖拽区域（弹窗标题栏、裁剪框）务必 `cursor: move`，否则用户学习成本白给。

```css
/* JS 未就绪窗口期：界面已渲染但不可交互，全局转圈缓解焦虑，初始化完改回 auto */
body { cursor: progress; }
```

## label 代言按钮

原生控件视觉不可控时，藏控件、留行为：label 变身按钮承接 UI，原生点击、表单提交、焦点管理全部保留。

```css
/* 原生控件 clip 隐藏：视觉消失，行为与可达性保留 */
[type="file"] {
  position: absolute;
  width: 1px; height: 1px;
  clip-path: inset(50%);
  overflow: hidden;
}

/* label 用 for 关联控件，承接全部按钮样式 */
.btn-label {
  display: inline-block;
  padding: 8px 16px;
  background: deepskyblue;
  color: #fff;
}

/* 焦点代理：Tab 聚焦的是隐形控件，焦点环必须写在 :focus + label 上才可见 */
input:focus-visible + .btn-label {
  outline: 2px solid Highlight;
  outline-offset: 2px;
}
```

反模式：把原生控件 display:none 再配 label——点击仍能触发但键盘可达性丢失；clip 隐藏两样都保。隐藏方案全维度对比见 [visibility-media.md](./visibility-media.md)。

## contain：渲染隔离

向浏览器声明"子树变化不外泄"，外部无需随之重排重绘——局部频繁重排的组件（卡片流、评论区）用它换稳定性。

| 值 | 隔离内容 |
| --- | --- |
| `layout` | 内部布局不影响外部 |
| `style` | 计数器等样式作用不外泄 |
| `paint` | 内容不溢出边界（溢出部分不绘制） |
| `size` | 尺寸与内容无关——元素尺寸需已知，否则塌陷 |
| `content` | = layout + paint，常用起点 |

```css
.card { contain: content; }
```

## content-visibility：跳过屏外渲染

`content-visibility: auto` 让视口外的子树跳过 layout 与 paint，滚到附近才渲染——长列表、长页面的渲染性能大杀器。必须配 `contain-intrinsic-size` 给占位高度，否则屏外高度为 0、滚动条乱跳。

```css
.feed > section {
  content-visibility: auto;
  contain-intrinsic-size: auto 320px;
}
```

占位高度估计不准时，滚入瞬间会跳动；`auto` 前缀让浏览器记住渲染后的真实尺寸，二次滚动不跳。

## 性能三件套排序

优化优先级：`content-visibility: auto`（直接减渲染量）> `contain: content`（隔离重排范围）> `will-change`（提前分层）。前两者几乎零风险，will-change 有代价，排最后。

will-change 提前告知浏览器将要变化的属性使其预先优化（提升层、分配显存）；慎用三律：

- 每个值都消耗内存与合成层，禁止全站 `* { will-change: transform }`。
- 写上即生效对应副作用：`will-change: transform` 等同 transform ≠ none，创建[结界](./stacking.md)。
- 用完移除（JS 在动画结束后删），或只加在即将交互的少量父层上。

动画性能细节见 [transform-animation.md](./transform-animation.md)。

## SVG 的 CSS 控制

SVG 的外观属性全面 CSS 化：fill / stroke / stroke-width 等直接写样式表，且参与继承、支持 currentColor。

- `fill` 有类继承表现：`svg.icon { fill: currentColor }` 让整棵图标树跟随文字颜色——图标变色的标准姿势。
- `stroke` + `fill` 是全兼容的 SVG 文字描边姿势，覆盖面比 `-webkit-text-stroke` 广。

**描边动画万能公式**：`stroke-dasharray: L` + `stroke-dashoffset: L → 0`（L = 路径总长，JS `getTotalLength()` 取值），即"画出来"效果——环形进度、签名回放、下划线动效的地基。

```css
/* 环形进度：dashoffset 驱动 */
circle.progress {
  fill: none;
  stroke: deepskyblue;
  stroke-width: 6;
  stroke-dasharray: 1069;    /* 2πr，路径总长 */
  stroke-dashoffset: 1069;   /* 0% */
  transition: stroke-dashoffset .6s;
}
circle.progress.done { stroke-dashoffset: 0; }  /* 100% */

/* 图标随文字变色 */
svg.icon { fill: currentColor; }

/* 外描边文字：描边垫底，不侵蚀字形 */
text { fill: crimson; stroke: #fff; stroke-width: 6px; paint-order: stroke; }

/* 自适应波形：描边宽度不随缩放 */
path.wave { vector-effect: non-scaling-stroke; }
```

- `paint-order: stroke` 改绘制顺序让描边垫底 = 外描边，解决 `-webkit-text-stroke` 向内侵蚀字形的问题。
- `vector-effect: non-scaling-stroke` 让描边宽度不随 SVG 缩放——波形图自适应宽度时保持恒定线宽。
- 反模式：只设 dashoffset 不设 dasharray——dasharray 决定"一圈多长"，两者必须配套，进度值按 L 换算。

## Houdini

把 CSS 引擎的绘制、布局等环节开放给 JS 扩展；当下可用入口是 Paint API，变量类型注册 @property 见 [variables.md](./variables.md)。

**CSS Paint API**：`paint(name)` 是 `<image>` 家族成员（数据类型思维：background-image / mask-image / border-image 通吃），JS 侧 `registerPaint('name', class)` 注册，`paint(context, size, properties)` 方法内用 Canvas 语法自绘；CSS 变量是数据通道，改变量即触发重绘。

```css
.fancy {
  background-image: paint(ripple);
  --ripple-color: deepskyblue; /* worklet 里 properties.get() 读取 */
}
```

```js
registerPaint('ripple', class {
  paint(ctx, size, properties) {
    const color = properties.get('--ripple-color');
    // ctx ≈ Canvas 2D context；size 是元素 content-box 尺寸
  }
});
```

Layout API（`display: layout(name)` 自定义布局）、Typed OM（类型化 CSSOM 读写）、Parser / Animation Worklet / Font Metrics 仍在演进，勿当生产力依赖。
