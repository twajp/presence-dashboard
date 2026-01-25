import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Draggable from 'react-draggable';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Button, CircularProgress, Box, Switch, FormControlLabel, ThemeProvider,
  createTheme, CssBaseline, useMediaQuery, Select, MenuItem, FormControl,
  InputLabel, Typography, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';

type PresenceStatus = 'present' | 'remote' | 'trip' | 'off';
type Dashboard = { id: number; dashboard_name: string; };
type User = {
  id: number; name: string; presence: PresenceStatus;
  note1?: string; note2?: string; x: number; y: number;
  team?: string; dashboard_id?: number;
};
type Seat = { id: number; x: number; y: number; status: PresenceStatus; userId?: number; };

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const STATUS_COLOR: Record<PresenceStatus, string> = {
  present: '#4caf50', remote: '#2196f3', trip: '#ffc107', off: '#9e9e9e',
};
const STATUS_ORDER: PresenceStatus[] = ['present', 'remote', 'trip', 'off'];
const nextStatus = (status: PresenceStatus): PresenceStatus => {
  const index = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
};

function SeatItem({ seat, onUpdate, users, isEditMode }: {
  seat: Seat; onUpdate: (id: number, data: Partial<User>) => void;
  users: User[]; isEditMode: boolean;
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
          width: 100, height: 50, backgroundColor: STATUS_COLOR[seat.status],
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontWeight: 'bold', cursor: isEditMode ? 'move' : 'pointer',
          userSelect: 'none', position: 'absolute', color: '#fff', fontSize: 12,
          outline: isEditMode ? '2px solid #2196f3' : 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)', borderRadius: '4px', zIndex: isEditMode ? 100 : 1
        }}
      >
        {user && <div style={{ fontSize: 14 }}>{user.name}</div>}
      </div>
    </Draggable>
  );
}

export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => createTheme({ palette: { mode: prefersDarkMode ? 'dark' : 'light' } }), [prefersDarkMode]);

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  // Fix: Initialize with '' to avoid MUI out-of-range error before dashboards fetch
  const [dashboardId, setDashboardId] = useState<number | ''>(() => {
    const saved = localStorage.getItem('selectedDashboardId');
    return saved ? Number(saved) : '';
  });

  const [users, setUsers] = useState<User[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const [openAdd, setOpenAdd] = useState(false);
  const [openAddDb, setOpenAddDb] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', team: '' });
  const [newDbName, setNewDbName] = useState('');

  const fetchDashboards = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboards`);
      const data = await res.json();
      setDashboards(data);
      // Auto-select first dashboard if none selected
      if (data.length > 0 && dashboardId === '') {
        setDashboardId(data[0].id);
      }
    } catch (err) { console.error("Failed to fetch dashboards", err); }
  }, [dashboardId]);

  const fetchUsers = useCallback(async () => {
    if (dashboardId === '') return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${dashboardId}`);
      const data: User[] = await response.json();
      setUsers(data);
      setSeats(data.map(u => ({ id: u.id, x: u.x || 0, y: u.y || 0, status: u.presence, userId: u.id })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [dashboardId]);

  useEffect(() => { fetchDashboards(); }, [fetchDashboards]);

  useEffect(() => {
    if (dashboardId !== '') {
      fetchUsers();
      let interval = !isEditMode ? setInterval(fetchUsers, 10000) : undefined;
      return () => clearInterval(interval);
    }
  }, [fetchUsers, isEditMode, dashboardId]);

  const updateSeat = useCallback(async (id: number, data: Partial<User>) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const payload = { ...user, ...data };
    await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    setSeats(prev => prev.map(s => s.id === id ? { ...s, status: data.presence || s.status, x: data.x ?? s.x, y: data.y ?? s.y } : s));
  }, [users]);

  const handleAddMember = async () => {
    const payload = { ...newUser, presence: 'present', dashboard_id: dashboardId, x: 0, y: 0, order: users.length };
    await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setOpenAdd(false);
    setNewUser({ name: '', team: '' });
    fetchUsers();
  };

  const handleDeleteMember = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    await fetch(`${API_BASE_URL}/api/users/${id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const handleAddDashboard = async () => {
    const res = await fetch(`${API_BASE_URL}/api/dashboards`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboard_name: newDbName }),
    });
    const data = await res.json();
    setOpenAddDb(false);
    setNewDbName('');
    await fetchDashboards();
    if (data.id) {
      setDashboardId(data.id);
      localStorage.setItem('selectedDashboardId', data.id.toString());
    }
  };

  const columns: GridColDef[] = [
    { field: 'team', headerName: 'Team', width: 120 },
    { field: 'name', headerName: 'Name', width: 120 },
    {
      field: 'presence', headerName: 'Status', width: 100,
      renderCell: (p) => (
        <Button size='small' variant='contained' disabled={isEditMode}
          onClick={() => updateSeat(p.row.id, { presence: nextStatus(p.row.presence) })}
          sx={{ width: '100%', backgroundColor: STATUS_COLOR[p.row.presence as PresenceStatus], color: '#fff', '&:hover': { opacity: 0.8, backgroundColor: STATUS_COLOR[p.row.presence as PresenceStatus] } }}
        > {p.row.presence} </Button>
      ),
    },
    { field: 'note1', headerName: 'Note 1', flex: 1, editable: true },
    { field: 'note2', headerName: 'Note 2', flex: 1, editable: true },
    ...(isEditMode ? [{
      field: 'actions', headerName: '', width: 50,
      renderCell: (p: any) => (
        <IconButton color="error" onClick={() => handleDeleteMember(p.row.id)}><DeleteIcon /></IconButton>
      )
    }] : [])
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex" flexDirection="column" width="100vw" height="100vh">
        <Box px={3} py={1} display="flex" alignItems="center" bgcolor="background.paper" borderBottom={1} borderColor="divider" sx={{ height: '64px', position: 'relative' }}>
          <Typography variant="h6" fontWeight="bold">Presence Dashboard</Typography>

          <Box position="absolute" left="50%" sx={{ transform: 'translateX(-50%)', minWidth: 280, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="db-select-label">Select Dashboard</InputLabel>
              <Select
                labelId="db-select-label"
                label="Select Dashboard"
                value={dashboards.length > 0 ? dashboardId : ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setLoading(true);
                  setDashboardId(val);
                  localStorage.setItem('selectedDashboardId', val.toString());
                }}
              >
                {dashboards.map(db => <MenuItem key={db.id} value={db.id}>{db.dashboard_name}</MenuItem>)}
              </Select>
            </FormControl>
            <Tooltip title="Add New Dashboard">
              <IconButton color="primary" onClick={() => setOpenAddDb(true)}>
                <DashboardCustomizeIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ marginLeft: 'auto' }} display="flex" gap={2}>
            {isEditMode && <Button startIcon={<AddIcon />} variant="contained" onClick={() => setOpenAdd(true)}>Add Member</Button>}
            <FormControlLabel control={<Switch checked={isEditMode} onChange={(e) => setIsEditMode(e.target.checked)} />} label={isEditMode ? "Edit Mode" : "View Mode"} />
          </Box>
        </Box>

        {loading && dashboardId !== '' ? <Box flex={1} display="flex" justifyContent="center" alignItems="center"><CircularProgress /></Box> : (
          <Box display="flex" flex={1} overflow="hidden">
            <Box flex={1} position="relative" sx={{ backgroundImage: isEditMode ? `radial-gradient(${theme.palette.divider} 1px, transparent 1px)` : 'none', backgroundSize: '20px 20px', overflow: 'auto', bgcolor: 'background.default' }}>
              {seats.map(s => <SeatItem key={s.id} seat={s} onUpdate={updateSeat} users={users} isEditMode={isEditMode} />)}
            </Box>
            <Box width="60vw" borderLeft={1} borderColor="divider">
              <DataGrid
                rows={users}
                columns={columns}
                processRowUpdate={async (n) => { await updateSeat(n.id, { note1: n.note1, note2: n.note2 }); return n; }}
                hideFooter
                sx={{ border: 'none' }}
              />
            </Box>
          </Box>
        )}

        {/* Dialogs remain the same */}
        <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogContent><Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Name" fullWidth value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
            <TextField label="Team" fullWidth value={newUser.team} onChange={e => setNewUser({ ...newUser, team: e.target.value })} />
          </Box></DialogContent>
          <DialogActions><Button onClick={() => setOpenAdd(false)}>Cancel</Button><Button onClick={handleAddMember} variant="contained">Add</Button></DialogActions>
        </Dialog>

        <Dialog open={openAddDb} onClose={() => setOpenAddDb(false)}>
          <DialogTitle>New Dashboard</DialogTitle>
          <DialogContent><Box pt={1}><TextField label="Dashboard Name" fullWidth autoFocus value={newDbName} onChange={e => setNewDbName(e.target.value)} /></Box></DialogContent>
          <DialogActions><Button onClick={() => setOpenAddDb(false)}>Cancel</Button><Button onClick={handleAddDashboard} variant="contained" disabled={!newDbName}>Create</Button></DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
