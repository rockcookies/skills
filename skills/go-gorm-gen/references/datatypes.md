# datatypes — GORM 自定义数据类型

`gorm.io/datatypes` 提供 JSON、日期、时间、UUID 等开箱即用的数据库列类型，实现了 GORM 的 `Scanner`/`Valuer` 接口，可直接映射到数据库字段。

## 安装

```sh
go get gorm.io/datatypes
```

## 在 Gen 中配置

使用 `gen.FieldType` 指定列对应的 Go 类型，并通过 `conf.WithImportPkgPath` 将包注入生成文件的 import 块。

```go
conf := gen.Config{ /* ... */ }

// 注入 import（生成的 model/dao 文件会自动包含该路径）
conf.WithImportPkgPath("\"gorm.io/datatypes\"")

gg := gen.NewGenerator(conf)
gg.UseDB(db)

gg.ApplyBasic(
    gg.GenerateModelAs("lb_skill", "Skill",
        gen.FieldType("metadata",       "datatypes.JSONMap"),           // JSON 对象
        gen.FieldType("files",          "datatypes.JSONSlice[string]"), // 泛型 JSON 数组
        gen.FieldType("release_result", "datatypes.JSON"),              // 原始 JSON bytes
    ),
    gg.GenerateModelAs("lb_event", "Event",
        gen.FieldType("attributes", "datatypes.JSONType[Attribute]"),   // 强类型 JSON 对象
        gen.FieldType("tags",       "datatypes.JSONSlice[Tag]"),        // 自定义结构体数组
        gen.FieldType("event_date", "datatypes.Date"),
        gen.FieldType("event_time", "datatypes.Time"),
        gen.FieldType("record_id",  "datatypes.UUID"),
    ),
)
```

### 泛型参数写法

`JSONSlice[T]` 和 `JSONType[T]` 的类型字符串需包含完整泛型参数，T 可以是内置类型或自定义结构体：

```go
gen.FieldType("ids",    "datatypes.JSONSlice[int64]")
gen.FieldType("names",  "datatypes.JSONSlice[string]")
gen.FieldType("tags",   "datatypes.JSONSlice[Tag]")       // Tag 须在同一包可见
gen.FieldType("config", "datatypes.JSONType[ConfigStruct]")
```

## 常用类型

### datatypes.JSON

原始 JSON bytes，支持完整的 JSON 查询操作，适合结构不固定的数据。

```go
type SkillVersion struct {
    gorm.Model
    ReleaseResult datatypes.JSON `gorm:"column:release_result;not null"`
}

// 写入
sv := SkillVersion{
    ReleaseResult: datatypes.JSON(`{"status": "ok", "artifacts": ["a.zip"]}`),
}
db.Create(&sv)

// 读取后访问
var result map[string]interface{}
json.Unmarshal(sv.ReleaseResult, &result)
```

### datatypes.JSONMap

`map[string]interface{}` 语义的 JSON 对象，适合存储结构松散的元数据（metadata）字段。

```go
type Skill struct {
    gorm.Model
    Metadata datatypes.JSONMap `gorm:"column:metadata;not null"`
}

skill := Skill{
    Metadata: datatypes.JSONMap{
        "author":  "alice",
        "version": "1.0",
        "tags":    []string{"cli", "devtool"},
    },
}
db.Create(&skill)

// 读取
fmt.Println(skill.Metadata["author"]) // "alice"
```

### datatypes.JSONSlice[T]

泛型 JSON 数组，编译期类型安全，适合存储同构列表（文件列表、标签列表等）。

```go
type Skill struct {
    gorm.Model
    Files datatypes.JSONSlice[string] `gorm:"column:files;not null"`
}

skill := Skill{
    Files: datatypes.NewJSONSlice([]string{"main.go", "README.md"}),
}
db.Create(&skill)

// 读取
for _, f := range []string(skill.Files) {
    fmt.Println(f)
}
```

> **注意**：`JSONSlice[T]` 不支持 JSON 查询（`datatypes.JSONQuery`）和 `db.Pluck`。

### datatypes.JSONType[T]

强类型 JSON 对象，T 为自定义结构体，读写时自动序列化/反序列化。

```go
type Attribute struct {
    Role  string
    Level int
    Tags  []string
}

type User struct {
    gorm.Model
    Attributes datatypes.JSONType[Attribute]
}

user := User{
    Attributes: datatypes.NewJSONType(Attribute{Role: "admin", Level: 5}),
}
db.Create(&user)

// 读取
attr := user.Attributes.Data()
fmt.Println(attr.Role) // "admin"
```

> **注意**：`JSONType[T]` 不支持 JSON 查询。需要查询时改用 `datatypes.JSON` + 手动处理。

### datatypes.Date

仅日期部分（年-月-日），忽略时间。

```go
type Event struct {
    gorm.Model
    EventDate datatypes.Date
}

event := Event{EventDate: datatypes.Date(time.Now())}
db.Create(&event)
// INSERT ... VALUES ("2026-05-26")

db.First(&result, "event_date = ?", datatypes.Date(time.Now()))
// SELECT ... WHERE event_date = "2026-05-26"
```

### datatypes.Time

仅时间部分（时:分:秒），不含日期。

```go
type Schedule struct {
    gorm.Model
    StartTime datatypes.Time
}

schedule := Schedule{StartTime: datatypes.NewTime(9, 0, 0, 0)}
db.Create(&schedule)
// INSERT ... VALUES ("09:00:00")
```

### datatypes.UUID

跨数据库 UUID 类型（MySQL/PostgreSQL/SQLServer/SQLite）。推荐新项目使用 UUIDv7（按时间有序）。

```go
type Record struct {
    gorm.Model
    RecordID datatypes.UUID
}

record := Record{RecordID: datatypes.NewUUIDv7()} // 时间有序，适合主键/索引
db.Create(&record)

// 比较
if record.RecordID.Equals(other.RecordID) { /* ... */ }
// 转字符串
fmt.Println(record.RecordID.String())
```

## JSON 查询

### HasKey — 检查 key 是否存在

```go
// 检查顶层 key
db.Find(&users, datatypes.JSONQuery("attributes").HasKey("role"))
// MySQL:      WHERE JSON_EXTRACT(`attributes`, '$.role') IS NOT NULL
// PostgreSQL: WHERE "attributes"::jsonb ? 'role'

// 检查嵌套 key
db.Find(&users, datatypes.JSONQuery("attributes").HasKey("orgs", "orga"))
// MySQL:      WHERE JSON_EXTRACT(`attributes`, '$.orgs.orga') IS NOT NULL
// PostgreSQL: WHERE "attributes"::jsonb -> 'orgs' ? 'orga'
```

### Equals — 检查 key 的值

```go
db.First(&user, datatypes.JSONQuery("attributes").Equals("admin", "role"))
// MySQL:      WHERE JSON_EXTRACT(`attributes`, '$.role') = "admin"
// PostgreSQL: WHERE json_extract_path_text("attributes"::json,'role') = 'admin'

// 嵌套路径
db.First(&user, datatypes.JSONQuery("attributes").Equals("orgb", "orgs", "orgb"))
// MySQL:      WHERE JSON_EXTRACT(`attributes`, '$.orgs.orgb') = "orgb"
```

### JSONArrayQuery — 数组包含（MySQL）

```go
db.Where(datatypes.JSONArrayQuery("config").Contains("c")).Find(&params)
// MySQL: WHERE JSON_CONTAINS(`config`, '"c"')
```

### 在 Gen 生成的 DAO 中使用 JSON 查询

datatypes 字段在生成的 DAO struct 中类型为 `field.Field`，不支持直接 `.Eq()` 等链式方法。需通过 `gen.Cond()` 包装条件传入：

```go
s := dal.Q.Skill

// 传入 datatypes.JSONQuery 条件
skills, err := s.WithContext(ctx).
    Where(gen.Cond(datatypes.JSONQuery("metadata").HasKey("author"))...).
    Find()

// 或直接用 db.Where
skills, err := s.WithContext(ctx).
    Where(s.OwnerID.Eq(ownerID)).
    UnderlyingDB().
    Where(datatypes.JSONQuery("metadata").Equals("alice", "author")).
    Find(&result)
```

## JSON 字段更新（JSONSet）

原地更新 JSON 列中的特定 key，无需读取整列再写回。

```go
// MySQL 路径语法
db.Model(&Skill{}).
    Where("name = ?", "my-skill").
    UpdateColumn("metadata",
        datatypes.JSONSet("metadata").
            Set("author", "bob").
            Set("tags[0]", "cli").
            Set("orgs.team", "backend"),
    )
// MySQL: UPDATE skills SET metadata = JSON_SET(metadata, '$.author', 'bob', '$.tags[0]', 'cli', '$.orgs.team', 'backend') WHERE name = 'my-skill'

// PostgreSQL 路径语法（用 {key} 格式）
db.Model(&Skill{}).
    Where("name = ?", "my-skill").
    UpdateColumn("metadata",
        datatypes.JSONSet("metadata").
            Set("{author}", "bob").
            Set("{tags, 0}", "cli"),
    )
// PostgreSQL: UPDATE skills SET metadata = JSONB_SET(JSONB_SET(metadata, '{author}', '"bob"'), '{tags, 0}', '"cli"') WHERE name = 'my-skill'
```
