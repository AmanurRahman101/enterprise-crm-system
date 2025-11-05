import { Request, Response } from 'express';
import NoteService from '../services/NoteService';
import logger from '../utils/logger';

/**
 * Create a new note
 */
export const createNote = async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    const user = req.user;

    if (!tenant || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { content, contactId, dealId, ticketId, authorId } = req.body;

    // Validate required fields
    if (!content) {
      return res.status(400).json({
        error: 'Missing required field: content',
      });
    }

    // At least one entity should be specified (contact, deal, or ticket)
    if (!contactId && !dealId && !ticketId) {
      return res.status(400).json({
        error: 'Note must be linked to at least one entity (contact, deal, or ticket)',
      });
    }

    const note = await NoteService.createNote(tenant.id, {
      content,
      contactId,
      dealId,
      ticketId,
      authorId: authorId || user.userId,
    });

    res.status(201).json(note);
  } catch (error: any) {
    logger.error('Error in createNote controller:', error);
    res.status(500).json({ error: error.message || 'Failed to create note' });
  }
};

/**
 * Get note by ID
 */
export const getNote = async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;

    if (!tenant) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const note = await NoteService.getNoteById(tenant.id, id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error: any) {
    logger.error('Error in getNote controller:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch note' });
  }
};

/**
 * Get all notes with filters
 */
export const getNotes = async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    const user = req.user;

    if (!tenant || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      page,
      limit,
      search,
      contactId,
      dealId,
      ticketId,
      authorId,
      sortBy,
      sortOrder,
    } = req.query;

    // Handle "me" or "current" for authorId filter
    let authorIdFilter = authorId as string | undefined;
    if (authorIdFilter === 'me' || authorIdFilter === 'current') {
      authorIdFilter = user.userId;
    }

    const result = await NoteService.getNotes(tenant.id, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
      contactId: contactId as string,
      dealId: dealId as string,
      ticketId: ticketId as string,
      authorId: authorIdFilter,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.json(result);
  } catch (error: any) {
    logger.error('Error in getNotes controller:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notes' });
  }
};

/**
 * Update note
 */
export const updateNote = async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;

    if (!tenant) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { content, contactId, dealId, ticketId } = req.body;

    const note = await NoteService.updateNote(tenant.id, id, {
      content,
      contactId,
      dealId,
      ticketId,
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error: any) {
    logger.error('Error in updateNote controller:', error);
    res.status(500).json({ error: error.message || 'Failed to update note' });
  }
};

/**
 * Delete note
 */
export const deleteNote = async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;

    if (!tenant) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const note = await NoteService.deleteNote(tenant.id, id);

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully', note });
  } catch (error: any) {
    logger.error('Error in deleteNote controller:', error);
    res.status(500).json({ error: error.message || 'Failed to delete note' });
  }
};

/**
 * Get note statistics
 */
export const getNoteStats = async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant;
    const user = req.user;

    if (!tenant || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { authorId, contactId, dealId, ticketId } = req.query;

    // Handle "me" or "current" for authorId filter
    let authorIdFilter = authorId as string | undefined;
    if (authorIdFilter === 'me' || authorIdFilter === 'current') {
      authorIdFilter = user.userId;
    }

    const stats = await NoteService.getNoteStats(tenant.id, {
      authorId: authorIdFilter,
      contactId: contactId as string,
      dealId: dealId as string,
      ticketId: ticketId as string,
    });

    res.json(stats);
  } catch (error: any) {
    logger.error('Error in getNoteStats controller:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch note stats' });
  }
};
