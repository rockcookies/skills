# 动态 SQL 与注解语法

## ApplyInterface：动态查询接口

通过在接口方法注释中写 SQL，Gen 将生成完全类型安全的 Go 代码。

```go
import "github.com/rockcookies/go-gen"

type Querier interface {
    // SELECT * FROM @@table WHERE id=@id
    GetByID(id int) (gen.T, error)

    // SELECT * FROM @@table WHERE role IN @rolesName
    GetByRoles(rolesName ...string) ([]*gen.T, error)

    // INSERT INTO @@table (name, age) VALUES (@name, @age)
    InsertValue(name string, age int) error
}

g.ApplyInterface(func(Querier) {}, model.User{}, g.GenerateModel("employee"))
g.Execute()
```

使用生成的代码：

```go
user, err := query.User.GetByID(10)
employees, err := query.Employee.GetByRoles("admin", "manager")
err = query.User.InsertValue("modi", 18)
```

### 代码片段（Code Fragments）

```go
type Querier interface {
    // FindByNameAndAge query data by name and age
    //
    // where("name=@name AND age=@age")
    FindByNameAndAge(name string, age int) (gen.M, error)
}
```

## 返回结果类型

| 类型 | 说明 |
|------|------|
| `gen.T` | 返回当前模型 struct |
| `gen.M` | 返回 `map[string]interface{}` |
| `gen.RowsAffected` | 返回受影响行数（int64） |
| `error` | 返回错误 |

```go
type Querier interface {
    GetByID(id int) (gen.T, error)          // 返回 struct + error
    GetByID(id int) (*gen.T, error)         // 返回 struct 指针 + error
    GetByID(id int) ([]*gen.T, error)       // 返回 slice of pointer
    GetByID(id int) ([]gen.M, error)        // 返回 slice of map
    InsertValue(name string, age int) (gen.RowsAffected, error)
}
```

## 模板占位符

| 占位符 | 说明 |
|--------|------|
| `@@table` | 转义并引用的当前表名 |
| `@@<name>` | 转义并引用为表名或列名的参数 |
| `@<name>` | SQL 查询参数（安全参数化） |

```go
type Filter interface {
    // SELECT * FROM @@table WHERE @@column=@value
    FilterWithColumn(column string, value string) (gen.T, error)
}
```

## 模板表达式

### `if/else`

```go
type Querier interface {
    // SELECT * FROM users WHERE
    //   {{if name != ""}}
    //     username=@name AND
    //   {{end}}
    //   role="admin"
    QueryWith(name string) (gen.T, error)
}

// 复杂嵌套条件
type Querier interface {
    // SELECT * FROM users
    //   {{if user != nil}}
    //     {{if user.ID > 0}}
    //       WHERE id=@user.ID
    //     {{else if user.Name != ""}}
    //       WHERE username=@user.Name
    //     {{end}}
    //   {{end}}
    QueryWith(user *gen.T) (gen.T, error)
}
```

### `where`

自动添加/省略 WHERE 关键字，并智能去除多余的 `AND`/`OR`：

```go
type Querier interface {
    // SELECT * FROM @@table
    //   {{where}}
    //     {{if !start.IsZero()}} created_time > @start {{end}}
    //     {{if !end.IsZero()}} AND created_time < @end {{end}}
    //   {{end}}
    FilterWithTime(start, end time.Time) ([]gen.T, error)
}
```

```go
query.User.FilterWithTime(since, end)   // WHERE created_time > "..." AND created_time < "..."
query.User.FilterWithTime(since, zero)  // WHERE created_time > "..."
query.User.FilterWithTime(zero, zero)   // （无 WHERE 子句）
```

### `set`

自动构建 SET 子句，智能去除多余的 `,`：

```go
type Querier interface {
    // UPDATE @@table
    //   {{set}}
    //     {{if user.Name != ""}} username=@user.Name, {{end}}
    //     {{if user.Age > 0}} age=@user.Age, {{end}}
    //     {{if user.Age >= 18}} is_adult=1 {{else}} is_adult=0 {{end}}
    //   {{end}}
    // WHERE id=@id
    Update(user gen.T, id int) (gen.RowsAffected, error)
}
```

```go
query.User.Update(User{Name: "jinzhu", Age: 18}, 10)
// UPDATE users SET username="jinzhu", age=18, is_adult=1 WHERE id=10

query.User.Update(User{Age: 0}, 10)
// UPDATE users SET is_adult=0 WHERE id=10
```

### `for`

遍历切片生成 SQL：

```go
type Querier interface {
    // SELECT * FROM @@table WHERE id IN (
    //   {{for _, id := range ids}} @id, {{end}}
    // )
    FindByIDs(ids []int) ([]gen.T, error)
}
```
