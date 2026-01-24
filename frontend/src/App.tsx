import { useRef, useState } from 'react';
import Draggable from 'react-draggable';

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

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
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
  );
}
