# Unsafe 方法、泛型接口与安全校验（Fork 专有）

## Unsafe 方法

`github.com/rockcookies/go-gen` 在 `DO` 上暴露了 4 个底层访问方法，用于在标准 API 无法满足需求时直接修改内部状态：

```go
// 直接替换底层 *gorm.DB 实例
func (d *DO) UnsafeSetDB(db *gorm.DB)

// 修改查询别名（影响 AS 子句）
func (d *DO) UnsafeSetAlias(alias string)

// 替换模型类型（影响列映射）
func (d *DO) UnsafeSetModelType(modelType reflect.Type)

// 覆盖表名
func (d *DO) UnsafeSetTableName(tableName string)
```

### 典型使用场景

```go
import (
    "reflect"
    "github.com/rockcookies/go-gen"
)

// 场景：动态切换分表
userDO := query.User.DO
userDO.UnsafeSetTableName("users_2026")

// 场景：在测试中注入特定 db 实例
userDO.UnsafeSetDB(testDB)

// 场景：动态改变查询别名
userDO.UnsafeSetAlias("u2")

// 场景：用反射替换模型类型
userDO.UnsafeSetModelType(reflect.TypeOf(ArchiveUser{}))
```

> **注意**：Unsafe 方法绕过 Gen 的类型安全保证，仅在明确需要底层控制时使用。直接修改后的 DO 不应被复用，应立即执行查询。

## IGenericsDo[T, E] 泛型接口

`IGenericsDo[T, E]` 是完全类型安全的泛型 DAO 接口，`T` 为 DO 自身类型（用于方法链），`E` 为模型类型（用于 CRUD 参数和返回值）。启用 `gen.WithGeneric` 模式后，Gen 会生成实现此接口的代码。

```go
// T = 查询链类型（如 IUserDo），E = 模型类型（如 *model.User）
type IGenericsDo[T any, E any] interface {
    // 链式查询构建
    Debug() T
    WithContext(ctx context.Context) T
    Session(config *gorm.Session) T
    Clauses(conds ...clause.Expression) T
    Not(conds ...Condition) T
    Or(conds ...Condition) T
    Select(conds ...field.Expr) T
    Where(conds ...Condition) T
    Order(conds ...field.Expr) T
    Distinct(cols ...field.Expr) T
    Omit(cols ...field.Expr) T
    Join(table schema.Tabler, on ...field.Expr) T
    LeftJoin(table schema.Tabler, on ...field.Expr) T
    RightJoin(table schema.Tabler, on ...field.Expr) T
    Group(cols ...field.Expr) T
    Having(conds ...Condition) T
    Limit(limit int) T
    Offset(offset int) T
    Scopes(funcs ...func(Dao) Dao) T
    Unscoped() T
    Attrs(attrs ...field.AssignExpr) T
    Assign(attrs ...field.AssignExpr) T
    Joins(fields ...field.RelationField) T
    Preload(fields ...field.RelationField) T
    Returning(value interface{}, columns ...string) T
    ReadDB() T
    WriteDB() T

    // CRUD（使用具体类型 E，无 interface{}）
    Create(values ...E) error
    CreateInBatches(values []E, batchSize int) error
    Save(values ...E) error
    First() (E, error)
    Take() (E, error)
    Last() (E, error)
    Find() ([]E, error)
    FindInBatch(batchSize int, fc func(tx Dao, batch int) error) (results []E, err error)
    FindInBatches(result *[]E, batchSize int, fc func(tx Dao, batch int) error) error
    FindByPage(offset int, limit int) (result []E, count int64, err error)
    Delete(...E) (ResultInfo, error)
    FirstOrInit() (E, error)
    FirstOrCreate() (E, error)

    // 更新（返回 ResultInfo）
    Update(column field.Expr, value interface{}) (ResultInfo, error)
    UpdateSimple(columns ...field.AssignExpr) (ResultInfo, error)
    Updates(value interface{}) (ResultInfo, error)
    UpdateColumn(column field.Expr, value interface{}) (ResultInfo, error)
    UpdateColumnSimple(columns ...field.AssignExpr) (ResultInfo, error)
    UpdateColumns(value interface{}) (ResultInfo, error)
    UpdateFrom(q SubQuery) Dao

    // 其他
    Count() (count int64, err error)
    Pluck(column field.Expr, dest interface{}) error
    Scan(result interface{}) error
    ScanByPage(result interface{}, offset int, limit int) (int64, error)
    Rows() (*sql.Rows, error)
    Row() *sql.Row
    WithResult(fc func(tx Dao)) ResultInfo
    UnderlyingDB() *gorm.DB
    ReplaceDB(db *gorm.DB)
    ToSQL(queryFn func(T)) string
}
```

### 基于 GenericsDo 的自定义 DO

```go
type UserDo struct {
    gen.GenericsDo[*UserDo, *model.User]
}

func (u *UserDo) WithDO(do gen.Dao) *UserDo {
    return &UserDo{GenericsDo: gen.GenericsDo[*UserDo, *model.User]{DO: do.(gen.DO)}}
}
```

## CheckClause 安全校验

`CheckClause` 防止通过 `Clauses()` 注入危险的 SQL 子句：

```go
// 校验单个 clause.Expression 是否安全
err := gen.CheckClause(someClause)
```

**禁止的 clause 类型**：`VALUES`、`SELECT`、`FROM`、`WHERE`、`GROUP BY`、`ORDER BY`、`LIMIT`、`UPDATE`、`SET`、`DELETE`

**允许通过**：`hints.Hints`、`hints.IndexHint`、`clause.OnConflict`、`clause.Locking`、`clause.Insert`、`dbresolver.Operation`

```go
// 正常使用（允许）
u.WithContext(ctx).Clauses(hints.UseIndex("idx_name")).Find()
u.WithContext(ctx).Clauses(clause.OnConflict{UpdateAll: true}).Create(&user)

// 危险注入（会被 CheckClause 拒绝）
u.WithContext(ctx).Clauses(clause.Where{}).Find() // error: clause WHERE is banned
```

Gen 在所有 `Clauses()` 调用前自动执行 `checkConds`，无需手动调用。在封装自定义查询构建器时，可主动调用 `gen.CheckClause` 做前置校验。
