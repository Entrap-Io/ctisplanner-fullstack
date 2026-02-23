# CTIS Planner – Full-Stack Curriculum Assistant

A modular full-stack curriculum management system developed for the CTIS faculty to efficiently manage, organize, and analyze curriculum structures.

Built using Node.js, Express.js, Supabase (PostgreSQL), and a frontend powered by HTML, CSS, and Vanilla JavaScript, the system provides an interactive and scalable platform for better curriculum planning and oversight.

**Live Application:**
[https://ctisplanner-fullstack.up.railway.app/](https://ctisplanner-fullstack.up.railway.app/)

---

## Overview

CTIS Planner allows faculty to:

* Organize and restructure semester layouts
* Manage course placements across academic terms
* Assign IS electives
* Oversee professor–course associations and section allocations
* Visualize and manage prerequisite relationships
* Save, update, and maintain multiple curriculum versions

The application evolved from a filesystem-based prototype into a fully deployed cloud-backed system.

---

# 🏗️ Architecture

## 🖥️ Backend

* **Node.js**
* **Express.js**
* **Supabase (PostgreSQL database)**
* Hosted on **Railway**

## 🎨 Frontend

* Vanilla JavaScript
* Modular architecture
* Modern CSS
* Clean separation of:

  * State management
  * API communication
  * UI logic

---

# 📁 Project Structure

```
ctisplanner-fullstack/
├── README.md                     # Project documentation
├── start.sh                      # Shell script to start the app
├── start.bat                     # Windows batch start script
├── package.json                  # Root npm config
├── package-lock.json             # Lockfile for npm
├── env.example                   # Template for environment variables
│
├── frontend/                     # Frontend client
│   ├── index.html                # Main HTML
│   ├── css/
│   │   └── styles.css            # Global CSS
│   └── js/
│       ├── utils.js              # Utility functions
│       ├── state.js              # Main app state logic
│       ├── app.js                # UI and interaction logic
│       └── api.js                # API interaction with backend
│
├── backend/                      # Backend API server
│   ├── server.js                 # Main Express server entrypoint
│   ├── routes/
│   │   ├── layoutRoutes.js       # Express routes for layouts
│   │   └── catalogRoutes.js      # Express routes for course catalog
│   ├── controllers/
│   │   ├── layoutController.js   # Controller logic for layouts
│   │   └── catalogController.js  # Controller logic for catalog
│   ├── data/                     # Legacy data store (filesystem JSON)
│   │   ├── layouts/
│   │   │   ├── current.json
│   │   │   └── catalog.json      # (Older iteration only — before Supabase)
│   │   └── ...                   # Deprecated JSON files
│   ├── node_modules/             # Installed backend dependencies
│   └── .env                     # (Not committed) Actual environment variables
│
└── .gitignore                    # Ignore patterns for Git

```

---

### Environment Variables

Create a `.env` file inside the backend folder:

```
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
PORT=3000
```

---

# Local Development

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## 1️⃣ Install Dependencies

```bash
cd backend
npm install
```

## 2️⃣ Run the Server

```bash
npm start
```

Or for development:

```bash
npm run dev
```

Then open:

```
http://localhost:3000
```

---

# API Endpoints

## Catalog

* `GET /api/catalog`

  * Returns all courses, professors, and IS electives

## Layouts

* `GET /api/layouts/current`
* `POST /api/layouts/current`
* `GET /api/layouts`
* `POST /api/layouts`
* `GET /api/layouts/:id`
* `DELETE /api/layouts/:id`

All layout data is now persisted in **Supabase**, not the local filesystem.

---

# Previous Iteration (Filesystem Version)

The original full-stack version used:

* Express backend
* Local JSON files for storage
* `backend/data/catalog.json`
* `backend/data/layouts/current.json`
* Layouts saved inside:

  ```
  backend/data/layouts/
  ```

### How It Worked

* Layouts were saved as JSON files
* Auto-save every 30 seconds
* No database required
* Single-user environment

### Limitations

* No cloud persistence
* Not scalable
* Data lost on redeploy
* Not production-ready

---

# Current Version Improvements

| Feature     | Old Version       | Current Version     |
| ----------- | ----------------- | ------------------- |
| Storage     | Local JSON        | Supabase PostgreSQL |
| Deployment  | Localhost         | Railway Cloud       |
| Persistence | Local only        | Cloud persistent    |
| Scalability | Single-user       | Production-ready    |
| Data safety | Risk of overwrite | Managed DB          |

---

# Features

* Drag & Drop semester planning
* IS elective assignment
* Professor-course linking
* Prerequisite visualization
* Modular frontend architecture
* REST API backend
* Cloud database storage
* Production deployment

---

# Troubleshooting

### Server not starting?

* Check `.env` file
* Ensure Supabase credentials are correct
* Verify Railway environment variables

### Data not saving?

* Check Supabase table configuration
* Verify RLS (Row Level Security) policies
* Inspect Railway logs

---

# Future Improvements

* Authentication (Supabase Auth)
* Multi-user accounts
* Role-based permissions
* Professor dashboards
* Analytics dashboard
* Export to PDF
* Performance optimizations

---

# 📄 License

CTIS Planner © 2026
Developed as a full-stack academic planning system.
