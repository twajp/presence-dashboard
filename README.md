# Presence Dashboard
A dynamic, real-time presence management application built with React, Material UI, and React Draggable. This dashboard allows teams to visualize member status through both a grid-based list and a customizable 2D floor plan.  
## 🚀 Features
- Dual View System: * Interactive Map: Drag-and-drop seating arrangement with a dot-grid background for precision.  
  - Data Grid: A robust table view powered by MUI X DataGrid for quick editing and sorting.  
- Presence Management: Toggle between `Present`, `Remote`, `Trip`, and `Off` with color-coded visual cues.  
- Multi-Dashboard Support: Create and manage multiple office layouts or team boards.  
- Dynamic Customization: * Edit Mode: Toggle to reposition seats, add/remove members, or reorder the list.  
  - Custom Labels: Rename column headers (e.g., "Note 1" to "Project") directly from the UI.  
- Real-time Synchronization: Auto-polls the backend every 10 seconds (when not in edit mode) to keep status updates fresh across all clients.  
- Theme Aware: Built-in support for Dark/Light mode based on system preferences.

## 🛠️ Tech Stack
- Framework: React (Vite)
- UI Library: Material UI (MUI)
- Components: `@mui/x-data-grid` for the tabular view.
    - `react-draggable` for seat positioning.
- State Management: React Hooks (useCallback, useMemo, useRef).
- Icons: MUI Icons.

## 📦 How to Launch
The easiest way to get started is using Docker:  
```bash
docker compose up -d
```

## 🖥️ Usage Guide
### Managing Presence
- **View Mode**: Click on any user’s name in the map or their status button in the table to open the status selector dialog.
- **Notes**: Double-click cells in the "Note" columns within the table to update information on the fly.

### Customizing the Layout
1. Toggle the **Edit Mode** switch in the top right.
1. **Move Seats**: Click and drag seat blocks to match your physical office layout.
1. **Add/Remove**: Use the "Add Member" button or the red trash icon in the "Actions" column.
1. **Reorder**: Use the up/down arrows in the table to change the display order of team members.
1. **Rename Headers**: In edit mode, click on column headers to rename them.

