# 内联盒模型与垂直对齐

管内联世界的机理：内联盒模型四层、strut、基线体系、line-height、vertical-align 与图文混排对齐。图片底部间隙、容器高度不等于行高、图标对不齐、inline-block 错位等排障时读；块级尺寸与 BFC 见 layout-flow.md，定位见 positioning.md。

## 内联盒模型四层

内联内容从字符到容器有严格的四层结构，每层的尺寸归属不同；内联怪象几乎都发生在层与层的交互处。

| 层 | 是什么 | 高度由谁定 |
|---|---|---|
| 内容区域 | 字符盒子（em-box） | font-size；可用「文本选中背景色」可视化 |
| 内联盒子 | 有标签的内联元素（`<em>`、`<span>`） | 自身内容区域与 line-height |
| 匿名内联盒子 | 光秃秃的文字 | 同上，无标签、不可直接挂样式 |
| 行框盒子 | 每一行一个 | 内部所有内联盒子与 strut 共同决定 |
| 包含盒子 | 容器（`<p>`、`div`） | 所有行框盒子依次堆叠 |

对照示例：

```html
<p>光秃文字<em>有标签</em>继续文字</p>
```

- 「光秃文字」「继续文字」是两个匿名内联盒子，`<em>` 是内联盒子，整段构成一行（或数行）行框盒子，`<p>` 是包含盒子。
- 排障入口：先定位现象发生在哪一层（字符高度？单行行框高度？容器内多行堆叠？），再查对应机理；跨层的怪象先看 strut。

## strut（幽灵空白节点）

标准模式（HTML5 文档声明）下，每个行框盒子行首都站着一个 0 宽、继承元素字体与行高的假想内联盒——strut 是内联世界一切诡异现象的头号元凶。

- 定义要点：规范名 strut（支柱）；不可见、0 宽，但真实参与基线对齐与行高计算。
- 继承的是行框盒子所属元素的 font-size 与 line-height——所以父级行高会通过它「绑架」子元素所在行。
- 空 `<span>` 能撑起 div 高度、`<div><img></div>` 底部出现间隙，都是它在作祟。
- 脑内渲染方法：把 strut 想象成行首一个不可见的「x」——有字号、有行高、有基线，参与一切内联计算。
- 排障方法：分析任何内联怪象，先假设行首站着一个 strut，再套 vertical-align 各值的定义逐个代入推演。

三大怪象与机理：

| 怪象 | 机理 |
|---|---|
| 图片底部间隙 | 图片按基线对齐 strut 中字母 x 的下边缘，x 的半行距露在图片下方 |
| 容器高度 ≠ line-height | strut 与内部内联盒的字号/行高/基线不一致，行框被撑大 |
| 内联元素 margin-top 负值推不出容器 | strut 的基线把内联元素限死，非主动位移不可能跑出容器 |

```css
/* 空内联元素撑起容器：高度 = strut 的行框高，不是 0 */
.box { line-height: 32px; }   /* <div class="box"><span></span></div> 高 32px */
```

处方分散在下文各节：图片间隙见「图片底部间隙」，高度异常见「line-height」与速查表，位移受限改用 relative 或 vertical-align 数值。

## 基线体系

内联世界的垂直坐标全部锚定在字母 x 上——中文排版同样以西文 x 为基准，换字体即换基准。

- 基线 = 字母 x 的下边缘；x-height = x 的高度（基线到中线 mean line）；`ex` = 1 个 x-height。
- `vertical-align:middle` 对齐的是「基线上方 1/2 x-height 处」（x 的交叉点），不是容器几何中分线——middle 永远只是近似垂直居中，下沉字体（微软雅黑）偏移更明显。
- 行高计算是全行博弈：改动一个元素的 vertical-align，整个行框盒子的高度都可能跟着变。
- 替换元素（img/input）的基线被定义为**下边缘**（其内容可能不含字符 x），尺寸与基线体系见 [替换元素](./visibility-media.md)。

```css
/* 图标高度用 ex 单位：默认基线对齐下与文字天然垂直居中，换字体字号都不失效 */
.icon { height: 1ex; }
```

## line-height 决定内联高度

纯内联非替换元素的可视高度完全由 line-height 决定——padding/border 不参与行盒高度计算，这是 strut 机制的直接后果。

- 行距 = line-height − font-size，且**上下等分**（各半行距）；传统印刷把行距独立处理或加在上方，CSS 的等分不是理所当然。
- 容器高度 = 各行框盒子高度之和；内联元素的 padding 不参与这个求和（行为见 [layout-flow](./layout-flow.md)）。
- 排障顺序：容器高度异常先量行框盒子，不要先怀疑 padding/margin——它们根本不进这个求和。
- 替换元素不受 line-height 影响，其高度直接参与撑高行框。

```css
.collapse { line-height: 0; }  /* 纯文本容器塌成边框高 */
.same     { font-size: 0; }    /* 行高 16px 仍是 16px——字号不改变行高本身 */
```

## line-height 的继承与计算

line-height 继承的是属性指定值还是计算值，数值与百分比/长度写法表现完全不同——这是行高问题的第一分岔。

| 写法 | 继承内容 | 子元素结果 |
|---|---|---|
| `line-height: 1.5`（数值） | 属性值本身 | 各元素按自身 font-size 重新计算 |
| `line-height: 150%` / `1.5em` | 计算值（如 21px） | 大字号标题行距不足、文字重叠 |

对照：

```css
body { line-height: 1.5; }   /* 父 14px→21px，子 h1 32px→48px，各自正确 */
body { line-height: 150%; }  /* 计算值 21px 传下去：h1 32px 字配 21px 行距，重叠 */
```

- `normal` 是随 font-family 变化的变量（微软雅黑 ≈1.32、宋体 ≈1.141），跨浏览器也不一致——必须显式重置，不能依赖默认值。
- 行高计算**向上舍入**：Chrome 下 `1.42857` 得 19px、`1.42858` 才是 20px；要精确像素直接写长度值 `line-height:20px`。
- 推荐值：图文站 1.6~1.8；心算友好首选 1.5。

```css
body { line-height: 1.5; }          /* 全局重置：只用数值 */

.single-line { line-height: 40px; } /* 单行文字垂直居中，不需要再设 height */
```

反模式：

- 全局 `line-height:150%` 或 `1.5em`——继承计算值，标题字号一大就重叠。
- 单行垂直居中先想 height——line-height 一个就够；且两者都是近似居中（字形偏下约 1px，普通场景可接受）。

## 大值特性

行框盒子的高度听其中**最大的 line-height**——根因是 strut 带着父级行高站在行首。

- 子元素 20px、父级 96px → 容器高 96px；子元素自己的 line-height「不生效」。
- 判定：「子元素 line-height 不生效」几乎都是大值特性，不是属性失效。
- 规避：给内联元素 `display:inline-block`——脱离所在行框盒子、自建独立行框。

```css
.father   { line-height: 96px; }
.son      { line-height: 20px; }        /* 无效：行框听 strut 的 96px */
.son-fix  { display: inline-block; line-height: 20px; }  /* 自建行框后生效 */
```

## vertical-align

vertical-align 对齐的双方是「元素」与「所在行框盒子的基线体系」，各属性值互不冲突，可逐个代入分析。

四类值：

| 类别 | 值 | 要点 |
|---|---|---|
| 线类 | baseline（默认，≡ 数值 0）/ top / middle / bottom | 对齐行框盒子的线，随行框变化 |
| 文本类 | text-top / text-bottom | 对齐父级内容区域，随 font-family 变化，实用性有限 |
| 上标下标类 | sub / super | 规范用语模糊，只配做上下标；不改变字号 |
| 数值百分比类 | `10px`、`-5px`、`20%` | 正上负下相对基线偏移；百分比相对 line-height 计算值 |

- 数值类是内联垂直微调**最强且兼容最好**的工具；百分比相对 line-height 计算值——行高一变偏移跟着变，精确微调一律用像素数值。
- 作用前提：display 计算值为 inline / inline-block / inline-table / table-cell；float、absolute 块状化后失效。
- table-cell 的 vertical-align 作用于**自身**（对齐的是其子元素）——给 cell 里的图片设 middle 无效，应设在 cell 上。

场景选型：

| 场景 | 用法 |
|---|---|
| 小图标与文字基线微调 | `vertical-align: -3px`（数值） |
| 图标随字号等比缩放对齐 | `height: 1ex` 配默认 baseline |
| 表格单元格内容垂直居中 | `td { vertical-align: middle }`（设在 cell 上） |

```css
.icon { vertical-align: -5px; }  /* 像素级下移对齐基线 */
```

反模式：

- 用 margin / relative 微调内联对齐——先想基线，`vertical-align` 数值一发入魂且无副作用。
- sub / super 当通用对齐工具——偏移量规范没定义死，只配做真正的上下标。

## inline-block 的基线规则

inline-block 的基线取决于内容状态——这是 inline-block 之间基线错位的钥匙。

- 有内联内容且 `overflow:visible` → 基线 = **最后一行内联元素**的基线。
- 空元素或 overflow 裁剪（含 `hidden`）→ 基线 = 自己的 **margin 底边缘**——裁剪态一律按规则二处理。

20px 雪碧图图标的基线策略：图标内永远有字符且不裁剪。

```css
.icon {
  display: inline-block; width: 20px; height: 20px;
  background: url(sprite.png) no-repeat;
  white-space: nowrap; letter-spacing: -1em; text-indent: -999em;
}
.icon::before { content: '\3000'; }   /* 全角空格，撑出字符基线 */
```

空 inline-block 错位的三种修法：

```css
.items > a        { vertical-align: top; }      /* 脱离基线对齐 */
.items > a::after { content: '\200b'; }         /* 塞字符提供基线 */
.items            { font-size: 0; }             /* 消掉 strut 行高，子项再恢复字号 */
```

反模式：用 `overflow:hidden` 藏图标文字——基线变为底边缘，图标对不齐；用 `text-indent:-999em` + `letter-spacing:-1em` 缩进即可保留基线。

## 图文混排行框盒子

图文共存时行框盒子高度由多方博弈，line-height 只是下限。

- line-height 只决定行框盒子的**最小高度**；替换元素（图片）的高度直接参与撑高行框。
- 「文字行高 20px，容器却是 21/22px」→ 是 vertical-align 基线位移在作祟，不是 line-height 失效。

```css
/* 大小字号混排后容器偏高：统一字号或脱离基线 */
.mix       { vertical-align: top; }
.mix .sub  { font-size: 12px; vertical-align: top; }
```

## 图片底部间隙

元凶三件套：strut + line-height + baseline——图片基线对齐 strut 中 x 的下边缘，x 的半行距嫁祸给图片下方。

- 间隙量 ≈ strut 的下半行距，随容器字号变化——这是验证元凶的快捷判据。

四种清除处方，按副作用选：

```css
img { display: block; }          /* 1. 块状化，一锅端 */
/* 或 */
.box { line-height: 0; }         /* 2. 容器行高足够小 */
/* 或 */
.box { font-size: 0; }           /* 3. 容器字号足够小 */
/* 或 */
img { vertical-align: top; }     /* 4. 或 middle / bottom，脱离基线 */
```

- 处方 1 最彻底，但图片变为块级、不再与文字同行——需要同行时在图片外再包一层。
- 处方 2 只适合容器内没有其他文字的场景。
- 处方 3 要求行高为相对值（数值）才被连坐归零；子内容需恢复字号。
- 处方 4 改动最小、保留行内布局，是「图片必须留在行内」时的首选。

## 近似垂直居中

内联世界里没有几何意义上的垂直居中，只有基于 x-height 的近似。

- middle = 元素垂直中心对齐「基线上 1/2 x-height」；x-height 随字体浮动，居中永远是近似值。
- 单行文字垂直居中用 `line-height = 目标高`；要求像素级精确时改用定位或 flex，不要在内联体系里硬凑。

## 弹框双 middle 居中的机理

四步链条：

1. 容器 `font-size:0`——x 的中心点落到容器上边缘。
2. `height:100%` 的 0 宽伪元素（人造 strut）以 `vertical-align:middle` 与之对齐，把对齐点带到容器垂直中心。
3. 弹框同样 `vertical-align:middle`，对齐该伪元素——垂直居中完成。
4. 水平一侧交给 `text-align:center`。

由此得到大小不固定的纯 CSS 水平垂直居中：内容变化自适应、超高可滚、无 resize 监听。完整配方见 [patterns](./patterns.md)。

## 内联怪象速查表

| 现象 | 元凶 | 处方 |
|---|---|---|
| 容器高度 > line-height | 大小字号基线位移（strut vs 内联盒） | 统一 font-size 或 `vertical-align:top` |
| 图片底部约 5px 间隙 | strut + line-height + baseline | 块状化 / line-height:0 / font-size:0 / 改 vertical-align |
| 子元素 line-height 不生效 | strut 所在行框更高（大值特性） | 子元素 `display:inline-block` |
| inline-block 间基线错位 | 空元素基线 = margin 底边缘 | 内部塞字符 / `vertical-align:top` / 容器 font-size:0 |
| margin-top 负值推不动内联元素 | strut 基线限死 | 改 relative 或 vertical-align 数值 |
| 两端对齐占位元素带出底部大间隙 | 占位元素自身的 strut 行高 | 容器 font-size:0；或占位塞 `&nbsp;` 配 line-height:0 |
| 空行内容器塌不下去 | strut 仍占一行高度 | 容器 `line-height:0` 或 `font-size:0` |
