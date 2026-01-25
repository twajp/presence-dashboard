import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Draggable from 'react-draggable';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams, GridRowModel } from '@mui/x-data-grid';
import {
  Button,
  CircularProgress,
  Box,
  Switch,
  FormControlLabel,
  ThemeProvider,
  createTheme,
  CssBaseline,
  useMediaQuery
} from '@mui/material';

// --- 1. Type Definitions ---
type PresenceStatus = 'present' | 'remote' | 'trip' | 'off';

type User = {
  id: number;
  name: string;
  presence: PresenceStatus;
  note1?: string;
  note2?: string;
  check1?: boolean;
  check2?: boolean;
  x: number;
  y: number;
  team?: string;
  order?: number;
  dashboard_id?: number;
};

type Seat = {
  id: number;
  x: number;
  y: number;
  status: PresenceStatus;
  userId?: number;
  user?: User;
};

// --- 2. Constants and Helper Functions ---
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STATUS_COLOR: Record<PresenceStatus, string> = {
  present: '#4caf50',
  remote: '#2196f3',
  trip: '#ffc107',
  off: '#9e9e9e',
};

const STATUS_ORDER: PresenceStatus[] = ['present', 'remote', 'trip', 'off'];

/**
 * Cycles through the presence statuses in order
 */
const nextStatus = (status: PresenceStatus): PresenceStatus => {
  const index = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
};

// --- 3. Seat Component (SeatItem) ---
function SeatItem({
  seat,
  onUpdate,
  users,
  isEditMode,
}: {
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
          // Prevent status change if the item was dragged or if we are in edit mode
          if (draggedRef.current || isEditMode) return;
          const nextPresence = nextStatus(seat.status);
          onUpdate(seat.id, { presence: nextPresence });
        }}
        style={{
          width: 100,
          height: 50,
          backgroundColor: STATUS_COLOR[seat.status],
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          cursor: isEditMode ? 'move' : 'pointer',
          userSelect: 'none',
          position: 'absolute',
          outline: isEditMode ? '2px solid #2196f3' : 'none',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          fontSize: 12,
          zIndex: isEditMode ? 100 : 1,
          color: '#fff',
        }}
      >
        {user && <div style={{ fontSize: 16 }}>{user.name}</div>}
      </div>
    </Draggable>
  );
}

// --- 4. Main Application (App) ---
export default function App() {
  // Detect system dark mode preference
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // Create MUI theme based on system preference
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
        },
      }),
    [prefersDarkMode]
  );

  const [users, setUsers] = useState<User[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardId] = useState<number>(1);
  const [isEditMode, setIsEditMode] = useState(false);

  /**
   * Fetches user data and initializes seat positions
   */
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${dashboardId}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data: User[] = await response.json();
      setUsers(data);

      const newSeats: Seat[] = data.map((user) => ({
        id: user.id,
        x: user.x || 0,
        y: user.y || 0,
        status: user.presence,
        userId: user.id,
        user: user,
      }));
      setSeats(newSeats);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [dashboardId]);

  /**
   * Initial fetch and polling setup
   * Polling is disabled while in Edit Mode to prevent UI jumps
   */
  useEffect(() => {
    fetchUsers();
    let interval: any;
    if (!isEditMode) {
      interval = setInterval(fetchUsers, 10000);
    }
    return () => clearInterval(interval);
  }, [fetchUsers, isEditMode]);

  /**
   * Updates user data on the server and performs an optimistic UI update
   */
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

      // Optimistic Updates
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...data } : u)));
      setSeats((prev) =>
        prev.map((seat) =>
          seat.id === id
            ? {
              ...seat,
              x: data.x !== undefined ? data.x : seat.x,
              y: data.y !== undefined ? data.y : seat.y,
              status: (data.presence as PresenceStatus) || seat.status,
            }
            : seat
        )
      );
    } catch (error) {
      console.error('Error updating seat:', error);
      fetchUsers(); // Revert on error
    }
  }, [users, fetchUsers]);

  /**
   * Handles cell editing in the DataGrid
   */
  const handleProcessRowUpdate = async (newRow: GridRowModel) => {
    await updateSeat(newRow.id as number, {
      note1: newRow.note1,
      note2: newRow.note2,
    });
    return newRow;
  };

  const columns: GridColDef[] = [
    { field: 'team', headerName: 'Team', width: 120 },
    { field: 'name', headerName: 'Name', width: 120 },
    {
      field: 'presence',
      headerName: 'Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size='small'
          variant='contained'
          disabled={isEditMode}
          onClick={() => {
            const nextPresence = nextStatus(params.row.presence as PresenceStatus);
            updateSeat(params.row.id as number, { presence: nextPresence });
          }}
          sx={{
            height: '30px',
            width: '100%',
            backgroundColor: STATUS_COLOR[params.row.presence as PresenceStatus],
            color: '#fff',
            '&:hover': {
              opacity: 0.8,
              backgroundColor: STATUS_COLOR[params.row.presence as PresenceStatus]
            },
          }}
        >
          {params.row.presence}
        </Button>
      ),
    },
    { field: 'note1', headerName: 'Note 1', flex: 1, editable: true },
    { field: 'note2', headerName: 'Note 2', flex: 1, editable: true },
  ];

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' height='100vh'>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{ display: 'flex', width: '100vw', height: '100vh', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{
          padding: '10px 20px',
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '20px' }}>Presence Dashboard</h1>
          <FormControlLabel
            label={isEditMode ? "Edit Mode" : "View Mode"}
            control={<Switch checked={isEditMode} onChange={(e) => setIsEditMode(e.target.checked)} />}
          />
        </div>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Floor Map Section */}
          <div style={{
            flex: 1,
            position: 'relative',
            // Show grid dots when in edit mode
            backgroundImage: isEditMode ? `radial-gradient(${theme.palette.divider} 1px, transparent 1px)` : 'none',
            backgroundSize: '20px 20px',
          }}>
            {seats.map((seat) => (
              <SeatItem
                key={seat.id}
                seat={seat}
                onUpdate={updateSeat}
                users={users}
                isEditMode={isEditMode}
              />
            ))}
          </div>

          {/* List/DataGrid Section */}
          <div style={{ width: '67vw', borderLeft: `1px solid ${theme.palette.divider}` }}>
            <DataGrid
              rows={users}
              columns={columns}
              processRowUpdate={handleProcessRowUpdate}
              hideFooter
              sx={{ border: 'none' }}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
