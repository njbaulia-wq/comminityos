import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOrganization,
  getOrganizationBySlug,
  OrganizationRepository,
} from '@/server/services/organization.service';
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

describe('Organization Onboarding Service', () => {
  let mockRepo: OrganizationRepository;

  beforeEach(() => {
    const orgs = new Map<string, any>();

    mockRepo = {
      findBySlug: vi.fn(async (slug: string) => orgs.get(slug) || null),
      create: vi.fn(async (data: any) => {
        const record = {
          id: 'org-' + Math.random().toString(36).substring(7),
          ...data,
          created_at: new Date().toISOString(),
        };
        orgs.set(data.slug, record);
        return record;
      }),
      createMembership: vi.fn(async (data: any) => ({
        id: 'member-1',
        ...data,
      })),
    };
  });

  it('should successfully create an organization and assign Owner role', async () => {
    const infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});

    const input = {
      name: 'RT 05 RW 02 Sukamaju',
      slug: 'rt05-rw02-sukamaju',
      template: 'rt' as const,
    };

    const org = await createOrganization({
      input,
      creatorUserId: 'user-owner-123',
      repo: mockRepo,
      requestId: 'req-create-org',
    });

    expect(org).toBeDefined();
    expect(org.name).toBe(input.name);
    expect(org.slug).toBe(input.slug);
    expect(mockRepo.createMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: org.id,
        roleName: 'Owner',
      })
    );

    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'organization',
        action: 'organization.created',
        requestId: 'req-create-org',
        context: expect.objectContaining({
          slug: 'rt05-rw02-sukamaju',
          template: 'rt',
        }),
      })
    );

    infoSpy.mockRestore();
  });

  it('should throw ConflictError if slug is already taken', async () => {
    const input = {
      name: 'RT 05 RW 02',
      slug: 'rt05-rw02',
      template: 'rt' as const,
    };

    await createOrganization({
      input,
      creatorUserId: 'user-1',
      repo: mockRepo,
    });

    // Attempt to create duplicate slug
    await expect(
      createOrganization({
        input: { ...input, name: 'Different Name' },
        creatorUserId: 'user-2',
        repo: mockRepo,
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should throw ValidationError if input schema validation fails', async () => {
    const invalidInput = {
      name: 'A', // too short
      slug: 'Invalid Slug!',
      template: 'unsupported' as any,
    };

    await expect(
      createOrganization({
        input: invalidInput,
        creatorUserId: 'user-1',
        repo: mockRepo,
      })
    ).rejects.toThrow(ValidationError);
  });

  it('should return organization on getOrganizationBySlug and throw NotFoundError when missing', async () => {
    await createOrganization({
      input: { name: 'Karang Taruna 01', slug: 'kt-01', template: 'karang_taruna' },
      creatorUserId: 'user-1',
      repo: mockRepo,
    });

    const found = await getOrganizationBySlug('kt-01', mockRepo);
    expect(found.slug).toBe('kt-01');

    await expect(getOrganizationBySlug('non-existent', mockRepo)).rejects.toThrow(
      NotFoundError
    );
  });
});
