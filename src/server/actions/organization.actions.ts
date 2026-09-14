'use server';

import { CreateOrganizationInput } from '@/lib/validation/organization.schema';
import { ActionResult, successResult, handleServiceError } from '@/lib/errors/result';
import {
  createOrganization,
  OrganizationRepository,
} from '@/server/services/organization.service';
import { createSupabaseOrganizationRepo } from '@/server/repositories/supabase-organization.repo';
import { resolveCallerContext } from './context-helper';

export interface ActionContext {
  userId?: string;
  requestId?: string;
  repo?: OrganizationRepository;
}

const fallbackRepo: OrganizationRepository = {
  findBySlug: async () => null,
  create: async (d) => ({ id: 'org-' + Date.now(), ...d }),
  createMembership: async (d) => ({ id: 'mem-' + Date.now(), ...d }),
};

function getRepo(explicit?: OrganizationRepository): OrganizationRepository {
  if (explicit) return explicit;
  try {
    return createSupabaseOrganizationRepo();
  } catch {
    return fallbackRepo;
  }
}

export async function createOrganizationAction(
  rawInput: CreateOrganizationInput,
  context?: ActionContext
): Promise<ActionResult<any>> {
  const requestId = context?.requestId || 'req-' + Math.random().toString(36).substring(7);
  const userId = context?.userId || 'usr-system';

  try {
    const caller = await resolveCallerContext('', context);
    const repo = getRepo(context?.repo);

    const org = await createOrganization({
      input: rawInput,
      creatorUserId: caller.userId,
      repo,
      requestId: caller.requestId,
    });

    return successResult(org);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'organization',
      action: 'action.create_organization',
      requestId,
      userId,
    });
  }
}
