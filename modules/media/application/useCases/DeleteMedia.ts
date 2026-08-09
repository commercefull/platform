/**
 * DeleteMedia Use Case
 */

export interface DeleteMediaInput {
  mediaId: string;
  deletedBy?: string;
  force?: boolean;
}

export interface DeleteMediaOutput {
  deleted: boolean;
  mediaId: string;
  deletedAt: string;
}

interface MediaRecord {
  mediaId: string;
}

interface MediaUsage {
  length: number;
}

interface DeleteMediaRepository {
  findById(mediaId: string): Promise<MediaRecord | null>;
  findUsages(mediaId: string): Promise<MediaUsage | null>;
  delete(mediaId: string, options: { deletedBy?: string }): Promise<void>;
}

export class DeleteMediaUseCase {
  constructor(private readonly mediaRepository: DeleteMediaRepository) {}

  async execute(input: DeleteMediaInput): Promise<DeleteMediaOutput> {
    const media = await this.mediaRepository.findById(input.mediaId);
    if (!media) {
      throw new Error(`Media not found: ${input.mediaId}`);
    }

    // Check for existing usages
    if (!input.force) {
      const usages = await this.mediaRepository.findUsages(input.mediaId);
      if (usages && usages.length > 0) {
        throw new Error(`Media is in use by ${usages.length} entities. Use force=true to delete anyway.`);
      }
    }

    await this.mediaRepository.delete(input.mediaId, {
      deletedBy: input.deletedBy,
    });

    return {
      deleted: true,
      mediaId: input.mediaId,
      deletedAt: new Date().toISOString(),
    };
  }
}
