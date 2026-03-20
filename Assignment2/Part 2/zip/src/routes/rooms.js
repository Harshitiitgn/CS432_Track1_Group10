import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getDB } from '../db/database.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const rooms = await db.all(`
      SELECT r.*, h.Name as HostelName, rt.TypeName, rt.BaseCapacity 
      FROM Room r
      JOIN Hostel h ON r.HostelID = h.HostelID
      JOIN RoomType rt ON r.RoomTypeID = rt.RoomTypeID
    `);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
