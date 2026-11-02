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
      const command = new CreatePageCommand({
        title: i.title as string,
        slug: i.slug as string,
        contentTypeId: i.contentTypeId as string,
        templateId: i.templateId as string | undefined,
        status: (i.status as 'draft' | 'published' | 'scheduled' | 'archived') || 'draft',
        visibility: (i.visibility as 'public' | 'private' | 'passwordProtected') || 'public',
        summary: i.summary as string | undefined,
        featuredImage: i.featuredImage as string | undefined,
        parentId: i.parentId as string | undefined,
        metaTitle: i.metaTitle as string | undefined,
        metaDescription: i.metaDescription as string | undefined,
        metaKeywords: i.metaKeywords as string | undefined,
        customFields: i.customFields as Record<string, unknown> | undefined,
        publishedAt: i.publishedAt as string | undefined,
        scheduledAt: i.scheduledAt as string | undefined,
        isHomePage: i.isHomePage as boolean | undefined,
        createdBy: i.createdBy as string | undefined,
      });
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
      const command = new UpdatePageCommand({
        pageId: i.pageId as string,
        title: i.title as string | undefined,
        slug: i.slug as string | undefined,
        templateId: i.templateId as string | undefined,
        status: i.status as 'draft' | 'published' | 'scheduled' | 'archived' | undefined,
        visibility: i.visibility as 'public' | 'private' | 'passwordProtected' | undefined,
        summary: i.summary as string | undefined,
        featuredImage: i.featuredImage as string | undefined,
        metaTitle: i.metaTitle as string | undefined,
        metaDescription: i.metaDescription as string | undefined,
        metaKeywords: i.metaKeywords as string | undefined,
        customFields: i.customFields as Record<string, unknown> | undefined,
        publishedAt: i.publishedAt as string | undefined,
        scheduledAt: i.scheduledAt as string | undefined,
        isHomePage: i.isHomePage as boolean | undefined,
        updatedBy: i.updatedBy as string | undefined,
      });
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
