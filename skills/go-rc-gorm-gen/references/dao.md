# DAL 接口与使用方式

## 初始化

```go
import (
    "your_project/dal"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"
)

db, _ := gorm.Open(sqlite.Open("test.db"), &gorm.Config{})

// 方式一：全局默认（配合 gen.WithDefaultQuery）
dal.SetDefault(db)
user, err := dal.Q.User.WithContext(ctx).First()

// 方式二：局部实例
q := dal.Use(db)
user, err := q.User.WithContext(ctx).First()
```

## IUserDo 接口完整方法

Gen 为每张表生成实现以下接口的 DAO 对象：

```go
type IUserDo interface {
    // 查询链构建
    Clauses(conds ...clause.Expression) IUserDo
    As(alias string) gen.Dao
    Columns(cols ...field.Expr) gen.Columns
    Not(conds ...gen.Condition) IUserDo
    Or(conds ...gen.Condition) IUserDo
    Select(conds ...field.Expr) IUserDo
    Where(conds ...gen.Condition) IUserDo
    Order(conds ...field.Expr) IUserDo
    Distinct(cols ...field.Expr) IUserDo
    Omit(cols ...field.Expr) IUserDo
    Join(table schema.Tabler, on ...field.Expr) IUserDo
    LeftJoin(table schema.Tabler, on ...field.Expr) IUserDo
    RightJoin(table schema.Tabler, on ...field.Expr) IUserDo
    Group(cols ...field.Expr) IUserDo
    Having(conds ...gen.Condition) IUserDo
    Limit(limit int) IUserDo
    Offset(offset int) IUserDo
    Scopes(funcs ...func(gen.Dao) gen.Dao) IUserDo
    Unscoped() IUserDo
    Attrs(attrs ...field.AssignExpr) IUserDo
    Assign(attrs ...field.AssignExpr) IUserDo
    Joins(fields ...field.RelationField) IUserDo
    Preload(fields ...field.RelationField) IUserDo
    Debug() IUserDo
    WithContext(ctx context.Context) IUserDo
    WithResult(fc func(tx gen.Dao)) gen.ResultInfo
    ReadDB() IUserDo
    WriteDB() IUserDo
    Session(config *gorm.Session) IUserDo

    // 创建
    Create(values ...*model.User) error
    CreateInBatches(values []*model.User, batchSize int) error
    Save(values ...*model.User) error

    // 查询
    First() (*model.User, error)
    Take() (*model.User, error)
    Last() (*model.User, error)
    Find() ([]*model.User, error)
    FindInBatch(batchSize int, fc func(tx gen.Dao, batch int) error) ([]*model.User, error)
    FindInBatches(result *[]*model.User, batchSize int, fc func(tx gen.Dao, batch int) error) error
    FindByPage(offset int, limit int) (result []*model.User, count int64, err error)
    ScanByPage(result interface{}, offset int, limit int) (count int64, err error)
    Scan(result interface{}) error
    Count() (int64, error)
    Pluck(column field.Expr, dest interface{}) error
    FirstOrInit() (*model.User, error)
    FirstOrCreate() (*model.User, error)
    Returning(value interface{}, columns ...string) IUserDo

    // 更新
    Update(column field.Expr, value interface{}) (gen.ResultInfo, error)
    UpdateSimple(columns ...field.AssignExpr) (gen.ResultInfo, error)
    Updates(value interface{}) (gen.ResultInfo, error)
    UpdateColumn(column field.Expr, value interface{}) (gen.ResultInfo, error)
    UpdateColumnSimple(columns ...field.AssignExpr) (gen.ResultInfo, error)
    UpdateColumns(value interface{}) (gen.ResultInfo, error)
    UpdateFrom(q gen.SubQuery) gen.Dao

    // 删除
    Delete(...*model.User) (gen.ResultInfo, error)
}
```

## DaoScope

`Scopes` 允许复用查询条件：

```go
func ActiveUsers(dao gen.Dao) gen.Dao {
    return dao.Where(dal.Q.User.Active.Is(true))
}

func RecentUsers(days int) func(gen.Dao) gen.Dao {
    return func(dao gen.Dao) gen.Dao {
        return dao.Where(dal.Q.User.CreatedAt.Gt(time.Now().AddDate(0, 0, -days)))
    }
}

users, err := dal.Q.User.WithContext(ctx).
    Scopes(ActiveUsers, RecentUsers(7)).
    Find()
// SELECT * FROM users WHERE active=true AND created_at > (now - 7days)
```

## 分页查询

```go
// 带总数的分页
users, total, err := dal.Q.User.WithContext(ctx).
    Where(dal.Q.User.Role.Eq("admin")).
    FindByPage(offset, limit)

// 仅 Scan 分页（result 为自定义 struct）
var result []MyResult
total, err := dal.Q.User.WithContext(ctx).ScanByPage(&result, offset, limit)
```

## 读写分离

```go
// 使用读库
users, err := dal.Q.User.WithContext(ctx).ReadDB().Find()

// 使用写库
user, err := dal.Q.User.WithContext(ctx).WriteDB().First()
```
