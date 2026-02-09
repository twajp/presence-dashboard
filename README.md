# Presence Dashboard
A dynamic, real-time presence management application built with React, Material UI, and React Draggable. This dashboard allows teams to visualize member status through both a grid-based list and a customizable 2D floor plan.  
## Features
- Dual View System: * Interactive Map: Drag-and-drop seating arrangement with a dot-grid background for precision.  
  - Data Grid: A robust table view powered by MUI X DataGrid for quick editing and sorting.  
- Presence Management: Toggle between `Present`, `Remote`, `Trip`, and `Off` with color-coded visual cues.  
- Multi-Dashboard Support: Create and manage multiple office layouts or team boards.  
- Dynamic Customization: * Edit Mode: Toggle to reposition seats, add/remove members, or reorder the list.  
  - Custom Labels: Rename column headers (e.g., "Note 1" to "Project") directly from the UI.  
- Real-time Synchronization: Auto-polls the backend every 10 seconds (when not in edit mode) to keep status updates fresh across all clients.  
- Theme Aware: Built-in support for Dark/Light mode based on system preferences.

## Tech Stack
- Framework: React (Vite)
- UI Library: Material UI (MUI)
- Components: `@mui/x-data-grid` for the tabular view.
  - `react-draggable` for seat positioning.
- State Management: React Hooks (useCallback, useMemo, useRef).
- Icons: MUI Icons.

# How to Launch
## Prerequisites
Copy [`.env.example`](.env.example) to `.env` and configure the environment variables:
```bash
cp .env.example .env
```
Then edit `.env` with your specific configuration.

## Local Development
```bash
docker compose up --build
```

## Production Deployment
### SSL Certificate Setup
Before deploying to production, place your SSL certificate files in the directory specified in `.env`:  
1. Create the certificate directory:
   ```bash
   mkdir certs
   ```
1. Place your SSL certificate and key files in the `certs/` directory.
1. Update the `.env` file with your certificate file names:

### Deploy
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

The application will be accessible via HTTPS on the port specified by `HTTPS_PORT` in `.env` (default: 443). HTTP requests on the port specified by `HTTP_PORT` (default: 80) will be automatically redirected to HTTPS.

## Usage Guide
### Managing Presence
- **View Mode**: Click on any user’s name in the map or their status button in the table to open the status selector dialog.
- **Notes**: Double-click cells in the "Note" columns within the table to update information on the fly.

### Customizing the Layout
1. Toggle the **Edit Mode** switch in the top right.
1. **Move Seats**: Click and drag seat blocks to match your physical office layout.
1. **Add/Remove**: Use the "Add Member" button or the red trash icon in the "Actions" column.
1. **Reorder**: Use the up/down arrows in the table to change the display order of team members.
1. **Rename Headers**: In edit mode, click on column headers to rename them.


## API Endpoints
### Response Format
All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

### Available Endpoints
#### Health Check
- `GET /health` - Check server and database connection status

#### Dashboards
- `GET /api/dashboards` - Get all dashboards
- `GET /api/dashboards/:dashboardId` - Get specific dashboard
- `POST /api/dashboards` - Create a new dashboard
  - Body: `{ "dashboard_name": "string" }`
- `PUT /api/dashboards/:dashboardId` - Update dashboard name
  - Body: `{ "dashboard_name": "string" }`
- `DELETE /api/dashboards/:dashboardId` - Delete dashboard and associated users

#### Dashboard Settings
- `GET /api/dashboards/:dashboardId/settings` - Get dashboard settings (labels, visibility, grid size, notes)
- `PUT /api/dashboards/:dashboardId/settings` - Update dashboard settings
  - Body: Labels, hide flags, grid dimensions, notes

#### Users
- `GET /api/dashboards/:dashboardId/users` - Get users for a specific dashboard
- `GET /api/users/:userId` - Get specific user
- `POST /api/dashboards/:dashboardId/users` - Create a new user
  - Body: `{ "name": "string", "presence": "present|remote|trip|off", "team": "string", ... }`
- `PUT /api/users/:userId` - Update user information
  - Body: Any user fields to update
- `DELETE /api/users/:userId` - Delete user
