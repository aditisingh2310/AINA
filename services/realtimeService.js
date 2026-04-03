const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class RealtimeService {
  constructor(server) {
    this.io = null;
    this.connectedClients = new Map(); // userId -> socketId
    this.server = server;
  }

  initialize() {
    const { Server } = require('socket.io');
    this.io = new Server(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupSocketHandlers();
    console.log('Realtime service initialized');
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Authenticate user on connection
      socket.on('authenticate', (userId) => {
        if (userId) {
          this.connectedClients.set(userId, socket.id);
          socket.userId = userId;
          socket.join(`user_${userId}`);
          console.log(`User ${userId} authenticated on socket ${socket.id}`);
        }
      });

      // Join admin room for dashboard updates
      socket.on('join_admin', () => {
        socket.join('admin');
        console.log(`Socket ${socket.id} joined admin room`);
      });

      // Handle incident updates
      socket.on('incident_update', async (data) => {
        try {
          const incident = await prisma.incident.findUnique({
            where: { id: data.incidentId },
            include: {
              user: { select: { id: true, name: true } },
              aiInsights: true
            }
          });

          if (incident) {
            // Broadcast to admin dashboard
            this.io.to('admin').emit('new_incident', {
              id: incident.id,
              location: incident.location,
              category: incident.category,
              severity: incident.aiInsights?.[0]?.riskLevel || 'low',
              timestamp: incident.createdAt,
              user: incident.user
            });

            // Broadcast location updates for map
            this.io.emit('location_update', {
              id: incident.id,
              lat: incident.lat,
              lng: incident.lng,
              severity: incident.aiInsights?.[0]?.riskLevel || 'low',
              category: incident.category
            });
          }
        } catch (error) {
          console.error('Error handling incident update:', error);
        }
      });

      socket.on('disconnect', () => {
        if (socket.userId) {
          this.connectedClients.delete(socket.userId);
        }
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Broadcast new incident to all connected clients
  async broadcastNewIncident(incidentId) {
    try {
      const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
        include: {
          user: { select: { id: true, name: true } },
          aiInsights: true
        }
      });

      if (incident) {
        const incidentData = {
          id: incident.id,
          location: incident.location,
          category: incident.category,
          severity: incident.aiInsights?.[0]?.riskLevel || 'low',
          riskTags: incident.aiInsights?.[0]?.riskTags || [],
          lat: incident.lat,
          lng: incident.lng,
          timestamp: incident.createdAt,
          user: incident.user
        };

        // Send to admin dashboard
        this.io.to('admin').emit('new_incident', incidentData);

        // Send location update for live map
        this.io.emit('location_update', {
          id: incident.id,
          lat: incident.lat,
          lng: incident.lng,
          severity: incident.severity || incident.aiInsights?.[0]?.riskLevel || 'low',
          category: incident.category
        });

        // Send notification to user's emergency contacts if high severity
        if (incident.aiInsights?.[0]?.riskLevel === 'critical' || incident.aiInsights?.[0]?.riskLevel === 'high') {
          this.notifyEmergencyContacts(incident.userId, incidentData);
        }
      }
    } catch (error) {
      console.error('Error broadcasting incident:', error);
    }
  }

  // Notify emergency contacts via WebSocket
  async notifyEmergencyContacts(userId, incidentData) {
    try {
      const contacts = await prisma.contact.findMany({
        where: { userId, isEmergency: true }
      });

      const notification = {
        type: 'emergency_alert',
        incident: incidentData,
        message: 'Emergency incident reported - please check on contact'
      };

      contacts.forEach(contact => {
        // In a real app, this would send SMS/email, but for demo we use WebSocket
        if (this.connectedClients.has(contact.id.toString())) {
          const socketId = this.connectedClients.get(contact.id.toString());
          this.io.to(socketId).emit('emergency_notification', notification);
        }
      });
    } catch (error) {
      console.error('Error notifying emergency contacts:', error);
    }
  }

  // Send real-time stats to admin dashboard
  async broadcastStatsUpdate() {
    try {
      const stats = await this.getRealtimeStats();
      this.io.to('admin').emit('stats_update', stats);
    } catch (error) {
      console.error('Error broadcasting stats:', error);
    }
  }

  async getRealtimeStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalIncidents, todayIncidents, weekIncidents, severityStats] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { createdAt: { gte: today } } }),
      prisma.incident.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.incident.groupBy({
        by: ['category'],
        _count: { id: true },
        where: { createdAt: { gte: weekAgo } }
      })
    ]);

    return {
      totalIncidents,
      todayIncidents,
      weekIncidents,
      categoryBreakdown: severityStats,
      timestamp: now
    };
  }

  // Get connected clients count
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }

  // Legacy methods for backward compatibility
  emitEvent(event, payload) {
    if (this.io) {
      this.io.emit(event, payload);
    }
  }

  getIO() {
    return this.io;
  }
}

let realtimeServiceInstance = null;

function initializeRealtimeService(server) {
  if (!realtimeServiceInstance) {
    realtimeServiceInstance = new RealtimeService(server);
    realtimeServiceInstance.initialize();
  }
  return realtimeServiceInstance;
}

function getRealtimeService() {
  return realtimeServiceInstance;
}

module.exports = {
  RealtimeService,
  initializeRealtimeService,
  getRealtimeService,
  // Legacy exports
  setIO: () => {}, // No-op for backward compatibility
  getIO: () => realtimeServiceInstance?.getIO(),
  emitEvent: (event, payload) => realtimeServiceInstance?.emitEvent(event, payload)
};
