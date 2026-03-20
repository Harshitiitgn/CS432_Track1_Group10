import express from 'express';
import { authenticateToken, requireOwnershipOrAdmin, requireAdmin } from '../middleware/auth.js';
import { getDB } from '../db/database.js';

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const visitors = await db.all(`
      SELECT v.*, m.Name as MemberName 
      FROM Visitor v
      JOIN Member m ON v.MemberID = m.MemberID
    `);
    res.json(visitors);
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

    const visitors = await db.all('SELECT * FROM Visitor WHERE MemberID = ?', [memberId]);
    res.json(visitors);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = getDB();
    const { VisitorName, VisitorContact, Relation, Purpose, InDateTime } = req.body;
    const MemberID = req.user.role === 'Admin' ? req.body.MemberID : req.user.memberId;
    const result = await db.run(
      `INSERT INTO Visitor (MemberID, VisitorName, VisitorContact, Relation, Purpose, InDateTime) VALUES (?, ?, ?, ?, ?, ?)`,
      [MemberID, VisitorName, VisitorContact, Relation, Purpose, InDateTime || new Date().toISOString()]
    );
    res.status(201).json({ id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const { OutDateTime } = req.body;
    await db.run('UPDATE Visitor SET OutDateTime=? WHERE VisitorID=?', [OutDateTime || new Date().toISOString(), req.params.id]);
    res.json({ message: 'Updated' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
