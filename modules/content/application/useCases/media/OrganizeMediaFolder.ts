/**
 * Organize Media Folder Use Case
 * Creates and manages media folders for organization
 */

import { ContentMediaRepo } from '../../../repos/contentMediaRepo';

export class CreateFolderCommand {
  constructor(
    public readonly name: string,
    public readonly parentId?: string,
    public readonly createdBy?: string
  ) {}
}

export class MoveFolderCommand {
  constructor(
    public readonly folderId: string,
    public readonly newParentId: string | null
  ) {}
}

export class MoveMediaToFolderCommand {
  constructor(
    public readonly mediaIds: string[],
    public readonly folderId: string | null
  ) {}
}

export interface FolderResponse {
  id: string;
  name: string;
  parentId?: string;
  path?: string;
  depth: number;
  createdAt: string;
}

export interface FolderTreeNode {
  id: string;
  name: string;
  path?: string;
  depth: number;
  children: FolderTreeNode[];
  mediaCount?: number;
}

export class OrganizeMediaFolderUseCase {
  constructor(private readonly mediaRepo: ContentMediaRepo) {}

  async createFolder(command: CreateFolderCommand): Promise<FolderResponse> {
    if (!command.name) {
      throw new Error('Folder name is required');
    }

    // Calculate depth and path
    let depth = 0;
    let path = command.name;

    if (command.parentId) {
      const parent = await this.mediaRepo.findFolderById(command.parentId);
      if (!parent) {
        throw new Error(`Parent folder with ID ${command.parentId} not found`);
      }
      depth = parent.depth + 1;
      path = parent.path ? `${parent.path}/${command.name}` : command.name;
    }

    const folder = await this.mediaRepo.createFolder({
      name: command.name,
      parentId: command.parentId ?? null,
      path,
      depth,
      sortOrder: 0,
      createdBy: command.createdBy ?? null,
      updatedBy: null
    });

    return {
      id: folder.contentMediaFolderId,
      name: folder.name,
      parentId: folder.parentId ?? undefined,
      path: folder.path ?? undefined,
      depth: folder.depth,
      createdAt: folder.createdAt instanceof Date ? folder.createdAt.toISOString() : String(folder.createdAt)
    };
  }

  async getFolderTree(): Promise<FolderTreeNode[]> {
    const allFolders = await this.mediaRepo.findAllFolders();
    return this.buildFolderTree(allFolders);
  }

  async moveFolder(command: MoveFolderCommand): Promise<FolderResponse> {
    const folder = await this.mediaRepo.findFolderById(command.folderId);
    if (!folder) {
      throw new Error(`Folder with ID ${command.folderId} not found`);
    }

    // Calculate new depth and path
    let depth = 0;
    let path = folder.name;

    if (command.newParentId) {
      const newParent = await this.mediaRepo.findFolderById(command.newParentId);
      if (!newParent) {
        throw new Error(`Parent folder with ID ${command.newParentId} not found`);
      }

      // Prevent circular reference
      if (command.newParentId === command.folderId) {
        throw new Error('Cannot move folder to itself');
      }

      depth = newParent.depth + 1;
      path = newParent.path ? `${newParent.path}/${folder.name}` : folder.name;
    }

    const updatedFolder = await this.mediaRepo.updateFolder(command.folderId, {
      parentId: command.newParentId ?? null,
      path,
      depth
    });

    return {
      id: updatedFolder.contentMediaFolderId,
      name: updatedFolder.name,
      parentId: updatedFolder.parentId ?? undefined,
      path: updatedFolder.path ?? undefined,
      depth: updatedFolder.depth,
      createdAt: updatedFolder.createdAt instanceof Date ? updatedFolder.createdAt.toISOString() : String(updatedFolder.createdAt)
    };
  }

  async moveMediaToFolder(command: MoveMediaToFolderCommand): Promise<{ movedCount: number }> {
    if (!command.mediaIds || command.mediaIds.length === 0) {
      throw new Error('At least one media ID is required');
    }

    // Verify folder exists if provided
    if (command.folderId) {
      const folder = await this.mediaRepo.findFolderById(command.folderId);
      if (!folder) {
        throw new Error(`Folder with ID ${command.folderId} not found`);
      }
    }

    let movedCount = 0;
    for (const mediaId of command.mediaIds) {
      try {
        await this.mediaRepo.updateMedia(mediaId, {
          contentMediaFolderId: command.folderId ?? null
        });
        movedCount++;
      } catch {
        // Skip media that doesn't exist
      }
    }

    return { movedCount };
  }

  async deleteFolder(folderId: string): Promise<boolean> {
    return this.mediaRepo.deleteFolder(folderId);
  }

  private buildFolderTree(folders: any[]): FolderTreeNode[] {
    const folderMap = new Map<string, FolderTreeNode>();
    const rootNodes: FolderTreeNode[] = [];

    // First pass: create all nodes
    for (const folder of folders) {
      const folderId = folder.contentMediaFolderId || folder.id;
      folderMap.set(folderId, {
        id: folderId,
        name: folder.name,
        path: folder.path ?? undefined,
        depth: folder.depth,
        children: []
      });
    }

    // Second pass: build hierarchy
    for (const folder of folders) {
      const folderId = folder.contentMediaFolderId || folder.id;
      const node = folderMap.get(folderId)!;
      
      if (folder.parentId && folderMap.has(folder.parentId)) {
        const parent = folderMap.get(folder.parentId)!;
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    return rootNodes;
  }
}
