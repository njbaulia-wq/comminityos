import { CreateOrganizationInput, CreateOrganizationSchema } from '@/lib/validation/organization.schema';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export interface OrganizationRepository {
  findBySlug(slug: string): Promise<any | null>;
  create(data: any): Promise<any>;
  createMembership(data: {
    organizationId: string;
    userId: string;
    roleName: string;
  }): Promise<any>;
}

export interface CreateOrganizationParams {
  input: CreateOrganizationInput;
  creatorUserId: string;
  repo: OrganizationRepository;
  requestId?: string;
}

export async function createOrganization(params: CreateOrganizationParams): Promise<any> {
  const { input, creatorUserId, repo, requestId } = params;

  // 1. Validate boundary input
  const validation = CreateOrganizationSchema.safeParse(input);
  if (!validation.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path.join('.') || 'root';
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    throw new ValidationError('Input pembuatan organisasi tidak valid', fieldErrors);
  }

  const validData = validation.data;

  // 2. Check slug collision
  const existing = await repo.findBySlug(validData.slug);
  if (existing) {
    throw new ConflictError('Slug organisasi sudah digunakan. Silakan pilih slug lain.');
  }

  // 3. Create organization
  const organization = await repo.create({
    name: validData.name,
    slug: validData.slug,
    template: validData.template,
  });

  // 4. Assign creator as Owner
  await repo.createMembership({
    organizationId: organization.id,
    userId: creatorUserId,
    roleName: 'Owner',
  });

  // 5. Emit structured log
  logger.info({
    module: 'organization',
    action: 'organization.created',
    requestId,
    organizationId: organization.id,
    userId: creatorUserId,
    message: 'Organisasi baru berhasil dibuat dan owner diinisialisasi',
    context: {
      slug: validData.slug,
      template: validData.template,
    },
  });

  return organization;
}

export async function getOrganizationBySlug(
  slug: string,
  repo: OrganizationRepository
): Promise<any> {
  const org = await repo.findBySlug(slug);
  if (!org) {
    throw new NotFoundError(`Organisasi dengan slug "${slug}" tidak ditemukan`);
  }
  return org;
}
