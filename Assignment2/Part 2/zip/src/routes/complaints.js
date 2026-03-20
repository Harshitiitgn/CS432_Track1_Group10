import express from 'express';
import { authenticateToken, requireOwnershipOrAdmin, requireAdmin } from '../middleware/auth.js';
import { getDB } from '../db/database.js';

const router = express.Router();

router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const categories = await db.all('SELECT * FROM ComplaintCategory ORDER BY CategoryName');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const complaints = await db.all(`
      SELECT c.*, m.Name as MemberName, r.RoomNumber, cat.CategoryName 
      FROM Complaint c
      JOIN Member m ON c.MemberID = m.MemberID
      LEFT JOIN Room r ON c.RoomID = r.RoomID
      JOIN ComplaintCategory cat ON c.CategoryID = cat.CategoryID
    `);
    res.json(complaints);
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

    const complaints = await db.all(`
      SELECT c.*, r.RoomNumber, cat.CategoryName 
      FROM Complaint c
      LEFT JOIN Room r ON c.RoomID = r.RoomID
      JOIN ComplaintCategory cat ON c.CategoryID = cat.CategoryID
      WHERE c.MemberID = ?
    `, [memberId]);
    
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { RoomID, CategoryID, Description, Severity } = req.body;
    const MemberID = req.user.role === 'Admin' ? req.body.MemberID : req.user.memberId;
    const result = await db.run(
      `INSERT INTO Complaint (MemberID, RoomID, CategoryID, Description, Severity) VALUES (?, ?, ?, ?, ?)`,
      [MemberID, RoomID || null, CategoryID, Description, Severity || 'Medium']
    );
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const { Status, AssignedTo, ResolutionRemarks } = req.body;
    await db.run(
      `UPDATE Complaint SET Status=?, AssignedTo=?, ResolutionRemarks=?, ResolvedDate=CASE WHEN ? IN ('Resolved','Closed') THEN CURRENT_TIMESTAMP ELSE NULL END WHERE ComplaintID=?`,
      [Status, AssignedTo || null, ResolutionRemarks || null, Status, req.params.id]
    );
    res.json({ message: 'Updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
