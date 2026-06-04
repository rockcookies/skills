# 生成器配置与模型生成

## 安装

```sh
go get -u github.com/rockcookies/go-gen
```

## gen.Config

```go
g := gen.NewGenerator(gen.Config{
    OutPath:           "../dal",    // 查询类代码输出路径，默认 ./query
    OutFile:           "gen.go",    // 输出文件名
    ModelPkgPath:      "model",     // 生成的 model 包名
    WithUnitTest:      false,       // 是否生成单元测试

    FieldNullable:     true,        // 可为 null 的字段生成指针类型
    FieldCoverable:    true,        // 有默认值的字段生成指针类型（避免零值覆盖）
    FieldSignable:     true,        // 根据列类型检测无符号整数
    FieldWithIndexTag: true,        // 生成 gorm index tag
    FieldWithTypeTag:  true,        // 生成 gorm type tag

    Mode: gen.WithoutContext | gen.WithDefaultQuery | gen.WithQueryInterface | gen.WithGeneric,
})
g.UseDB(db)
g.Execute()
```

### 生成模式（GenerateMode）

| 标志 | 说明 |
|------|------|
| `gen.WithDefaultQuery` | 生成全局变量 `Q`，可通过 `dal.Q.User.First()` 调用 |
| `gen.WithQueryInterface` | 生成查询 API 为接口（用于 Mock 测试） |
| `gen.WithGeneric` | 生成带泛型的接口代码，配合 `IGenericsDo` |
| `gen.WithoutContext` | 生成不需要传 context 参数的代码 |

## 从数据库生成模型

```go
g.ApplyBasic(
    g.GenerateModel("users"),
    g.GenerateModelAs("users", "Employee"),
    g.GenerateModel("users", gen.FieldIgnore("address"), gen.FieldType("id", "int64")),
    g.GenerateModel("customer", gen.FieldType("tags", "datatypes.JSON")),
)

// 从当前数据库所有表生成
g.ApplyBasic(g.GenerateAllTable()...)
```

## 字段选项（ModelOpt）

```go
gen.FieldNew("score", "float64", `json:"score"`) // 添加新字段
gen.FieldIgnore("address")                        // 忽略字段
gen.FieldIgnoreReg("^_")                          // 正则忽略字段
gen.FieldRename("old_name", "NewName")            // 重命名字段
gen.FieldComment("name", "用户名")                // 指定字段注释
gen.FieldType("id", "int64")                      // 指定字段类型
gen.FieldTypeReg(".*_id$", "int64")               // 正则批量改类型
gen.FieldTag("name", `json:"n" yaml:"n"`)         // 指定完整 tag
gen.FieldJSONTag("name", "n")                     // 指定 json tag
gen.FieldGORMTag("name", "column:n;index")        // 指定 gorm tag
gen.FieldNewTag("age", `yaml:"age"`)              // 添加额外 tag
gen.FieldTrimPrefix("tbl_")                       // 去除列前缀
gen.FieldTrimSuffix("_col")                       // 去除列后缀
gen.FieldRelate(gen.HasMany, "Orders", orderMeta, nil)               // 指定表关联
gen.FieldRelateModel(gen.BelongsTo, "Company", model.Company{}, nil) // 指定模型关联
```

## 模板方法（WithMethod）

```go
type CommonMethod struct {
    ID   int32
    Name *string
}

func (m *CommonMethod) IsEmpty() bool {
    return m == nil || m.ID == 0
}

// 为单个模型添加指定方法
g.GenerateModel("people", gen.WithMethod(CommonMethod{}.IsEmpty))

// 为模型添加所有方法
g.GenerateModel("user", gen.WithMethod(CommonMethod{}))

// 为所有生成模型添加 TableName 方法
g.WithOpts(gen.WithMethod(gen.DefaultMethodTableWithNamer))
```

## 命名策略

```go
// 表名 → 目标表名（返回空字符串则忽略该表）
g.WithTableNameStrategy(func(tableName string) string {
    if strings.HasPrefix(tableName, "_") {
        return "" // 忽略 _ 前缀的表
    }
    return tableName
})

// 表名 → 模型结构名
g.WithModelNameStrategy(func(tableName string) string { return tableName })

// 表名 → 文件名
g.WithFileNameStrategy(func(tableName string) string { return tableName })

// 列名 → json tag 内容
g.WithJSONTagNameStrategy(func(columnName string) string { return columnName })
```

## 数据类型映射

```go
g.WithDataTypeMap(map[string]func(gorm.ColumnType) string{
    "int": func(ct gorm.ColumnType) string {
        if n, ok := ct.Nullable(); ok && n {
            return "*int32"
        }
        return "int32"
    },
    "tinyint": func(ct gorm.ColumnType) string {
        if t, _ := ct.ColumnType(); strings.HasPrefix(t, "tinyint(1)") {
            return "bool"
        }
        return "byte"
    },
})
```

## 额外选项

```go
// 指定额外 import 路径
g.WithImportPkgPath("github.com/your/pkg")

// 全局 ModelOpt（应用到所有生成模型）
g.WithOpts(gen.WithMethod(CommonMethod{}))
```

## 从 SQL 文件生成

```go
import "gorm.io/rawsql"

gormdb, _ := gorm.Open(rawsql.New(rawsql.Config{
    FilePath: []string{"./sql"}, // SQL 文件目录
}))
g.UseDB(gormdb)
g.ApplyBasic(g.GenerateAllTable()...)
g.Execute()
```
