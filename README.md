# Incident Reviews for Claude Code

Finish the incident review. Name the owner, record the evidence and close the follow-ups.

## Three ways to own it

- **Do it yourself:** free MIT code for Claude Code, Codex, OpenCode or Cursor. Agent subscriptions, hosting and your time remain your costs.
- **We customise it:** Enterprise DNA maps your incident.io records, changes your fields and review rules, and builds agreed screens and connections. A different stack is an option.
- **We run it for you:** Omni by Enterprise DNA installs and operates your version. One setup fee, then a monthly retainer.

[Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=incident-io).

## Try the fictional service desk

Node 20 or newer. No database account required.

```bash
npm install
npm run demo
npm run incidents -- review-queue
npm run incidents -- follow-ups
npm run incidents -- repeat-failures
npm run incidents -- weekly-review --json
npm run view
npm run docs
npm test
```

PGlite stores demo records in .data/db. DATA_DIR chooses another local database. DATABASE_URL chooses PostgreSQL 15 or newer. Use an empty database and npm run migrate for real records; never seed a business database. The schema uses the same SQL on both engines.

## The working week

Start with `/attention`, assign the review work with `/review-queue`, check `/follow-ups`, inspect `/repeat-failures` and write `/weekly-review`. `/compliance` flags record gaps against documented controls and team deadlines. It does not certify compliance or decide whether an incident is legally reportable.

Record incidents and dated events, resolve impact with evidence, record cause and lessons, then complete corrective actions. Closure requires a written review and no open actions. Every mutation requires an actor and accepts a dry run that rolls back records and audit events. Every command accepts --json. Names match case-insensitively, references match exactly, and ID prefixes work. Ambiguity prints candidates and exits 1.

This is the review and evidence workflow. It does not deliver urgent alerts, run on-call schedules, record calls, host status pages or capture chat. Keep your paging service. The free version remains useful offline for reviews, follow-ups and internal reports. [The screen boundary](docs/why-no-front-end.md) explains the deployment work.

## Ten questions answered from your records

These join your records across incidents, services and follow-ups. They are not a claim that incident.io cannot be configured to answer the same questions.

1. Which resolved incidents missed their review date? (`attention`)
2. Which corrective actions are overdue, and who owns them? (`follow-ups`)
3. Which service has multiple incidents in the last 30 days and overdue actions? (`repeat-failures`)
4. Which imported incidents still need a local owner and classification? (`attention`)
5. Which review cycles are unfinished even after a written review? (`review-queue`)
6. Which services have the longest recorded average resolution time? (`service-health`)
7. Which records lack any local timeline evidence? (`compliance`)
8. Which incident records have passed their retention review date? (`compliance`)
9. Who recorded a resolution, review or action completion? (`history`)
10. What did the old system say before local verification? (`imported-records`)

## Your first hour: ten things to ask for

1. Put our name, logo and colours in brand.json.
2. Show the late review in the fictional demo.
3. Find the overdue action on the repeat-failure service.
4. Explain the difference between resolved and closed.
5. Map the actual headings in our incident.io export.
6. Preview the import and reconcile its counts.
7. Classify an imported record without treating its old status as proof.
8. Produce an internal review pack.
9. Add our review category through /customise.
10. Add an owner-specific read-only report through /new-view.

## Bringing your history

[The replacement guide](docs/replace-incident-io.md) covers the CSV export and one-command import. Original rows are retained. Identical reimports are skipped; changed rows and reference collisions stop the entire import. The fixture is synthetic, so map your actual column names first. Imported incidents stay unverified until reviewed locally. Timeline, attachments, follow-ups and post-mortem contents need separate mapping.

Export creates a complete JSON archive and refuses to overwrite an existing file. Restoration is a reviewed migration. Rendered HTML, exports and drafts contain incident records; protect them like the database. The two document types are an incident review pack and a corrective action brief. Three read-only dashboards show the week, follow-ups and service history. Draft commands never send.

## Verification and deployment

npm test uses a temporary database, migrates and seeds twice, exercises every CLI command, and checks chronology, state gates, dry-run rollback, ambiguous names, import atomicity, duplicate imports, audit protection, exports and HTML escaping. CI covers Ubuntu, Windows and PostgreSQL; a platform is only verified when its job passes. TEST_DATABASE_URL must be an empty disposable database.

One business, trusted operators. No per-person access control. Row security denies public access; the CLI uses an owner connection. Do not expose it to a browser. Actor names are not authentication, and database owners can change audit triggers. See [record checks and source rules](docs/compliance.md).

MIT. Copyright 2026 Enterprise DNA. Independent of incident.io and Anthropic.
