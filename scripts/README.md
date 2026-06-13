# scripts/

Convenience scripts for local development.

| Script | What it does |
|---|---|
| `seed.sh` | Seeds (or resets) the demo workspace — creates the demo coach, athletes, sessions, synthetic videos, and runs the real processing pipeline. Idempotent. |

```bash
# from the repo root
bash scripts/seed.sh
```

For the full setup and Docker instructions, see the root [`README.md`](../README.md)
and [`docs/deployment.md`](../docs/deployment.md).
