# 事务处理

## 自动事务

```go
import "github.com/rockcookies/go-gen"

q := query.Use(db)

q.Transaction(func(tx *query.Query) error {
    if _, err := tx.User.WithContext(ctx).Where(tx.User.ID.Eq(100)).Delete(); err != nil {
        return err // 自动回滚
    }
    if err := tx.Article.WithContext(ctx).Create(&model.Article{Title: "gen"}); err != nil {
        return err // 自动回滚
    }
    return nil // 自动提交
})
```

## 嵌套事务

支持嵌套事务，内层回滚不影响外层：

```go
q.Transaction(func(tx *query.Query) error {
    tx.User.WithContext(ctx).Create(&user1)

    tx.Transaction(func(tx2 *query.Query) error {
        tx2.User.WithContext(ctx).Create(&user2)
        return errors.New("rollback user2") // 回滚 user2，user1 不受影响
    })

    tx.Transaction(func(tx3 *query.Query) error {
        tx3.User.WithContext(ctx).Create(&user3)
        return nil // 提交 user3
    })

    return nil // 提交 user1, user3
})
```

## 手动事务

```go
q := query.Use(db)

func doSomething(ctx context.Context, users ...*model.User) (err error) {
    tx := q.Begin()
    defer func() {
        if recover() != nil || err != nil {
            _ = tx.Rollback()
        }
    }()

    err = tx.User.WithContext(ctx).Create(users...)
    if err != nil {
        return
    }
    return tx.Commit()
}
```

## SavePoint / RollbackTo

```go
tx := q.Begin()
txCtx := tx.WithContext(ctx)

txCtx.User.Create(&user1)
tx.SavePoint("sp1")

txCtx.User.Create(&user2)
tx.RollbackTo("sp1") // 回滚到 sp1，user2 被撤销

tx.Commit() // 提交 user1
```
