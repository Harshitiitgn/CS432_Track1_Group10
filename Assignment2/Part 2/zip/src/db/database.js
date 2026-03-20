import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

let db;

export async function initDB() {
  db = await open({ filename: './hostel.db', driver: sqlite3.Database });
  await db.exec('PRAGMA foreign_keys = ON');

  // Load and sanitize user's hostel.sql file dynamically
  const sqlPath = path.join(process.cwd(), 'hostel.sql');
  let rawSql = fs.readFileSync(sqlPath, 'utf8');

  const splitToken = '-- MOCK DATA SEEDING';
  let schemaPart = rawSql;
  let seedPart = '';

  if (rawSql.includes(splitToken)) {
    const parts = rawSql.split(splitToken);
    schemaPart = parts[0];
    seedPart = parts[1];
  }

  const transpile = (s) => {
    let t = s;
    t = t.replace(/--.*$/gm, '');
    t = t.replace(/\/\*[\s\S]*?\*\//g, '');
    t = t.replace(/CREATE DATABASE[^;]+;/gi, '');
    t = t.replace(/DROP DATABASE[^;]+;/gi, '');
    t = t.replace(/USE[^;]+;/gi, '');
    t = t.replace(/AUTO_INCREMENT/gi, ''); 
    t = t.replace(/ENUM\([\s\S]*?\)/gi, 'TEXT'); 
    t = t.replace(/ON UPDATE CURRENT_TIMESTAMP/gi, '');
    t = t.replace(/INT\s+PRIMARY KEY/gi, 'INTEGER PRIMARY KEY'); 
    t = t.replace(/CREATE\s+TABLE\s+(if\s+not\s+exists\s+)?/gi, 'CREATE TABLE IF NOT EXISTS ');
    t = t.replace(/INSERT\s+INTO/gi, 'INSERT OR IGNORE INTO'); 
    return t;
  };

  await db.exec(transpile(schemaPart));

  if (seedPart) {
    const check = await db.get("SELECT COUNT(*) as c FROM Hostel");
    if (check && check.c === 0) {
      await db.exec(transpile(seedPart));
    }
  }

  // We explicitly preserve the Fee/User tables added for the Dashboard UI
  const APP_SCHEMA = `
    CREATE TABLE IF NOT EXISTS FeeCategory (
      FeeCategoryID INTEGER PRIMARY KEY AUTOINCREMENT,
      CategoryName TEXT NOT NULL UNIQUE,
      DefaultAmount REAL NOT NULL,
      Description TEXT
    );
    CREATE TABLE IF NOT EXISTS FeePayment (
      PaymentID INTEGER PRIMARY KEY AUTOINCREMENT,
      MemberID INTEGER NOT NULL,
      FeeCategoryID INTEGER NOT NULL,
      AmountPaid REAL NOT NULL,
      PaymentDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      Status TEXT NOT NULL DEFAULT 'Paid',
      FOREIGN KEY (MemberID) REFERENCES Member(MemberID),
      FOREIGN KEY (FeeCategoryID) REFERENCES FeeCategory(FeeCategoryID)
    );
    CREATE TABLE IF NOT EXISTS Users (
      UserID INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT NOT NULL UNIQUE,
      PasswordHash TEXT NOT NULL,
      Role TEXT NOT NULL DEFAULT 'Regular',
      MemberID INTEGER,
      CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await db.exec(APP_SCHEMA);

  // Seed Admin & Regular User if not exists
  const adminExists = await db.get('SELECT * FROM Users WHERE Username = ?', ['admin']);
  if (!adminExists) {
    const hash = await bcrypt.hash('admin123', 10);
    await db.run('INSERT INTO Users (Username, PasswordHash, Role) VALUES (?, ?, ?)', ['admin', hash, 'Admin']);
  }

  // Provision login accounts for ALL members seeded from hostel.sql
  const members = await db.all('SELECT * FROM Member');
  for (const member of members) {
    const userExists = await db.get('SELECT * FROM Users WHERE MemberID = ?', [member.MemberID]);
    if (!userExists && member.IdentificationNumber) {
      // Default username = IdentificationNumber, password = ContactNumber
      const hash = await bcrypt.hash(member.ContactNumber || 'password123', 10); 
      await db.run('INSERT OR IGNORE INTO Users (Username, PasswordHash, Role, MemberID) VALUES (?, ?, ?, ?)', [member.IdentificationNumber, hash, 'Regular', member.MemberID]);
    }
  }

  // Seed some fee data for Member 1 if empty
  const feeCount = await db.get('SELECT COUNT(*) as c FROM FeeCategory');
  if (feeCount.c === 0) {
    for (const [name, amt, desc] of [
      ['Hostel Fee',      15000, 'Monthly accommodation fee'],
      ['Mess Fee',         5000, 'Monthly mess/food charges'],
      ['Electricity Fee',  1500, 'Monthly electricity charges'],
      ['Maintenance Fee',   500, 'Monthly maintenance charges'],
      ['Security Deposit',10000, 'One-time refundable deposit']
    ]) await db.run('INSERT INTO FeeCategory (CategoryName,DefaultAmount,Description) VALUES(?,?,?)', [name,amt,desc]);
    await db.run('INSERT INTO FeePayment (MemberID,FeeCategoryID,AmountPaid,Status) VALUES(1,1,15000,"Paid")');
  }

  console.log('Database cleanly transpiled and initialized from hostel.sql!');
}

export function getDB() {
  if (!db) throw new Error('Database not initialized');
  return db;
}
