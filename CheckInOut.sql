-- =============================================================================
-- Database Name: checkinout_hostel_db
-- =============================================================================

-- Drop and recreate the database (use only when you want to start fresh)
DROP DATABASE IF EXISTS checkinout_hostel_db;

CREATE DATABASE IF NOT EXISTS checkinout_hostel_db;
USE checkinout_hostel_db;

/* TABLE DESIGN JUSTIFICATION
===============================================================================
| #  | Table Name          | Type             | Why We Need It (Justification)                                    |
|----|---------------------|------------------|-------------------------------------------------------------------|
| 1  | Member              | Core Entity      | Stores students/residents data.                                   |
| 2  | Hostel              | Core Entity      | Supports multiple hostels/blocks (scalable design).               |
| 3  | Room                | Core Entity      | Central to the whole system; links members, furniture, allocation |
| 4  | RoomType            | Lookup           | Single, Double, Triple, AC/Non-AC, etc. (normalization support)   |
| 5  | Allocation          | Core (Bridge)    | Check-in / Check-out records; heart of the project                |
| 6  | FurnitureType       | Lookup           | Bed, Chair, Cupboard, Table, Mattress, etc.                       |
| 7  | FurnitureItem       | Core Entity      | Tracks actual furniture pieces with condition & serial number     |
| 8  | Complaint           | Core Entity      | Student complaints with status tracking                           |
| 9  | ComplaintCategory   | Lookup           | Electrical, Plumbing, Cleanliness, WiFi, Furniture Damage, etc.   |
| 10 | Visitor             | Core Entity      | Visitor registration with in/out timing                           |
| 11 | QRScanLog           | Log Table        | Records every QR scan (security & tracking feature)               |
| 12 | MaintenanceRequest  | Core Entity      | Separate maintenance workflow (distinct from complaints)          |
===============================================================================
*/

-- =============================================================================
-- TABLE: Member (registration & management)
-- =============================================================================
CREATE TABLE if not exists Member (
    MemberID        INT             AUTO_INCREMENT          PRIMARY KEY,

    -- Mandatory fields from assignment
    Name            VARCHAR(100)    NOT NULL,
    Image           VARCHAR(255),                           -- can be NULL
    Age             INT             NOT NULL,
    Email           VARCHAR(150)    NOT NULL    UNIQUE,
    ContactNumber   VARCHAR(20)     NOT NULL,
    IdentificationNumber  VARCHAR(50)     NOT NULL    UNIQUE,   -- roll no, employee ID, Aadhaar, passport, etc.
	AllocatedDate   DATE            NOT NULL,               -- date when person was allocated/registered/admitted
    PurposeOfStay   ENUM(
        'Resident Student',
        'Staff',
        'Visitor',
        'Guest',
        'Short-term',
        'Researcher',
        'Exchange Student',
        'Intern',
        'Maintenance/Contractor',
        'Other'
    )               NOT NULL,
    
    -- Additional fields (some optional)
    Department      VARCHAR(100),
    YearOfStudy     TINYINT,
    Gender          ENUM('Male', 'Female', 'Other', 'Prefer not to say') NOT NULL,
    DateOfBirth     DATE            NOT NULL,
    PermanentAddress TEXT,
    GuardianName    VARCHAR(100),
    GuardianContact VARCHAR(20),
    
    -- QR feature
    QRCode          VARCHAR(100)    NOT NULL    UNIQUE,

    -- Status & audit
    IsActive        BOOLEAN         NOT NULL    DEFAULT TRUE,
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_member_age_positive          CHECK (Age > 0),
    CONSTRAINT chk_year_of_study_range          CHECK (YearOfStudy IS NULL OR YearOfStudy BETWEEN 1 AND 10)
    -- CONSTRAINT chk_allocated_date_valid         CHECK (AllocatedDate <= CURRENT_DATE),
    -- CONSTRAINT chk_dob_before_allocated         CHECK (DateOfBirth < AllocatedDate)
);

-- =============================================================================
-- TABLE: Hostel
-- =============================================================================
CREATE TABLE Hostel (
    HostelID        INT             AUTO_INCREMENT          PRIMARY KEY,
    Name            VARCHAR(100)    NOT NULL,               -- e.g. 'Aryabhatta Hostel', 'Narmada Hostel', 'Ramanujan Hostel'
    ShortCode       VARCHAR(10)     NOT NULL    UNIQUE,     -- e.g. 'ABH', 'NRM', 'RJM'
    WardenName      VARCHAR(100)    NOT NULL,
    WardenContact   VARCHAR(20),
    Address         VARCHAR(255)    NOT NULL,
    
    /*
     * Number of rooms per type (assuming typical hostel occupancy up to 4 persons)
     * These columns are stored for simplicity, fast reporting, and clarity in the current design.
     * 
     * Alternative (more normalized) approach (possible in future refactoring):
     * - Create a RoomType table (Single=1, Double=2, Triple=3, Quad=4)
     * - Each Room references a RoomTypeID
     * - Then the counts can be calculated with a query
     *
     * This would eliminate the need for these four columns and avoid any potential inconsistency.
     * For now we keep them for readability and quick overview.
     */
     
    NumSingleRooms  INT             NOT NULL    DEFAULT 0,  -- 1-person rooms
    NumDoubleRooms  INT             NOT NULL    DEFAULT 0,  -- 2-person rooms
    NumTripleRooms  INT             NOT NULL    DEFAULT 0,  -- 3-person rooms
    NumQuadRooms    INT             NOT NULL    DEFAULT 0,  -- 4-person rooms
    
    -- Hostel-level status (same states as individual rooms)
    HostelStatus    ENUM(
        'Available',                -- Fully operational
        'Occupied',                 -- All or most rooms occupied (informational)
        'Under Maintenance',        -- Temporary closure / major work
        'Reserved',                 -- Booked for special purpose (e.g. event, inspection)
        'Out of Service'            -- Long-term closed (e.g. renovation, decommissioning)
    )                   NOT NULL        DEFAULT 'Available',
    
    -- Summary fields
    TotalRooms      INT             NOT NULL    DEFAULT 0,
    TotalCapacity   INT             NOT NULL    DEFAULT 0,
    
    -- Status & audit
    IsActive        BOOLEAN         NOT NULL    DEFAULT TRUE,
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_hostel_room_counts_non_negative CHECK (
        NumSingleRooms >= 0 AND
        NumDoubleRooms >= 0 AND
        NumTripleRooms >= 0 AND
        NumQuadRooms   >= 0
    ),
    CONSTRAINT chk_hostel_totals_positive CHECK (
        TotalRooms    >= 0 AND
        TotalCapacity >= 0
    ),
    CONSTRAINT chk_total_rooms_consistent CHECK (
        TotalRooms = NumSingleRooms + NumDoubleRooms + NumTripleRooms + NumQuadRooms
    ),
    CONSTRAINT chk_total_capacity_consistent CHECK (
        TotalCapacity = (NumSingleRooms * 1) +
                        (NumDoubleRooms * 2) +
                        (NumTripleRooms * 3) +
                        (NumQuadRooms * 4)
    )
);

-- =============================================================================
-- TABLE: RoomType
-- =============================================================================
CREATE TABLE RoomType (
    RoomTypeID      INT             AUTO_INCREMENT          PRIMARY KEY,
    TypeName        ENUM(
        'Single',           -- 1 bed
        'Double',           -- 2 beds
        'Triple',           -- 3 beds
        'Quad',             -- 4 beds
        'Others'            -- optional
    )                   NOT NULL,

    BaseCapacity    TINYINT         NOT NULL,

    IsAC            BOOLEAN         NOT NULL    DEFAULT FALSE,

    -- optional short note
    Description     VARCHAR(200)                DEFAULT NULL,

    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ON UPDATE CURRENT_TIMESTAMP,

    -- very strong consistency constraint
    CONSTRAINT chk_roomtype_capacity_matches_name
        CHECK (
            (TypeName = 'Single'  AND BaseCapacity = 1) OR
            (TypeName = 'Double'  AND BaseCapacity = 2) OR
            (TypeName = 'Triple'  AND BaseCapacity = 3) OR
            (TypeName = 'Quad'    AND BaseCapacity = 4) OR
            (TypeName = 'Others'  AND BaseCapacity BETWEEN 1 AND 4)
        ),

    -- optional but nice: prevent duplicate semantic types
    CONSTRAINT uq_roomtype_name_capacity UNIQUE (TypeName, BaseCapacity)
);

-- =============================================================================
-- TABLE: Room
-- =============================================================================
CREATE TABLE Room (
    RoomID          INT             AUTO_INCREMENT          PRIMARY KEY,
    HostelID        INT             NOT NULL,
    RoomTypeID      INT             NOT NULL,               -- links to RoomType
    RoomNumber      VARCHAR(20)     NOT NULL,               -- e.g. '101', 'G-05', 'A-201'
    Floor           TINYINT         NOT NULL,

    -- Maximum number of people this specific room can hold
    -- In most cases this should match RoomType.BaseCapacity
    MaxCapacity     TINYINT         NOT NULL,
    -- Current number of residents (must never exceed MaxCapacity)
    CurrentOccupancy TINYINT        NOT NULL    DEFAULT 0,

    -- QR code for quick access to room details
    QRCode          VARCHAR(100)    NOT NULL    UNIQUE,

    -- Room status
    RoomStatus      ENUM(
        'Available',                -- Ready for new allocation
        'Occupied',                 -- Has one or more residents
        'Under Maintenance',        -- Temporarily unavailable (repair, cleaning, etc.)
        'Reserved',                 -- Booked but not yet occupied
        'Out of Service'            -- Long-term unavailable (e.g. major renovation)
    )               NOT NULL        DEFAULT 'Available',

	-- Active flag (soft delete / archive support) and Audit fields
    IsActive        BOOLEAN         NOT NULL    DEFAULT TRUE,
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ON UPDATE CURRENT_TIMESTAMP,

    -- Relationships
    FOREIGN KEY (HostelID)   REFERENCES Hostel(HostelID)     ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (RoomTypeID) REFERENCES RoomType(RoomTypeID) ON DELETE RESTRICT ON UPDATE CASCADE,

    -- Constraints
    CONSTRAINT chk_room_max_capacity
        CHECK (MaxCapacity BETWEEN 1 AND 4),

    CONSTRAINT chk_room_occupancy_valid
        CHECK (CurrentOccupancy >= 0 AND CurrentOccupancy <= MaxCapacity),

    CONSTRAINT chk_room_number_unique_per_hostel
        UNIQUE (HostelID, RoomNumber)
);

-- =============================================================================
-- TABLE: Allocation (Room allocation & check-in/out (Allocation))
-- =============================================================================
-- Qucik info:
-- 		which member is allocated to which room
-- 		when they checked in
-- 		when they checked out (NULL if still staying)
-- 		status/history
CREATE TABLE Allocation (
    AllocationID    INT             AUTO_INCREMENT          PRIMARY KEY,
    MemberID        INT             NOT NULL,
    RoomID          INT             NOT NULL,

    -- Core check-in / check-out dates
    CheckInDate     DATE            NOT NULL,               -- date of allocation / check-in
    CheckOutDate    DATE            DEFAULT NULL,           -- NULL = still staying

    -- Optional: exact time
    CheckInTime     TIME            DEFAULT NULL,
    CheckOutTime    TIME            DEFAULT NULL,

    -- Who approved / performed the allocation
    AllocatedBy     VARCHAR(100)    DEFAULT NULL,           -- warden name or staff ID

    -- Current status of this allocation record
    AllocationStatus ENUM(
        'Active',               -- currently staying
        'Completed',            -- checked out normally
        'Cancelled',            -- allocation was cancelled before check-in
        'Early Checkout',       -- left before planned date
        'Overstayed'            -- stayed beyond expected date (can be set by trigger)
    )                   NOT NULL        DEFAULT 'Active',

    -- Remarks
    Remarks         TEXT            DEFAULT NULL,

    -- Audit fields
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ON UPDATE CURRENT_TIMESTAMP,
    CreatedBy       VARCHAR(100)    DEFAULT NULL,

    -- Relationships
    FOREIGN KEY (MemberID) REFERENCES Member(MemberID) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (RoomID) REFERENCES Room(RoomID) 
        ON DELETE RESTRICT ON UPDATE CASCADE,

    -- Important constraints
    CONSTRAINT chk_checkout_after_checkin
        CHECK (CheckOutDate IS NULL OR CheckOutDate >= CheckInDate),

    -- Prevent multiple active allocations for same member at same time
    -- Note: this is partial unique - better enforced via trigger or app
    CONSTRAINT uk_member_active_allocation UNIQUE (MemberID, AllocationStatus)
);

-- =============================================================================
-- TABLE: FurnitureType & FurnitureItem (Furniture inventory & assignment)
-- =============================================================================
-- Why this structure?
-- 		FurnitureType — prevents duplication of type names, easy to add new types
-- 		FurnitureItem — tracks individual items (important for inventory, damage reporting, replacement)
CREATE TABLE FurnitureType (
    FurnitureTypeID INT             AUTO_INCREMENT          PRIMARY KEY,
    TypeName        VARCHAR(50)     NOT NULL    UNIQUE,     -- 'Bed', 'Chair', 'Cupboard', 'Study Table', 'Mattress', 'Fan', 'Tube Light', etc.
    Description     VARCHAR(200)    DEFAULT NULL,           -- e.g. 'Single bed with mattress', 'Wooden cupboard with 2 shelves'

    -- Audit fields
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ON UPDATE CURRENT_TIMESTAMP,

    -- At least 3 NOT NULL columns
    CONSTRAINT chk_furniture_type_name_not_empty CHECK (TRIM(TypeName) <> '')
);
CREATE TABLE FurnitureItem (
    FurnitureItemID INT AUTO_INCREMENT PRIMARY KEY,
    
    FurnitureTypeID INT NOT NULL,               -- links to FurnitureType
    RoomID          INT NOT NULL,               -- which room this item is in
    
    SerialNumber    VARCHAR(50)     DEFAULT NULL,           -- optional unique identifier
    
    -- Renamed column: no more conflict
    FurnitureCondition ENUM(
        'New',
        'Good',
        'Fair',
        'Damaged',
        'Needs Repair',
        'Out of Service'
    )               NOT NULL        DEFAULT 'Good',
    
    -- Optional: date when last inspected / checked
    LastCheckedDate DATE            DEFAULT NULL,
    
    Remarks         TEXT            DEFAULT NULL,           -- e.g. 'Broken leg on chair', 'New mattress 2025'
    
    -- Audit fields
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ON UPDATE CURRENT_TIMESTAMP,
    
    -- Relationships
    FOREIGN KEY (FurnitureTypeID) REFERENCES FurnitureType(FurnitureTypeID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    FOREIGN KEY (RoomID) REFERENCES Room(RoomID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_furniture_condition_valid 
        CHECK (FurnitureCondition IS NOT NULL)
);

-- =============================================================================
-- TABLE: ComplaintCategory and Complaint (Complaint handling)
-- =============================================================================
CREATE TABLE ComplaintCategory (
    CategoryID      INT             AUTO_INCREMENT          PRIMARY KEY,
    
    CategoryName    VARCHAR(100)    NOT NULL    UNIQUE,     -- 'Electrical', 'Plumbing', 'Cleanliness', 'Furniture Damage', 'WiFi/Internet', 'Security', 'Food/Mess', 'Others'
    
    Description     VARCHAR(255)    DEFAULT NULL,
    
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_category_name_not_empty CHECK (TRIM(CategoryName) <> '')
);
CREATE TABLE Complaint (
    ComplaintID     INT             AUTO_INCREMENT          PRIMARY KEY,
    
    MemberID        INT             NOT NULL,               -- who raised the complaint
    RoomID          INT             DEFAULT NULL,           -- which room (can be NULL if hostel-wide)
    
    CategoryID      INT             NOT NULL,
    
    Description     TEXT            NOT NULL,               -- detailed complaint text
    Severity        ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    
    Status          ENUM(
        'Open',                 -- new / pending
        'In Progress',
        'Resolved',
        'Rejected',
        'Closed'
    )                   NOT NULL        DEFAULT 'Open',
    
    RaisedDate      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    ResolvedDate    DATETIME        DEFAULT NULL,
    
    AssignedTo      VARCHAR(100)    DEFAULT NULL,           -- staff/warden name or ID
    
    ResolutionRemarks TEXT          DEFAULT NULL,
    
    FOREIGN KEY (MemberID)    REFERENCES Member(MemberID)     ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (RoomID)      REFERENCES Room(RoomID)         ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (CategoryID)  REFERENCES ComplaintCategory(CategoryID) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT chk_description_not_empty CHECK (TRIM(Description) <> '')
);

-- =============================================================================
-- TABLE: Visitor (Visitor logging)
-- =============================================================================
CREATE TABLE Visitor (
    VisitorID       INT             AUTO_INCREMENT          PRIMARY KEY,
    
    MemberID        INT             NOT NULL,               -- which resident they are visiting
    
    VisitorName     VARCHAR(100)    NOT NULL,
    VisitorContact  VARCHAR(20)     NOT NULL,
    Relation        VARCHAR(50)     NOT NULL,               -- 'Parent', 'Friend', 'Relative', 'Official', etc.
    
    Purpose         VARCHAR(200)    NOT NULL,
    
    InDateTime      DATETIME        NOT NULL,
    OutDateTime     DATETIME        DEFAULT NULL,
    
    GatePassNumber  VARCHAR(50)     DEFAULT NULL,
    
    Remarks         TEXT            DEFAULT NULL,
    
    FOREIGN KEY (MemberID) REFERENCES Member(MemberID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT chk_visitor_in_before_out 
        CHECK (OutDateTime IS NULL OR OutDateTime >= InDateTime)
);

-- =============================================================================
-- TABLE: QRScanLog (QR code scanning history)
-- =============================================================================
CREATE TABLE QRScanLog (
    ScanID          INT             AUTO_INCREMENT          PRIMARY KEY,
    
    QRCode          VARCHAR(100)    NOT NULL,               -- the scanned code (from Member.QRCode or Room.QRCode)
    ScanType        ENUM('Member', 'Room') NOT NULL,         -- what was scanned
    
    ScannedBy       VARCHAR(100)    NOT NULL,               -- security/warden name or device ID
    ScanDateTime    DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    
    Location        VARCHAR(100)    DEFAULT NULL,           -- e.g. 'Main Gate', 'Hostel Block A'
    
    Remarks         TEXT            DEFAULT NULL,
    
    -- Optional: link to actual entity
    MemberID        INT             DEFAULT NULL,
    RoomID          INT             DEFAULT NULL,
    
    FOREIGN KEY (MemberID) REFERENCES Member(MemberID) ON DELETE SET NULL,
    FOREIGN KEY (RoomID)   REFERENCES Room(RoomID)   ON DELETE SET NULL
);

-- =============================================================================
-- TABLE: MaintenanceRequest
-- =============================================================================
CREATE TABLE MaintenanceRequest (
    RequestID       INT             AUTO_INCREMENT          PRIMARY KEY,
    
    RoomID          INT             NOT NULL,
    RequestedBy     INT             NOT NULL,               -- MemberID who raised it
    
    Description     TEXT            NOT NULL,
    
    RequestDate     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    CompletedDate   DATETIME        DEFAULT NULL,
    
    Status          ENUM('Pending', 'In Progress', 'Completed', 'Rejected') 
                        NOT NULL        DEFAULT 'Pending',
    
    AssignedTo      VARCHAR(100)    DEFAULT NULL,
    
    FOREIGN KEY (RoomID)      REFERENCES Room(RoomID)       ON DELETE RESTRICT,
    FOREIGN KEY (RequestedBy) REFERENCES Member(MemberID)   ON DELETE RESTRICT
);




-- =============================================================================
-- SAMPLE DATA POPULATION (10–20 rows per table)
-- =============================================================================

-- 1. RoomType (lookup - 5 rows)
INSERT INTO RoomType (TypeName, BaseCapacity, IsAC, Description) VALUES
('Single',  1, FALSE, 'Standard single occupancy room'),
('Double',  2, FALSE, 'Standard shared room for two students'),
('Triple',  3, FALSE, 'Triple sharing room'),
('Quad',    4, TRUE,  'Four-bed room with AC'),
('Others',  2, TRUE,  'Special room - premium');

-- 2. Hostel (2 hostels for realism)
INSERT INTO Hostel (Name, ShortCode, WardenName, WardenContact, Address, NumSingleRooms, NumDoubleRooms, NumTripleRooms, NumQuadRooms, TotalRooms, TotalCapacity, HostelStatus) VALUES
('Aryabhatta Hostel', 'ABH', 'Dr. Rajesh Kumar', '9876543210', 'Near Academic Block, IITGN', 20, 60, 30, 10, 120, 270, 'Available'),
('Narmada Hostel', 'NRM', 'Prof. Anita Sharma', '9123456789', 'Riverside Block, IITGN', 15, 50, 25, 15, 105, 250, 'Available');
 
-- 3. Room (sample rooms from both hostels)
INSERT INTO Room (HostelID, RoomTypeID, RoomNumber, Floor, MaxCapacity, CurrentOccupancy, QRCode, RoomStatus) VALUES
(1, 1, '101', 1, 1, 1, 'ROOM-ABH-101-QR001', 'Occupied'),
(1, 2, '102', 1, 2, 2, 'ROOM-ABH-102-QR002', 'Occupied'),
(1, 3, '201', 2, 3, 0, 'ROOM-ABH-201-QR003', 'Available'),
(1, 4, '301', 3, 4, 3, 'ROOM-ABH-301-QR004', 'Occupied'),
(1, 1, 'G01', 0, 1, 0, 'ROOM-ABH-G01-QR005', 'Available'),
(2, 2, '105', 1, 2, 2, 'ROOM-NRM-105-QR006', 'Occupied'),
(2, 3, '208', 2, 3, 1, 'ROOM-NRM-208-QR007', 'Occupied'),
(2, 4, '312', 3, 4, 0, 'ROOM-NRM-312-QR008', 'Available'),
(2, 1, '401', 4, 1, 1, 'ROOM-NRM-401-QR009', 'Occupied'),
(2, 2, '402', 4, 2, 0, 'ROOM-NRM-402-QR010', 'Available'),
(1, 2, '103', 1, 2, 0, 'ROOM-ABH-103-QR011', 'Available'),
(1, 3, '202', 2, 3, 2, 'ROOM-ABH-202-QR012', 'Occupied');

-- 4. Member (sample residents + staff + visitor)
INSERT INTO Member (Name, Age, Email, ContactNumber, IdentificationNumber, AllocatedDate, PurposeOfStay, Department, YearOfStudy, Gender, DateOfBirth, QRCode) VALUES
('Rahul Sharma', 20, 'rahul.sharma@iitgn.ac.in', '9876543211', '2023001', '2025-07-15', 'Resident Student', 'CSE', 2, 'Male', '2005-03-12', 'MEM-QR-001'),
('Priya Patel', 19, 'priya.patel@iitgn.ac.in', '9876543212', '2023002', '2025-07-16', 'Resident Student', 'EE', 2, 'Female', '2006-01-25', 'MEM-QR-002'),
('Amit Verma', 21, 'amit.verma@iitgn.ac.in', '9876543213', '2022001', '2025-01-10', 'Resident Student', 'ME', 3, 'Male', '2004-08-05', 'MEM-QR-003'),
('Sneha Gupta', 22, 'sneha.gupta@iitgn.ac.in', '9876543214', '2021005', '2025-01-12', 'Resident Student', 'CL', 4, 'Female', '2003-11-18', 'MEM-QR-004'),
('Vikram Singh', 23, 'vikram.singh@iitgn.ac.in', '9876543215', '2020008', '2025-02-01', 'Resident Student', 'CE', 4, 'Male', '2002-06-30', 'MEM-QR-005'),
('Dr. Rajesh Kumar', 45, 'rajesh.kumar@iitgn.ac.in', '9876543201', 'W001', '2020-06-01', 'Staff', 'Administration', NULL, 'Male', '1980-04-10', 'MEM-QR-006'),
('Anjali Desai', 20, 'anjali.desai@iitgn.ac.in', '9876543216', '2023010', '2025-07-20', 'Resident Student', 'AI', 2, 'Female', '2005-09-08', 'MEM-QR-007'),
('Rohan Mehta', 21, 'rohan.mehta@iitgn.ac.in', '9876543217', '2023011', '2025-07-21', 'Resident Student', 'CSE', 2, 'Male', '2004-12-15', 'MEM-QR-008'),
('Kavya Reddy', 19, 'kavya.reddy@iitgn.ac.in', '9876543218', '2024005', '2025-08-01', 'Resident Student', 'MnC', 1, 'Female', '2006-02-22', 'MEM-QR-009'),
('Arjun Kapoor', 22, 'arjun.kapoor@iitgn.ac.in', '9876543219', '2022003', '2025-01-15', 'Resident Student', 'EE', 3, 'Male', '2003-07-07', 'MEM-QR-010'),
('Parent of Rahul', 50, 'parent.rahul@gmail.com', '9876543220', 'Adhar', '2025-09-01', 'Guest', NULL, NULL, 'Male', '1975-05-05', 'MEM-QR-011');

-- 5. Allocation (sample allocations - some active, some completed)
INSERT INTO Allocation (MemberID, RoomID, CheckInDate, CheckOutDate, AllocationStatus) VALUES
(1, 1, '2025-07-15', NULL, 'Active'),
(2, 2, '2025-07-16', NULL, 'Active'),
(3, 4, '2025-01-10', '2025-05-30', 'Completed'),
(4, 7, '2025-01-12', NULL, 'Active'),
(5, 9, '2025-02-01', NULL, 'Active'),
(8, 2, '2025-07-21', NULL, 'Active'),
(9, 6, '2025-08-01', NULL, 'Active'),
(10, 12, '2025-01-15', NULL, 'Active'),
(1, 3, '2024-07-10', '2025-05-15', 'Completed');

-- 6. FurnitureType (8 common types)
INSERT INTO FurnitureType (TypeName, Description) VALUES
('Bed', 'Single wooden bed with mattress'),
('Chair', 'Plastic study chair'),
('Cupboard', 'Steel cupboard with 3 shelves'),
('Study Table', 'Wooden table with drawer'),
('Mattress', '5-inch foam mattress'),
('Fan', 'Ceiling fan'),
('Tube Light', '40W LED tube light'),
('Bookshelf', 'Small metal bookshelf');

-- 7. FurnitureItem (sample items in rooms)
INSERT INTO FurnitureItem (FurnitureTypeID, RoomID, SerialNumber, FurnitureCondition, Remarks) VALUES
(1, 1, 'BED-ABH101-001', 'Good', 'Assigned to Rahul Sharma'),
(2, 1, NULL, 'Good', NULL),
(3, 1, 'CUP-ABH101-001', 'Fair', 'Minor scratch on door'),
(1, 2, 'BED-ABH102-001', 'New', NULL),
(1, 2, 'BED-ABH102-002', 'Good', NULL),
(4, 2, NULL, 'Good', 'Shared study table'),
(1, 4, 'BED-ABH301-001', 'Good', NULL),
(1, 4, 'BED-ABH301-002', 'Good', NULL),
(1, 4, 'BED-ABH301-003', 'Fair', 'Mattress needs replacement soon'),
(1, 4, 'BED-ABH301-004', 'Good', NULL);

-- 8. ComplaintCategory (8 categories)
INSERT INTO ComplaintCategory (CategoryName, Description) VALUES
('Electrical', 'Lights, fans, sockets issues'),
('Plumbing', 'Water leakage, tap, bathroom issues'),
('Cleanliness', 'Room/hostel cleaning, dustbin'),
('Furniture Damage', 'Broken bed, chair, table'),
('WiFi/Internet', 'Network connectivity issues'),
('Security', 'Lock, gate pass, safety concerns'),
('Maintenance', 'Painting, wall repair, etc.'),
('Others', 'Any miscellaneous issue');

-- 9. Complaint (sample complaints)
INSERT INTO Complaint (MemberID, RoomID, CategoryID, Description, Severity, Status) VALUES
(1, 1, 4, 'Cupboard door hinge broken', 'Medium', 'In Progress'),
(2, 2, 1, 'Ceiling fan making noise', 'Low', 'Open'),
(4, 7, 2, 'Bathroom tap leaking continuously', 'High', 'In Progress'),
(5, 9, 3, 'Room not cleaned for 3 days', 'Medium', 'Open'),
(8, 2, 4, 'Study table wobbling', 'Low', 'Resolved'),
(9, 6, 5, 'WiFi not working in room', 'High', 'In Progress');

-- 10. Visitor (sample visitors)
INSERT INTO Visitor (MemberID, VisitorName, VisitorContact, Relation, Purpose, InDateTime, OutDateTime) VALUES
(1, 'Mr. Anil Sharma', '9876543221', 'Father', 'Parent meeting', '2025-09-05 14:30:00', '2025-09-05 17:00:00'),
(2, 'Neha Patel', '9876543222', 'Sister', 'Casual visit', '2025-09-06 11:00:00', NULL),
(3, 'Dr. Suman Verma', '9876543223', 'Faculty', 'Academic discussion', '2025-09-07 15:45:00', '2025-09-07 16:30:00'),
(4, 'Riya Gupta', '9876543224', 'Friend', 'Birthday celebration', '2025-09-08 18:00:00', '2025-09-08 21:00:00');

-- 11. QRScanLog (sample scans)
INSERT INTO QRScanLog (QRCode, ScanType, ScannedBy, ScanDateTime, Location) VALUES
('MEM-QR-001', 'Member', 'Security Guard Raju', '2025-09-05 14:15:00', 'Main Gate'),
('ROOM-ABH-101-QR001', 'Room', 'Warden Kumar', '2025-09-05 10:00:00', 'Aryabhatta Block'),
('MEM-QR-002', 'Member', 'Security Guard Raju', '2025-09-06 10:45:00', 'Main Gate'),
('ROOM-NRM-105-QR006', 'Room', 'Maintenance Staff', '2025-09-07 09:30:00', 'Narmada Block');

-- 12. MaintenanceRequest (sample requests)
INSERT INTO MaintenanceRequest (RoomID, RequestedBy, Description, Status) VALUES
(1, 1, 'Repair broken cupboard hinge', 'In Progress'),
(2, 2, 'Fix noisy ceiling fan', 'Pending'),
(7, 4, 'Replace leaking bathroom tap', 'Completed'),
(9, 5, 'Clean room properly', 'In Progress');
