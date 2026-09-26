import { requireBusinessAuth, type GraphQLAuthContext } from '../../../../libs/graphqlAuth';
import { CreatePageCommand } from '../../application/useCases/CreatePage';
import { UpdatePageCommand } from '../../application/useCases/UpdatePage';
import { PublishPageCommand } from '../../application/useCases/PublishPage';
import { createPageUseCase, updatePageUseCase, publishPageUseCase } from '../../application/useCases/wired';

export const contentResolvers = {
  Mutation: {
    createPage: async (_parent: unknown, args: { input: Record<string, unknown> }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = createPageUseCase;
      const i = args.input;
      const command = new CreatePageCommand(
        i.title as string,
        i.slug as string,
        i.contentTypeId as string,
        i.templateId as string | undefined,
        (i.status as 'draft' | 'published' | 'scheduled' | 'archived') || 'draft',
        (i.visibility as 'public' | 'private' | 'password_protected') || 'public',
        i.summary as string | undefined,
        i.featuredImage as string | undefined,
        i.parentId as string | undefined,
        i.metaTitle as string | undefined,
        i.metaDescription as string | undefined,
        i.metaKeywords as string | undefined,
        i.customFields as Record<string, unknown> | undefined,
        i.publishedAt as string | undefined,
        i.scheduledAt as string | undefined,
        i.isHomePage as boolean | undefined,
        i.createdBy as string | undefined,
      );
      const result = await useCase.execute(command);
      return {
        ...result,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      };
    },

    updatePage: async (_parent: unknown, args: { input: Record<string, unknown> }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = updatePageUseCase;
      const i = args.input;
      const command = new UpdatePageCommand(
        i.pageId as string,
        i.title as string | undefined,
        i.slug as string | undefined,
        i.templateId as string | undefined,
        i.status as 'draft' | 'published' | 'scheduled' | 'archived' | undefined,
        i.visibility as 'public' | 'private' | 'password_protected' | undefined,
        i.summary as string | undefined,
        i.featuredImage as string | undefined,
        i.metaTitle as string | undefined,
        i.metaDescription as string | undefined,
        i.metaKeywords as string | undefined,
        i.customFields as Record<string, unknown> | undefined,
        i.publishedAt as string | undefined,
        i.scheduledAt as string | undefined,
        i.isHomePage as boolean | undefined,
        i.updatedBy as string | undefined,
      );
      const result = await useCase.execute(command);
      return {
        ...result,
        updatedAt: result.updatedAt.toISOString(),
      };
    },

    publishPage: async (_parent: unknown, args: { pageId: string; publishedBy?: string }, context: GraphQLAuthContext) => {
      requireBusinessAuth(context);
      const useCase = publishPageUseCase;
      const command = new PublishPageCommand(args.pageId, args.publishedBy);
      const result = await useCase.execute(command);
      return {
        ...result,
        publishedAt: result.publishedAt?.toISOString() ?? null,
      };
    },
  },
};
