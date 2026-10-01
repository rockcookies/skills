# 术语表（glossary）

张鑫旭《CSS世界》（标记〔世 N〕）与《CSS新世界》（标记〔新 N〕）的自创术语与关键概念，一行定义；机理见末尾标注的归属文件。

## 流与盒模型 → layout-flow.md

- **流（flow）** — 引导元素排列定位的看不见的"水流"；块级负责结构、内联负责内容；特殊布局（float/absolute）= 对流的破坏与保护。〔世 1〕
- **造物主视角** — 遇到费解表现，问"如果我为图文展示设计这个世界，为何如此设计"。〔世 1〕
- **流体布局** — 利用元素流特性实现的布局，天然自适应；"自适应布局"的子集。〔世 1〕
- **鑫三无准则** — 无宽度、无图片、无浮动；设了具体宽度，流动性就死。〔世 3〕
- **双盒子（外在/内在盒子）** — 每个元素 = 外在盒子（决定能否一行显示）+ 内在（容器）盒子（承载宽高）；`width/height`、`box-sizing` 只作用于内在盒子。〔世 3〕
- **外部尺寸 / 内部尺寸** — Extrinsic（宽度由外部决定，唯一表现 fill-available/stretch）vs Intrinsic（由内容决定：包裹性、min-content、max-content）；判据：无内容时宽为 0 → 内部尺寸。〔世 3 / 新 3〕
- **包裹性** — shrink-to-fit 的别称："包裹"（尺寸由内容决定）+ "自适应"（永不超出包含块，如同冥冥中有 max-width:100% 罩着）；浮动、绝对定位、inline-block、table 都有。〔世 3〕
- **包含块（containing block）** — 元素计算尺寸与定位的基准框。普通元素 = 最近块容器祖先的 content box；absolute = 最近 position≠static 祖先的 padding box；fixed = 初始包含块（视口）。〔世 3〕
- **宽度分离原则** — width 不与影响宽度的 padding/border 共存；width 独占一层标签，内层靠流动性自适应。〔世 3〕
- **首选最小宽度（min-content）** — width:auto 收缩到的最小宽度：中文 = 一个汉字宽，英文 = 连续字符单元，图片 = 自身宽。〔世 3〕
- **超越 !important，超越最大** — max-width 超级覆盖 width（压过 style+!important）；min-width 与 max-width 冲突时 min 胜；可用性排序 min > max > width。〔世 3〕
- **margin 合并** — 块级元素垂直方向 margin 合一的机制；三种场景：相邻兄弟、父子（父与首/末子元素）、空块级元素自身。〔世 4〕
- **margin 镜像法则** — margin 只在元素"充分利用可用空间"时改变尺寸；`margin:auto` = 剩余空间分配器（一侧 auto 全拿、两侧平分）。〔世 4〕
- **结界（BFC，块级格式化上下文）** — "CSS 世界的结界"：内部子元素翻江倒海不影响外部；不发生 margin 合并、可清浮动影响。触发：根元素 / float≠none / overflow:auto\|scroll\|hidden / display:flow-root\|table-cell\|inline-block / position≠static\|relative。〔世 6〕
- **浮动参考（float reference）** — float 元素对齐的参考实体 = 所在**行框盒子**（不是包含块）；标题换行后行尾 float:right 对齐最后一行。〔世 6〕
- **浮动锚点（float anchor）** — float 元素所在流中的一个点，表现如空内联元素；作用是产生行框盒子。〔世 6〕
- **行框盒子不可重叠性** — 块盒可与浮动元素完全重叠，但其中的行框盒子被限死在浮动元素一侧——文字环绕的实现本质。〔世 6〕
- **剪裁界线** — overflow 剪裁/滚动的边界是 border box 内边缘（非 padding box）；"剪裁+留白"用透明边框。〔世 6〕
- **数据类型思维** — 属性值 = `<尖括号数据类型>` 的组合（`<image>` = url/渐变/cross-fade/element/image-set/paint）；学一次类型，凡支持该类型的属性全部生效。〔新 2〕
- **属性值定义语法** — 关键字+数据类型+数量符号的形式语法（`&& || |` 组合、`* + ? {A,B} #` 数量）；斜杠规则一句话：斜杠前后类型必须相同或部分相同。〔新 2〕
- **全局关键字** — inherit / initial（规范初始值）/ unset（配 all）/ revert（浏览器默认，`ol{padding:revert}` 才能找回序号）。〔新 2〕
- **渐进增强五技巧** — 直接用 > 属性值语法差异分流 > 伪类/伪元素区分 > @supports > JS `CSS.supports()` 兜底。〔新 2〕

## 内联世界 → inline-box.md

- **内联盒模型四层** — 内容区域（可近似为文本选中背景）→ 内联盒子（有标签）/ 匿名内联盒子（裸文字）→ 行框盒子（每行一个）→ 包含盒子（如 `<p>`）。〔世 3〕
- **strut（幽灵空白节点）** — HTML5 文档声明下每个行框盒子前面的 0 宽度、具备元素字体和行高属性的假想内联盒；图片底部间隙、容器高度≠line-height、内联 margin-top 负值失效皆因它。〔世 3 / 世 5〕
- **基线（baseline）** — 字母 x 的下边缘；内联垂直对齐的原点；替换元素的基线 = 元素下边缘。〔世 5〕
- **x-height** — 小写字母 x 的高度（基线到中线 mean line）；`vertical-align:middle` = 元素中心对齐"基线往上 1/2 x-height 处"。〔世 5〕
- **ex** — CSS 单位，= 1 个 x-height；图标 `height:1ex` 与文字天然垂直居中，不受字体字号影响。〔世 5〕
- **行距 / 半行距** — 行距 = line-height − font-size（em-box）；CSS 中行距上下等分（各半行距），与传统印刷不同。〔世 5〕
- **大值特性** — 行框盒子的高度由数值最大的 line-height 决定（strut 参与竞争）。〔世 5〕
- **近似垂直居中** — line-height（单行）或 vertical-align:middle（行内）实现的居中都不是几何中分——字形垂直中线普遍偏下（微软雅黑明显）。〔世 5〕

## 定位 → positioning.md

- **无依赖绝对定位** — 不设 left/top/right/bottom 的 absolute：停留在原位置，保持"相对特性"但不占流空间；比 relative+方位值更简洁健壮。〔世 6〕
- **相对特性** — 无方位值的 absolute/fixed 元素表现如相对定位（停在原地）。〔世 6〕
- **格式化宽度 / 格式化高度** — absolute/fixed 元素对立方位（left+right / top+bottom）同时定位时，尺寸自适应包含块 padding box，具有完全流体性。〔世 3 / 世 6〕
- **流体特性** — 同"格式化宽高"：对立方位定位 = 流体开关，padding/margin/auto 全部恢复可用。〔世 6〕
- **最小化影响原则** — relative 能不用就不用；必须用时套在仅包住目标元素的最小容器上。〔世 6〕
- **锚点定位** — 通过改变容器滚动高度实现定位；URL 锚链与 focus 两种触发，由内而外触发所有可滚动容器。〔世 6〕
- **块状化** — float≠none 或 position:absolute/fixed 使 display 计算值变为 block（inline-table 例外为 table）。〔世 6〕
- **黏性约束矩形** — sticky 元素的包含块矩形 ∩ 流盒（按 top/bottom 偏移后）；黏性效果的空间由它决定。〔新 3〕
- **流盒（flow box）** — sticky 最近可滚动元素的盒子（无则视窗）。〔新 3〕

## 层叠 → stacking.md

- **层叠上下文（stacking context）** — z 轴上的"层叠结界"：自成体系、可嵌套、与兄弟独立；内部元素出不了结界。〔世 7〕
- **层叠水平（stacking level）** — 同一结界内元素的论资排辈；所有元素都有，z-index 只是影响因素之一。〔世 7〕
- **层叠顺序（stacking order）** — 7 阶规则（底→顶）：结界背景/边框 → 负 z-index → block → float → inline → z-index:auto/0 → 正 z-index。〔世 7〕
- **层叠黄金准则** — ① 谁大谁上（层叠水平大者覆盖）；② 后来居上（水平相同时 DOM 靠后者覆盖）。〔世 7〕
- **三派创建** — 层叠上下文的创建：天生派（根元素）、正统派（z-index 为数值的定位元素）、扩招派（CSS3：opacity/transform/filter/mix-blend-mode/isolation/will-change、flex/grid 子项+z-index 等）。〔世 7 / 新 4 / 新 11〕
- **z-index:0 与 auto 的差异** — 层叠水平等价，但数值 0 创建层叠上下文——子元素 z-index 被封锁在结界内。〔世 7〕
- **不犯二准则** — 非浮层元素 z-index 不需要超过 2；浮层组件用层级计数器管理（默认 9）。〔世 7〕
- **混合模式边界** — 任何层叠上下文都是 mix-blend-mode 的作用边界；`isolation:isolate` 显式画界。〔新 11〕

## 现代布局 → layout-flex-grid.md

- **分家产模型** — flex-basis 分基础、flex-grow 富余分配、flex-shrink 不足分摊。〔新 6〕
- **flex 非默认补全** — `flex:1` ≡ `1 1 0%`、`flex:100px` ≡ `1 1 100px`，缩写值不按默认值补（basis 不是 auto）。〔新 6〕
- **fr** — 网格剩余空间比例单位，与内容无关；总和 <1 时不铺满。〔新 6〕
- **auto（grid 轨道）** — ≈ minmax(min-content, max-content)，上限受 justify-content 影响、下限受 min-width 抬升。〔新 6〕
- **auto-fill / auto-fit** — repeat() 自动列数；auto-fit 折叠空白轨道（卡片布局首选），auto-fill 保留。〔新 6〕
- **对齐命名法** — justify 水平 / align 垂直 × content 整体 / items 每项 / self 单项。〔新 6〕
- **CSS Shapes** — shape-outside 让文字环绕任意形状（作用在浮动元素上）。〔新 6〕

## 文本与视觉 → typography.md / background-border.md

- **12px 限制** — Chrome 最小字号限制：font-size 计算值 <12px 按 12px 渲染，唯一例外是 0。〔世 8〕
- **normal（line-height）** — 随 font-family 变化的变量（雅黑≈1.32、宋体≈1.141），跨浏览器不一致，必须重置。〔世 5 / 世 8〕
- **衬线 / 无衬线** — serif 笔画有装饰（宋体）；sans-serif 无装饰（雅黑）；移动端 body 用 sans-serif。〔世 8〕
- **字体显示时间线** — 字体阻塞/交换/失败三时段；font-display 五值（block/swap/fallback/optional）。〔新 3〕
- **可变字体** — 单文件多设计轴（wght/wdth/ital/slnt/opsz）；font-variation-settings 精调。〔新 9〕
- **占位曲线** — background-position 百分比公式：positionX = (容器宽 − 图片宽) × percentX；图片大于容器时负百分比定位在容器内。〔世 9〕
- **转角等分规则** — border 转角平滑等分，solid 边框沿袭之——三角/梯形图形构建的基石。〔世 4〕
- **double 表现规则** — 双线宽度永远相等、中间间隔 ±1；≥3px 才有双线，故 border-width 默认值 medium = 3px。〔世 4〕
- **系统颜色** — 跟随操作系统主题的颜色关键字；可当"天然变量"用于即时配色。〔世 9〕

## 显隐与媒体 → visibility-media.md

- **隐藏决策矩阵** — 按空间/点击/键盘/读屏/加载/动画维度选隐藏方案：script 模板、display:none、visibility:hidden、clip、z-index 负值、opacity:0、text-indent、max-height。〔世 10〕
- **替换元素** — 修改某属性值即可替换呈现内容的元素（img/object/video/iframe/input/textarea/select）；与非替换元素只隔一个 src 或 content 属性。〔世 4〕
- **三层尺寸** — 替换元素的固有尺寸 < HTML 尺寸 < CSS 尺寸；有固有宽高比时只设一边等比缩放；与 display 无关。〔世 4〕
- **匿名替换元素** — content 属性生成的内容；不可选中、读屏不可达——只用于装饰。〔世 4〕
- **填充规则（fill-rule）** — nonzero/evenodd 决定 SVG 路径交叉区域是否填充。〔新 12 / 新 14〕

## 响应式与逻辑 → responsive-logical.md

- **逻辑属性** — inline/block × start/end 命名（margin-inline-end 等），随流方向而变；inset 是唯一日常高频者。〔新 3〕
- **三剑客（流向）** — direction/unicode-bidi（内联方向，为阿拉伯文设计）与 writing-mode（纵横规则，为东亚文字设计）；一横一纵无交集。〔世 12〕
- **双向性（bidi）** — 混合方向文字同现的现象；unicode-bidi 定义其表现：normal/embed/bidi-override。〔世 12〕

## 交互与性能 → interaction-advanced.md

- **滚动穿透** — 弹层滚动带动页面；`overscroll-behavior: contain` 终结。〔新 13〕
- **Scroll Snap** — scroll-snap-type（容器）+ scroll-snap-align（子项）+ scroll-snap-stop:always（强制逐卡）。〔新 13〕
- **pointer-events 继承性** — 父 none 子可 auto 复活；不阻止键盘行为。〔新 13〕
- **渲染隔离（contain）** — size/layout/style/paint 四类隔离声明；content = layout+paint。〔新 13〕
- **content-visibility** — 视口外内容跳过渲染；配 contain-intrinsic-size 防跳动。〔新 13〕
- **will-change** — 提前声明将要变化的属性触发优化；副作用 = 对应属性层叠上下文立即生效；少量元素、用完移除。〔新 13〕

## 变量与扩展 → variables.md

- **边界特性** — opacity/颜色通道等数值超范围按边界钳制；配合变量实现 CSS if/else。〔新 4〕
- **空格开关** — `--open: ;`（可能有效 = 关闭态）↔ `--open: inherit`（一定无效 = 启用全部 fallback）；一个变量切换多个属性。〔新 8〕
- **@property** — 注册自定义属性的 syntax/inherits/initial-value；注册后变量可参与过渡动画。〔新 15〕
- **Paint API** — registerPaint + paint() 自绘图像，作为 `<image>` 使用。〔新 15〕
- **Typed OM** — 类型化 CSSOM（CSSUnitValue），替代字符串解析。〔新 15〕

## 判定方法 → cheatsheet.md

- **未定义行为** — 规范空白处浏览器各自实现导致的表现差异（:active+preventDefault、隐藏元素背景图加载、滚动容器 padding-bottom 等）——覆盖且违反规范 = bug，规范空白 = 未定义行为，适配而非修复。〔世 2〕
- **焦点元素** — 可被键盘 Tab 聚焦的元素（a/button/input 或设 tabindex 的元素）。〔世 2 / 世 11〕
