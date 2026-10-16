# Move incident.io review records in one command

The import moves incident summaries into a local review register. It does not move paging, live chat, status pages, attachments, full timelines, follow-up records or post-mortem document contents. Keep those original exports for reconciliation and arrange their mapping separately.

## Export and map

Export the incident list from your incident.io workspace as CSV. Include a stable incident ID, reference, title, summary and created timestamp. Review filters and counts before export. Exclude private incidents: this base is one trusted team with no per-person permissions.

The vendor documents [custom fields in incident CSV exports](https://docs.incident.io/incidents/custom-fields) and [private-incident export controls](https://docs.incident.io/incidents/sensitive-incidents). Its [May 2023 changelog](https://incident.io/changelog/2023-05-23) also records incident CSV export support. Sources reopened on 16 October 2026. Headers depend on your export and configuration. The included fixture is synthetic, not a vendor-export contract.

Copy `fixtures/column-map.json`, replacing its values with the actual headers in your CSV. Required keys: `key`, `reference`, `name`, `started`. Optional: `summary`, `visibility`. Timestamps must be ISO with a timezone, for example `2026-09-01T09:00:00Z`. Convert an export's local timestamps explicitly before import and keep the original file. Unknown or private visibility values stop the import when that column is mapped. Excluding that column is not an access-control measure: the operator must exclude restricted records from the file.

```bash
npm run migrate
npm run incidents -- import incident-io --file=fixtures/incident-io.csv --map=fixtures/column-map.json --namespace=demo-workspace --actor=Operator --dry-run --json
npm run incidents -- import incident-io --file=fixtures/incident-io.csv --map=fixtures/column-map.json --namespace=demo-workspace --actor=Operator --json
```

Replace the fixture paths and namespace with your export, map and stable workspace name. One command imports the whole file atomically. The dry run reports counts and rolls back both domain rows and audit events. An empty file, missing column, invalid date, repeated source key or reference collision rejects the whole file.

## Reconcile before relying on it

Identical rows in the same namespace are skipped on rerun. Changed rows stop the import for explicit reconciliation. The original row and its mapping are retained, including unmapped fields. An imported status of Closed remains source history; the local incident starts unverified. Classify its service, severity, owner and review dates, then record evidence before marking it resolved or reviewed. Historical timestamps and review evidence can be entered through the same commands.

Compare the source count to imported plus skipped, compare references and summaries, and inspect `imported-records`. Check a sample against incident.io. Move the review workflow only after those checks. Keep your alerting and paging service running. A one-day record migration is a useful target for a clean export; it is not a promise to replace live response infrastructure in a day.

`export` creates a complete JSON archive of domain records, original source rows and audit history. It refuses to overwrite an existing file. Archive restoration is an operator-reviewed migration, not the incident.io CSV import. Protect archives, drafts and HTML as incident data.
