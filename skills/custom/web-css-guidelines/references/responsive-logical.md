# 响应式适配与逻辑属性（@media / clamp / env / 逻辑属性 / 流向）

管设备与环境的适配：媒体查询、流式尺寸公式、安全区、逻辑属性、书写方向，以及渐进增强的分流手段。写多端适配、深色模式、RTL/垂直排版、特性检测时读。

## @media 精简矩阵

媒体查询按环境给样式分流；结构 = 修饰符 + 媒体类型 + 条件 + 特性。类型只记 screen / print / all（读屏软件识别的是 screen，不是 speech）；`not` 否定的是整个查询语句，不是单个特性。

| 需求 | 特性 |
| --- | --- |
| 断点布局 | `(min-width: …)` / `(max-width: …)`（width/height 同构） |
| 深色模式 | `(prefers-color-scheme: dark)` |
| 尊重"减少动态效果"设置 | `(prefers-reduced-motion: reduce)` |
| 鼠标 vs 触屏 | `(hover: hover) and (pointer: fine)`；`any-*` 检测任意输入 |
| 高分屏 | `(min-resolution: 2dppx)` |
| 横竖屏 | `orientation`（软键盘弹出会误判，关键布局用 width 断点） |

- pointer 分 `fine`（鼠标/触控笔）与 `coarse`（手指）——hover 悬停类 UI 只给 fine。
- 断点默认移动优先：基础样式写小屏，`min-width` 逐级增强。
- JS 读媒体状态：`window.matchMedia('(prefers-color-scheme: dark)').matches`。
- 深色主题落地 = CSS 变量 + prefers-color-scheme，变量组织见 [variables.md](./variables.md)。
- 打印分页保护：`@media print` 内 `break-inside: avoid`。

```css
/* 结构解剖：类型 + 条件 + 特性 */
@media screen and (min-width: 480px) { /* … */ }

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  body { background: #1c1c1e; color: #eee; }
}

/* 尊重减少动效设置 */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}

/* 悬浮提示只在精确指针下启用——触屏没有 hover，别让提示永远出不来 */
.tooltip { display: none; }
@media (hover: hover) and (pointer: fine) {
  .target:hover .tooltip { display: block; }
}
```

## 流式数值黄金公式

尺寸随视口线性变化、但限制在区间内——无断点的连续适配。公式：

`clamp(MIN, calc(基准 + 斜率 * (100vw - 设计宽) / 区间宽), MAX)`

```css
/* 根字号：375px 视口 16px，414px 视口 18px，两端封顶 16~20px */
html {
  font-size: 16px; /* 旧浏览器兜底 */
  font-size: clamp(16px, calc(16px + 2 * (100vw - 375px) / 39), 20px);
}
```

- 斜率 = 目标增量 / 区间宽（例中 2 / 39）：视口每增 1px，字号增 2/39px。
- 区间取小取大分别用 `min()` / `max()`，clamp 是两者的区间封装。
- 组织方式：只流式化根字号，字号间距全用 rem——一条公式驱动整页；设计稿任意值换算成 rem 后自动随根字号联动。
- 同一设计稿的任意尺寸值共用同一条斜率，只换基准与上下限。

```css
/* 公式只写在根上，具体尺寸用 rem 表达 */
html { font-size: clamp(16px, calc(16px + 2 * (100vw - 375px) / 39), 20px); }
.icon { width: 7.5rem; }  /* 375 视口下 120px，随根字号整体缩放 */
```
- 反模式：全站纯 vw（`120 / 375 * 100 = 32vw` 式换算）让一切随屏宽线性缩放，大屏字大到失真；要 clamp 限区间，不做整站纯 vw。

## env() 安全区

读取设备安全区域（刘海屏、底部横条）的四向内边距。三要素缺一不可：

- 变量名区分大小写：`safe-area-inset-top` / `-right` / `-bottom` / `-left`。
- 必须配 `<meta name="viewport" content="…, viewport-fit=cover">`，否则值恒为 0。
- 第二参数写默认值兜底。

```css
.footer { padding-bottom: env(safe-area-inset-bottom, 20px); }
```

配套 HTML：`<meta name="viewport" content="width=device-width, viewport-fit=cover">`。与 var() 的区别：env() 可以出现在媒体查询语句里：

```css
@media (env(safe-area-inset-left) > 0px) {
  .sidebar { padding-left: env(safe-area-inset-left); }
}
```

## 逻辑属性

物理方向（left/right）在流变化（RTL、竖排）后会错位；逻辑属性以流为参照（inline/block × start/end），映射随 direction / writing-mode 自动换轴。ltr 水平流的映射：

| 物理 | 逻辑 |
| --- | --- |
| left / right | inline-start / inline-end |
| top / bottom | block-start / block-end |
| width / height | inline-size / block-size |
| margin / padding / border 各边 | `*-inline-start` 等对应变体 |

`writing-mode: vertical-rl` 下水平垂直互换，上表整体换轴。

- 日常高频只有 `inset`：`position: absolute; inset: 0` 等价于 left/top/right/bottom 全 0，支持 1~4 值，方位语法同 margin。
- 只在配合 writing-mode / direction / text-orientation 时才有意义；`flex-direction: row-reverse` 是布局顺序，与逻辑属性无关，别混。
- 对齐对应：`text-align: start / end`。

```css
/* 镜像对称布局（聊天对话）：一侧用逻辑属性，另一侧一句 direction 反转 */
.bubble { margin-inline-start: 10px; }
[data-self="me"] { direction: rtl; }
```

direction 一句反转的机理：rtl 反转的是替换元素与 inline-block 的水平呈现顺序，元素本身不用逐个改 margin。

## 流向三剑客

direction / unicode-bidi 管内联方向，writing-mode 颠覆纵横——一横一纵没有交集，不能指望联动；`vertical-rl` 的 rl 是水平列进方向，direction:rtl 改的是行内文本方向。

**direction: rtl 的性价比场景**：桌面"确认在左"，移动端一行反转，免 JS 免改 DOM：

```css
@media screen and (max-width: 480px) {
  .dialog-footer { direction: rtl; }
}
```

- 开头打点：`dir="rtl"` + 省略号三件套 → 省略号出现在文字开头，配 `text-align: left` 保住尾部图标不被打点。

```css
.ell { width: 240px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
/* <p class="ell" dir="rtl">长文本…</p> */
```
- 纯中文设 rtl 不会逐字反排（字符不动，只有替换元素/inline-block 反序）；逐字反向必须 `unicode-bidi: bidi-override`。

**unicode-bidi**（处理混合方向文字）：`normal`（默认，仅图片/按钮等按 direction 反排）/ `embed`（开独立嵌入层，隔离外部重排）/ `bidi-override`（强制所有字符按 direction 反排）。非 normal 值克制使用。

**writing-mode: vertical-rl / vertical-lr**：现代浏览器全支持，直接用。切换纵横后，水平流的规则整体换轴：

| 水平流规则 | 垂直流表现 |
| --- | --- |
| 垂直方向 margin 合并 | 水平方向 margin 合并 |
| 块元素 margin:auto 水平居中 | margin:auto 直接垂直居中 |
| text-align:center 图片水平居中 | text-align:center 图片垂直居中 |
| text-indent 水平缩进 | 垂直位移——按钮 `:active` 文字下沉免高度计算 |
| 拉丁字符直立 | 天然"躺倒"90°，icon 字体免 transform 旋转 |

```css
.vertical { writing-mode: vertical-rl; }
.vertical .btn:active { text-indent: 2px; } /* 按下文字下沉反馈 */
```

- 父子设相同 writing-mode 值不累加，不会二次旋转。
- 反模式：给纯中文设 direction:rtl 期待逐字反排；混用 vertical-rl 与 direction:rtl 想叠加效果。

```css
/* 垂直流下块元素垂直居中：auto 填充轴换到垂直 */
.vertical { writing-mode: vertical-rl; }
.vertical > .center { margin: auto 0; } /* 需父容器高于内容 */
```

direction 的其他反转用途：表格列顺序整体镜像；`text-align: justify` 时让最后一行落单元素靠右。

## 渐进增强五技巧

能力分流的优先级阶梯，能用前面的就不上后面的：

1. **直接用**——纯体验升级类属性（border-radius / box-shadow / filter / scroll-behavior）不识别就保持原样，不做任何分流。
2. **属性值语法差异**——同一属性先写旧值再写新值，新语法不识别时旧声明继续生效：`font-size: 16px; font-size: clamp(…)`。
3. **伪类/伪元素区分**——规则集里有无法识别的选择器则整条忽略，把新伪类塞进选择器组即可圈定支持范围（例：`x-card:defined { … }` 自定义元素升级后才套样式）。前缀策略可能变，勿当长期契约。
4. **@supports**——最正统的特性检测；复杂条件必须括号嵌套：`@supports (display: flex) and (not (display: grid))`；块内可嵌任意 @ 规则。
5. **JS 兜底**——`CSS.supports('position', 'sticky')` 为假时上 JS 方案。

```css
@supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
  .glass { backdrop-filter: blur(8px); }
}
```

反模式：直写 `and not (…)`——必须 `(not (…))` 括号嵌套，否则整条解析失败。

阶梯判断：体验类升级直接用；功能类差异走 @supports；结构性依赖才动 JS。

## image-set() 多倍图与 touch-action

`image-set()` 按屏幕密度选图，属 `<image>` 家族（background-image / mask-image 通用）：

```css
.hero { background-image: image-set(url(hero.png) 1x, url(hero@2x.png) 2x); }
```

适用条件：不同密度显示真正不同的图（非仅尺寸差异）且流量收益明显；普通多倍图场景用 `resolution` 查询 + background-size 即可。内容图的对应物是 HTML 侧 `srcset` / `sizes`——`<img>` 走 HTML，装饰图走 CSS。

`touch-action: manipulation` 只保留滚动与持续缩放、禁双击缩放——消除移动端点击延迟的官方姿势，免费的全局优化：

```css
html { touch-action: manipulation; }
```

其余值：`none` 全禁（自绘手势，画板）；`pan-x` / `pan-y` 及方向变体限定滚动方向（轮播横滑防纵滑干扰）；值可组合 `pan-left pan-up`。与 `overscroll-behavior` 分工：touch-action 管"手势怎么响应"，overscroll-behavior 管"滚到头怎么办"（见 [interaction-advanced.md](./interaction-advanced.md)）。
