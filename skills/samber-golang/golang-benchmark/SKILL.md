---
name: golang-benchmark
description: >-
  Golang benchmarking, profiling, and performance measurement. Use when writing,
  running, or comparing Go benchmarks, profiling hot paths with pprof,
  interpreting CPU/memory/trace profiles, analyzing results with benchstat,
  setting up CI benchmark regression detection, or investigating production
  performance with Prometheus runtime metrics. Also use when the developer needs
  deep analysis on a specific performance indicator - this skill provides the
  measurement methodology, while `golang-performance`
  provides the optimization patterns.
user-invocable: true
license: MIT
compatibility: >-
  Designed for Claude Code or similar AI coding agents, and for projects using
  Golang.
metadata:
  author: samber
  version: 1.2.6
  openclaw:
    emoji: 📊
    homepage: https://github.com/samber/cc-skills-golang
    requires:
      bins:
        - go
        - benchstat
    install:
      - kind: go
        package: golang.org/x/perf/cmd/benchstat@latest
        bins:
          - benchstat
allowed-tools: >-
  Read Edit Write Glob Grep Bash(go:*) Bash(golangci-lint:*) Bash(git:*) Agent
  WebFetch Bash(benchstat:*) Bash(benchdiff:*) Bash(cob:*) Bash(gobenchdata:*)
  Bash(curl:*) mcp__context7__resolve-library-id mcp__context7__query-docs
  WebSearch AskUserQuestion EnterWorktree ExitWorktree
---

**Persona:** You are a Go performance measurement engineer. You never draw conclusions from a single benchmark run — statistical rigor and controlled conditions are prerequisites before any optimization decision.

**Thinking mode:** Use `ultrathink` for benchmark analysis, profile interpretation, and performance comparison tasks. Deep reasoning prevents misinterpreting profiling data and ensures statistically sound conclusions.

**Dependencies:**

- benchstat: `go install golang.org/x/perf/cmd/benchstat@latest`

# Go Benchmarking & Performance Measurement

Performance improvement does not exist without measures — if you can measure it, you can improve it.

This skill covers the full measurement workflow: write a benchmark, run it, profile the result, compare before/after with statistical rigor, and track regressions in CI. For optimization patterns to apply after measurement, → See `golang-performance` skill. For pprof setup on running services, → See `golang-troubleshooting` skill.

## Writing Benchmarks

### File and Ordering Conventions

Benchmark functions live in a `_bench_test.go` file named after the source file under benchmark, not after the individual function — `parser.go` -> `parser_bench_test.go`, containing `BenchmarkParse`, `BenchmarkEncode`, etc., not a separate `benchmarkparse_test.go` per function. Keeping benchmarks in their own file (instead of mixed into `parser_test.go`) lets `go test -run . -short` skip the package's regular test run without also compiling benchmark-only fixtures, and keeps `go test -bench=. ./pkg/parser` output free of unrelated `Test*` noise. The file still follows Go's one-test-file-per-source-file convention (→ See `golang-testing` skill), just with the `_bench` suffix marking its narrower purpose.

Order `Benchmark*` functions inside `parser_bench_test.go` to mirror the order of the functions/methods they measure in `parser.go` — a reader comparing the two files top to bottom should find `BenchmarkParse` at the same relative position as `Parse`.

### `b.Loop()` (Go 1.24+) — preferred

For Go 1.24+, prefer `b.Loop()` for new benchmarks. It times only the loop body and keeps function arguments/results alive, which reduces dead-code-elimination mistakes.

```go
func BenchmarkParse(b *testing.B) {
    data := loadFixture("large.json") // setup — excluded from timing
    for b.Loop() {
        Parse(data)  // compiler cannot eliminate this call
    }
}
```

Legacy `b.N` loops still compile and are fine to keep when preserving existing benchmarks or supporting Go <1.24. They are easier to get wrong: setup may need `b.ResetTimer()`, and results may need a sink if the compiler can eliminate the work. Go 1.26 fixed an earlier `b.Loop()` inlining limitation — benchmarks on 1.24–1.25 already benefit from `b.Loop()` but may miss inlining optimizations that 1.26 delivers.

### Memory tracking

```go
func BenchmarkAlloc(b *testing.B) {
    b.ReportAllocs() // or run with -benchmem flag
    var sink []byte
    for b.Loop() {
        sink = make([]byte, 1024)
    }
    _ = sink
}
```

`b.ReportMetric()` adds custom metrics (e.g., throughput):

```go
b.ReportMetric(float64(totalBytes)/b.Elapsed().Seconds(), "bytes/s") // b.Elapsed() is only valid inside b.Loop()
```

### Sub-benchmarks and table-driven

```go
func BenchmarkEncode(b *testing.B) {
    for _, size := range []int{64, 256, 4096} {
        b.Run(fmt.Sprintf("size=%d", size), func(b *testing.B) {
            data := make([]byte, size)
            for b.Loop() {
                Encode(data)
            }
        })
    }
}
```

## Running Benchmarks

```bash
go test -bench=BenchmarkEncode -benchmem -count=10 ./pkg/... | tee bench.txt
```

| Flag                   | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `-bench=.`             | Run all benchmarks (regexp filter)        |
| `-benchmem`            | Report allocations (B/op, allocs/op)      |
| `-count=10`            | Run 10 times for statistical significance |
| `-benchtime=3s`        | Minimum time per benchmark (default 1s)   |
| `-cpu=1,2,4`           | Run with different GOMAXPROCS values      |
| `-cpuprofile=cpu.prof` | Write CPU profile                         |
| `-memprofile=mem.prof` | Write memory profile                      |
| `-trace=trace.out`     | Write execution trace                     |

**Output format:** `BenchmarkEncode/size=64-8  5000000  230.5 ns/op  128 B/op  2 allocs/op` — the `-8` suffix is GOMAXPROCS, `ns/op` is time per operation, `B/op` is bytes allocated per op, `allocs/op` is heap allocation count per op.

## Comparing Optimization Variants in Parallel

When several competing optimization hypotheses exist for the same bottleneck, implement each variant in its own isolated worktree (`EnterWorktree`) via a separate sub-agent, so their code changes never collide in the shared working tree.

**Run the benchmarks serially, not concurrently.** Concurrent benchmark runs share the same CPU — the noisy-neighbor effect contaminates `ns/op` and reintroduces the exact statistical noise `-count` and `benchstat` exist to eliminate. Implementing in parallel is safe (isolated worktrees, no file contention); measuring in parallel is not (shared hardware, real contention). Run each variant's benchmark one at a time, back in the main tree or sequentially per worktree.

Compare every variant's `benchstat` output against the **same** baseline report, keep the winner, and `ExitWorktree` (remove) the rest.

## Documenting Results in Commits

Paste benchstat output in the commit body when the change has a measurable performance impact. This documents _why_ an optimization was made, prevents future readers from reverting it, and lets reviewers verify the claim without re-running benchmarks.

Commit format:

```
perf(parser): reduce Parse allocations 50% with sync.Pool

Replace per-call []byte allocation with a pooled buffer.

goos: linux / goarch: amd64 / cpu: AMD Ryzen 9 5950X
          │    old     │              new               │
          │  sec/op    │  sec/op     vs base            │
Parse-32    4.592µ ± 2%  3.041µ ± 1%  -33.78% (p=0.000 n=10)

          │   old    │             new              │
          │   B/op   │   B/op     vs base           │
Parse-32   1.024Ki ± 0%  0.512Ki ± 0%  -50.00% (p=0.000 n=10)

          │ old  │            new             │
          │ allocs/op │ allocs/op  vs base    │
Parse-32   12.00 ± 0%   6.000 ± 0%  -50.00% (p=0.000 n=10)
```

**Rules:**

- Only include benchmarks directly affected by the change — strip unrelated rows
- Never paste results with `~` (no statistical significance) — the improvement cannot be claimed
- Include the hardware context line (`goos/goarch/cpu`) so results are reproducible
- Use `perf(scope):` commit type for performance-only changes

## Profiling from Benchmarks

Generate profiles directly from benchmark runs — no HTTP server needed:

```bash
# CPU profile
go test -bench=BenchmarkParse -cpuprofile=cpu.prof ./pkg/parser
go tool pprof cpu.prof

# Memory profile (alloc_objects shows GC churn, inuse_space shows leaks)
go test -bench=BenchmarkParse -memprofile=mem.prof ./pkg/parser
go tool pprof -alloc_objects mem.prof

# Execution trace
go test -bench=BenchmarkParse -trace=trace.out ./pkg/parser
go tool trace trace.out
```

For full pprof CLI reference (all commands, non-interactive mode, profile interpretation), see [pprof Reference](./references/pprof.md). For execution trace interpretation, see [Trace Reference](./references/trace.md). For statistical comparison, see [benchstat Reference](./references/benchstat.md).

## Reference Files

- **[pprof Reference](./references/pprof.md)** — Interactive and non-interactive analysis of CPU, memory, and goroutine profiles. Full CLI commands, profile types (CPU vs alloc*objects vs inuse_space), web UI navigation, and interpretation patterns. Use this to dive deep into \_where* time and memory are being spent in your code.

- **[benchstat Reference](./references/benchstat.md)** — Statistical comparison of benchmark runs with rigorous confidence intervals and p-value tests. Covers output reading, filtering old benchmarks, interleaving results for visual clarity, and regression detection. Use this when you need to prove a change made a meaningful performance difference, not just a lucky run.

- **[Trace Reference](./references/trace.md)** — Execution tracer for understanding _when_ and _why_ code runs. Visualizes goroutine scheduling, garbage collection phases, network blocking, and custom span annotations. Use this when pprof (which shows _where_ CPU goes) isn't enough — you need to see the timeline of what happened.

- **[Diagnostic Tools](./references/tools.md)** — Quick reference for ancillary tools: fieldalignment (struct padding waste), GODEBUG (runtime logging flags), fgprof (frame graph profiles), race detector (concurrency bugs), and others. Use this when you have a specific symptom and need a focused diagnostic — don't reach for pprof if a simpler tool already answers your question.

- **[Compiler Analysis](./references/compiler-analysis.md)** — Low-level compiler optimization insights: escape analysis (when values move to the heap), inlining decisions (which function calls are eliminated), SSA dump (intermediate representation), and assembly output. Use this when benchmarks show allocations you didn't expect, or when you want to verify the compiler did what you intended.

- **[CI Regression Detection](./references/ci-regression.md)** — Automated performance regression gating in CI pipelines. Covers three tools (benchdiff for quick PR comparisons, cob for strict threshold-based gating, gobenchdata for long-term trend dashboards), noisy neighbor mitigation strategies (why cloud CI benchmarks vary 5-10% even on quiet machines), and self-hosted runner tuning to make benchmarks reproducible. Use this when you want to ensure pull requests don't silently slow down your codebase — detecting regressions early prevents shipping performance debt.

- **[Investigation Session](./references/investigation-session.md)** — Production performance troubleshooting workflow combining Prometheus runtime metrics (heap size, GC frequency, goroutine counts), PromQL queries to correlate metrics with code changes, runtime configuration flags (GODEBUG env vars to enable GC logging), and cost warnings (when you're hitting performance tax). Use this when production benchmarks look good but real traffic behaves differently.

- **[Prometheus Go Metrics Reference](./references/prometheus-go-metrics.md)** — Complete listing of Go runtime metrics actually exposed as Prometheus metrics by `prometheus/client_golang`. Covers 30 default metrics, 40+ optional metrics (Go 1.17+), process metrics, and common PromQL queries. Distinguishes between `runtime/metrics` (Go internal data) and Prometheus metrics (what you scrape from `/metrics`). Use this when setting up monitoring dashboards or writing PromQL queries for production alerts.

## Cross-References

- → See `golang-performance` skill for optimization patterns to apply after measuring ("if X bottleneck, apply Y")
- → See `golang-troubleshooting` skill for pprof setup on running services (enable, secure, capture), Delve debugger, GODEBUG flags, root cause methodology
- → See `golang-observability` skill for everyday always-on monitoring, continuous profiling (Pyroscope), distributed tracing (OpenTelemetry)
- → See `golang-testing` skill for general testing practices
- → See `samber/cc-skills@promql-cli` skill for querying Prometheus runtime metrics in production to validate benchmark findings
