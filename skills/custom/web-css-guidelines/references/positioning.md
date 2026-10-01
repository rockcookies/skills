# 定位体系

管 position 四值（absolute / relative / fixed / sticky）、无依赖定位、流体特性、锚点定位、inset 速记与 scroll-snap。写或排障角标、弹层居中、黏性表头、锚点错乱、轮播停靠等问题时读；float 与 BFC 机理见 layout-flow.md，层叠顺序见 stacking.md，内联世界见 inline-box.md。

## absolute 与 float 的兄弟关系

absolute 与 float 同为「文字环绕」而生的流破坏者，共享四个特性，但 absolute 更霸道。

四共性：

- **块状化**：display 计算值变 block——`span` 设 absolute 后可直接设宽高，无需补 `display:block`。
- **包裹性**：宽度收缩适配内容，天然具备，无需再写 `display:inline-block`。
- **破坏性**：脱离文档流，父元素高度塌陷是标准行为（流内的应对见 [layout-flow](./layout-flow.md)）。
- **自成结界**：建立新的 BFC，内部布局不影响外部、不发生 margin 合并（BFC 机理见 [layout-flow](./layout-flow.md)）。

absolute 更霸道：同一元素 float 与 absolute 并存时 float 失效，float 的全部特性让位于 absolute。

```css
.tag { position: absolute; width: 100px; height: 20px; }  /* span 直接可设宽高 */
```

反模式：给 absolute 元素补 `display:inline-block` 或 `float`——一个多余、一个失效。

## absolute 的包含块

absolute 的所有方位值与百分比都相对包含块计算，而它的包含块规则与普通元素完全不同。

- 最近 `position ≠ static` 祖先的 **padding box**（普通元素的百分比宽高相对父级 content box——这正是绝对定位能救活百分比高度的原因，见 [layout-flow](./layout-flow.md)）。
- 祖先为纯内联元素时：包含块由该内联元素前后生成的 0 宽内联盒的 padding box 包围盒决定——范围稳固、不受 line-height 影响；内联祖先跨行时属未定义行为，别依赖。
- 无定位祖先 → 初始包含块（视口）。

方位 0 贴的是包含块 padding box 的边缘（即 border 内边缘），不是 content 边缘：

```css
.frame { position: relative; padding: 20px; }
.frame .corner { position: absolute; top: 0; right: 0; }  /* 贴 border 内边缘，非 content 外 20px */
```

查锚三步（absolute 元素方位计算失真时）：

1. 沿祖先链向上找第一个 `position ≠ static` 的元素——那就是包含块。
2. 取它的 padding box（border 内边缘）作为坐标系。
3. 所有 top/right/bottom/left 与百分比宽高都在这个框里计算。

反模式：祖先链上有「为了 z-index 顺手加的」relative/fixed 祖先——absolute 后代全部错锚到它（预防见 relative 节的最小化影响原则）。

## 无依赖绝对定位

absolute 元素不设 left/top/right/bottom 时，停留在流内原位置——只是不再占空间，相对位置关系全部保留。

规则：

- 原地悬浮、不占流空间、不影响兄弟元素，因此**免 relative、免 z-index**。
- 跟随正文流动：文字长度变化、字号变化，定位关系自动维持；元素原本是内联时，还随 text-align 与换行走。
- 锚点是元素自身的流内位置——移动 DOM 位置或改文本长度会带着它走，这正是「随文角标」需要的行为。
- 适用：角标、小图标、行内提示、必填星标——凡是「贴在某段内容旁边」的元素。

```css
/* 角标图标：只声明 absolute + margin 微调，父级与兄弟零改动 */
.icon-hot { position: absolute; margin: -6px 0 0 2px; }

/* 必填星标：贴在标签文字之后 */
.required::after { content: '*'; position: absolute; margin-left: 2px; color: red; }
```

反模式：「absolute 必配 relative + top/left + z-index 三件套」——错误认知（以为 absolute 会跑到窗口左上角）导致的滥用；无依赖定位大多一行搞定且免维护。

## 流体特性：对立方位定位

absolute 的对立方位（left/right 或 top/bottom）同时设置时，宽（高）由外部决定——格式化宽度/高度，元素恢复完全的流体性，比普通块级更强。

规则：

- 对立方位同时定位 → 尺寸自适应包含块 padding box，**水平垂直双向流动**（格式化高度仅存在于绝对定位模型）。
- 只设单侧（另一侧 auto）→ 不拉伸，退回包裹性。
- 流体态下 margin/padding/`margin:auto` 全部恢复普通流行为（镜像法则见 [layout-flow](./layout-flow.md)）。
- `auto` 与数值之间无法平滑过渡——方位值从 auto 改为定值不做插值，需要动画时用 transform/opacity。
- 覆盖全屏用四向 0，不用 `width/height:100%`——后者加 margin 直接跑出窗体、加 padding 溢出。

```css
/* 全屏覆盖（流体写法，padding/margin 自动分配） */
.overlay { position: absolute; left: 0; right: 0; top: 0; bottom: 0; }

/* 定宽高 + 四向 0 + margin:auto：水平垂直居中 */
.box { position: absolute; left: 0; right: 0; top: 0; bottom: 0;
       width: 200px; height: 100px; margin: auto; }

/* 尺寸不定也居中：fit-content 给出确定尺寸；不占 transform，与动画关键帧无冲突 */
.dialog { position: absolute; inset: 0; width: fit-content; height: fit-content;
          margin: auto; }
```

注意：Firefox 认 `height:fit-content` 语法但无效果，`@supports` 检测不出真相。更多居中配方见 [patterns](./patterns.md)。

## relative

relative 相对自身原位置偏移，且**无侵入**——偏移后原占位保留、后续元素纹丝不动。

与 margin 定位的本质差异：

| | relative | margin |
|---|---|---|
| 占位 | 保留原占位 | 改变占位 |
| 兄弟元素 | 纹丝不动 | 被推动 |
| 溢出容器 | 可以（视觉越界） | 受流约束 |
| 用途 | 视觉微调、锚 absolute | 间距与流布局 |

规则：

- 对立方位同用时「你死我活」，按文档流顺序定胜负：top 压 bottom、left 压 right——与 absolute 的双向拉伸完全相反。
- top/bottom 百分比相对包含块高度；包含块高度为 auto 时百分比计算值为 0，偏移无效。
- 不脱离文档流、不创建结界、不改变元素尺寸；作用是位移 + 充当 absolute 后代的包含块锚点。
- **最小化影响原则**：① 能用无依赖绝对定位就不用 relative；② 必须用时，把 relative 套在仅包住目标元素的最小容器上，不污染整个模块。

```css
/* relative 只包住需要锚点的最小单元 */
.card { position: relative; }        /* 而不是挂在 .module 大容器上 */
.card .badge { position: absolute; top: 0; right: 0; }
```

反模式：relative 直接挂在模块大容器上——所有 absolute 后代的包含块被整个模块霸占，方位计算失真，还埋下锚点错乱隐患。

## fixed

fixed 的包含块是初始包含块（视口），任何 relative 祖先都限制不了它。

规则：

- 祖先带 `transform ≠ none` 时 fixed 退化为相对该祖先定位——想「容器内固定」不要依赖此副作用，用 absolute 模拟：页面滚动交给内部 `overflow:auto` 容器，元素本身 absolute 定在容器内。
- 无依赖写法对 fixed 同样成立：不设方位值则停留在流内原位、随视口固定；居中场景现代改用 flex/grid 更直观。
- fixed 在现代浏览器天然创建层叠结界（无需 z-index），子孙 z-index 被封锁在内——机理见 [stacking](./stacking.md)。
- 弹层的滚动穿透与背景锁定（overscroll-behavior、根元素 overflow:hidden）见 [interaction-advanced](./interaction-advanced.md)。

```css
/* 「被限制的固定效果」：容器 absolute + 内部滚动 */
.modal-wrap { position: absolute; inset: 0; }
.modal-body { height: 100%; overflow: auto; }
```

## 锚点定位

锚点定位的本质是改变容器的滚动高度（scrollTop），由内而外逐层触发所有可滚动的祖先容器——这是滚动容器类布局错乱的通用病根。

两种触发：

1. URL 锚链交互（`<a href="#target">`；`<a href="#">` 即返回顶部，无 JS 依赖）。
2. 可 focus 元素获得焦点——focus 会让该元素滚入可视区。

- 免 JS 滚动定位的利用：需要滚动到某元素时直接 `el.focus()`，锚点定位链自动完成，不必手写 scrollIntoView。
- `overflow:hidden` 的祖先仍是可滚动容器——锚点/focus 依然会滚动它（scrollTop 可编程写入），只是不显示滚动条。
- 定位链会触发**所有**方向上需要滚动的祖先——页面带横向滚动容器时，一次纵向 focus 也可能带出横向滚动。
- margin 负值等高布局中锚点错乱，根因是负 margin 改变了元素的正常流位置，锚点滚动量与视觉位置脱节（模式见 [patterns](./patterns.md)）。
- 锚点跳转的平滑化 `scroll-behavior:smooth` 见 [interaction-advanced](./interaction-advanced.md)。

```html
<a href="#">返回顶部</a>
```

## sticky

sticky 是 relative 的延伸（不是 relative + fixed 的混合）：像 relative 一样占位保留、创建绝对定位包含块、可设 z-index；但偏移计算另起一套。

机理：

- 偏移基准 = 层级最近的**可滚动祖先**（没有则视窗）——祖先有 `overflow ≠ visible` 时，窗体滚动永远带不动它，黏性失效不是 bug。
- **黏性约束矩形** = 包含块矩形 ∩ 流盒按 top/bottom 偏移后的矩形。元素碰到约束矩形边缘开始吸附；滚出约束矩形就被「带滚」随父容器离开。
- 偏移属性通常只设一侧（如仅 top），另一侧保持 auto；双侧同设时约束矩形上下同时收窄，活动空间更小。
- 堆叠行为：同一容器内的多个 sticky 相互重叠；**不同容器**内的 sticky 依次推开——通讯录字母索引、分组表头必须给每个条目套独立容器。

三问排障（黏性不生效按序检查）：

| 序 | 问题 | 判定与处方 |
|---|---|---|
| 1 | 祖先 overflow ≠ visible？ | 黏性基准变为该祖先；把 sticky 元素移出，或改该祖先 overflow:visible |
| 2 | 父容器与元素等高？ | 约束矩形无活动空间，永无黏性；父容器需更高内容撑开 |
| 3 | 多个 sticky 未分容器？ | 同容器只会重叠不会推开；每个 sticky 套独立容器 |

推演：`div{height:100px;margin-top:50px}` 内包 `nav{position:sticky;top:20px}`——初始 nav 距约束矩形顶 33px 无效果；滚动至贴边开始吸附；nav 底部触及 div 底边后黏性失效、随父滚走。

```css
/* 分组表头：每组独立 section，标题吸附时下一组把它推走 */
h4 { position: sticky; top: 0; }
```

适用场景速判：

- 分组表头吸附：`sticky; top:0` + 每组独立容器——下一组推走上一组的标题。
- 通讯录字母索引：每个条目独立容器，否则同容器只重叠不推开。
- 底部操作条：`sticky; bottom:0`，吸附于约束矩形底边。
- 侧栏跟随：需要父容器明显高 sticky 元素，否则约束矩形无活动空间（三问第 2 问）。

层次滚动（标题 sticky top + 评论区 sticky bottom + z-index:-1）的完整模式见 [patterns](./patterns.md)。

## inset 速记

inset 是四向定位的缩写：`inset:0` ≡ `left:0; top:0; right:0; bottom:0`。

- 支持 1~4 值，方位规则同 margin（如 `inset:0 auto auto 10px` 表示仅左 10px）。
- 它是逻辑属性家族里唯一日常高频的成员；完整逻辑属性体系（inline/block × start/end，writing-mode/direction 联动）见 [responsive-logical](./responsive-logical.md)。

```css
.fullscreen { position: absolute; inset: 0; }
```

## scroll-snap

Scroll Snap 把「滚动停靠位置」交给 CSS：容器声明停靠轴与严格度，子项声明对齐线——轮播与整屏滚动的纯 CSS 方案。

属性分工：

- 容器 `scroll-snap-type: x | y | both` + `mandatory | proximity`——mandatory 强制吸附，proximity 靠近才吸。
- 子项 `scroll-snap-align: start | center | end`；双值（如 `start end`）分别作用于两个滚动轴。
- 子项 `scroll-snap-stop: always`——强制逐卡停靠，防止一划到底（轮播必备）。
- 子项 `scroll-margin`——捕获点向外扩边距；容器侧对应物是 `scroll-padding`（如吸附时为 sticky 表头预留高度）。
- 吸附对齐区域 = 子项 border box 外扩 scroll-margin，与 margin 无关——调吸附位置用 scroll-margin。

```css
/* 横向轮播：整卡停靠 + 逐卡滚动 + 平滑滚动 */
.carousel {
  display: flex; overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
}
.carousel > li {
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

/* 纵向整屏滚动：每屏顶部对齐 */
.pager { height: 100vh; overflow-y: auto; scroll-snap-type: y mandatory; }
.pager > section { scroll-snap-align: start; }
```

选型与反模式：

- 只在容器写 type、子项不写 align → 无效果；两属性缺一不可，且 type 归容器、align 归子项，写反皆无效。
- 内容比视口高的长页面用 mandatory → 用户无法停在任意位置阅读；此类场景用 proximity。

## 定位选型速查表

| 需求 | 正确姿势 | 反面写法 |
|---|---|---|
| absolute 覆盖全屏 | 四向 0（`inset:0`） | `width/height:100%` |
| absolute 居中 | 四向 0 + `margin:auto` | `top:50%` + margin-top 负一半 |
| 小图标角标 | 无依赖 absolute + margin | 父 relative + top/right 定值三件套 |
| relative 锚定 absolute | 套最小容器 | 挂在模块大容器上 |
| fixed 受限于容器 | absolute 模拟 + 内部滚动容器 | 依赖祖先 transform 副作用 |
| 黏性表头吸附 | sticky + 检查三问 | JS 监听滚动加 fixed |
| 轮播/整屏停靠 | scroll-snap-type + align | JS 计算滚动位置 |
| 滚动定位到某元素 | `el.focus()` 或 `href="#id"` | 手写滚动量计算 |
