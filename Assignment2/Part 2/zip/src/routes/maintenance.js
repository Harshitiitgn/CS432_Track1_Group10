import express from 'express';
import { authenticateToken, requireOwnershipOrAdmin, requireAdmin } from '../middleware/auth.js';
import { getDB } from '../db/database.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const requests = await db.all(`
      SELECT mr.*, m.Name as RequestedByName, r.RoomNumber 
      FROM MaintenanceRequest mr
      JOIN Member m ON mr.RequestedBy = m.MemberID
      JOIN Room r ON mr.RoomID = r.RoomID
    `);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/member/:id', authenticateToken, requireOwnershipOrAdmin, async (req, res) => {
  try {
    const db = getDB();
    const memberId = parseInt(req.params.id);
    
    if (req.user.role !== 'Admin' && req.user.memberId !== memberId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const requests = await db.all(`
      SELECT mr.*, r.RoomNumber 
      FROM MaintenanceRequest mr
      JOIN Room r ON mr.RoomID = r.RoomID
      WHERE mr.RequestedBy = ?
    `, [memberId]);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { RoomID, Description } = req.body;
    const RequestedBy = req.user.role === 'Admin' ? req.body.RequestedBy : req.user.memberId;
    const result = await db.run('INSERT INTO MaintenanceRequest (RoomID,RequestedBy,Description) VALUES(?,?,?)', [RoomID, RequestedBy, Description]);
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const { Status, AssignedTo, CompletedDate } = req.body;
    await db.run(
      `UPDATE MaintenanceRequest SET Status=?, AssignedTo=?, CompletedDate=CASE WHEN ?='Completed' THEN COALESCE(?,CURRENT_TIMESTAMP) ELSE NULL END WHERE RequestID=?`,
      [Status, AssignedTo || null, Status, CompletedDate || null, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
