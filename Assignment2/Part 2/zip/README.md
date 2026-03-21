# Hostel Management System (HMS)

A premium, full-stack solution for modern hostel administration and resident life management. Built with a focus on speed, security, and a superior user experience.

---

## Vision
HMS is designed to replace legacy paper-based systems with a digital-first approach. From **AI-powered security gate verification** to **dynamic room occupancy logic**, this system ensures that hostel operations are seamless, transparent, and secure.

## Key Features

### Administrative Powerhouse
*   **Unified Dashboard**: Real-time analytics on occupancy, pending complaints, and visitor traffic.
*   **Inventory Management**: Full control over Hostels and Rooms with support for **Multi-Occupancy** types (Single, Double, Triple).
*   **Interactive Room Map**: Visual representation of room occupancy with instant access to resident profiles.
*   **Audit Logging**: Detailed tracking of all administrative actions (POST/PUT/DELETE) for accountability.
*   **Warden Directory**: Centralized management of staff contact details, accessible to residents.

### Resident Experience (Member Portal)
*   **Digital Pass**: Instant generation of a unique QR code for secure gate entry/exit.
*   **Smart Room Details**: View current room assignment, check-in history, and assigned Warden contacts.
*   **Maintenance Requests**: Report issues directly to the admin with real-time status updates.
*   **Visitor Registration**: Log and track visitors for enhanced security and compliance.

### Smart Security & Maintenance
*   **Gate Security Scanner**: Real-time terminal for verifying resident passes via camera or text input.
*   **Maintenance Verification**: Automated closure of work orders using QR-authenticated room/member scans.
*   **Side-by-Side Terminals**: Modern, stable grid layout for high-density information display during peak hours.

---

## Design Aesthetics
*   **Premium UI**: Built with a "Wow" factor using **Glassmorphism**, vibrant gradients, and smooth micro-animations.
*   **Fully Responsive**: Sophisticated sidebar-drawer system that adapts perfectly to Mobile, Tablet, and Desktop.
*   **Dark Mode Ready**: Intelligent theme switching that respects system preferences and enhances readability.

---

## 🛠️ Technical Stack
*   **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [Tailwind CSS 4](https://tailwindcss.com/)
*   **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
*   **Database**: [SQLite](https://www.sqlite.org/) (Persistent, lightweight, and fast)
*   **Authentication**: Secure **HTTP-Only Cookie-based JWT** system.
*   **Icons**: [Lucide React](https://lucide.dev/) for a consistent visual language.

---

## ⚙️ Local Setup & Installation

### 1. Prerequisites
Ensure you have **Node.js (v18+)** installed on your machine.

### 2. Clone and Install
```bash
# Navigate to project directory
cd zip

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory (you can copy from `.env.example`):
```env
# Example .env configuration
PORT=3000
NODE_ENV=development
# Add any specialized API keys if required
```

### 4. Initialize Database
The system will **automatically initialize** the SQLite database (`hostel.db`) upon the first run. You can also seed initial data using the provided `hostel.sql` if needed.

### 5. Running the Application
```bash
# Start the development server (Backend + Vite HMR)
npm run dev
```
The application will be accessible at: **[http://localhost:3000](http://localhost:3000)**

---

## 🚢 Deployment
To generate a production-ready build:
```bash
# Build the frontend assets
npm run build

# Start the production server
npm start
```

---

## 📝 Administrative Credentials (Demo)
*   **Default**: Accessible via the "Demo Accounts" button on the sign-in page.

---

*Developed with ❤️ for a better campus living experience.*
