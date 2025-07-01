import { Request, Response } from 'express';
import channelRepo from '../repos/channelRepo';
import { ChannelType } from '../domain/channelType';
import { ChannelStatus } from '../domain/channel';

/**
 * Get all channels with pagination and filtering
 */
export const getChannels = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "20",
      status,
      type,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const filters: {
      status?: ChannelStatus;
      type?: ChannelType;
    } = {};

    // Apply filters if provided
    if (status) {
      // Convert string status from query param to enum value
      const statusStr = String(status).toUpperCase();
      filters.status = statusStr === 'ACTIVE' ? ChannelStatus.ACTIVE : ChannelStatus.INACTIVE;
    }

    if (type) {
      filters.type = type as ChannelType;
    }

    const { channels, total } = await channelRepo.findAllChannels(filters, {
      limit: limitNum,
      offset: (pageNum - 1) * limitNum
    });

    res.json({
      success: true,
      data: channels,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error getting channels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get channels",
      error: (error as Error).message,
    });
  }
};

/**
 * Get active channels
 */
export const getActiveChannels = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const { channels, total } = await channelRepo.findActiveChannels({
      limit: limitNum,
      offset: (pageNum - 1) * limitNum
    });

    res.json({
      success: true,
      data: channels,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error getting active channels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get active channels",
      error: (error as Error).message,
    });
  }
};

/**
 * Get channel by ID
 */
export const getChannelById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const channel = await channelRepo.findById(id);

    if (!channel) {
      res.status(404).json({
        success: false,
        message: "Channel not found",
      });
      return;
    }

    res.json({
      success: true,
      data: channel,
    });
  } catch (error) {
    console.error("Error getting channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get channel",
      error: (error as Error).message,
    });
  }
};

/**
 * Get channel by code
 */
export const getChannelByCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    const channel = await channelRepo.findByCode(code);

    if (!channel) {
      res.status(404).json({
        success: false,
        message: "Channel not found",
      });
      return;
    }

    res.json({
      success: true,
      data: channel,
    });
  } catch (error) {
    console.error("Error getting channel by code:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get channel by code",
      error: (error as Error).message,
    });
  }
};

/**
 * Create a new channel
 */
export const createChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const channelData = req.body;

    // Validate required fields
    if (!channelData.name || !channelData.code || !channelData.type) {
      res.status(400).json({
        success: false,
        message: "Missing required fields: name, code, and type are required",
      });
      return;
    }

    // Check if code is unique
    const existingChannel = await channelRepo.findByCode(channelData.code);
    if (existingChannel) {
      res.status(400).json({
        success: false,
        message: "Channel code must be unique",
      });
      return;
    }

    // Default isActive to true if not provided
    if (channelData.isActive === undefined) {
      channelData.isActive = true;
    }

    const newChannel = await channelRepo.create(channelData);

    res.status(201).json({
      success: true,
      data: newChannel,
    });
  } catch (error) {
    console.error("Error creating channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create channel",
      error: (error as Error).message,
    });
  }
};

/**
 * Update a channel
 */
export const updateChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const channelData = req.body;

    // Check if channel exists
    const existingChannel = await channelRepo.findById(id);
    if (!existingChannel) {
      res.status(404).json({
        success: false,
        message: "Channel not found",
      });
      return;
    }

    // If code is being updated, ensure it's unique
    if (channelData.code && channelData.code !== existingChannel.code) {
      const channelWithCode = await channelRepo.findByCode(channelData.code);
      if (channelWithCode && channelWithCode.channelId !== id) {
        res.status(400).json({
          success: false,
          message: "Channel code must be unique",
        });
        return;
      }
    }

    const updatedChannel = await channelRepo.update(id, channelData);

    res.json({
      success: true,
      data: updatedChannel,
    });
  } catch (error) {
    console.error("Error updating channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update channel",
      error: (error as Error).message,
    });
  }
};

/**
 * Delete a channel
 */
export const deleteChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if channel exists
    const existingChannel = await channelRepo.findById(id);
    if (!existingChannel) {
      res.status(404).json({
        success: false,
        message: "Channel not found",
      });
      return;
    }

    await channelRepo.delete(id);

    res.json({
      success: true,
      message: "Channel deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete channel",
      error: (error as Error).message,
    });
  }
};

/**
 * Get products in a channel
 */
export const getChannelProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      page = "1",
      limit = "20",
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    // Check if channel exists
    const channel = await channelRepo.findById(id);
    if (!channel) {
      res.status(404).json({
        success: false,
        message: "Channel not found",
      });
      return;
    }

    const { products, total } = await channelRepo.findProductsByChannelId(id, {
      limit: limitNum,
      offset: (pageNum - 1) * limitNum
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error getting channel products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get channel products",
      error: (error as Error).message,
    });
  }
};

/**
 * Add a product to a channel
 */
export const addProductToChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const productData = req.body;

    // Check if channel exists
    const channel = await channelRepo.findById(id);
    if (!channel) {
      res.status(404).json({
        success: false,
        message: "Channel not found",
      });
      return;
    }

    // Validate required fields
    if (!productData.productId) {
      res.status(400).json({
        success: false,
        message: "Missing required field: productId is required",
      });
      return;
    }

    // Default isActive to true if not provided
    if (productData.isActive === undefined) {
      productData.isActive = true;
    }

    const newChannelProduct = await channelRepo.addProductToChannel({
      ...productData,
      channelId: id,
    });

    res.status(201).json({
      success: true,
      data: newChannelProduct,
    });
  } catch (error) {
    console.error("Error adding product to channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add product to channel",
      error: (error as Error).message,
    });
  }
};

/**
 * Remove a product from a channel
 */
export const removeProductFromChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, productId } = req.params;

    // Check if channel exists
    const channel = await channelRepo.findById(id);
    if (!channel) {
      res.status(404).json({
        success: false,
        message: "Channel not found",
      });
      return;
    }

    await channelRepo.removeProductFromChannel(id, productId);

    res.json({
      success: true,
      message: "Product removed from channel successfully",
    });
  } catch (error) {
    console.error("Error removing product from channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove product from channel",
      error: (error as Error).message,
    });
  }
};

/**
 * Get channels for a product
 */
export const getProductChannels = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const channels = await channelRepo.findChannelsByProductId(productId);

    res.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    console.error("Error getting product channels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get product channels",
      error: (error as Error).message,
    });
  }
};
