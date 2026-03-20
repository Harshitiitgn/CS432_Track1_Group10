import express from 'express';
import { authenticateToken, requireOwnershipOrAdmin, requireAdmin } from '../middleware/auth.js';
import { getDB } from '../db/database.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const allocations = await db.all(`
      SELECT a.*, m.Name as MemberName, r.RoomNumber, h.Name as HostelName 
      FROM Allocation a
      JOIN Member m ON a.MemberID = m.MemberID
      JOIN Room r ON a.RoomID = r.RoomID
      JOIN Hostel h ON r.HostelID = h.HostelID
    `);
    res.json(allocations);
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

    const allocations = await db.all(`
      SELECT a.*, r.RoomNumber, h.Name as HostelName 
      FROM Allocation a
      JOIN Room r ON a.RoomID = r.RoomID
      JOIN Hostel h ON r.HostelID = h.HostelID
      WHERE a.MemberID = ?
    `, [memberId]);
    
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const { MemberID, RoomID, CheckInDate, AllocatedBy } = req.body;
    const result = await db.run(
      `INSERT INTO Allocation (MemberID, RoomID, CheckInDate, AllocatedBy, CreatedBy) VALUES (?, ?, ?, ?, ?)`,
      [MemberID, RoomID, CheckInDate, AllocatedBy || null, req.user.username]
    );
    await db.run('UPDATE Room SET CurrentOccupancy=CurrentOccupancy+1, RoomStatus="Occupied" WHERE RoomID=?', [RoomID]);
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const { CheckOutDate, AllocationStatus } = req.body;
    const alloc = await db.get('SELECT * FROM Allocation WHERE AllocationID=?', [req.params.id]);
    if (!alloc) return res.status(404).json({ error: 'Not found' });
    await db.run('UPDATE Allocation SET CheckOutDate=?, AllocationStatus=? WHERE AllocationID=?',
      [CheckOutDate || new Date().toISOString().split('T')[0], AllocationStatus || 'Completed', req.params.id]);
    await db.run('UPDATE Room SET CurrentOccupancy=MAX(0,CurrentOccupancy-1) WHERE RoomID=?', [alloc.RoomID]);
    await db.run(`UPDATE Room SET RoomStatus=CASE WHEN (SELECT CurrentOccupancy FROM Room WHERE RoomID=?) <= 0 THEN 'Available' ELSE 'Occupied' END WHERE RoomID=?`, [alloc.RoomID, alloc.RoomID]);
    res.json({ message: 'Checked out' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
