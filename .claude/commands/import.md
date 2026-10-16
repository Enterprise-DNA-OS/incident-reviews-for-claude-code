# import

Read `docs/replace-incident-io.md`. Inspect the CSV headers without exposing sensitive rows. Map actual headers, confirm the workspace namespace, exclude restricted records and check timestamp timezones. Run the documented `import incident-io` with `--dry-run --actor=<operator> --json`; reconcile counts, apply the authorised import, then inspect `imported-records` and `attention`. Changed source rows require explicit reconciliation. Never silently trust an imported Closed status.
