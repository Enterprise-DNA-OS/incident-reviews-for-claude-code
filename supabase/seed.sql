insert into services(id,name,owner,criticality) values
('10000000-0000-0000-0000-000000000001','Order gateway','Mira','critical'),('10000000-0000-0000-0000-000000000002','Reporting','Theo','standard') on conflict do nothing;
insert into incidents(id,reference,name,service_id,owner,severity,state,summary,started_at,resolved_at,review_due,retention_review) values
('20000000-0000-0000-0000-000000000001','DEMO-101','Order queue stalled','10000000-0000-0000-0000-000000000001','Mira','sev1','resolved','Queue workers exhausted their connection pool.',now()-interval '10 days',now()-interval '10 days'+interval '80 minutes',current_date-3,current_date+180),
('20000000-0000-0000-0000-000000000002','DEMO-102','Order retries growing','10000000-0000-0000-0000-000000000001','Mira','sev2','open','Retries are increasing after a supplier timeout.',now()-interval '2 hours',null,current_date+7,current_date+180),
('20000000-0000-0000-0000-000000000003','DEMO-103','Daily report delayed','10000000-0000-0000-0000-000000000002','Theo','sev3','reviewed','Refresh started after the agreed cutoff.',now()-interval '20 days',now()-interval '20 days'+interval '35 minutes',current_date-13,current_date-1) on conflict do nothing;
insert into timeline(id,incident_id,happened_at,note,evidence,actor) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',now()-interval '10 days','Worker saturation observed','Demo trace A','Mira'),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000003',now()-interval '20 days','Refresh delay confirmed','Demo report log','Theo') on conflict do nothing;
insert into actions(id,incident_id,name,owner,due_on) values
('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Cap worker connections','Mira',current_date-2),
('40000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Exercise queue recovery','Theo',current_date+3),
('40000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000003','Set refresh cutoff alarm','Theo',current_date-5) on conflict do nothing;
insert into reviews(id,incident_id,reviewer,reviewed_at,cause,lessons,evidence) values
('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','Mira',now()-interval '18 days','A schedule change bypassed the cutoff check.','Check the cutoff after every schedule change.','Demo debrief record') on conflict do nothing;
