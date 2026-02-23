# CTIS Planner - Full-Stack Application

A complete curriculum planning tool for Bilkent University CTIS students, rebuilt as a modular full-stack application.

## 📁 Project Structure

```
ctisplanner-fullstack/
├── backend/
│   ├── server.js                 # Express server
│   ├── package.json              # Node.js dependencies
│   ├── routes/
│   │   ├── catalogRoutes.js      # Catalog API routes
│   │   └── layoutRoutes.js       # Layout save/load routes
│   ├── controllers/
│   │   ├── catalogController.js  # Catalog business logic
│   │   └── layoutController.js   # Layout management logic
│   └── data/
│       ├── catalog.json          # Course catalog data
│       └── layouts/              # Saved user layouts (auto-created)
│
└── frontend/
    ├── index.html                # Main HTML structure
    ├── css/
    │   └── styles.css            # All application styles
    └── js/
        ├── state.js              # Application state management
        ├── utils.js              # Helper functions
        ├── api.js                # Backend API communication
        └── app.js                # Main application logic & UI
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Running the Application

1. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   ```
   http://localhost:3000
   ```

The server will:
- Serve the frontend files
- Provide API endpoints for catalog and layout management
- Auto-save your layout every 30 seconds

## 🔧 API Endpoints

### Catalog
- `GET /api/catalog` - Get all courses, professors, and IS electives

### Layouts
- `GET /api/layouts/current` - Get current working layout
- `POST /api/layouts/current` - Save current working layout
- `GET /api/layouts` - Get all saved layouts
- `POST /api/layouts` - Save new named layout
- `GET /api/layouts/:id` - Get specific layout
- `DELETE /api/layouts/:id` - Delete layout

## 📦 Features

- ✅ **Drag & Drop:** Move courses between semesters
- ✅ **IS Electives:** Assign information systems electives to slots
- ✅ **Prerequisites:** Visual prerequisite arrows and editing
- ✅ **Professor Management:** Track course sections by professor
- ✅ **Analytics:** Credit distribution, workload analysis, prerequisite tracking
- ✅ **Auto-Save:** Layout automatically saved every 30 seconds
- ✅ **Persistent Storage:** Layouts saved to backend filesystem
- ✅ **JSON Export/Import:** Export and import curriculum plans

## 🛠️ Development

### Backend Development

The backend uses:
- **Express.js** for the web server
- **Filesystem storage** for layouts (no database needed)
- **CORS** enabled for development

### Frontend Development

The frontend is pure vanilla JavaScript with:
- **No framework dependencies** (no React, Vue, etc.)
- **Modular architecture** (separate state, utils, API, app logic)
- **Modern CSS** with CSS variables for theming

### Adding New Features

1. **New API endpoint:** Add route in `backend/routes/`, controller in `backend/controllers/`
2. **New UI feature:** Add logic to `frontend/js/app.js`, API calls to `frontend/js/api.js`
3. **New data:** Update `backend/data/catalog.json`

## 📝 Notes

- **No Authentication:** This version has no user authentication (single-user application)
- **File Storage:** Layouts are stored as JSON files in `backend/data/layouts/`
- **Auto-Save:** Current layout auto-saves every 30 seconds to `current.json`
- **Named Saves:** You can save multiple named versions via the Save modal

## 🐛 Troubleshooting

### Server won't start
- Make sure you're in the `backend/` directory
- Run `npm install` to ensure dependencies are installed
- Check that port 3000 is not already in use

### Layout not saving
- Check browser console for errors
- Ensure `backend/data/layouts/` directory exists (auto-created on first save)
- Verify server is running

### Catalog not loading
- Check that `backend/data/catalog.json` exists
- Look for errors in server console
- Verify API endpoint returns data: `http://localhost:3000/api/catalog`

## 📄 License

Original CTIS Planner © 2025 - Rebuilt as full-stack application
