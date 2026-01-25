import { useRef, useState, useEffect, useCallback } from 'react';
import Draggable from 'react-draggable';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams, GridRowModel } from '@mui/x-data-grid';
import { Button, CircularProgress, Box, Switch, FormControlLabel } from '@mui/material';

// --- Types ---
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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const STATUS_COLOR: Record<PresenceStatus, string> = {
  present: '#4caf50',
  remote: '#2196f3',
  trip: '#ffc107',
  off: '#e0e0e0',
};

const STATUS_ORDER: PresenceStatus[] = ['present', 'remote', 'trip', 'off'];

const nextStatus = (status: PresenceStatus): PresenceStatus => {
  const index = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
};

// --- Seat Component ---
function SeatItem({
  seat,
  onUpdate,
  users,
  isEditMode, // Receive edit mode state
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
      disabled={!isEditMode} // Draggable only in Edit Mode
      onStart={() => {
        draggedRef.current = false;
      }}
      onDrag={() => {
        draggedRef.current = true;
      }}
      onStop={(_e, data) => {
        onUpdate(seat.id, { x: data.x, y: data.y });
      }}
    >
      <div
        ref={nodeRef}
        onClick={() => {
          // Prevent status toggle if dragging or if in Edit Mode
          if (draggedRef.current || isEditMode) return;
          const nextPresence = nextStatus(seat.status);
          onUpdate(seat.id, { presence: nextPresence });
        }}
        style={{
          width: 100,
          height: 50,
          borderRadius: 0,
          backgroundColor: STATUS_COLOR[seat.status],
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          cursor: isEditMode ? 'move' : 'pointer', // Switch cursor based on mode
          userSelect: 'none',
          position: 'absolute',
          boxShadow: isEditMode ? '0 0 0 2px #2196f3' : '0 2px 6px rgba(0,0,0,0.2)', // Visual border indicator for editing
          fontSize: 12,
          zIndex: isEditMode ? 100 : 1,
        }}
      >
        {user && (
          <div
            style={{
              fontSize: 16,
              color: seat.status === 'off' ? '#333' : '#fff',
            }}
          >
            {user.name}
          </div>
        )}
      </div>
    </Draggable>
  );
}

// --- Main App Component ---
export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardId] = useState<number>(1);
  const [isEditMode, setIsEditMode] = useState(false); // Edit mode state

  useEffect(() => {
    fetchUsers();

    // Polling is disabled in Edit Mode to prevent UI overwrites during dragging
    let interval: any;
    if (!isEditMode) {
      interval = setInterval(fetchUsers, 10000);
    }
    return () => clearInterval(interval);
  }, [dashboardId, isEditMode]);

  const fetchUsers = async () => {
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
  };

  const updateSeat = useCallback(async (id: number, data: Partial<User>) => {
    try {
      const user = users.find((u) => u.id === id);
      if (!user) return;

      const updatePayload = {
        ...user,
        ...data,
      };

      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) throw new Error('Failed to update user');

      // Optimistic updates for smoother UI experience
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...data } : u))
      );

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
      fetchUsers(); // Rollback/Sync with server on error
    }
  }, [users]);

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
      display: 'flex',
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size='small'
          variant='contained'
          disabled={isEditMode} // Disable status changes from grid during Edit Mode
          onClick={() => {
            const nextPresence = nextStatus(params.row.presence as PresenceStatus);
            updateSeat(params.row.id as number, { presence: nextPresence });
          }}
          sx={{
            height: '100%',
            width: '100%',
            borderRadius: 0,
            backgroundColor: STATUS_COLOR[params.row.presence as PresenceStatus],
            color: params.row.presence === 'off' ? '#333' : '#fff',
            boxShadow: 'none',
            textTransform: 'capitalize',
            '&:hover': {
              backgroundColor: STATUS_COLOR[params.row.presence as PresenceStatus],
              opacity: 0.8,
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
    <div style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: '#f5f5f5', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '10px 20px', backgroundColor: '#fff', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>Presence Dashboard</h1>

        {/* Mode Toggle Switch */}
        <FormControlLabel
          labelPlacement='start'
          label={isEditMode ? "Edit Mode (Drag to Move)" : "View Mode"}
          control={
            <Switch
              checked={isEditMode}
              onChange={(e) => setIsEditMode(e.target.checked)}
              color="primary"
            />
          }
        />
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left side: Seat layout */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            borderRight: '1px solid #ddd',
            // Show grid dots only in Edit Mode
            backgroundImage: isEditMode ? 'radial-gradient(#ddd 1px, transparent 1px)' : 'none',
            backgroundSize: '20px 20px',
          }}
        >
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

        {/* Right side: Data Grid */}
        <div style={{ width: '67vw', height: '100%', backgroundColor: '#fff' }}>
          <DataGrid
            rows={users}
            columns={columns}
            columnHeaderHeight={35}
            rowHeight={35}
            processRowUpdate={handleProcessRowUpdate}
            onProcessRowUpdateError={(err) => console.error(err)}
            hideFooter
            sx={{ border: 'none', height: '100%' }}
          />
        </div>
      </div>
    </div>
  );
}
