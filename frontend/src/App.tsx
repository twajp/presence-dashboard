import { useRef, useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Button, CircularProgress, Box } from '@mui/material';

type PresenceStatus = 'present' | 'remote' | 'away' | 'vacant';

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
  away: '#ffc107',
  vacant: '#e0e0e0',
};

const STATUS_ORDER: PresenceStatus[] = [
  'present',
  'remote',
  'away',
  'vacant',
];

const nextStatus = (status: PresenceStatus): PresenceStatus => {
  const index = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
};

function SeatItem({
  seat,
  onUpdate,
  users,
}: {
  seat: Seat;
  onUpdate: (id: number, data: Partial<Seat>) => void;
  users: User[];
}) {
  const draggedRef = useRef(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const user = users.find(u => u.id === seat.userId);

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
      onStop={(e, data) => {
        onUpdate(seat.id, { x: data.x, y: data.y });
      }}
    >
      <div
        ref={nodeRef}
        onClick={() => {
          if (draggedRef.current) return;
          const nextPresence = nextStatus(seat.status);
          onUpdate(seat.id, { status: nextPresence });
        }}
        style={{
          width: 100,
          height: 50,
          borderRadius: 8,
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
        {user && <div style={{ fontSize: 16 }}>{user.name}</div>}
      </div>
    </Draggable>
  );
}


export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardId, setDashboardId] = useState<number>(1);

  // Initialize: fetch users from backend and set up auto-refresh
  useEffect(() => {
    fetchUsers();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchUsers, 10 *1000);
    return () => clearInterval(interval);
  }, [dashboardId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/users/${dashboardId}`);
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data);

      // Create seats from users, using stored x, y positions from database
      const newSeats = data.map((user: User) => ({
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

  const updateSeat = async (id: number, data: Partial<Seat>) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) return;

      // Prepare update payload with current user data
      const updatePayload: any = {
        name: user.name,
        presence: data.status || user.presence,
        note1: user.note1 || '',
        note2: user.note2 || '',
        check1: user.check1 || false,
        check2: user.check2 || false,
        x: data.x !== undefined ? data.x : user.x,
        y: data.y !== undefined ? data.y : user.y,
      };

      // Send update to backend
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      // Update local state after successful backend update
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, ...updatePayload } : u
        )
      );

      setSeats((prev) =>
        prev.map((seat) =>
          seat.id === id ? {
            ...seat,
            ...data,
            status: updatePayload.presence,
            user: { ...user, ...updatePayload }
          } : seat
        )
      );
    } catch (error) {
      console.error('Error updating seat:', error);
      // Revert on error
      fetchUsers();
    }
  };

  const columns: GridColDef[] = [
    // { field: 'id', headerName: 'ID', width: 90 },
    { field: 'team', headerName: 'Team', width: 120 },
    { field: 'name', headerName: 'Name', width: 120 },
    {
      field: 'presence', headerName: 'Status', width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => {
            const nextPresence = nextStatus(params.row.presence as PresenceStatus);
            updateSeat(params.row.id, { status: nextPresence });
          }}
          sx={{
            backgroundColor: STATUS_COLOR[params.row.presence as PresenceStatus],
            color: params.row.presence === 'vacant' ? '#333' : '#fff',
            textTransform: 'capitalize',
            '&:hover': {
              opacity: 0.8,
            }
          }}
        >
          {params.row.presence}
        </Button>
      )
    },
    { field: 'x', headerName: 'X', width: 70 },
    { field: 'y', headerName: 'Y', width: 70 },
    { field: 'note1', headerName: 'Note 1', width: 150 },
    { field: 'note2', headerName: 'Note 2', width: 150 },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
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
        <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Presence Dashboard</h1>
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
            overflow: 'auto',
            backgroundColor: '#fff',
          }}
        >
          <DataGrid
            rows={users}
            columns={columns}
            pageSizeOptions={[5, 10]}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            disableRowSelectionOnClick
            sx={{
              '& .MuiDataGrid-root': {
                border: 'none',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
