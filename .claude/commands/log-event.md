# log-event

Read the relevant incident, service or action before changing it. Run `npm run incidents -- log-event` with these named flags: incident, at, note, evidence. Each uses `--key=value`. Get missing facts from the operator. Supply `--actor=<operator>` and `--json`. Preview with `--dry-run`, then apply the authorised change and read the record back. Never infer completion, a timestamp or evidence. State transitions and evidence checks must pass. No notifications are sent.
