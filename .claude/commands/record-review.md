# record-review

Read the relevant incident, service or action before changing it. Run `npm run incidents -- record-review` with these named flags: incident, at, reviewer, cause, lessons, evidence. Each uses `--key=value`. Get missing facts from the operator. Supply `--actor=<operator>` and `--json`. Preview with `--dry-run`, then apply the authorised change and read the record back. Never infer completion, a timestamp or evidence. State transitions and evidence checks must pass. No notifications are sent.
