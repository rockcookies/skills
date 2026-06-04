# soft_delete — 软删除插件

`gorm.io/plugin/soft_delete` 提供基于整数（unix 时间戳或 0/1 标志）的软删除，替代 GORM 内置的 `gorm.DeletedAt`（基于 NULL）。

## 安装

```sh
go get gorm.io/plugin/soft_delete
```

## 与 gorm.DeletedAt 的区别

| | `gorm.DeletedAt` | `soft_delete.DeletedAt` |
|---|---|---|
| 存储类型 | `DATETIME` / `TIMESTAMP` nullable | `BIGINT NOT NULL DEFAULT 0` |
| 未删除标识 | `IS NULL` | `= 0` |
| 参与唯一索引 | 不能（NULL 不计入唯一约束） | 可以（0 是正常值，参与唯一约束） |
| 字段名惯例 | `deleted_at` | 任意，常用 `delete_timestamp`、`is_del` |
| 记录删除时间 | 是（精确到秒） | 需选择时间单位，或用混合模式 |

**推荐场景**：字段需参与唯一索引时（如 `email + delete_timestamp` 组合唯一），选用 `soft_delete.DeletedAt`。

## 在 Gen 中配置

`soft_delete.DeletedAt` 字段需同时设置类型和 GORM tag，通常封装成辅助函数复用。

### deleteOpts 辅助函数模式（推荐）

```go
import (
    "github.com/rockcookies/go-gen"
    "github.com/rockcookies/go-gen/field"
)

// deleteOpts 为指定列名生成软删除配置（毫秒时间戳模式）
func deleteOpts(columnName string) []gen.ModelOpt {
    return []gen.ModelOpt{
        gen.FieldType(columnName, "soft_delete.DeletedAt"),
        gen.FieldGORMTag(columnName, func(tag field.GormTag) field.GormTag {
            return tag.Set("softDelete", "milli")
        }),
    }
}
```

在 Gen 配置中使用（字段名为 `delete_timestamp` 而非默认 `deleted_at`）：

```go
conf.WithImportPkgPath("\"gorm.io/plugin/soft_delete\"")

gg.ApplyBasic(
    gg.GenerateModelAs("lb_user", "User",    deleteOpts("delete_timestamp")...),
    gg.GenerateModelAs("lb_admin", "Admin",  deleteOpts("delete_timestamp")...),
    gg.GenerateModelAs("lb_skill", "Skill",
        slices.Concat([]gen.ModelOpt{
            gen.FieldType("metadata", "datatypes.JSONMap"),
            gen.FieldType("files",    "datatypes.JSONSlice[string]"),
        }, deleteOpts("delete_timestamp"))...,
    ),
)
```

生成的 model：

```go
type User struct {
    ID              int64                 `gorm:"column:id;primaryKey;autoIncrement:true"`
    Username        string                `gorm:"column:username;not null"`
    // ...
    DeleteTimestamp soft_delete.DeletedAt `gorm:"column:delete_timestamp;not null;softDelete:milli"`
    CreateTime      time.Time             `gorm:"column:create_time;autoCreateTime:milli"`
    UpdateTime      time.Time             `gorm:"column:update_time;autoUpdateTime:milli"`
}
```

## 删除模式

### unix 秒（默认）

删除时写入当前 unix 时间戳（秒），未删除为 0。

```go
type User struct {
    ID        uint
    Name      string
    DeletedAt soft_delete.DeletedAt `gorm:"column:deleted_at;not null"`
}

// Query
// SELECT * FROM users WHERE deleted_at = 0;

// Delete
// UPDATE users SET deleted_at = 1748304000 WHERE id = 1;
```

### 毫秒 / 纳秒

适合需要精确删除时间记录的场景。

```go
type User struct {
    ID        uint
    Name      string
    DeletedAt soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli"`
    // DeletedAt soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:nano"`
}

// Delete
// UPDATE users SET deleted_at = 1748304000000 WHERE id = 1;  (milli)
```

Gen 配置：

```go
gen.FieldGORMTag("deleted_at", func(tag field.GormTag) field.GormTag {
    return tag.Set("softDelete", "milli") // 或 "nano"
})
```

### 0/1 标志（flag 模式）

用 `0` 表示未删除、`1` 表示已删除，字段通常命名为 `is_del`。

```go
type User struct {
    ID    uint
    Name  string
    IsDel soft_delete.DeletedAt `gorm:"column:is_del;not null;softDelete:flag"`
}

// Query
// SELECT * FROM users WHERE is_del = 0;

// Delete
// UPDATE users SET is_del = 1 WHERE id = 1;
```

Gen 配置：

```go
gen.FieldType("is_del", "soft_delete.DeletedAt"),
gen.FieldGORMTag("is_del", func(tag field.GormTag) field.GormTag {
    return tag.Set("softDelete", "flag")
}),
```

### 混合模式（flag + 记录删除时间）

同时用 0/1 标志标记删除状态，并将删除时间写入另一个字段，便于审计。

```go
type User struct {
    ID        uint
    Name      string
    DeletedAt time.Time             // 记录删除时间（也可以是 int64 unix 时间戳）
    IsDel     soft_delete.DeletedAt `gorm:"softDelete:flag,DeletedAtField:DeletedAt"`
}

// Query
// SELECT * FROM users WHERE is_del = 0;

// Delete
// UPDATE users SET is_del = 1, deleted_at = '2026-05-26 12:00:00' WHERE id = 1;
```

指定时间单位（毫秒）：

```go
type User struct {
    ID        uint
    DeletedAt int64
    IsDel     soft_delete.DeletedAt `gorm:"softDelete:flag,DeletedAtField:DeletedAt,DeletedAtFieldUnit:milli"`
}
```

## 查询行为

### 自动过滤软删除记录

GORM 会在所有查询中自动追加软删除条件，无需手动添加：

```go
u := dal.Q.User

// 自动追加 WHERE delete_timestamp = 0
users, err := u.WithContext(ctx).Where(u.Status.Eq(1)).Find()
// SELECT * FROM lb_user WHERE status = 1 AND delete_timestamp = 0;

// First / Count / Update / Delete 均自动追加
count, err := u.WithContext(ctx).Count()
// SELECT count(*) FROM lb_user WHERE delete_timestamp = 0;
```

### 查询包含软删除记录（Unscoped）

```go
// 在 Gen DAO 中：通过底层 db 的 Unscoped
allUsers, err := u.WithContext(ctx).UnderlyingDB().Unscoped().Find(&result)
// SELECT * FROM lb_user;  （不附加 delete_timestamp 条件）

// 查询仅软删除的记录
db.Unscoped().Where("delete_timestamp > 0").Find(&deletedUsers)
```

### 软删除（设置时间戳）

```go
// Gen DAO 的 Delete 方法触发软删除
err := u.WithContext(ctx).Where(u.ID.Eq(userId)).Delete()
// UPDATE lb_user SET delete_timestamp = 1748304000000 WHERE id = ? AND delete_timestamp = 0;
```

### 永久删除

```go
// 通过底层 db 的 Unscoped().Delete() 执行物理删除
db.Unscoped().Delete(&model.User{}, userId)
// DELETE FROM lb_user WHERE id = ?;
```

## 生成的 DAO 中的注意事项

`soft_delete.DeletedAt` 字段在生成的 DAO struct 中类型为 `field.Field`，不支持 `.Eq()` 等整数比较方法：

```go
// ❌ 不可用：soft_delete 字段不是 field.Int64
u.DeleteTimestamp.Eq(0)

// ✅ 用 Unscoped 或底层 db 操作软删除相关逻辑
db.Unscoped().Where("delete_timestamp > 0").Find(&deletedUsers)
```

软删除的过滤由 GORM 内部的 `Callback` 自动处理，Gen 生成的 DAO 方法（`Find`、`Count`、`Delete` 等）均已正确继承此行为，无需额外干预。
