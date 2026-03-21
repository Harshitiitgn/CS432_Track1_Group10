














CREATE TABLE if not exists Member (
    MemberID        INTEGER PRIMARY KEY,

    
    Name            VARCHAR(100)    NOT NULL,
    Image           VARCHAR(255),                           
    Age             INT             NOT NULL,
    Email           VARCHAR(150)    NOT NULL    UNIQUE,
    ContactNumber   VARCHAR(20)     NOT NULL,
    IdentificationNumber  VARCHAR(50)     NOT NULL    UNIQUE,   
	AllocatedDate   DATE            NOT NULL,               
    PurposeOfStay   TEXT               NOT NULL,
    
    
    Department      VARCHAR(100),
    YearOfStudy     TINYINT,
    Gender          TEXT NOT NULL,
    DateOfBirth     DATE            NOT NULL,
    PermanentAddress TEXT,
    GuardianName    VARCHAR(100),
    GuardianContact VARCHAR(20),
    
    
    QRCode          VARCHAR(100)    NOT NULL    UNIQUE,

    
    IsActive        BOOLEAN         NOT NULL    DEFAULT TRUE,
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ,

    
    CONSTRAINT chk_member_age_positive          CHECK (Age > 0),
    CONSTRAINT chk_year_of_study_range          CHECK (YearOfStudy IS NULL OR YearOfStudy BETWEEN 1 AND 10)
    
    
);




CREATE TABLE Hostel (
    HostelID        INTEGER PRIMARY KEY,
    Name            VARCHAR(100)    NOT NULL,               
    ShortCode       VARCHAR(10)     NOT NULL    UNIQUE,     
    WardenName      VARCHAR(100)    NOT NULL,
    WardenContact   VARCHAR(20),
    Address         VARCHAR(255)    NOT NULL,
    
    
     
    NumSingleRooms  INT             NOT NULL    DEFAULT 0,  
    NumDoubleRooms  INT             NOT NULL    DEFAULT 0,  
    NumTripleRooms  INT             NOT NULL    DEFAULT 0,  
    NumQuadRooms    INT             NOT NULL    DEFAULT 0,  
    
    
    HostelStatus    TEXT                   NOT NULL        DEFAULT 'Available',
    
    
    TotalRooms      INT             NOT NULL    DEFAULT 0,
    TotalCapacity   INT             NOT NULL    DEFAULT 0,
    
    
    IsActive        BOOLEAN         NOT NULL    DEFAULT TRUE,
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ,
    
    
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




CREATE TABLE RoomType (
    RoomTypeID      INTEGER PRIMARY KEY,
    TypeName        TEXT                   NOT NULL,

    BaseCapacity    TINYINT         NOT NULL,

    IsAC            BOOLEAN         NOT NULL    DEFAULT FALSE,

    
    Description     VARCHAR(200)                DEFAULT NULL,

    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ,

    
    

    
    CONSTRAINT uq_roomtype_name_capacity UNIQUE (TypeName, BaseCapacity)
);




CREATE TABLE Room (
    RoomID          INTEGER PRIMARY KEY,
    HostelID        INT             NOT NULL,
    RoomTypeID      INT             NOT NULL,               
    RoomNumber      VARCHAR(20)     NOT NULL,               
    Floor           TINYINT         NOT NULL,

    
    
    MaxCapacity     TINYINT         NOT NULL,
    
    CurrentOccupancy TINYINT        NOT NULL    DEFAULT 0,

    
    QRCode          VARCHAR(100)    NOT NULL    UNIQUE,

    
    RoomStatus      TEXT               NOT NULL        DEFAULT 'Available',

	
    IsActive        BOOLEAN         NOT NULL    DEFAULT TRUE,
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ,

    
    FOREIGN KEY (HostelID)   REFERENCES Hostel(HostelID)     ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (RoomTypeID) REFERENCES RoomType(RoomTypeID) ON DELETE RESTRICT ON UPDATE CASCADE,

    
    CONSTRAINT chk_room_max_capacity
        CHECK (MaxCapacity BETWEEN 1 AND 4),

    CONSTRAINT chk_room_occupancy_valid
        CHECK (CurrentOccupancy >= 0 AND CurrentOccupancy <= MaxCapacity),

    CONSTRAINT chk_room_number_unique_per_hostel
        UNIQUE (HostelID, RoomNumber)
);









CREATE TABLE Allocation (
    AllocationID    INTEGER PRIMARY KEY,
    MemberID        INT             NOT NULL,
    RoomID          INT             NOT NULL,

    
    CheckInDate     DATE            NOT NULL,               
    CheckOutDate    DATE            DEFAULT NULL,           

    
    CheckInTime     TIME            DEFAULT NULL,
    CheckOutTime    TIME            DEFAULT NULL,

    
    AllocatedBy     VARCHAR(100)    DEFAULT NULL,           

    
    AllocationStatus TEXT                   NOT NULL        DEFAULT 'Active',

    
    Remarks         TEXT            DEFAULT NULL,

    
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ,
    CreatedBy       VARCHAR(100)    DEFAULT NULL,

    
    FOREIGN KEY (MemberID) REFERENCES Member(MemberID) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (RoomID) REFERENCES Room(RoomID) 
        ON DELETE RESTRICT ON UPDATE CASCADE,

    
    CONSTRAINT chk_checkout_after_checkin
        CHECK (CheckOutDate IS NULL OR CheckOutDate >= CheckInDate),

    
    
    CONSTRAINT uk_member_active_allocation UNIQUE (MemberID, AllocationStatus)
);







CREATE TABLE FurnitureType (
    FurnitureTypeID INTEGER PRIMARY KEY,
    TypeName        VARCHAR(50)     NOT NULL    UNIQUE,     
    Description     VARCHAR(200)    DEFAULT NULL,           

    
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ,

    
    CONSTRAINT chk_furniture_type_name_not_empty CHECK (TRIM(TypeName) <> '')
);
CREATE TABLE FurnitureItem (
    FurnitureItemID INTEGER PRIMARY KEY,
    
    FurnitureTypeID INT NOT NULL,               
    RoomID          INT NOT NULL,               
    
    SerialNumber    VARCHAR(50)     DEFAULT NULL,           
    
    
    FurnitureCondition TEXT               NOT NULL        DEFAULT 'Good',
    
    
    LastCheckedDate DATE            DEFAULT NULL,
    
    Remarks         TEXT            DEFAULT NULL,           
    
    
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ,
    
    
    FOREIGN KEY (FurnitureTypeID) REFERENCES FurnitureType(FurnitureTypeID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    FOREIGN KEY (RoomID) REFERENCES Room(RoomID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    
    
    CONSTRAINT chk_furniture_condition_valid 
        CHECK (FurnitureCondition IS NOT NULL)
);




CREATE TABLE ComplaintCategory (
    CategoryID      INTEGER PRIMARY KEY,
    
    CategoryName    VARCHAR(100)    NOT NULL    UNIQUE,     
    
    Description     VARCHAR(255)    DEFAULT NULL,
    
    CreatedAt       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       DATETIME                    ,
    
    CONSTRAINT chk_category_name_not_empty CHECK (TRIM(CategoryName) <> '')
);
CREATE TABLE Complaint (
    ComplaintID     INTEGER PRIMARY KEY,
    
    MemberID        INT             NOT NULL,               
    RoomID          INT             DEFAULT NULL,           
    
    CategoryID      INT             NOT NULL,
    
    Description     TEXT            NOT NULL,               
    Severity        TEXT NOT NULL DEFAULT 'Medium',
    
    Status          TEXT                   NOT NULL        DEFAULT 'Open',
    
    RaisedDate      DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    ResolvedDate    DATETIME        DEFAULT NULL,
    
    AssignedTo      VARCHAR(100)    DEFAULT NULL,           
    
    ResolutionRemarks TEXT          DEFAULT NULL,
    
    FOREIGN KEY (MemberID)    REFERENCES Member(MemberID)     ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (RoomID)      REFERENCES Room(RoomID)         ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (CategoryID)  REFERENCES ComplaintCategory(CategoryID) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT chk_description_not_empty CHECK (TRIM(Description) <> '')
);




CREATE TABLE Visitor (
    VisitorID       INTEGER PRIMARY KEY,
    
    MemberID        INT             NOT NULL,               
    
    VisitorName     VARCHAR(100)    NOT NULL,
    VisitorContact  VARCHAR(20)     NOT NULL,
    Relation        VARCHAR(50)     NOT NULL,               
    
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




CREATE TABLE QRScanLog (
    ScanID          INTEGER PRIMARY KEY,
    
    QRCode          VARCHAR(100)    NOT NULL,               
    ScanType        TEXT NOT NULL,         
    
    ScannedBy       VARCHAR(100)    NOT NULL,               
    ScanDateTime    DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    
    Location        VARCHAR(100)    DEFAULT NULL,           
    
    Remarks         TEXT            DEFAULT NULL,
    
    
    MemberID        INT             DEFAULT NULL,
    RoomID          INT             DEFAULT NULL,
    
    FOREIGN KEY (MemberID) REFERENCES Member(MemberID) ON DELETE SET NULL,
    FOREIGN KEY (RoomID)   REFERENCES Room(RoomID)   ON DELETE SET NULL
);




CREATE TABLE MaintenanceRequest (
    RequestID       INTEGER PRIMARY KEY,
    
    RoomID          INT             NOT NULL,
    RequestedBy     INT             NOT NULL,               
    
    Description     TEXT            NOT NULL,
    
    RequestDate     DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    CompletedDate   DATETIME        DEFAULT NULL,
    
    Status          TEXT 
                        NOT NULL        DEFAULT 'Pending',
    
    AssignedTo      VARCHAR(100)    DEFAULT NULL,
    
    FOREIGN KEY (RoomID)      REFERENCES Room(RoomID)       ON DELETE RESTRICT,
    FOREIGN KEY (RequestedBy) REFERENCES Member(MemberID)   ON DELETE RESTRICT
);









INSERT INTO RoomType (TypeName, BaseCapacity, IsAC, Description) VALUES
('Single',  1, FALSE, 'Standard single occupancy room'),
('Double',  2, FALSE, 'Standard shared room for two students'),
('Triple',  3, FALSE, 'Triple sharing room'),
('Quad',    4, TRUE,  'Four-bed room with AC'),
('Others',  2, TRUE,  'Special room - premium'),
('Single Non-AC', 1, FALSE, 'Budget single room'),
('Accessible', 2, TRUE, 'Wheelchair accessible room');


INSERT INTO Hostel (Name, ShortCode, WardenName, WardenContact, Address, NumSingleRooms, NumDoubleRooms, NumTripleRooms, NumQuadRooms, TotalRooms, TotalCapacity, HostelStatus) VALUES
('Aryabhatta Hostel', 'ABH', 'Dr. Rajesh Kumar', '9876543210', 'Near Academic Block, IITGN', 20, 60, 30, 10, 120, 270, 'Available'),
('Narmada Hostel', 'NRM', 'Prof. Anita Sharma', '9123456789', 'Riverside Block, IITGN', 15, 50, 25, 15, 105, 250, 'Available');
 

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


INSERT INTO Allocation (MemberID, RoomID, CheckInDate, CheckOutDate, AllocationStatus) VALUES
(1, 1, '2025-07-15', NULL, 'Active'),
(2, 2, '2025-07-16', NULL, 'Active'),
(3, 4, '2025-01-10', '2025-05-30', 'Completed'),
(4, 7, '2025-01-12', NULL, 'Active'),
(5, 9, '2025-02-01', NULL, 'Active'),
(8, 2, '2025-07-21', NULL, 'Active'),
(9, 6, '2025-08-01', NULL, 'Active'),
(10, 12, '2025-01-15', NULL, 'Active'),
(1, 3, '2024-07-10', '2025-05-15', 'Completed'),
(7, 8, '2025-07-20', NULL, 'Active'),
(6, 11, '2024-06-01', NULL, 'Active');


INSERT INTO FurnitureType (TypeName, Description) VALUES
('Bed', 'Single wooden bed with mattress'),
('Chair', 'Plastic study chair'),
('Cupboard', 'Steel cupboard with 3 shelves'),
('Study Table', 'Wooden table with drawer'),
('Mattress', '5-inch foam mattress'),
('Fan', 'Ceiling fan'),
('Tube Light', '40W LED tube light'),
('Bookshelf', 'Small metal bookshelf'),
('Curtains', 'Window curtains set of 2'),
('Dustbin', 'Plastic pedal dustbin 10L');


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


INSERT INTO ComplaintCategory (CategoryName, Description) VALUES
('Electrical', 'Lights, fans, sockets issues'),
('Plumbing', 'Water leakage, tap, bathroom issues'),
('Cleanliness', 'Room/hostel cleaning, dustbin'),
('Furniture Damage', 'Broken bed, chair, table'),
('WiFi/Internet', 'Network connectivity issues'),
('Security', 'Lock, gate pass, safety concerns'),
('Maintenance', 'Painting, wall repair, etc.'),
('Others', 'Any miscellaneous issue'),
('Pest Control', 'Insects, rodents, or termites'),
('Noise/Disturbance', 'Loud music, shouting, etc.');


INSERT INTO Complaint (MemberID, RoomID, CategoryID, Description, Severity, Status) VALUES

(1, 1, 4, 'Cupboard door hinge broken', 'Medium', 'In Progress'),
(8, 2, 4, 'Study table wobbling', 'Low', 'Resolved'),

(2, 2, 1, 'Ceiling fan making noise', 'Low', 'Open'),
(3, 4, 1, 'Tube light flickering', 'Low', 'Resolved'),
(8, 2, 1, 'Socket sparking', 'Critical', 'Resolved'),

(4, 7, 2, 'Bathroom tap leaking continuously', 'High', 'In Progress'),
(10, 12, 2, 'Flush not working', 'Critical', 'In Progress'),

(5, 9, 3, 'Room not cleaned for 3 days', 'Medium', 'Open'),
(6, NULL, 3, 'Corridor dustbins overflowing', 'Medium', 'Open'),

(9, 6, 5, 'WiFi not working in room', 'High', 'In Progress'),
(7, 12, 5, 'Internet speed very slow', 'High', 'Open'),

(2, 2, 7, 'Paint peeling off near window', 'Low', 'Pending'),

(5, 9, 6, 'Balcony door lock jammed', 'High', 'Resolved'),

(1, 1, 8, 'Stray dog in corridor', 'Medium', 'Closed');


INSERT INTO Visitor (MemberID, VisitorName, VisitorContact, Relation, Purpose, InDateTime, OutDateTime) VALUES
(1, 'Suresh Raina', '9000000001', 'Uncle', 'Drop off luggage', '2025-09-09 10:00:00', '2025-09-09 10:30:00'),
(2, 'Mahesh Bhupathi', '9000000002', 'Coach', 'Sports inquiry', '2025-09-10 11:00:00', '2025-09-10 12:00:00'),
(3, 'Sania Mirza', '9000000003', 'Sister', 'Personal', '2025-09-11 14:00:00', '2025-09-11 18:00:00'),
(5, 'Virat Kohli', '9000000004', 'Friend', 'Weekend visit', '2025-09-12 09:00:00', NULL),
(6, 'Rohit Sharma', '9000000005', 'Brother', 'Family function', '2025-09-13 10:00:00', '2025-09-13 22:00:00'),
(7, 'MS Dhoni', '9000000006', 'Guardian', 'Check up', '2025-09-14 16:00:00', '2025-09-14 17:00:00'),
(8, 'Hardik Pandya', '9000000007', 'Cousin', 'Drop off food', '2025-09-15 13:00:00', '2025-09-15 13:15:00'),
(9, 'Ravindra Jadeja', '9000000008', 'Friend', 'Study group', '2025-09-16 18:00:00', '2025-09-16 23:00:00'),
(10, 'Jasprit Bumrah', '9000000009', 'Brother', 'Emergency', '2025-09-17 02:00:00', '2025-09-17 06:00:00'),
(4, 'Kiran Bedi', '9000000010', 'Aunt', 'Drop off medicines', '2025-09-18 10:00:00', '2025-09-18 10:30:00'),
(2, 'PV Sindhu', '9000000011', 'Sister', 'Birthday visit', '2025-09-19 15:00:00', '2025-09-19 19:00:00');


INSERT INTO QRScanLog (QRCode, ScanType, ScannedBy, ScanDateTime, Location) VALUES
('MEM-QR-001', 'Member', 'Security Guard Raju', '2025-09-05 14:15:00', 'Main Gate'),
('ROOM-ABH-101-QR001', 'Room', 'Warden Kumar', '2025-09-05 10:00:00', 'Aryabhatta Block'),
('MEM-QR-002', 'Member', 'Security Guard Raju', '2025-09-06 10:45:00', 'Main Gate'),
('ROOM-NRM-105-QR006', 'Room', 'Maintenance Staff', '2025-09-07 09:30:00', 'Narmada Block'),
('MEM-QR-003', 'Member', 'Guard Patil', '2025-09-08 08:00:00', 'Mess Hall'),
('MEM-QR-004', 'Member', 'Guard Patil', '2025-09-08 08:05:00', 'Mess Hall'),
('ROOM-ABH-201-QR003', 'Room', 'Warden Kumar', '2025-09-08 09:00:00', 'Routine Inspection'),
('MEM-QR-005', 'Member', 'Library System', '2025-09-08 10:00:00', 'Library Entrance'),
('MEM-QR-001', 'Member', 'Gym Access', '2025-09-08 17:00:00', 'Gym'),
('ROOM-NRM-312-QR008', 'Room', 'Cleaner Staff', '2025-09-09 11:00:00', 'Cleaning Log'),
('MEM-QR-010', 'Member', 'Main Gate', '2025-09-09 23:00:00', 'Late Entry');


INSERT INTO MaintenanceRequest (RoomID, RequestedBy, Description, Status) VALUES
(1, 1, 'Repair broken cupboard hinge', 'In Progress'),
(2, 2, 'Fix noisy ceiling fan', 'Pending'),
(7, 4, 'Replace leaking bathroom tap', 'Completed'),
(9, 5, 'Clean room properly', 'In Progress'),
(3, 1, 'Window glass cracked', 'Pending'),
(4, 3, 'AC not cooling properly', 'In Progress'),
(6, 9, 'Door latch stuck', 'Completed'),
(8, 7, 'Study table drawer broken', 'Pending'),
(10, 2, 'Bedsheet torn', 'Rejected'),
(12, 10, 'Bathroom mirror broken', 'Pending');
