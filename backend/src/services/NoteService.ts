import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface CreateNoteInput {
  content: string;
  contactId?: string;
  dealId?: string;
  ticketId?: string;
  authorId: string;
}

interface GetNotesFilters {
  page?: number;
  limit?: number;
  search?: string;
  contactId?: string;
  dealId?: string;
  ticketId?: string;
  authorId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class NoteService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Create a new note
   */
  async createNote(tenantId: string, data: CreateNoteInput) {
    try {
      // Validate contact if provided
      if (data.contactId) {
        const contact = await this.prisma.contact.findFirst({
          where: {
            id: data.contactId,
            tenantId,
          },
        });

        if (!contact) {
          throw new Error('Contact not found or does not belong to this tenant');
        }
      }

      // Validate deal if provided
      if (data.dealId) {
        const deal = await this.prisma.deal.findFirst({
          where: {
            id: data.dealId,
            tenantId,
          },
        });

        if (!deal) {
          throw new Error('Deal not found or does not belong to this tenant');
        }
      }

      // Validate ticket if provided
      if (data.ticketId) {
        const ticket = await this.prisma.ticket.findFirst({
          where: {
            id: data.ticketId,
            tenantId,
          },
        });

        if (!ticket) {
          throw new Error('Ticket not found or does not belong to this tenant');
        }
      }

      // Validate author exists in tenant
      const author = await this.prisma.user.findFirst({
        where: {
          id: data.authorId,
          tenantId,
        },
      });

      if (!author) {
        throw new Error('Author not found or does not belong to this tenant');
      }

      const note = await this.prisma.note.create({
        data: {
          tenantId,
          content: data.content,
          contactId: data.contactId,
          dealId: data.dealId,
          ticketId: data.ticketId,
          authorId: data.authorId,
        },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          deal: {
            select: {
              id: true,
              title: true,
              value: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
            },
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Note created: ${note.id} for tenant: ${tenantId}`);
      return note;
    } catch (error: any) {
      logger.error(`Error creating note for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get note by ID
   */
  async getNoteById(tenantId: string, noteId: string) {
    try {
      const note = await this.prisma.note.findFirst({
        where: {
          id: noteId,
          tenantId,
        },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          deal: {
            select: {
              id: true,
              title: true,
              value: true,
              stage: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
              status: true,
            },
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!note) {
        return null;
      }

      return note;
    } catch (error: any) {
      logger.error(`Error fetching note ${noteId} for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get all notes with filters and pagination
   */
  async getNotes(tenantId: string, filters: GetNotesFilters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        contactId,
        dealId,
        ticketId,
        authorId,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = filters;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        tenantId,
      };

      // Search in content
      if (search) {
        where.content = {
          contains: search,
          mode: 'insensitive',
        };
      }

      // Filter by contact
      if (contactId) {
        where.contactId = contactId;
      }

      // Filter by deal
      if (dealId) {
        where.dealId = dealId;
      }

      // Filter by ticket
      if (ticketId) {
        where.ticketId = ticketId;
      }

      // Filter by author
      if (authorId) {
        where.authorId = authorId;
      }

      // Get total count
      const total = await this.prisma.note.count({ where });

      // Get notes
      const notes = await this.prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          deal: {
            select: {
              id: true,
              title: true,
              value: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
            },
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return {
        notes,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      logger.error(`Error fetching notes for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Update note
   */
  async updateNote(
    tenantId: string,
    noteId: string,
    data: Partial<CreateNoteInput>
  ) {
    try {
      // Check if note exists in tenant
      const existingNote = await this.prisma.note.findFirst({
        where: {
          id: noteId,
          tenantId,
        },
      });

      if (!existingNote) {
        return null;
      }

      // Validate contact if provided
      if (data.contactId) {
        const contact = await this.prisma.contact.findFirst({
          where: {
            id: data.contactId,
            tenantId,
          },
        });

        if (!contact) {
          throw new Error('Contact not found or does not belong to this tenant');
        }
      }

      // Validate deal if provided
      if (data.dealId) {
        const deal = await this.prisma.deal.findFirst({
          where: {
            id: data.dealId,
            tenantId,
          },
        });

        if (!deal) {
          throw new Error('Deal not found or does not belong to this tenant');
        }
      }

      // Validate ticket if provided
      if (data.ticketId) {
        const ticket = await this.prisma.ticket.findFirst({
          where: {
            id: data.ticketId,
            tenantId,
          },
        });

        if (!ticket) {
          throw new Error('Ticket not found or does not belong to this tenant');
        }
      }

      const note = await this.prisma.note.update({
        where: { id: noteId },
        data: {
          content: data.content,
          contactId: data.contactId,
          dealId: data.dealId,
          ticketId: data.ticketId,
        },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          deal: {
            select: {
              id: true,
              title: true,
              value: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
            },
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Note updated: ${noteId} for tenant: ${tenantId}`);
      return note;
    } catch (error: any) {
      logger.error(`Error updating note ${noteId} for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Delete note
   */
  async deleteNote(tenantId: string, noteId: string) {
    try {
      // Check if note exists in tenant
      const note = await this.prisma.note.findFirst({
        where: {
          id: noteId,
          tenantId,
        },
      });

      if (!note) {
        return null;
      }

      await this.prisma.note.delete({
        where: { id: noteId },
      });

      logger.info(`Note deleted: ${noteId} for tenant: ${tenantId}`);
      return note;
    } catch (error: any) {
      logger.error(`Error deleting note ${noteId} for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Get note statistics
   */
  async getNoteStats(
    tenantId: string,
    filters: {
      authorId?: string;
      contactId?: string;
      dealId?: string;
      ticketId?: string;
    } = {}
  ) {
    try {
      const { authorId, contactId, dealId, ticketId } = filters;

      // Build base where clause
      const baseWhere: any = { tenantId };

      // Filter by author
      if (authorId) {
        baseWhere.authorId = authorId;
      }

      // Filter by contact
      if (contactId) {
        baseWhere.contactId = contactId;
      }

      // Filter by deal
      if (dealId) {
        baseWhere.dealId = dealId;
      }

      // Filter by ticket
      if (ticketId) {
        baseWhere.ticketId = ticketId;
      }

      // Get total notes
      const total = await this.prisma.note.count({
        where: baseWhere,
      });

      // Get notes by author (only if not filtering by author)
      let authorStats: any[] = [];
      if (!authorId) {
        const notesByAuthor = await this.prisma.note.groupBy({
          by: ['authorId'],
          where: baseWhere,
          _count: { authorId: true },
        });

        authorStats = await Promise.all(
          notesByAuthor.map(async (item: any) => {
            const user = await this.prisma.user.findUnique({
              where: { id: item.authorId },
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            });

            return {
              authorId: item.authorId,
              authorName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
              authorEmail: user?.email,
              count: item._count.authorId,
            };
          })
        );
      }

      // Count notes by entity type
      const notesWithContact = await this.prisma.note.count({
        where: {
          ...baseWhere,
          contactId: { not: null },
        },
      });

      const notesWithDeal = await this.prisma.note.count({
        where: {
          ...baseWhere,
          dealId: { not: null },
        },
      });

      const notesWithTicket = await this.prisma.note.count({
        where: {
          ...baseWhere,
          ticketId: { not: null },
        },
      });

      // Get recent notes
      const recentNotes = await this.prisma.note.findMany({
        where: baseWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          deal: {
            select: {
              id: true,
              title: true,
            },
          },
          ticket: {
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
            },
          },
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return {
        total,
        byAuthor: authorStats,
        byEntity: {
          contacts: notesWithContact,
          deals: notesWithDeal,
          tickets: notesWithTicket,
        },
        recent: recentNotes,
      };
    } catch (error: any) {
      logger.error(`Error fetching note stats for tenant ${tenantId}:`, error);
      throw error;
    }
  }
}

export default new NoteService();
