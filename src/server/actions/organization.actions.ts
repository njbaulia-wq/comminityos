import { CreateOrganizationInput } from '@/lib/validation/organization.schema';
import { ActionResult, successResult, handleServiceError } from '@/lib/errors/result';
import {
  createOrganization,
  OrganizationRepository,
} from '@/server/services/organization.service';

export interface ActionContext {
  userId: string;
  requestId?: string;
  repo?: OrganizationRepository;
}

export async function createOrganizationAction(
  rawInput: CreateOrganizationInput,
  context: ActionContext
): Promise<ActionResult<any>> {
  const requestId = context.requestId || 'req-' + Math.random().toString(36).substring(7);

  try {
    const org = await createOrganization({
      input: rawInput,
      creatorUserId: context.userId,
      repo: context.repo || {
        findBySlug: async () => null,
        create: async (d) => ({ id: 'org-' + Date.now(), ...d }),
        createMembership: async (d) => ({ id: 'mem-' + Date.now(), ...d }),
      },
      requestId,
    });

    return successResult(org);
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'organization',
      action: 'action.create_organization',
      requestId,
      userId: context.userId,
    });
  }
}
