---
name: go-rc-gorm-gen
description: GORM Gen 类型安全 DAO 代码生成，基于 github.com/rockcookies/go-gen（rockcookies fork）。涵盖代码生成配置、模型生成、查询构建、增删改查、关联关系、动态 SQL 注解、事务处理、datatypes 自定义字段类型（JSON/JSONMap/JSONSlice/JSONType/Date/UUID）、soft_delete 软删除插件（unix 时间戳/flag 模式），以及 fork 专有功能：Tmpl 运行时模板覆写（18 个模板）、Unsafe 底层方法（UnsafeSetDB/Alias/ModelType/TableName）、IGenericsDo[T,E] 泛型接口。使用时机：需要从数据库生成 DAO 代码（GenerateModel/GenerateModelAs）、编写 DAL 查询（DO 链式调用、DaoScope、事务、关联加载）、配置生成器（gen.Config、ModelOpt、FieldGORMTag、FieldModify、FieldType、Tmpl 自定义模板）、使用 datatypes（JSONMap、JSONSlice、JSONQuery、JSONSet）或 soft_delete（DeletedAt、softDelete:milli、deleteOpts）时使用本技能。当用户消息中包含以下任一关键词（go-gen、gorm-gen、GenerateModelAs、ModelOpt、FieldGORMTag、FieldModify、DaoScope、LoadOneToMany、LoadManyToMany、IGenericsDo、UnsafeSetDB、datatypes、JSONMap、JSONSlice、JSONQuery、soft_delete、softDelete、DeletedAt），或用户明确请求 GORM Gen 代码生成/DAO 编写时触发本技能。
---

# go-gorm-gen

基于 [rockcookies/go-gen](https://github.com/rockcookies/go-gen) — 原 GORM Gen 的增强 fork，增加了运行时模板定制、泛型接口和 Unsafe 底层访问方法。

## 安装

```sh
go get -u github.com/rockcookies/go-gen
```

## 快速入门

```go
package main

import "github.com/rockcookies/go-gen"

func main() {
    g := gen.NewGenerator(gen.Config{
        OutPath: "../dal",
        Mode:    gen.WithoutContext | gen.WithDefaultQuery | gen.WithQueryInterface | gen.WithGeneric,
    })
    g.UseDB(db)

    // 从数据库表生成模型并应用 DAO 接口
    g.ApplyBasic(
        g.GenerateModel("users"),
        g.GenerateModelAs("company", "Company"),
    )

    // 应用自定义动态 SQL 接口
    g.ApplyInterface(func(Querier) {}, model.User{})

    g.Execute()
}
```

使用生成的 DAL：

```go
import "your_project/dal"

func main() {
    dal.SetDefault(db)

    // 类型安全的链式查询
    user, err := dal.Q.User.WithContext(ctx).Where(dal.Q.User.Name.Eq("modi")).First()

    // DaoScope 复用条件
    users, err := dal.Q.User.WithContext(ctx).Scopes(ActiveUsers, RecentUsers(7)).Find()
}
```

## Fork 专有功能

| 功能 | 说明 | 参考 |
|------|------|------|
| `gen.Tmpl` | 运行时覆写 18 个代码生成模板 | [custom-templates.md](references/custom-templates.md) |
| `Unsafe*` 方法 | 直接修改 DO 内部状态（db/alias/modelType/tableName） | [unsafe-generics.md](references/unsafe-generics.md) |
| `IGenericsDo[T,E]` | 完全类型安全的泛型查询接口 | [unsafe-generics.md](references/unsafe-generics.md) |
| `CheckClause` | Clause 注入安全校验 | [unsafe-generics.md](references/unsafe-generics.md) |

## References

按需加载 references：仅当用户问题涉及该子主题时读取对应文件，例如询问事务时读取 transactions.md，询问关联关系时读取 associations.md。

- [generator.md](references/generator.md) — 生成器配置、模型生成、字段选项、命名策略
- [dao.md](references/dao.md) — DAL 接口完整方法、DaoScope、分页、读写分离
- [query.md](references/query.md) — 查询构建、条件、排序、分页、Join、子查询、字段表达式
- [crud.md](references/crud.md) — 创建、更新、删除、Upsert、Hints
- [associations.md](references/associations.md) — 关联关系定义、Preload、嵌套预加载
- [sql-templates.md](references/sql-templates.md) — ApplyInterface 动态 SQL、注解语法（if/where/set/for）
- [transactions.md](references/transactions.md) — 自动/嵌套/手动事务、SavePoint
- [custom-templates.md](references/custom-templates.md) — Tmpl 结构体 + 18 个模板覆写（fork 专有）
- [unsafe-generics.md](references/unsafe-generics.md) — Unsafe 方法 + IGenericsDo 泛型接口（fork 专有）
- [datatypes.md](references/datatypes.md) — datatypes 字段类型（JSON/JSONMap/JSONSlice/JSONType/Date/Time/UUID）、Gen 配置、JSONQuery 查询、JSONSet 更新
- [soft-delete.md](references/soft-delete.md) — soft_delete 插件配置、unix 时间戳/milli/flag/混合模式、deleteOpts 辅助函数、Unscoped 查询
