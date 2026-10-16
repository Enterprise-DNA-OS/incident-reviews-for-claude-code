# add-incident

Read the relevant incident, service or action before changing it. Run `npm run incidents -- add-incident` with these named flags: reference, name, service, owner, severity, started, review-due, retention-review, optional summary. Each uses `--key=value`. Get missing facts from the operator. Supply `--actor=<operator>` and `--json`. Preview with `--dry-run`, then apply the authorised change and read the record back. Never infer completion, a timestamp or evidence. State transitions and evidence checks must pass. No notifications are sent.
