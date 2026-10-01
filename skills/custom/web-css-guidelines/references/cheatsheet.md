# 决策速查（cheatsheet）

排障入口：先在判断规则与征兆速诊里定位病根，再进标注的机理文件看处方。

## 判断规则（When X → do Y）

- 容器高度和预期不符 → 先假设行首有个 [strut](./inline-box.md)，再逐个套 vertical-align 定义。
- 元素宽度行为怪 → 先归类 [width:auto 四表现](./layout-flow.md)：铺满=fill-available / 收缩=包裹性 / 断字=min-content / 溢出=max-content。
- margin 不生效 → 按序排查：inline 非替换元素的垂直 margin？table-cell/row？合并中被大值压住？absolute 非定位方位？容器/自身尺寸定死？
- z-index 压不住 → 沿祖先链找[层叠上下文](./stacking.md)（z-index 数值、opacity≠1、transform≠none、filter、will-change…），结界封顶，子值无用。
- 覆盖冲突 → 先比层叠水平（谁大谁上），平手看 DOM 顺序（后来居上）。
- 浮动元素"跑错行" → 它对齐的是所在**行框盒子**，不是容器；把它移到目标行内。
- 元素设置 width 后布局变脆 → 流动性丢了：删宽度 / 宽度分离 / box-sizing（仅替换元素刚需 border-box）。
- margin:auto 不居中 → 前提是元素能"自动填充"（块级水平方向 / absolute 对立方位拉伸）；两侧 auto 才平分。
- height:100% 无效 → 父级无显式高度，规范解析为 auto；出路：高度链 or absolute（相对 padding box）。
- transition 不生效 → 属性在过渡列表里吗（visibility 在、display 不在）？起始值是 auto 类关键字吗（height:auto 不行，用 max-height）？
- 浏览器表现不一 → 查规范：覆盖且违反 = bug；空白 = 未定义行为，适配而非修复。
- 学新属性 → 先看它支持的**数据类型**（`<image>`/`<color>`/`<basic-shape>`），类型即能力清单。
- 缩写语法记不住 → 记"斜杠前后类型必须相同/部分相同"（background: position/size；font: size/line-height；grid: rows/columns）。
- 想还原浏览器默认样式 → `revert`（initial 是规范初始值，会丢 ol 序号）；想变 span → `all: unset`。
- 绝对定位弹框要居中还要动画 → `width/height:fit-content + inset:0 + margin:auto`，transform 留给动画。
- flex 子项尺寸诡异 → 先查 flex 缩写补全：`flex:1 = 1 1 0%`（basis 不是 auto）；`flex:none` 防挤压；`flex:auto` 保内容。
- fr 不铺满 → fr 总和 <1 只按比例拿份额；想铺满用 ≥1 的整数值。
- grid 卡片列数不定 → `repeat(auto-fit, minmax(min, 1fr))`；末行留白难看换 auto-fit（非 auto-fill）。
- sticky 没效果 → 三查：祖先有无 overflow≠visible？父容器高度是否与元素等高？多个 sticky 是否没分容器？
- 渐变不生效/断开 → 检查 background-origin（粗边框断开设 border-box）；渐变想动画 → @property 注册颜色。
- 圆角边框图片不圆 → border-radius 管不了 border-image，用 `clip-path: inset(0 round N)`。
- 文字描边侵蚀字形 → -webkit-text-stroke 居中描边；换 SVG `paint-order: stroke`。
- 混合模式"失灵" → 祖先层叠上下文成了边界；`isolation: isolate` 显式控制范围。
- 想让变量动画 → 必须 `@property` 注册 syntax；未注册变量是任意 token 串。
- 弹层滚动带动页面 → `overscroll-behavior: contain`。
- 长页渲染慢 → 列表项 `content-visibility:auto + contain-intrinsic-size`；别全站撒 will-change。
- 剪裁区还能被点到/点不到 → clip-path/mask 隐藏区域交互一并失效（特性也是坑）。

## 决策树

**居中方案？**
水平：margin:auto（需定宽）/ text-align:center（内联级）
垂直：行内内容 → line-height（单行）/ 行高+middle+伪元素（多行/弹框）
绝对定位 → inset:0 + fit-content + margin:auto
writing-mode 垂直流 → margin:auto / text-align:center 直接垂直居中

**隐藏/裁剪选型？**（机理 → [filters-masks.md](./filters-masks.md)）
按形状裁（可过渡、可交互边界）→ clip-path
按图像/渐变淡出（PNG 透明替代、图标变色）→ mask
按盒模型裁 → background-clip / overflow

**适配方案？**（→ [responsive-logical.md](./responsive-logical.md)）
流式数值（字号/宽度区间）→ clamp(MIN, calc(...vw...), MAX)
安全区 → env(safe-area-inset-*) + viewport-fit=cover
多倍图 → image-set() / 多倍图 + background-size
鼠标 vs 触屏 → @media (hover:hover) and (pointer:fine)

**内联垂直微调？**
先 vertical-align 数值（正上负下，兼容最好）→ 不行再 relative → 永不先 margin

单文件决策直达：隐藏方案全维度矩阵与决策树 → [visibility-media.md](./visibility-media.md)；布局选型与 flex 死角 → [layout-flex-grid.md](./layout-flex-grid.md)；清除浮动 → [layout-flow.md](./layout-flow.md)；渲染性能三件套排序 → [interaction-advanced.md](./interaction-advanced.md)。

## 阈值与默认值

| 项 | 值 |
|---|---|
| Windows 滚动栏宽 | **17px**（精确） |
| border-width 默认 medium | 3px（double ≥3px 才有双线） |
| 替换元素默认尺寸 | 300×150（img 例外，浏览器各异） |
| line-height 推荐值 | 数值 1.5（心算友好）；图文站 1.6~1.8 |
| 行高计算舍入 | **向上**舍入（1.42857→19px，1.42858→20px） |
| Chrome 最小字号 | 12px，唯一例外 0 |
| z-index 页面主体 | ≤2（不犯二）；浮层默认 9 + 层级计数器 |
| margin:auto 规则 | 一侧 auto 全拿剩余；两侧 auto 平分 |
| 滚动容器底部留白 | 只能子元素 margin-bottom（padding-bottom 跨浏览器不一致） |
| font-weight | 仅 100~900 整百；400=normal，700=bold；bolder/lighter 按临界点跳变 |
| object-fit 默认 | fill（变形）；scale-down=min(none,contain) |
| opacity 透明度叠加 | 父×子（乘积），混合公式 fg×α+bg×(1−α) |
| CSS 渐变角度 | 0deg=向上，顺时针为正（与 PS 相反） |
| radial 默认 | ellipse farthest-corner at center |
| conic 断点换算 | 45deg ≡ 12.5% |
| stroke 描边动画 | dasharray=L; dashoffset: L→0（L=路径长） |
| miterlimit 默认 | 4 |
| text-emphasis 位置 | 默认 over right；中文用 under right |
| will-change 副作用 | 声明即生效对应属性的层叠上下文 |
| pointer-events:none | 不拦键盘；子元素可 auto 复活 |
| var() fallback 触发 | 未定义 / 空值 / 全局关键字；非法值不走 fallback 而回落初始值 |
| --变量命名 | 支持数字开头/中文/空格；特殊字符需转义 |

## 征兆速诊（Tells & Smells）

| 征兆 | 病根 |
|---|---|
| 图片下方多 5px | strut + line-height + baseline 三连 |
| 容器高度 > line-height 几像素 | 大小字号基线位移（font-size 放 span 上了） |
| inline-block 之间基线错位 | 空元素基线 = margin 底边缘 |
| 弹出层 z-index 巨大仍被盖 | 父级层叠上下文封顶 |
| 弹窗背景还能滚 / 蒙层盖不住滚动条 | fixed 的包含块是根元素 |
| margin-top:-9999px 推不动图片 | strut 基线限死内联元素 |
| 标题一换行"更多"掉到下行 | float 参考是行框盒子 |
| 中文下划线粘字 | 用 border-bottom 模拟 |
| 页面加载时水平晃动 | 滚动条出现改变可用宽 → html{overflow-y:scroll} |
| rem 布局整体偏大 | Chrome 12px 限制吃了 62.5% 根字号 |
| 改 padding 页面错位 | width 与 padding 共存 → 宽度分离 |
| flex:1 的子项不按内容宽 | basis 被缩写补成 0%，非 auto |
| sticky 一动不动 | 祖先 overflow / 父等高 / 未分容器 |
| grid 列塌成最小宽 | minmax(1fr,200px) 写反（fr 只能第二参） |
| 渐变 hover 突变不平滑 | 渐变不可过渡；@property 注册颜色 |
| margin:auto 居中失效 | 元素非 fill-available；用 inset+fit-content |
| mask 显示反了 | 遮罩白/不透明=显示；JPG 遮罩需 mask-mode:luminance |
| clip-path 动画跳变 | 前后关键点数量不一致 |
| offset 缩写整条失效 | 子属性兼容参差；分开写 |
| will-change 加了更卡 | 合成层爆炸；少量元素+用完移除 |
| initial 恢复不了 ol 序号 | initial=规范初始值；用 revert |
| env() 恒为 0 | 缺 viewport-fit=cover |
| 深色模式图片刺眼 | mix-blend-mode: difference / 提供双图 |

## 覆盖关系速记

- max-width > width（连 !important 都压）；min-width 压 max-width；可用性排序：min > max > width。
- 层叠 7 阶（底→顶）：结界背景/边框 → z:-1 → block → float → **inline** → auto/0 → z:+1。
- 内联元素 padding 垂直方向：影响视觉与布局（滚动条会出），但不进行盒高度计算；margin 垂直则彻底无效。
- float/absolute 一旦出现：display 计算值必为 block（inline-table 除外）；vertical-align/text-align 失效；absolute 在场时 float 失效。

## 新旧对照速记

| 旧做法 | 现代替代 |
|---|---|
| display:table + margin:auto 居中收缩元素 | width:fit-content + margin:auto |
| transform:translate(-50%,-50%) 居中 | inset:0 + margin:auto（fit-content） |
| 负 margin/伪元素两端对齐列表 | flex gap / grid auto-fit |
| JS 监听滚动吸顶 | position: sticky |
| JS 平滑滚动 | scroll-behavior: smooth |
| body 锁滚动 JS | overscroll-behavior: contain |
| JS 计算路径动画 | offset-path + offset-distance |
| 多张图 hover 切换 | cross-fade / opacity 过渡 |
| float 环绕 + 手抠形状 | shape-outside |
| Sass 变量换肤 | CSS 自定义属性 + @property |
| background-position sprite | img + object-fit/object-position |
