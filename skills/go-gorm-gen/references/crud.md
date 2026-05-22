# 增删改查（CRUD）

## 创建

```go
import "github.com/rockcookies/go-gen"

u := query.User

// 创建单条记录
err := u.WithContext(ctx).Create(&user)

// 指定字段创建
u.WithContext(ctx).Select(u.Name, u.Age).Create(&user)
// INSERT INTO `users` (`name`,`age`) VALUES (...)

// 忽略字段创建
u.WithContext(ctx).Omit(u.Name, u.Age).Create(&user)
```

### 批量插入

```go
var users = []*model.User{{Name: "a"}, {Name: "b"}, {Name: "c"}}
query.User.WithContext(ctx).Create(users...)

// 分批插入，指定每批数量
query.User.WithContext(ctx).CreateInBatches(users, 100)
```

### Upsert / OnConflict

```go
import "gorm.io/gorm/clause"

// 冲突时不做任何操作
u.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&user)

// 冲突时更新指定列
u.WithContext(ctx).Clauses(clause.OnConflict{
    Columns:   []clause.Column{{Name: "id"}},
    DoUpdates: clause.Assignments(map[string]interface{}{"role": "user"}),
}).Create(&users)

// 冲突时更新指定列名
u.WithContext(ctx).Clauses(clause.OnConflict{
    DoUpdates: clause.AssignmentColumns([]string{"name", "age"}),
}).Create(&user)

// 冲突时更新所有列（除主键）
u.WithContext(ctx).Clauses(clause.OnConflict{UpdateAll: true}).Create(&users)
```

## 更新

### 更新单列

```go
u := query.User

// 必须有 Where 条件，否则抛出 ErrMissingWhereClause
u.WithContext(ctx).Where(u.Activate.Is(true)).Update(u.Name, "hello")
// UPDATE users SET name='hello' WHERE active=true;

// 表达式更新
u.WithContext(ctx).Where(u.Activate.Is(true)).UpdateSimple(u.Age.Add(1))
// UPDATE users SET age=age+1 WHERE active=true;

u.WithContext(ctx).Where(u.Activate.Is(true)).UpdateSimple(u.Age.Zero())
// UPDATE users SET age=0 WHERE active=true;
```

### 更新多列

```go
// 使用 map 更新（更新所有指定字段）
u.WithContext(ctx).Where(u.ID.Eq(111)).Updates(map[string]interface{}{"name": "hello", "age": 18})

// 使用 struct 更新（只更新非零值字段）
u.WithContext(ctx).Where(u.ID.Eq(111)).Updates(model.User{Name: "hello", Age: 18})

// 表达式批量更新
u.WithContext(ctx).Where(u.ID.Eq(111)).UpdateSimple(u.Age.Add(1), u.Number.Add(1))

// 指定零值/NULL
u.WithContext(ctx).Where(u.Activate.Is(true)).UpdateSimple(u.Age.Value(17), u.Number.Zero(), u.Birthday.Null())
```

### 选择字段更新

```go
u.WithContext(ctx).Select(u.Name).Where(u.ID.Eq(111)).Updates(map[string]interface{}{"name": "hello", "age": 18})
// UPDATE users SET name='hello' WHERE id=111;

u.WithContext(ctx).Omit(u.Name).Where(u.ID.Eq(111)).Updates(map[string]interface{}{"name": "hello", "age": 18})
// UPDATE users SET age=18 WHERE id=111;
```

### 子查询更新

```go
u := query.User
c := query.Company

// 单列子查询
u.WithContext(ctx).Update(u.CompanyName, c.Select(c.Name).Where(c.ID.EqCol(u.CompanyID)))
// UPDATE "users" SET "company_name" = (SELECT name FROM companies WHERE companies.id = users.company_id)

// 多列跨表更新（MySQL）
ua := u.As("u")
ca := c.As("c")
ua.WithContext(ctx).UpdateFrom(ca.WithContext(ctx).Select(c.ID, c.Address).Where(c.ID.Gt(100))).
    Where(ua.CompanyID.EqCol(ca.ID)).
    UpdateSimple(ua.Address.SetCol(ca.Address))
```

## 删除

```go
e := query.Email

// 条件删除（必须有 Where 条件，否则抛出 ErrMissingWhereClause）
e.WithContext(ctx).Where(e.ID.Eq(10)).Delete()
// DELETE from emails where id = 10;

// 多条件删除
e.WithContext(ctx).Where(e.ID.Eq(10), e.Name.Eq("modi")).Delete()

// 主键批量删除
u.WithContext(ctx).Where(u.ID.In(1, 2, 3)).Delete()

// 模糊批量删除
e.WithContext(ctx).Where(e.Name.Like("%modi%")).Delete()

// 获取删除结果
result, err := e.WithContext(ctx).Where(e.ID.Eq(10)).Delete()
result.RowsAffected // 受影响的行数
```

### 软删除

模型包含 `gorm.DeletedAt` 字段时自动启用软删除：

```go
// 软删除（设置 deleted_at）
u.WithContext(ctx).Where(u.Age.Eq(20)).Delete()
// UPDATE users SET deleted_at=now() WHERE age=20;

// 查询自动排除软删除记录
users, err := u.WithContext(ctx).Where(u.Age.Eq(20)).Find()
// SELECT * FROM users WHERE age=20 AND deleted_at IS NULL;

// 查询包含软删除记录
users, err := u.WithContext(ctx).Unscoped().Where(u.Age.Eq(20)).Find()

// 永久删除
o.WithContext(ctx).Unscoped().Where(o.ID.Eq(10)).Delete()
// DELETE FROM orders WHERE id=10;
```

### 带 Select 的级联删除

```go
// 删除 user 时同时删除关联的 account
u.Select(u.Account).Delete(&user)

// 删除所有关联数据（has one/many/many2many）
u.Select(field.AssociationFields).Delete(&user)
```

## Hints（查询优化提示）

```go
import "gorm.io/hints"

u := query.Use(db).User

// 优化器提示
users, err := u.WithContext(ctx).Clauses(hints.New("MAX_EXECUTION_TIME(10000)")).Find()
// SELECT * /*+ MAX_EXECUTION_TIME(10000) */ FROM `users`

// Index hint
users, err := u.WithContext(ctx).Clauses(hints.UseIndex("idx_user_name")).Find()
// SELECT * FROM `users` USE INDEX (`idx_user_name`)

users, err := u.WithContext(ctx).Clauses(hints.ForceIndex("idx_user_name", "idx_user_id").ForJoin()).Find()
// SELECT * FROM `users` FORCE INDEX FOR JOIN (`idx_user_name`,`idx_user_id`)
```
