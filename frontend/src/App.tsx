import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Draggable from 'react-draggable';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import {
  Button,
  CircularProgress,
  Box,
  Switch,
  FormControlLabel,
  ThemeProvider,
  createTheme,
  CssBaseline,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography
} from '@mui/material';

// --- 1. Type Definitions ---
type PresenceStatus = 'present' | 'remote' | 'trip' | 'off';

type Dashboard = {
  id: number;
  dashboard_name: string;
};

type User = {
  id: number;
  name: string;
  presence: PresenceStatus;
  note1?: string;
  note2?: string;
  x: number;
  y: number;
  team?: string;
  dashboard_id?: number;
};

type Seat = {
  id: number;
  x: number;
  y: number;
  status: PresenceStatus;
  userId?: number;
};

// --- 2. Constants and Helpers ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STATUS_COLOR: Record<PresenceStatus, string> = {
  present: '#4caf50',
  remote: '#2196f3',
  trip: '#ffc107',
  off: '#9e9e9e',
};

const STATUS_ORDER: PresenceStatus[] = ['present', 'remote', 'trip', 'off'];
const nextStatus = (status: PresenceStatus): PresenceStatus => {
  const index = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
};

// --- 3. Seat Component ---
function SeatItem({ seat, onUpdate, users, isEditMode }: {
  seat: Seat;
  onUpdate: (id: number, data: Partial<User>) => void;
  users: User[];
  isEditMode: boolean;
}) {
  const draggedRef = useRef(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const user = users.find((u) => u.id === seat.userId);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: seat.x, y: seat.y }}
      grid={[10, 10]}
      disabled={!isEditMode}
      onStart={() => { draggedRef.current = false; }}
      onDrag={() => { draggedRef.current = true; }}
      onStop={(_e, data) => { onUpdate(seat.id, { x: data.x, y: data.y }); }}
    >
      <div
        ref={nodeRef}
        onClick={() => {
          if (draggedRef.current || isEditMode) return;
          onUpdate(seat.id, { presence: nextStatus(seat.status) });
        }}
        style={{
          width: 100, height: 50,
          backgroundColor: STATUS_COLOR[seat.status],
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', cursor: isEditMode ? 'move' : 'pointer',
          userSelect: 'none', position: 'absolute',
          outline: isEditMode ? '2px solid #2196f3' : 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)', color: '#fff', fontSize: 12,
          zIndex: isEditMode ? 100 : 1, borderRadius: '4px'
        }}
      >
        {user && <div style={{ fontSize: 16 }}>{user.name}</div>}
      </div>
    </Draggable>
  );
}

// --- 4. Main Application ---
export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => createTheme({ palette: { mode: prefersDarkMode ? 'dark' : 'light' } }), [prefersDarkMode]);

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [dashboardId, setDashboardId] = useState<number>(() => {
    const saved = localStorage.getItem('selectedDashboardId');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [users, setUsers] = useState<User[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch dashboard list
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/dashboards`)
      .then(res => res.json())
      .then(data => {
        setDashboards(data);
        if (data.length > 0 && !data.find((d: Dashboard) => d.id === dashboardId)) {
          setDashboardId(data[0].id);
        }
      })
      .catch(err => console.error("Fetch error:", err));
  }, []);

  // Save selection to LocalStorage
  useEffect(() => {
    localStorage.setItem('selectedDashboardId', dashboardId.toString());
  }, [dashboardId]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${dashboardId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data: User[] = await response.json();
      setUsers(data);
      setSeats(data.map(u => ({ id: u.id, x: u.x || 0, y: u.y || 0, status: u.presence, userId: u.id })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [dashboardId]);

  useEffect(() => {
    fetchUsers();
    let interval = !isEditMode ? setInterval(fetchUsers, 10000) : undefined;
    return () => clearInterval(interval);
  }, [fetchUsers, isEditMode]);

  const updateSeat = useCallback(async (id: number, data: Partial<User>) => {
    try {
      const user = users.find((u) => u.id === id);
      if (!user) return;
      const updatePayload = { ...user, ...data };
      await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
      setSeats(prev => prev.map(s => s.id === id ? { ...s, status: data.presence || s.status, x: data.x ?? s.x, y: data.y ?? s.y } : s));
    } catch (error) {
      fetchUsers();
    }
  }, [users, fetchUsers]);

  const columns: GridColDef[] = [
    { field: 'team', headerName: 'Team', width: 120 },
    { field: 'name', headerName: 'Name', width: 120 },
    {
      field: 'presence',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size='small' variant='contained' disabled={isEditMode}
          onClick={() => updateSeat(params.row.id, { presence: nextStatus(params.row.presence) })}
          sx={{ width: '100%', backgroundColor: STATUS_COLOR[params.row.presence as PresenceStatus], color: '#fff' }}
        >
          {params.row.presence}
        </Button>
      ),
    },
    { field: 'note1', headerName: 'Note 1', flex: 1, editable: true },
    { field: 'note2', headerName: 'Note 2', flex: 1, editable: true },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex" flexDirection="column" width="100vw" height="100vh">

        {/* --- Centered Header Layout --- */}
        <Box
          px={3} py={1}
          display="flex"
          alignItems="center"
          bgcolor="background.paper"
          borderBottom={1}
          borderColor="divider"
          position="relative" // Allows absolute centering for the middle element
          sx={{ height: '64px' }}
        >
          {/* Left: Title */}
          <Typography variant="h6" fontWeight="bold" sx={{ flexShrink: 0 }}>
            Presence Dashboard
          </Typography>

          {/* Center: Dashboard Selector */}
          <Box
            position="absolute"
            left="50%"
            sx={{ transform: 'translateX(-50%)', minWidth: 250 }}
          >
            <FormControl size="small" fullWidth>
              <InputLabel id="dashboard-select-label">Select Dashboard</InputLabel>
              <Select
                labelId="dashboard-select-label"
                value={dashboardId}
                label="Select Dashboard"
                onChange={(e) => {
                  setLoading(true);
                  setDashboardId(Number(e.target.value));
                }}
              >
                {dashboards.map((db) => (
                  <MenuItem key={db.id} value={db.id}>
                    {db.dashboard_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Right: Mode Switcher */}
          <Box sx={{ marginLeft: 'auto' }}>
            <FormControlLabel
              control={<Switch checked={isEditMode} onChange={(e) => setIsEditMode(e.target.checked)} />}
              label={isEditMode ? "Edit Mode" : "View Mode"}
            />
          </Box>
        </Box>

        {/* --- Content Area --- */}
        {loading ? (
          <Box flex={1} display="flex" justifyContent="center" alignItems="center"><CircularProgress /></Box>
        ) : (
          <Box display="flex" flex={1} overflow="hidden">
            <Box flex={1} position="relative" sx={{
              backgroundImage: isEditMode ? `radial-gradient(${theme.palette.divider} 1px, transparent 1px)` : 'none',
              backgroundSize: '20px 20px',
              overflow: 'auto'
            }}>
              {seats.map(seat => (
                <SeatItem key={seat.id} seat={seat} onUpdate={updateSeat} users={users} isEditMode={isEditMode} />
              ))}
            </Box>

            <Box width="67vw" borderLeft={1} borderColor="divider" bgcolor="background.paper">
              <DataGrid
                rows={users}
                columns={columns}
                processRowUpdate={async (newRow) => {
                  await updateSeat(newRow.id, { note1: newRow.note1, note2: newRow.note2 });
                  return newRow;
                }}
                hideFooter
              />
            </Box>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}
