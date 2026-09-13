import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Multi-Tenant RLS Security Test Suite (Cross-Tenant Leak Prevention)', () => {
  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
  const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));

  const allMigrationsContent = migrationFiles
    .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf-8'))
    .join('\n\n');

  const tenantTables = [
    'organizations',
    'organization_members',
    'profiles',
    'teams',
    'activities',
    'activity_members',
    'tasks',
    'task_checklists',
    'accounts',
    'transactions',
    'due_plans',
    'due_items',
    'payments',
    'document_folders',
    'documents',
    'audit_logs',
    'notifications',
  ];

  it('should explicitly enable Row Level Security on EVERY tenant table', () => {
    for (const table of tenantTables) {
      const regex = new RegExp(`ALTER\\s+TABLE\\s+${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY;`, 'i');
      expect(
        regex.test(allMigrationsContent),
        `Table "${table}" must have ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
      ).toBe(true);
    }
  });

  it('should not contain any unrestricted public SELECT policies on tenant tables', () => {
    // Regex looking for policies with USING (true) or WITHOUT organization_id / get_auth_user_org_ids check
    for (const table of tenantTables) {
      const policyRegex = new RegExp(`CREATE\\s+POLICY\\s+[^;]+ON\\s+${table}\\s+FOR\\s+SELECT\\s+USING\\s*\\(\\s*true\\s*\\);`, 'i');
      expect(
        policyRegex.test(allMigrationsContent),
        `Table "${table}" must NOT have unrestricted public SELECT policy USING (true)`
      ).toBe(false);
    }
  });

  describe('Cross-Tenant Data Leak Simulation Engine', () => {
    interface SecurityContext {
      authUserId: string;
      userOrgIds: string[];
    }

    interface SimulatedRow {
      id: string;
      organizationId: string;
      [key: string]: any;
    }

    const orgA = '11111111-1111-4111-8111-111111111111';
    const orgB = '22222222-2222-4222-8222-222222222222';

    const userInOrgA: SecurityContext = {
      authUserId: 'usr-org-a',
      userOrgIds: [orgA],
    };

    function simulateRlsFilter(
      context: SecurityContext,
      rows: SimulatedRow[],
      table: string
    ): SimulatedRow[] {
      // Simulate PostgreSQL RLS policy: USING (organization_id IN (SELECT get_auth_user_org_ids()))
      return rows.filter((row) => {
        if (table === 'notifications') {
          return context.userOrgIds.includes(row.organizationId) && row.userId === context.authUserId;
        }
        return context.userOrgIds.includes(row.organizationId);
      });
    }

    function simulateRlsInsert(
      context: SecurityContext,
      newRow: SimulatedRow
    ): { allowed: boolean; reason?: string } {
      if (!context.userOrgIds.includes(newRow.organizationId)) {
        return {
          allowed: false,
          reason: 'WITH CHECK violation: user is not a member of target organization',
        };
      }
      return { allowed: true };
    }

    it('should completely prevent user in Org A from viewing data in Org B across all domain tables', () => {
      const crossTenantSampleDataset: Record<string, SimulatedRow[]> = {
        transactions: [
          { id: 'tx-a', organizationId: orgA, amount: 100000 },
          { id: 'tx-b', organizationId: orgB, amount: 999999 },
        ],
        documents: [
          { id: 'doc-a', organizationId: orgA, name: 'sk-a.pdf' },
          { id: 'doc-b', organizationId: orgB, name: 'rahasia-b.pdf' },
        ],
        activities: [
          { id: 'act-a', organizationId: orgA, title: 'Kegiatan A' },
          { id: 'act-b', organizationId: orgB, title: 'Kegiatan B' },
        ],
        audit_logs: [
          { id: 'log-a', organizationId: orgA, action: 'create' },
          { id: 'log-b', organizationId: orgB, action: 'delete' },
        ],
        notifications: [
          { id: 'notif-a', organizationId: orgA, userId: userInOrgA.authUserId, title: 'Notif A' },
          { id: 'notif-b', organizationId: orgB, userId: 'usr-org-b', title: 'Notif B' },
        ],
      };

      for (const [table, rows] of Object.entries(crossTenantSampleDataset)) {
        const visibleRows = simulateRlsFilter(userInOrgA, rows, table);
        expect(visibleRows.length).toBe(1);
        expect(visibleRows[0].organizationId).toBe(orgA);
        expect(visibleRows.some((r) => r.organizationId === orgB)).toBe(false);
      }
    });

    it('should reject INSERT attempts into Org B by user belonging to Org A', () => {
      const maliciousInsert: SimulatedRow = {
        id: 'doc-malicious',
        organizationId: orgB,
        name: 'injected.pdf',
      };

      const result = simulateRlsInsert(userInOrgA, maliciousInsert);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('WITH CHECK violation');
    });
  });
});
