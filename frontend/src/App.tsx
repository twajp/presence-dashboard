import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Draggable from 'react-draggable';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import {
  Button, CircularProgress, Box, ThemeProvider,
  createTheme, CssBaseline, useMediaQuery, Select, MenuItem, FormControl,
  InputLabel, Typography, IconButton, Dialog, DialogTitle, DialogContent,
  TextField, DialogActions, Stack, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DashboardCustomizeIcon from '@mui/icons-material/DashboardCustomize';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';

type PresenceStatus = 'present' | 'remote' | 'trip' | 'off';
type Dashboard = { id: number; dashboard_name: string; };
type User = {
  id: number; name: string; presence: PresenceStatus;
  note1?: string; note2?: string; note3?: string;
  check1?: boolean; check2?: boolean; check3?: boolean;
  x: number; y: number;
  team?: string; dashboard_id?: number; order: number;
  updated_at?: string;
};
type Seat = { id: number; x: number; y: number; status: PresenceStatus; userId?: number; };

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000');

const STATUS_CONFIG: Record<PresenceStatus, { color: string; label: string }> = {
  present: { color: '#4caf50', label: 'Present' },
  remote: { color: '#2196f3', label: 'Remote' },
  trip: { color: '#ffc107', label: 'Trip' },
  off: { color: '#9e9e9e', label: 'Off' },
};

const STATUS_ORDER: PresenceStatus[] = ['present', 'remote', 'trip', 'off'];

// --- Sub-Components ---

function PresenceDialog({ open, onClose, currentStatus, onSelect }: {
  open: boolean; onClose: () => void; currentStatus?: PresenceStatus; onSelect: (status: PresenceStatus) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>Set Presence</DialogTitle>
      <DialogContent>
        <Stack spacing={2} py={1}>
          {STATUS_ORDER.map((status) => (
            <Button
              key={status}
              variant={currentStatus === status ? 'contained' : 'outlined'}
              onClick={() => { onSelect(status); onClose(); }}
              sx={{
                py: 1.5,
                borderColor: STATUS_CONFIG[status].color,
                color: currentStatus === status ? '#fff' : STATUS_CONFIG[status].color,
                backgroundColor: currentStatus === status ? STATUS_CONFIG[status].color : 'transparent',
                '&:hover': { backgroundColor: STATUS_CONFIG[status].color, color: '#fff' }
              }}
            >
              {STATUS_CONFIG[status].label}
            </Button>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function SeatItem({ seat, onUpdate, users, isEditMode, onStatusClick }: {
  seat: Seat; onUpdate: (id: number, data: Partial<User>) => void;
  users: User[]; isEditMode: boolean; onStatusClick: (user: User) => void;
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
          if (draggedRef.current || isEditMode || !user) return;
          onStatusClick(user);
        }}
        style={{
          width: 100, height: 50, backgroundColor: STATUS_CONFIG[seat.status].color,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: isEditMode ? 'move' : 'pointer',
          userSelect: 'none', position: 'absolute', color: '#fff', fontSize: 16,
          outline: isEditMode ? '2px solid #2196f3' : 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)', borderRadius: '4px', zIndex: isEditMode ? 100 : 1
        }}
      >
        {user && <div >{user.name}</div>}
      </div>
    </Draggable>
  );
}

// --- Main App ---

export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(() => createTheme({ palette: { mode: prefersDarkMode ? 'dark' : 'light' } }), [prefersDarkMode]);

  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [dashboardId, setDashboardId] = useState<number | ''>(() => {
    const saved = localStorage.getItem('selectedDashboardId');
    return saved ? Number(saved) : '';
  });

  const [users, setUsers] = useState<User[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  const [headers, setHeaders] = useState({
    team_label: 'Team',
    name_label: 'Name',
    note1_label: 'Note 1',
    note2_label: 'Note 2',
    note3_label: 'Note 3',
    check1_label: 'Check 1',
    check2_label: 'Check 2',
    check3_label: 'Check 3',
    updated_at_label: 'Last Updated',
    grid_width: 40,
    grid_height: 70,
    notes: ''
  });
  const [editingHeader, setEditingHeader] = useState<string | null>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [openAddDb, setOpenAddDb] = useState(false);
  const [openDbSettings, setOpenDbSettings] = useState(false);
  const [presenceTarget, setPresenceTarget] = useState<User | null>(null);
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [gridWidth, setGridWidth] = useState(40);
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const [gridHeight, setGridHeight] = useState(70);
  const [notes, setNotes] = useState('');

  const [newUser, setNewUser] = useState({ name: '', team: '' });
  const [newDbName, setNewDbName] = useState('');
  const [editDbName, setEditDbName] = useState('');

  const fetchDashboards = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboards`);
      const data = await res.json();
      setDashboards(data);
      if (data.length > 0 && dashboardId === '') {
        setDashboardId(data[0].id);
      }
    } catch (err) { console.error('Failed to fetch dashboards', err); }
  }, [dashboardId]);

  const fetchHeaderLabels = useCallback(async () => {
    if (dashboardId === '') return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/columns/${dashboardId}`);
      const data = await res.json();
      setHeaders({
        team_label: data.team_label || 'Team',
        name_label: data.name_label || 'Name',
        note1_label: data.note1_label || 'Note 1',
        note2_label: data.note2_label || 'Note 2',
        note3_label: data.note3_label || 'Note 3',
        check1_label: data.check1_label || 'Check 1',
        check2_label: data.check2_label || 'Check 2',
        check3_label: data.check3_label || 'Check 3',
        updated_at_label: data.updated_at_label || 'Last Updated',
        grid_width: data.grid_width ?? 40,
        grid_height: data.grid_height ?? 70,
        notes: data.notes || ''
      });
      setGridWidth(data.grid_width ?? 40);
      setGridHeight(data.grid_height ?? 70);
      setNotes(data.notes || '');
    } catch (err) { console.error(err); }
  }, [dashboardId]);

  const fetchUsers = useCallback(async () => {
    if (dashboardId === '') return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${dashboardId}`);
      const data: User[] = await response.json();
      const sortedData = [...data].sort((a, b) => a.order - b.order);
      setUsers(sortedData);
      setSeats(sortedData.map(u => ({ id: u.id, x: u.x || 0, y: u.y || 0, status: u.presence, userId: u.id })));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [dashboardId]);

  useEffect(() => { fetchDashboards(); }, [fetchDashboards]);

  useEffect(() => {
    if (dashboardId !== '') {
      fetchUsers();
      fetchHeaderLabels();
      let interval = !isEditMode ? setInterval(fetchUsers, 10000) : undefined;
      return () => clearInterval(interval);
    }
  }, [fetchUsers, fetchHeaderLabels, isEditMode, dashboardId]);

  const updateSeat = useCallback(async (id: number, data: Partial<User>) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const payload = { ...user, ...data };
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (result.user) {
      setUsers(prev => {
        const updated = prev.map(u => u.id === id ? result.user : u);
        return updated.sort((a, b) => a.order - b.order);
      });
      setSeats(prev => prev.map(s => s.id === id ? { ...s, status: result.user.presence || s.status, x: result.user.x ?? s.x, y: result.user.y ?? s.y } : s));
    }
  }, [users]);

  const saveHeader = async (newHeaders: typeof headers) => {
    if (dashboardId === '') return;
    await fetch(`${API_BASE_URL}/api/columns/${dashboardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHeaders),
    });
    setEditingHeader(null);
  };

  const saveGridWidth = async (width: number) => {
    if (dashboardId === '') return;
    const newHeaders = { ...headers, grid_width: width };
    setHeaders(newHeaders);
    await fetch(`${API_BASE_URL}/api/columns/${dashboardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHeaders),
    });
  };

  const handleWidthResizeStart = () => {
    if (!isEditMode) return;
    setIsResizingWidth(true);
  };

  const handleHeightResizeStart = () => {
    if (!isEditMode) return;
    setIsResizingHeight(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizingWidth) {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 10 && newWidth < 90) {
        setGridWidth(newWidth);
      }
    } else if (isResizingHeight) {
      const leftPanel = document.getElementById('left-panel');
      if (leftPanel) {
        const rect = leftPanel.getBoundingClientRect();
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
        if (newHeight > 10 && newHeight < 90) {
          setGridHeight(newHeight);
        }
      }
    }
  }, [isResizingWidth, isResizingHeight]);

  const handleMouseUp = useCallback(() => {
    if (isResizingWidth) {
      setIsResizingWidth(false);
      saveGridWidth(gridWidth);
    } else if (isResizingHeight) {
      setIsResizingHeight(false);
      saveGridHeight(gridHeight);
    }
  }, [isResizingWidth, isResizingHeight, gridWidth, gridHeight]);

  const saveGridHeight = async (height: number) => {
    if (dashboardId === '') return;
    const newHeaders = { ...headers, grid_height: height };
    setHeaders(newHeaders);
    await fetch(`${API_BASE_URL}/api/columns/${dashboardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHeaders),
    });
  };

  const saveNotes = async (newNotes: string) => {
    if (dashboardId === '') return;
    const newHeaders = { ...headers, notes: newNotes };
    setHeaders(newHeaders);
    await fetch(`${API_BASE_URL}/api/columns/${dashboardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHeaders),
    });
  };

  useEffect(() => {
    if (isResizingWidth || isResizingHeight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizingWidth, isResizingHeight, handleMouseMove, handleMouseUp]);

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= users.length) return;
    const currentItem = { ...users[index] };
    const targetItem = { ...users[targetIndex] };
    const tempOrder = currentItem.order;
    currentItem.order = targetItem.order;
    targetItem.order = tempOrder;
    await Promise.all([
      updateSeat(currentItem.id, { order: currentItem.order }),
      updateSeat(targetItem.id, { order: targetItem.order })
    ]);
    fetchUsers();
  };

  const handleAddMember = async () => {
    const maxOrder = users.length > 0 ? Math.max(...users.map(u => u.order)) : 0;
    const payload = { ...newUser, presence: 'present', dashboard_id: dashboardId, x: 0, y: 0, order: maxOrder + 1 };
    await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setOpenAdd(false);
    setNewUser({ name: '', team: '' });
    fetchUsers();
  };

  const handleDeleteMember = async (id: number) => {
    if (!window.confirm('Are you sure?')) return;
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

  const handleUpdateDashboard = async () => {
    if (dashboardId === '') return;
    await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboard_name: editDbName }),
    });
    setOpenDbSettings(false);
    fetchDashboards();
  };

  const EditableHeader = ({ label, fieldKey }: { label: string, fieldKey: keyof typeof headers }) => {
    const [tempValue, setTempValue] = useState(label);
    if (isEditMode && editingHeader === fieldKey) {
      return (
        <TextField
          variant='standard'
          autoFocus
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={() => {
            const next = { ...headers, [fieldKey]: tempValue };
            setHeaders(next);
            saveHeader(next);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const next = { ...headers, [fieldKey]: tempValue };
              setHeaders(next);
              saveHeader(next);
            }
          }}
          sx={{ input: { fontSize: '0.875rem', fontWeight: 'bold' } }}
        />
      );
    }
    return (
      <Box
        sx={{ cursor: isEditMode ? 'pointer' : 'inherit', width: '100%' }}
        onClick={() => isEditMode && setEditingHeader(fieldKey)}
      >
        {label}
      </Box>
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'team', headerName: headers.team_label, width: 120,
      editable: isEditMode, sortable: false, disableColumnMenu: true,
      renderHeader: () => <EditableHeader label={headers.team_label} fieldKey='team_label' />
    },
    {
      field: 'name', headerName: headers.name_label, width: 120,
      editable: isEditMode, sortable: false, disableColumnMenu: true,
      renderHeader: () => <EditableHeader label={headers.name_label} fieldKey='name_label' />
    },
    {
      field: 'presence', headerName: 'Status', width: 100, sortable: false, disableColumnMenu: true,
      renderCell: (p) => (
        <Button size='small' variant='contained' disabled={isEditMode}
          onClick={() => setPresenceTarget(p.row as User)}
          sx={{
            width: '100%',
            height: '100%',
            backgroundColor: STATUS_CONFIG[p.row.presence as PresenceStatus].color,
            color: '#fff',
            '&:hover': { opacity: 0.8, backgroundColor: STATUS_CONFIG[p.row.presence as PresenceStatus].color }
          }}
        > {STATUS_CONFIG[p.row.presence as PresenceStatus].label} </Button>
      ),
    },
    {
      field: 'note1', headerName: headers.note1_label, flex: 1,
      editable: true, sortable: false, disableColumnMenu: true,
      renderHeader: () => <EditableHeader label={headers.note1_label} fieldKey='note1_label' />
    },
    {
      field: 'note2', headerName: headers.note2_label, flex: 1,
      editable: true, sortable: false, disableColumnMenu: true,
      renderHeader: () => <EditableHeader label={headers.note2_label} fieldKey='note2_label' />
    },
    {
      field: 'note3', headerName: headers.note3_label, flex: 1,
      editable: true, sortable: false, disableColumnMenu: true,
      renderHeader: () => <EditableHeader label={headers.note3_label} fieldKey='note3_label' />
    },
    {
      field: 'check1', headerName: headers.check1_label, width: 80,
      sortable: false, disableColumnMenu: true,
      renderHeader: () => <EditableHeader label={headers.check1_label} fieldKey='check1_label' />,
      renderCell: (p) => (
        <Box display='flex' justifyContent='center' alignItems='center' width='100%' height='100%'>
          <input
            type='checkbox'
            checked={p.row.check1 || false}
            onChange={(e) => updateSeat(p.row.id, { check1: e.target.checked })}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
        </Box>
      ),
    },
    {
      field: 'check2', headerName: headers.check2_label, width: 80,
      sortable: false, disableColumnMenu: true,
      renderHeader: () => <EditableHeader label={headers.check2_label} fieldKey='check2_label' />,
      renderCell: (p) => (
        <Box display='flex' justifyContent='center' alignItems='center' width='100%' height='100%'>
          <input
            type='checkbox'
            checked={p.row.check2 || false}
            onChange={(e) => updateSeat(p.row.id, { check2: e.target.checked })}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
        </Box>
      ),
    },
    {
      field: 'check3', headerName: headers.check3_label, width: 80,
      sortable: false, disableColumnMenu: true,
      renderHeader: () => <EditableHeader label={headers.check3_label} fieldKey='check3_label' />,
      renderCell: (p) => (
        <Box display='flex' justifyContent='center' alignItems='center' width='100%' height='100%'>
          <input
            type='checkbox'
            checked={p.row.check3 || false}
            onChange={(e) => updateSeat(p.row.id, { check3: e.target.checked })}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
        </Box>
      ),
    },
    {
      field: 'updated_at', headerName: headers.updated_at_label, width: 150,
      editable: false, sortable: false, disableColumnMenu: true,
      renderHeader: () => <EditableHeader label={headers.updated_at_label} fieldKey='updated_at_label' />,
      renderCell: (p) => {
        if (!p.row.updated_at) return null;
        const date = new Date(p.row.updated_at);
        return date.toLocaleString('ja-JP', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit'
        });
      },
    },
    ...(isEditMode ? [{
      field: 'actions', headerName: 'Actions', width: 140, sortable: false, disableColumnMenu: true,
      renderCell: (p: any) => {
        const index = users.findIndex(u => u.id === p.row.id);
        return (
          <Stack direction='row' spacing={0}>
            <IconButton size='small' disabled={index === 0} onClick={() => handleMove(index, 'up')}>
              <ArrowUpwardIcon fontSize='small' />
            </IconButton>
            <IconButton size='small' disabled={index === users.length - 1} onClick={() => handleMove(index, 'down')}>
              <ArrowDownwardIcon fontSize='small' />
            </IconButton>
            <IconButton size='small' color='error' onClick={() => handleDeleteMember(p.row.id)}>
              <DeleteIcon fontSize='small' />
            </IconButton>
          </Stack>
        )
      }
    }] : [])
  ];

  const currentDashboardName = dashboards.find(d => d.id === dashboardId)?.dashboard_name || '';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display='flex' flexDirection='column' width='100vw' height='100vh'>
        <Box px={3} py={1} display='flex' alignItems='center' bgcolor='background.paper' borderBottom={1} borderColor='divider' sx={{ height: '64px' }}>
          <Typography variant='h6' fontWeight='bold' sx={{ display: { xs: 'none', md: 'block' } }}>Presence Dashboard</Typography>

          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center' }}>
            <FormControl size='small' sx={{ minWidth: 200 }}>
              <InputLabel id='db-select-label'>Select Dashboard</InputLabel>
              <Select
                labelId='db-select-label'
                label='Select Dashboard'
                value={dashboards.length > 0 ? dashboardId : ''}
                disabled={isEditMode}
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

            <Tooltip title='Add Dashboard'>
              <IconButton color='primary' onClick={() => setOpenAddDb(true)}><DashboardCustomizeIcon /></IconButton>
            </Tooltip>

            {isEditMode && dashboardId !== '' && (
              <Tooltip title='Dashboard Settings'>
                <IconButton color='secondary' onClick={() => {
                  setEditDbName(currentDashboardName);
                  setOpenDbSettings(true);
                }}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box display='flex' gap={1} alignItems='center'>
            {isEditMode ? (
              <>
                <Button
                  startIcon={<AddIcon />}
                  variant='outlined'
                  size="small"
                  onClick={() => setOpenAdd(true)}
                >
                  Add Member
                </Button>
                <Button
                  startIcon={<CheckIcon />}
                  variant='contained'
                  color='primary'
                  size="small"
                  onClick={() => { setIsEditMode(false); setEditingHeader(null); }}
                  sx={{ minWidth: '80px' }}
                >
                  Done
                </Button>
              </>
            ) : (
              <Button
                startIcon={<EditIcon />}
                variant='outlined'
                size="small"
                onClick={() => setIsEditMode(true)}
                sx={{ minWidth: '80px' }}
              >
                Edit
              </Button>
            )}
          </Box>
        </Box>

        {loading && dashboardId !== '' ? <Box flex={1} display='flex' justifyContent='center' alignItems='center'><CircularProgress /></Box> : (
          <Box display='flex' flex={1} overflow='hidden'>
            <Box id='left-panel' width={`${gridWidth}%`} display='flex' flexDirection='column' overflow='hidden'>
              <Box height={`${gridHeight}%`} position='relative' sx={{ backgroundImage: isEditMode ? `radial-gradient(${theme.palette.divider} 1px, transparent 1px)` : 'none', backgroundSize: '20px 20px', overflow: 'auto', bgcolor: 'background.default' }}>
                {seats.map(s => <SeatItem key={s.id} seat={s} onUpdate={updateSeat} users={users} isEditMode={isEditMode} onStatusClick={(u) => setPresenceTarget(u)} />)}
              </Box>
              <Box
                sx={{
                  height: '5px',
                  cursor: isEditMode ? 'row-resize' : 'default',
                  bgcolor: isResizingHeight ? 'primary.main' : 'divider',
                  '&:hover': isEditMode ? { bgcolor: 'primary.main' } : {},
                  transition: 'background-color 0.2s'
                }}
                onMouseDown={handleHeightResizeStart}
              />
              <Box flex={1} overflow='auto' p={2} bgcolor='background.paper'>
                <TextField
                  multiline
                  fullWidth
                  variant='outlined'
                  label='Notes'
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => saveNotes(notes)}
                  minRows={4}
                  sx={{ height: '100%', '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' } }}
                />
              </Box>
            </Box>
            <Box
              sx={{
                width: '5px',
                cursor: isEditMode ? 'col-resize' : 'default',
                bgcolor: isResizingWidth ? 'primary.main' : 'divider',
                '&:hover': isEditMode ? { bgcolor: 'primary.main' } : {},
                transition: 'background-color 0.2s'
              }}
              onMouseDown={handleWidthResizeStart}
            />
            <Box flex={1} borderLeft={1} borderColor='divider' sx={{ minWidth: 0 }}>
              <DataGrid
                rows={users}
                columns={columns}
                columnHeaderHeight={28}
                rowHeight={28}
                processRowUpdate={async (n) => {
                  await updateSeat(n.id, { team: n.team, name: n.name, note1: n.note1, note2: n.note2, note3: n.note3 });
                  return n;
                }}
                hideFooter
                sx={{ border: 'none' }}
              />
            </Box>
          </Box>
        )}

        <PresenceDialog open={!!presenceTarget} onClose={() => setPresenceTarget(null)} currentStatus={presenceTarget?.presence} onSelect={(status) => presenceTarget && updateSeat(presenceTarget.id, { presence: status })} />

        {/* Add Member Dialog */}
        <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogContent><Box display='flex' flexDirection='column' gap={2} pt={1}>
            <TextField label='Team' fullWidth value={newUser.team} onChange={e => setNewUser({ ...newUser, team: e.target.value })} />
            <TextField label='Name' fullWidth value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
          </Box></DialogContent>
          <DialogActions><Button onClick={() => setOpenAdd(false)}>Cancel</Button><Button onClick={handleAddMember} variant='contained'>Add</Button></DialogActions>
        </Dialog>

        {/* Dashboard Dialog */}
        <Dialog open={openAddDb} onClose={() => setOpenAddDb(false)}>
          <DialogTitle>New Dashboard</DialogTitle>
          <DialogContent><Box pt={1}><TextField label='Dashboard Name' fullWidth autoFocus value={newDbName} onChange={e => setNewDbName(e.target.value)} /></Box></DialogContent>
          <DialogActions><Button onClick={() => setOpenAddDb(false)}>Cancel</Button><Button onClick={handleAddDashboard} variant='contained' disabled={!newDbName}>Create</Button></DialogActions>
        </Dialog>

        {/* Edit Dashboard Settings Dialog */}
        <Dialog open={openDbSettings} onClose={() => setOpenDbSettings(false)}>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogContent>
            <Box pt={1}>
              <TextField
                label='Dashboard Name'
                fullWidth
                autoFocus
                value={editDbName}
                onChange={e => setEditDbName(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDbSettings(false)}>Cancel</Button>
            <Button onClick={handleUpdateDashboard} variant='contained' color='primary' disabled={!editDbName}>
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
