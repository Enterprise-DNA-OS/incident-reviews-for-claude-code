# Evidence checks for incident reviews

Checked 16 October 2026. These are record checks for a trusted internal team. They do not certify compliance, investigate an incident, determine reportability or issue notifications.

[NIST SP 800-61 Revision 3](https://doi.org/10.6028/NIST.SP.800-61r3), published April 2025, describes incident response within cybersecurity risk management. Its roles, incident analysis, response documentation and improvement guidance are the basis for the first three checks below. This is guidance, not a legal deadline or a certification checklist. Apply the controls relevant to your own service and incident type.

| Check | What the software checks | Basis and limit |
|---|---|---|
| Classification | Every imported record needs a local service, owner, severity and review dates | NIST roles and incident analysis; source labels are preserved, never treated as verification |
| Chronology | Classified incidents have at least one dated event with evidence and actor | NIST response documentation; presence does not establish truth or completeness |
| Review and follow-ups | Resolved incidents need cause, lessons, reviewer and evidence; open actions block closure | NIST improvement guidance; a team decides what evidence is adequate |
| Review deadline | Flags a missed operator-supplied review date | Internal policy only. The example uses seven days; NIST sets no seven-day legal limit |
| Retention review | Flags an operator-supplied retention review date in the past | Internal policy. A date prompts a purpose review; it never deletes a record |

`npm run incidents -- compliance --json` shows findings. No findings means only that these checks found no gaps. The base does not assess notification duties, personal-data breaches, sector rules, SOC 2, ISO certification or forensic evidence custody.

The CLI requires an actor for each change and stores an append-only audit record. Actor text is attribution, not login authentication. Database owners can change the database and its triggers. An independent audit sink, individual access control, backups, encryption and retention policy belong to deployment. Public database roles have no access by default; never expose an owner connection.
