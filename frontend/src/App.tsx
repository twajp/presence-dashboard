import { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { DataGrid } from '@mui/x-data-grid';
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Button } from '@mui/material';

type PresenceStatus = 'present' | 'away' | 'remote' | 'vacant';

type Seat = {
  id: string;
  x: number;
  y: number;
  status: PresenceStatus;
};

const STATUS_COLOR: Record<PresenceStatus, string> = {
  present: '#4caf50',
  away: '#ffc107',
  remote: '#2196f3',
  vacant: '#e0e0e0',
};

const STATUS_ORDER: PresenceStatus[] = [
  'present',
  'away',
  'remote',
  'vacant',
];

const nextStatus = (status: PresenceStatus): PresenceStatus => {
  const index = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
};

function SeatItem({
  seat,
  onUpdate,
}: {
  seat: Seat;
  onUpdate: (id: string, data: Partial<Seat>) => void;
}) {
  const draggedRef = useRef(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: seat.x, y: seat.y }}
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
          onUpdate(seat.id, { status: nextStatus(seat.status) });
        }}
        style={{
          width: 60,
          height: 60,
          borderRadius: 8,
          backgroundColor: STATUS_COLOR[seat.status],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'absolute',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        {seat.id}
      </div>
    </Draggable>
  );
}


export default function App() {
  const [seats, setSeats] = useState<Seat[]>([
    { id: 'A1', x: 50, y: 50, status: 'present' },
    { id: 'A2', x: 150, y: 50, status: 'away' },
    { id: 'B1', x: 50, y: 150, status: 'vacant' },
  ]);

  const updateSeat = (id: string, data: Partial<Seat>) => {
    setSeats((prev) =>
      prev.map((seat) =>
        seat.id === id ? { ...seat, ...data } : seat
      )
    );
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'status', headerName: 'ステータス', width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          size="small"
          variant="contained"
          onClick={() => updateSeat(params.row.id, { status: nextStatus(params.row.status as PresenceStatus) })}
          sx={{
            backgroundColor: STATUS_COLOR[params.row.status as PresenceStatus],
            color: params.row.status === 'vacant' ? '#333' : '#fff',
            textTransform: 'capitalize',
            '&:hover': {
              opacity: 0.8,
            }
          }}
        >
          {params.row.status}
        </Button>
      )
    },
    { field: 'x', headerName: 'X', width: 70 },
    { field: 'y', headerName: 'Y', width: 70 },
  ];

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      {/* 左側：座席配置 */}
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
          />
        ))}
      </div>

      {/* 右側：データグリッド */}
      <div
        style={{
          width: 400,
          height: '100vh',
          overflow: 'auto',
          backgroundColor: '#fff',
        }}
      >
        <DataGrid
          rows={seats}
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
  );
}
