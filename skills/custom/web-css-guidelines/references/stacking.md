# 层叠与 z-index：谁覆盖谁

排障"压不住 / 被盖住 / z-index 失灵"、写浮层遮罩与负值垫底时读。BFC 结界（管布局溢出）归 [layout-flow.md](./layout-flow.md)；transform/opacity 的动画性能归 [transform-animation.md](./transform-animation.md)。

## 三个概念：层叠上下文 / 层叠水平 / 层叠顺序

层叠由三件事共同决定：结界（层叠上下文）、结界内的论资排辈（层叠水平）、比较规则本身（层叠顺序）。z-index 只是影响层叠水平的手段之一，不是层叠规则的全部。

| 概念 | 定义 | 要点 |
| --- | --- | --- |
| 层叠上下文 | z 轴上的结界 | 自成小世界、可嵌套、与兄弟结界独立 |
| 层叠水平 | 同一结界内元素的论资排辈 | 所有元素都有；z-index 只是手段之一，且仅定位元素可用 |
| 层叠顺序 | 同一结界内的固定七阶规则 | 见下节 |

层叠水平只在同一结界内可比——跨结界比较子元素的 z-index 没有意义，先找到共同的祖先结界，再在对应层级上比较。

## 层叠七阶图

同一结界内，元素从底到顶固定为七层：

1. 结界元素自身的 background / border
2. z-index 负值的定位子元素
3. block 块级盒子
4. float 浮动盒子
5. inline 水平盒子（inline / inline-block / inline-table）
6. z-index:auto 或 z-index:0 的定位元素，以及不依赖 z-index 的层叠上下文元素
7. z-index 正值的定位元素

设计逻辑：装饰（背景/边框）最底、布局（block/float）居中、内容（inline）最高——CSS 为图文展示而生，内容必须最优先呈现。推论：文字永远压在浮动图片上方，无需任何设置。

```
高 │ 7. z-index 正值的定位元素
↑ │ 6. z-index:auto / z-index:0 的定位元素、无 z-index 的结界元素
  │ 5. inline 水平盒子（内容）
  │ 4. float 盒子（布局）
  │ 3. block 盒子（布局）
  │ 2. z-index 负值的定位子元素
低 │ 1. 结界元素的 background / border（装饰）
```

补充两条判定规则：

- 定位元素（position ≠ static）不写 z-index 时按 auto 参与层叠，天然压过 block / float / inline——这就是"无需 z-index 也能盖住普通流"的原因。
- 无 z-index 的 CSS3 结界元素（transform/opacity 等创建）同属第 6 阶，与 auto 定位元素相遇时按后来居上。

## 两条黄金准则

覆盖冲突永远由两条准则裁决，先后固定：

1. 谁大谁上：同一结界内，层叠水平大者覆盖小者。
2. 后来居上：层叠水平一致时，DOM 流在后的覆盖在前的。

```css
/* 两个定位元素同为 auto（第 6 阶）：DOM 在后的 .b 覆盖 .a，与声明顺序无关 */
.a, .b { position: relative; }
```

| 场景 | 判定 | 准则应用 |
| --- | --- | --- |
| 两个定位元素比大小 | 比生效的 z-index 数值 | 谁大谁上 |
| 层叠水平相同（含 auto、结界元素） | 比 DOM 顺序 | 后来居上 |
| z-index 很大却压不过别人 | 父级结界封顶 | 提升或统一父级层级 |
| 想让元素垫在背景上 | 父级造结界 + 子 z-index:-1 | 负值止步于第一个结界 |
| 文字要压住浮动图 | 无需设置 | inline 天然高于 float |

## 层叠上下文 = 结界

结界内自成体系：内部元素无论 z-index 多大，只与结界内兄弟比较，出不了结界；结界与结界之间按父级的层叠水平和 DOM 顺序裁决。排查"z-index 失灵"的本质就是找结界。

注意区分两类结界：overflow 等触发的是 BFC 结界（管布局与清除浮动），z-index/transform 等触发的是层叠结界（管覆盖）——BFC 归 [layout-flow.md](./layout-flow.md)。

## 结界创建三派

| 流派 | 条件 |
| --- | --- |
| 天生派 | 根元素 html（根层叠上下文） |
| 正统派 | z-index 为数值的定位元素（relative / absolute / fixed） |
| 扩招派（CSS3） | opacity ≠ 1；transform ≠ none；filter / backdrop-filter ≠ none；mix-blend-mode ≠ normal；isolation: isolate；will-change 声明为上述值；flex/grid 子项配 z-index ≠ auto |

position:fixed 在现代浏览器天然创建结界，无需数值 z-index。

扩招派的"免费覆盖权"：想让 DOM 靠前的元素覆盖靠后的，一行 `opacity: .99` 或 `transform: scale(1)` 即可——比 z-index 少一次心智负担，但会创建结界，子孙 z-index 被封锁。

```css
/* hover 放大盖住相邻卡片：不写 z-index */
.card:hover { transform: scale(1.05); }
```

反模式：随手给容器加 `transform: scale(1)`、`opacity: .99` 之类的"无害"声明来抢覆盖权或修层叠——它们创建结界，子孙 z-index 全部被封印，给后人埋雷。

## z-index:0 与 auto 的差异

层叠水平上二者等价（同属第 6 阶），但数值 0 会创建结界、auto 不会——子元素的 z-index 从此只在结界内比，结界之间改按父级"谁大谁上 / 后来居上"裁决。90% 的 z-index 诡异行为源于此。

反转实验：两个兄弟 div（position:relative）各含一张图（z-index:2 与 1）。父级为 auto 时是普通定位元素，两图直接比较，2 压 1；父级改 `z-index: 0` 后各自成结界，子图 z-index 被封印，改为父级之间比较——同为 0，按后来居上，DOM 在后的容器整体覆盖在前。

| 父级取值 | 子图的比较域 | 结果 |
| --- | --- | --- |
| auto（不造结界） | 图 vs 图，z-index 直接生效 | 2 压 1 |
| z-index: 0（造结界） | 结界 a vs 结界 b，子值封印 | 同为 0，DOM 在后者覆盖 |

```css
/* 需要子元素独立比 z-index 时，父级保持 auto */
.a, .b { position: relative; }
.a img { position: absolute; z-index: 2; }
.b img { position: absolute; z-index: 1; }

/* 需要整体参与比较、封锁子孙比较域时，才造结界 */
.panel { position: relative; z-index: 0; }
```

## z-index 负值：垫底艺术

负值元素的渲染规则：向上寻找第一个层叠上下文并止步于其上——最终位于该结界的背景/边框之上、block 元素之下。所以负值"垫底/隐藏"时灵时不灵：取决于祖先链上有无结界、结界有无背景。

正当用途：

- 装饰元素精确定位在"背景之上、内容之下"（阴影、纸张卷边）。
- 可访问性隐藏：relative + z-index:-1 即可，不脱流、不影响布局与焦点，读屏仍可访问；缺点是需要父级有背景配合。
- 结果"时灵时不灵"的原因即渲染规则本身：父级有无结界、结界有无背景，决定负值元素最终停在哪一层。

永久隐藏元素首选 clip / display 方案，负值只用于"垫底"，不用于"消失"。

```css
/* 纸张卷边阴影：藏在结界背景之上、纸张内容之下 */
.container { position: relative; z-index: 0; background: #666; }
.page { position: relative; background: #f4f39e; }
.page::before,
.page::after {
  content: "";
  position: absolute;
  z-index: -1;
  box-shadow: 0 8px 16px rgba(0, 0, 0, .3);
}
```

反模式：以为 z-index 负值能把元素藏到"页面背后"——最多藏到第一个结界的背景处；隐不掉先沿祖先链找结界。永久隐藏元素仍用 clip / display 方案。

## 不犯二准则

机理：设数值 z-index 即创建结界、即改变全局层叠关系；巨大数值只会引发 9 → 99 → 999999 的军备竞赛。

- 页面主体（非浮层）元素的 z-index 不超过 2。
- "absolute 必配 z-index"是坏习惯：定位元素 auto 已属第 6 阶，天然高于 block / float / inline。
- 浮层组件用层级计数器：打开时 JS 取页面当前最大 z-index，超出则 +1；默认 9 起步已足够安全。

```css
/* 主体元素：2 封顶 */
.header { position: relative; z-index: 1; }
.dropdown { position: absolute; z-index: 2; }

/* 浮层：交给层级计数器，不写死 999999 */
.modal { position: fixed; z-index: 9; }
```

## 排障路径：z-index 压不住时

1. 沿祖先链找结界（侦测清单如下）——任何一个命中，子元素的 z-index 就只在结界内有效。
2. 同一结界内先比层叠水平（谁大谁上），平手再看 DOM 顺序（后来居上）。
3. 结界封顶时，只能提升或统一父级层级，调子元素 z-index 无效。

```text
/* 结界侦测清单：排障时沿祖先链 grep 这些声明 */
opacity < 1
transform ≠ none
filter / backdrop-filter ≠ none
mix-blend-mode ≠ normal
isolation: isolate
will-change: transform | opacity | filter …
position: fixed
父项 display: flex/grid 且子项 z-index ≠ auto
```

典型案：fadeIn 动画期间文字被图片盖住——动画中 opacity ≠ 1 让图片成了结界（第 6 阶），DOM 在后的图片按后来居上覆盖文字。修复：调 DOM 顺序，或给文字 `z-index: 1`。

```css
.img { animation: fadeIn .3s; }
.text { position: relative; z-index: 1; }  /* 拿回正阶层叠水平 */
```

症状速查：

| 症状 | 根因 | 处置 |
| --- | --- | --- |
| z-index 再大也压不住 | 祖先结界封顶 | 提升父级层级，或把元素移出结界 |
| 动画期间被后方元素覆盖 | opacity/transform 临时造结界 | 文字 z-index:1，或调 DOM 顺序 |
| 负值元素藏不进去 | 祖先无结界或结界无背景 | 父级 z-index:0 + 给背景 |
| 混合效果突然不外泄 | 祖先结界成了混合边界 | 属预期；要混合就调整层级结构 |

## 混合模式的边界

mix-blend-mode 的混合范围以层叠上下文为界：元素只与同一结界内的下方内容混合，出不了结界。isolation: isolate 通过显式创建结界画一条混合边界，让组件内部自己混合、不与组件外内容混合。

```css
.modal { isolation: isolate; }  /* 弹层内部自己玩，不与页面背景混 */
```

陷阱：元素"突然不与页面背景混合了"，先查祖先链上的结界属性。滤镜与混合的完整配方归 [filters-masks.md](./filters-masks.md)。

## will-change 副作用

will-change 声明为 transform、opacity、filter 等会创建结界的值时，元素即成层叠结界——它不只是性能提示，还是结界开关。性能与合成层讨论归 [interaction-advanced.md](./interaction-advanced.md)。
