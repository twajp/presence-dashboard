import { useRef, useState, useEffect, useCallback } from 'react';
import Draggable from 'react-draggable';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams, GridRowModel } from '@mui/x-data-grid';
import { Button, CircularProgress, Box } from '@mui/material';

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

// --- Constants & Helpers ---
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
}: {
  seat: Seat;
  onUpdate: (id: number, data: Partial<User>) => void;
  users: User[];
}) {
  const draggedRef = useRef(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const user = users.find((u) => u.id === seat.userId);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: seat.x, y: seat.y }}
      grid={[10, 10]}
      onStart={() => {
        draggedRef.current = false;
      }}
      onDrag={() => {
        draggedRef.current = true;
      }}
      onStop={(_e, data) => {
        // Position update
        onUpdate(seat.id, { x: data.x, y: data.y });
      }}
    >
      <div
        ref={nodeRef}
        onClick={() => {
          if (draggedRef.current) return;
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
          cursor: 'pointer',
          userSelect: 'none',
          position: 'absolute',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          fontSize: 12,
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

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchUsers();
    // auto-refresh every 10 seconds
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, [dashboardId]);

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

  // Update seat/user info
  const updateSeat = useCallback(async (id: number, data: Partial<User>) => {
    try {
      const user = users.find((u) => u.id === id);
      if (!user) return;

      // Payload creation (merge current values with changes)
      const updatePayload = {
        name: user.name,
        presence: data.presence || user.presence,
        note1: data.note1 !== undefined ? data.note1 : user.note1 || '',
        note2: data.note2 !== undefined ? data.note2 : user.note2 || '',
        check1: user.check1 || false,
        check2: user.check2 || false,
        x: data.x !== undefined ? data.x : user.x,
        y: data.y !== undefined ? data.y : user.y,
        team: user.team,
        order: user.order,
        dashboard_id: user.dashboard_id
      };

      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) throw new Error('Failed to update user');

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...updatePayload } : u))
      );

      setSeats((prev) =>
        prev.map((seat) =>
          seat.id === id
            ? {
              ...seat,
              x: updatePayload.x,
              y: updatePayload.y,
              status: updatePayload.presence as PresenceStatus,
            }
            : seat
        )
      );

      return updatePayload;
    } catch (error) {
      console.error('Error updating seat:', error);
      fetchUsers(); // Refresh data on error
      throw error;
    }
  }, [users]);

  // DataGrid row update handler
  const handleProcessRowUpdate = async (newRow: GridRowModel) => {
    // Update note1 and note2
    await updateSeat(newRow.id as number, {
      note1: newRow.note1,
      note2: newRow.note2,
    });
    return newRow;
  };

  const columns: GridColDef[] = [
    // { field: 'id', headerName: 'ID', width: 10 },
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
              opacity: 0.8,
              backgroundColor: STATUS_COLOR[params.row.presence as PresenceStatus],
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
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ padding: '10px', backgroundColor: '#fff', borderBottom: '1px solid #ddd' }}>
        <h1 style={{ margin: '0 0 0 0', fontSize: '24px', color: '#333' }}>Presence Dashboard</h1>
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
          }}
        >
          {seats.map((seat) => (
            <SeatItem
              key={seat.id}
              seat={seat}
              onUpdate={updateSeat}
              users={users}
            />
          ))}
        </div>

        {/* Right side: Data Grid */}
        <div
          style={{
            width: '67vw',
            height: '100%',
            backgroundColor: '#fff',
            overflowY: 'auto',
          }}
        >
          <DataGrid
            rows={users}
            columns={columns}
            columnHeaderHeight={30}
            rowHeight={30}
            processRowUpdate={handleProcessRowUpdate}
            onProcessRowUpdateError={(err) => console.error(err)}
            hideFooter
            sx={{
              border: 'none',
              height: '100%',
              '& .MuiDataGrid-main': { overflow: 'hidden' }
            }}
          />
        </div>
      </div>
    </div>
  );
}
