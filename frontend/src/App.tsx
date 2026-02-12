import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import Draggable from 'react-draggable';
import { DataGrid, type GridColDef, type GridSortModel } from '@mui/x-data-grid';
import {
  Button, CircularProgress, Box, ThemeProvider, createTheme, CssBaseline,
  useMediaQuery, Select, MenuItem, FormControl, InputLabel, Typography,
  IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions,
  Stack, Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DashboardCustomize as DashboardCustomizeIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { DEFAULT_DASHBOARD_SETTINGS } from './config/defaults';
import { type PresenceStatus, PRESENCE_STATUSES, PRESENCE_STATUS_CONFIG } from './config/presence';

type Dashboard = { id: number; dashboard_name: string; };
type User = {
  id: number; name: string; presence: PresenceStatus;
  note1?: string; note2?: string; note3?: string;
  check1?: boolean; check2?: boolean; check3?: boolean;
  x: number; y: number;
  width?: number; height?: number;
  team?: string; dashboard_id?: number; order: number;
  updated_at?: string;
};
type Seat = { id: number; x: number; y: number; status: PresenceStatus; userId?: number; };

const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000');

const STATUS_CONFIG = PRESENCE_STATUS_CONFIG;
const STATUS_ORDER = PRESENCE_STATUSES;

// --- Sub-Components ---

function PresenceDialog({ open, onClose, currentStatus, onSelect }: {
  open: boolean; onClose: () => void; currentStatus?: PresenceStatus;
  onSelect: (status: PresenceStatus) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ textAlign: 'center' }}>
        Set Presence
      </DialogTitle>
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
                fontSize: '1.5rem',
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

function LegendBar({ onBulkSet }: { onBulkSet: (status: PresenceStatus) => void }) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        px: 2,
        py: 1,
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <Typography variant='caption' fontWeight='bold'>
        Legend:
      </Typography>
      {STATUS_ORDER.map((status) => (
        <Box
          key={status}
          onClick={() => onBulkSet(status)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            transition: 'background-color 0.2s',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <Box
            sx={{
              width: 16,
              height: 16,
              bgcolor: STATUS_CONFIG[status].color,
              borderRadius: 0.5,
              border: '1px solid',
              borderColor: 'divider'
            }}
          />
          <Typography variant='caption'>
            {STATUS_CONFIG[status].label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function SeatItem({ seat, onUpdate, users, isSettingsMode, onStatusClick, prefersDarkMode }: {
  seat: Seat; onUpdate: (id: number, data: Partial<User>) => void;
  users: User[]; isSettingsMode: boolean;
  onStatusClick: (user: User) => void;
  prefersDarkMode: boolean;
}) {
  const draggedRef = useRef(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, corner: '', startX: 0, startY: 0 });
  const user = users.find((u) => u.id === seat.userId);

  const width = user?.width || 80;
  const height = user?.height || 40;
  const isVertical = height > width;

  const handleResizeStart = useCallback((e: React.MouseEvent, corner: string) => {
    if (!isSettingsMode) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: width,
      height: height,
      corner: corner,
      startX: seat.x,
      startY: seat.y
    });
  }, [isSettingsMode, width, height, seat.x, seat.y]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = resizeStart.startX;
      let newY = resizeStart.startY;

      if (resizeStart.corner.includes('e')) {
        newWidth = Math.max(40, Math.round((resizeStart.width + deltaX) / 8) * 8);
      } else if (resizeStart.corner.includes('w')) {
        newWidth = Math.max(40, Math.round((resizeStart.width - deltaX) / 8) * 8);
        newX = resizeStart.startX + (resizeStart.width - newWidth);
      }

      if (resizeStart.corner.includes('s')) {
        newHeight = Math.max(40, Math.round((resizeStart.height + deltaY) / 8) * 8);
      } else if (resizeStart.corner.includes('n')) {
        newHeight = Math.max(40, Math.round((resizeStart.height - deltaY) / 8) * 8);
        newY = resizeStart.startY + (resizeStart.height - newHeight);
      }

      if (nodeRef.current) {
        nodeRef.current.style.width = `${newWidth}px`;
        nodeRef.current.style.height = `${newHeight}px`;
        nodeRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (nodeRef.current && user) {
        const finalWidth = parseInt(nodeRef.current.style.width);
        const finalHeight = parseInt(nodeRef.current.style.height);
        const transform = nodeRef.current.style.transform;
        const match = transform.match(/translate\((-?\d+)px, (-?\d+)px\)/);
        const finalX = match ? parseInt(match[1]) : seat.x;
        const finalY = match ? parseInt(match[2]) : seat.y;
        onUpdate(seat.id, { width: finalWidth, height: finalHeight, x: finalX, y: finalY });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, onUpdate, seat.id, seat.x, seat.y, user]);

  return (
    <Draggable
      nodeRef={nodeRef}
      position={{ x: seat.x, y: seat.y }}
      grid={[8, 8]}
      disabled={!isSettingsMode || isResizing}
      onStart={() => { draggedRef.current = false; }}
      onDrag={() => { draggedRef.current = true; }}
      onStop={(_e, data) => { onUpdate(seat.id, { x: data.x, y: data.y }); }}
    >
      <div
        ref={nodeRef}
        onClick={() => {
          if (draggedRef.current || isSettingsMode || !user) return;
          onStatusClick(user);
        }}
        style={{
          width: width,
          height: height,
          fontSize: '0.875rem',
          display: 'flex',
          flexDirection: isVertical ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isSettingsMode ? (prefersDarkMode ? '#393939' : '#e0e0e0') : STATUS_CONFIG[seat.status].color,
          color: isSettingsMode ? (prefersDarkMode ? '#fff' : '#000') : '#fff',
          outline: isSettingsMode ? (prefersDarkMode ? '2px solid #757575' : '2px solid #bdbdbd') : 'none',
          cursor: isSettingsMode ? 'move' : 'pointer',
          userSelect: 'none',
          position: 'absolute',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          borderRadius: '4px',
          zIndex: isSettingsMode ? 100 : 1,
          // padding: '4px',
          overflow: 'hidden',
          textAlign: 'center',
          wordBreak: 'keep-all',
          overflowWrap: 'break-word',
          lineHeight: 1.2
        }}
      >
        {user && <div style={{
          maxWidth: '100%',
          maxHeight: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: isVertical ? 3 : 2,
          WebkitBoxOrient: 'vertical'
        }}>{user.name}</div>}

        {isSettingsMode && (
          <>
            {/* Top Left */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'nw')}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: '8px',
                height: '8px',
                cursor: 'nwse-resize',
                backgroundColor: prefersDarkMode ? '#757575' : '#bdbdbd',
                borderRadius: '4px 0 0 0',
                zIndex: 101
              }}
            />
            {/* Top Right */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'ne')}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                width: '8px',
                height: '8px',
                cursor: 'nesw-resize',
                backgroundColor: prefersDarkMode ? '#757575' : '#bdbdbd',
                borderRadius: '0 4px 0 0',
                zIndex: 101
              }}
            />
            {/* Bottom Left */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'sw')}
              style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '8px',
                height: '8px',
                cursor: 'nesw-resize',
                backgroundColor: prefersDarkMode ? '#757575' : '#bdbdbd',
                borderRadius: '0 0 0 4px',
                zIndex: 101
              }}
            />
            {/* Bottom Right */}
            <div
              onMouseDown={(e) => handleResizeStart(e, 'se')}
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: '8px',
                height: '8px',
                cursor: 'nwse-resize',
                backgroundColor: prefersDarkMode ? '#757575' : '#bdbdbd',
                borderRadius: '0 0 4px 0',
                zIndex: 101
              }}
            />
          </>
        )}
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
  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [settingsWarningOpen, setSettingsWarningOpen] = useState(false);

  const [headers, setHeaders] = useState(DEFAULT_DASHBOARD_SETTINGS);
  const [editingHeader, setEditingHeader] = useState<string | null>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [openAddDb, setOpenAddDb] = useState(false);
  const [openRenameDb, setOpenRenameDb] = useState(false);
  const [presenceTarget, setPresenceTarget] = useState<User | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkConfirmStatus, setBulkConfirmStatus] = useState<PresenceStatus | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'member' | 'dashboard'; id?: number; name?: string } | null>(null);
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [gridWidth, setGridWidth] = useState(DEFAULT_DASHBOARD_SETTINGS.grid_width);
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const [gridHeight, setGridHeight] = useState(DEFAULT_DASHBOARD_SETTINGS.grid_height);
  const [notes, setNotes] = useState('');

  const [newUser, setNewUser] = useState({ name: '', team: '' });
  const [newDbName, setNewDbName] = useState('');
  const [renameDbName, setRenameDbName] = useState('');
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  const fetchDashboards = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboards`);
      const result = await res.json();
      const data = result.success ? result.data : [];
      setDashboards(data);
    } catch (err) { console.error('Failed to fetch dashboards', err); }
  }, [dashboardId]);

  const fetchHeaderLabels = useCallback(async () => {
    if (dashboardId === '') return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/settings`);
      const result = await res.json();
      const data = result.success ? result.data : {};
      setHeaders({
        team_label: data.team_label || DEFAULT_DASHBOARD_SETTINGS.team_label,
        name_label: data.name_label || DEFAULT_DASHBOARD_SETTINGS.name_label,
        presence_label: data.presence_label || DEFAULT_DASHBOARD_SETTINGS.presence_label,
        note1_label: data.note1_label || DEFAULT_DASHBOARD_SETTINGS.note1_label,
        note2_label: data.note2_label || DEFAULT_DASHBOARD_SETTINGS.note2_label,
        note3_label: data.note3_label || DEFAULT_DASHBOARD_SETTINGS.note3_label,
        check1_label: data.check1_label || DEFAULT_DASHBOARD_SETTINGS.check1_label,
        check2_label: data.check2_label || DEFAULT_DASHBOARD_SETTINGS.check2_label,
        check3_label: data.check3_label || DEFAULT_DASHBOARD_SETTINGS.check3_label,
        updated_at_label: data.updated_at_label || DEFAULT_DASHBOARD_SETTINGS.updated_at_label,
        hide_note1: data.hide_note1 ?? DEFAULT_DASHBOARD_SETTINGS.hide_note1,
        hide_note2: data.hide_note2 ?? DEFAULT_DASHBOARD_SETTINGS.hide_note2,
        hide_note3: data.hide_note3 ?? DEFAULT_DASHBOARD_SETTINGS.hide_note3,
        hide_check1: data.hide_check1 ?? DEFAULT_DASHBOARD_SETTINGS.hide_check1,
        hide_check2: data.hide_check2 ?? DEFAULT_DASHBOARD_SETTINGS.hide_check2,
        hide_check3: data.hide_check3 ?? DEFAULT_DASHBOARD_SETTINGS.hide_check3,
        hide_updated_at: data.hide_updated_at ?? DEFAULT_DASHBOARD_SETTINGS.hide_updated_at,
        team_width: data.team_width ?? DEFAULT_DASHBOARD_SETTINGS.team_width,
        name_width: data.name_width ?? DEFAULT_DASHBOARD_SETTINGS.name_width,
        presence_width: data.presence_width ?? DEFAULT_DASHBOARD_SETTINGS.presence_width,
        note1_width: data.note1_width ?? DEFAULT_DASHBOARD_SETTINGS.note1_width,
        note2_width: data.note2_width ?? DEFAULT_DASHBOARD_SETTINGS.note2_width,
        note3_width: data.note3_width ?? DEFAULT_DASHBOARD_SETTINGS.note3_width,
        check1_width: data.check1_width ?? DEFAULT_DASHBOARD_SETTINGS.check1_width,
        check2_width: data.check2_width ?? DEFAULT_DASHBOARD_SETTINGS.check2_width,
        check3_width: data.check3_width ?? DEFAULT_DASHBOARD_SETTINGS.check3_width,
        updated_at_width: data.updated_at_width ?? DEFAULT_DASHBOARD_SETTINGS.updated_at_width,
        grid_width: data.grid_width ?? DEFAULT_DASHBOARD_SETTINGS.grid_width,
        grid_height: data.grid_height ?? DEFAULT_DASHBOARD_SETTINGS.grid_height,
        notes: data.notes || DEFAULT_DASHBOARD_SETTINGS.notes
      });
      setGridWidth(data.grid_width ?? DEFAULT_DASHBOARD_SETTINGS.grid_width);
      setGridHeight(data.grid_height ?? DEFAULT_DASHBOARD_SETTINGS.grid_height);
      setNotes(data.notes || '');
    } catch (err) { console.error(err); }
  }, [dashboardId]);

  const fetchUsers = useCallback(async () => {
    if (dashboardId === '') return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/users`);
      const result = await response.json();
      const data: User[] = result.success ? result.data : [];
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
      let interval = !isSettingsMode ? setInterval(() => {
        fetchUsers();
        fetchHeaderLabels();
      }, 10000) : undefined;
      return () => clearInterval(interval);
    }
  }, [fetchUsers, fetchHeaderLabels, isSettingsMode, dashboardId]);

  const updateSeat = useCallback(async (id: number, data: Partial<User>) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const payload = { ...user, ...data };
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (result.success && result.data) {
      setUsers(prev => {
        const updated = prev.map(u => u.id === id ? result.data : u);
        return updated.sort((a, b) => a.order - b.order);
      });
      setSeats(prev => prev.map(s => s.id === id ? { ...s, status: result.data.presence || s.status, x: result.data.x ?? s.x, y: result.data.y ?? s.y } : s));
    }
  }, [users]);

  const bulkUpdatePresence = useCallback(async (status: PresenceStatus) => {
    // Update all users at once
    const updatePromises = users.map(user =>
      fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, presence: status }),
      })
    );

    await Promise.all(updatePromises);

    // Refresh users after bulk update
    fetchUsers();
  }, [users, fetchUsers]);

  const saveHeader = async (newHeaders: typeof headers) => {
    if (dashboardId === '') return;
    await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/settings`, {
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
    await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHeaders),
    });
  };

  const handleWidthResizeStart = () => {
    if (!isSettingsMode) return;
    setIsResizingWidth(true);
  };

  const handleHeightResizeStart = () => {
    if (!isSettingsMode) return;
    setIsResizingHeight(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizingWidth) {
      const newWidth = Math.round(e.clientX / 8) * 8;
      if (newWidth > 200 && newWidth < window.innerWidth - 200) {
        const leftPanel = document.getElementById('left-panel');
        if (leftPanel) {
          leftPanel.style.width = `${newWidth}px`;
        }
      }
    } else if (isResizingHeight) {
      const leftPanel = document.getElementById('left-panel');
      if (leftPanel) {
        const rect = leftPanel.getBoundingClientRect();
        const legendBar = leftPanel.children[0] as HTMLElement;
        const legendBarHeight = legendBar ? legendBar.offsetHeight : 0;
        const newHeight = Math.round((e.clientY - rect.top - legendBarHeight) / 8) * 8;
        if (newHeight > 200 && newHeight < rect.height - legendBarHeight - 100) {
          const gridArea = leftPanel.children[1] as HTMLElement;
          if (gridArea) {
            gridArea.style.height = `${newHeight}px`;
          }
        }
      }
    }
  }, [isResizingWidth, isResizingHeight]);

  const handleMouseUp = useCallback(() => {
    if (isResizingWidth) {
      const leftPanel = document.getElementById('left-panel');
      if (leftPanel) {
        const finalWidth = parseInt(leftPanel.style.width);
        setGridWidth(finalWidth);
        saveGridWidth(finalWidth);
      }
      setIsResizingWidth(false);
    } else if (isResizingHeight) {
      const leftPanel = document.getElementById('left-panel');
      if (leftPanel) {
        const gridArea = leftPanel.children[1] as HTMLElement;
        if (gridArea) {
          const finalHeight = parseInt(gridArea.style.height);
          setGridHeight(finalHeight);
          saveGridHeight(finalHeight);
        }
      }
      setIsResizingHeight(false);
    }
  }, [isResizingWidth, isResizingHeight]);

  const saveGridHeight = async (height: number) => {
    if (dashboardId === '') return;
    const newHeaders = { ...headers, grid_height: height };
    setHeaders(newHeaders);
    await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHeaders),
    });
  };

  const saveNotes = async (newNotes: string) => {
    if (dashboardId === '') return;
    const newHeaders = { ...headers, notes: newNotes };
    setHeaders(newHeaders);
    await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHeaders),
    });
  };

  const handleColumnWidthChange = useCallback(async (params: { colDef: { field: string; width?: number }; width: number }) => {
    const field = params.colDef.field;
    const width = params.width;
    const widthFieldMap: Record<string, keyof typeof headers> = {
      'team': 'team_width',
      'name': 'name_width',
      'presence': 'presence_width',
      'note1': 'note1_width',
      'note2': 'note2_width',
      'note3': 'note3_width',
      'check1': 'check1_width',
      'check2': 'check2_width',
      'check3': 'check3_width',
      'updated_at': 'updated_at_width'
    };

    const widthField = widthFieldMap[field];
    if (!widthField || dashboardId === '') return;

    const newHeaders = { ...headers, [widthField]: width };
    setHeaders(newHeaders);

    await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHeaders),
    });
  }, [dashboardId, headers]);

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
    const payload = { ...newUser, presence: 'present', x: 0, y: 0, order: maxOrder + 1 };
    await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setOpenAdd(false);
    setNewUser({ name: '', team: '' });
    fetchUsers();
  };

  const handleDeleteMember = async (id: number) => {
    const user = users.find(u => u.id === id);
    setDeleteTarget({ type: 'member', id, name: user?.name });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'member' && deleteTarget.id) {
      await fetch(`${API_BASE_URL}/api/users/${deleteTarget.id}`, { method: 'DELETE' });
      fetchUsers();
    } else if (deleteTarget.type === 'dashboard' && dashboardId !== '') {
      const res = await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setOpenRenameDb(false);
        setDashboardId('');
        localStorage.removeItem('selectedDashboardId');
        await fetchDashboards();
        setIsSettingsMode(false);
      }
    }

    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handleAddDashboard = async () => {
    const res = await fetch(`${API_BASE_URL}/api/dashboards`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboard_name: newDbName }),
    });
    const result = await res.json();
    setOpenAddDb(false);
    setNewDbName('');
    await fetchDashboards();
    if (result.success && result.data?.id) {
      setDashboardId(result.data.id);
      localStorage.setItem('selectedDashboardId', result.data.id.toString());
    }
  };

  const handleUpdateDashboard = async () => {
    if (dashboardId === '') return;
    await fetch(`${API_BASE_URL}/api/dashboards/${dashboardId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboard_name: renameDbName }),
    });
    setOpenRenameDb(false);
    fetchDashboards();
  };

  const handleDeleteDashboard = async () => {
    if (dashboardId === '') return;
    setDeleteTarget({ type: 'dashboard', name: currentDashboardName });
    setDeleteConfirmOpen(true);
  };

  const EditableHeader = ({ label, fieldKey, hideFieldKey, isEditable = true }: { label: string, fieldKey: keyof typeof headers, hideFieldKey?: keyof typeof headers, isEditable?: boolean }) => {
    const [tempValue, setTempValue] = useState(label);
    if (isEditable && isSettingsMode && editingHeader === fieldKey) {
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
        sx={{ cursor: isEditable && isSettingsMode ? 'pointer' : 'inherit', width: '100%', display: 'flex', alignItems: 'center', gap: 0.5 }}
        onClick={() => isEditable && isSettingsMode && setEditingHeader(fieldKey)}
      >
        {label}
        {isEditable && isSettingsMode && hideFieldKey && (
          <input
            type='checkbox'
            checked={!headers[hideFieldKey]}
            onChange={(e) => {
              e.stopPropagation();
              const next = { ...headers, [hideFieldKey]: !e.target.checked };
              setHeaders(next);
              saveHeader(next);
            }}
            onClick={(e) => e.stopPropagation()}
            title='Show/Hide'
            style={{ width: 14, height: 14, cursor: 'pointer' }}
          />
        )}
      </Box>
    );
  };

  const columns: GridColDef[] = [
    {
      field: 'team', headerName: headers.team_label, width: headers.team_width ?? 120,
      editable: isSettingsMode, sortable: !isSettingsMode, disableColumnMenu: true, resizable: isSettingsMode,
      renderHeader: () => <EditableHeader label={headers.team_label} fieldKey='team_label' isEditable={isSettingsMode} />
    },
    {
      field: 'name', headerName: headers.name_label, width: headers.name_width ?? 100,
      editable: isSettingsMode, sortable: !isSettingsMode, disableColumnMenu: true, resizable: isSettingsMode,
      renderHeader: () => <EditableHeader label={headers.name_label} fieldKey='name_label' isEditable={isSettingsMode} />
    },
    {
      field: 'presence', headerName: headers.presence_label, width: headers.presence_width ?? 100, sortable: !isSettingsMode, disableColumnMenu: true, resizable: isSettingsMode,
      renderHeader: () => <EditableHeader label={headers.presence_label} fieldKey='presence_label' />,
      renderCell: (p) => (
        <Button size='small' variant='contained' disabled={isSettingsMode}
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
    ...(!headers.hide_note1 || isSettingsMode ? [{
      field: 'note1',
      headerName: headers.note1_label,
      ...(headers.note1_width ? { flex: headers.note1_width } : { flex: 100 }),
      editable: true, sortable: !isSettingsMode, disableColumnMenu: true, resizable: isSettingsMode,
      renderHeader: () => <EditableHeader label={headers.note1_label} fieldKey='note1_label' hideFieldKey='hide_note1' />
    }] : []),
    ...(!headers.hide_note2 || isSettingsMode ? [{
      field: 'note2',
      headerName: headers.note2_label,
      ...(headers.note2_width ? { flex: headers.note2_width } : { flex: 100 }),
      editable: true, sortable: !isSettingsMode, disableColumnMenu: true, resizable: isSettingsMode,
      renderHeader: () => <EditableHeader label={headers.note2_label} fieldKey='note2_label' hideFieldKey='hide_note2' />
    }] : []),
    ...(!headers.hide_note3 || isSettingsMode ? [{
      field: 'note3',
      headerName: headers.note3_label,
      ...(headers.note3_width ? { flex: headers.note3_width } : { flex: 100 }),
      editable: true, sortable: !isSettingsMode, disableColumnMenu: true, resizable: isSettingsMode,
      renderHeader: () => <EditableHeader label={headers.note3_label} fieldKey='note3_label' hideFieldKey='hide_note3' />
    }] : []),
    ...(!headers.hide_check1 || isSettingsMode ? [{
      field: 'check1', headerName: headers.check1_label, width: headers.check1_width ?? 80,
      sortable: !isSettingsMode, disableColumnMenu: true, resizable: isSettingsMode,
      renderHeader: () => <EditableHeader label={headers.check1_label} fieldKey='check1_label' hideFieldKey='hide_check1' />,
      renderCell: (p: any) => (
        <Box display='flex' justifyContent='center' alignItems='center' width='100%' height='100%'>
          <input
            type='checkbox'
            checked={p.row.check1 || false}
            onChange={(e) => updateSeat(p.row.id, { check1: e.target.checked })}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
        </Box>
      ),
    }] : []),
    ...(!headers.hide_check2 || isSettingsMode ? [{
      field: 'check2', headerName: headers.check2_label, width: headers.check2_width ?? 80,
      sortable: !isSettingsMode, disableColumnMenu: true, resizable: isSettingsMode,
      renderHeader: () => <EditableHeader label={headers.check2_label} fieldKey='check2_label' hideFieldKey='hide_check2' />,
      renderCell: (p: any) => (
        <Box display='flex' justifyContent='center' alignItems='center' width='100%' height='100%'>
          <input
            type='checkbox'
            checked={p.row.check2 || false}
            onChange={(e) => updateSeat(p.row.id, { check2: e.target.checked })}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
        </Box>
      ),
    }] : []),
    ...(!headers.hide_check3 || isSettingsMode ? [{
      field: 'check3', headerName: headers.check3_label, width: headers.check3_width ?? 80,
      sortable: !isSettingsMode, disableColumnMenu: true, resizable: isSettingsMode,
      renderHeader: () => <EditableHeader label={headers.check3_label} fieldKey='check3_label' hideFieldKey='hide_check3' />,
      renderCell: (p: any) => (
        <Box display='flex' justifyContent='center' alignItems='center' width='100%' height='100%'>
          <input
            type='checkbox'
            checked={p.row.check3 || false}
            onChange={(e) => updateSeat(p.row.id, { check3: e.target.checked })}
            style={{ width: 18, height: 18, cursor: 'pointer' }}
          />
        </Box>
      ),
    }] : []),
    ...(!headers.hide_updated_at || isSettingsMode ? [{
      field: 'updated_at', headerName: headers.updated_at_label, width: headers.updated_at_width ?? 100,
      editable: false, sortable: !isSettingsMode, disableColumnMenu: true, resizable: isSettingsMode,
      renderHeader: () => <EditableHeader label={headers.updated_at_label} fieldKey='updated_at_label' hideFieldKey='hide_updated_at' />,
      renderCell: (p: any) => {
        if (!p.row.updated_at) return null;
        const date = new Date(p.row.updated_at);
        const isToday = date.toDateString() === new Date().toDateString();
        return (
          <span style={{ color: isToday ? 'inherit' : 'gray' }}>
            {date.toLocaleString('ja-JP', {
              month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit'
            })}
          </span>
        );
      },
    }] : []),
    ...(isSettingsMode ? [{
      field: 'actions', headerName: 'Actions', width: 105, sortable: false, disableColumnMenu: true,
      renderHeader: () => <EditableHeader label={'Actions'} fieldKey={'actions' as any} isEditable={false} />,
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
          <Typography variant='h6' fontSize='1.5rem' fontWeight='bold' sx={{ display: { xs: 'none', md: 'block' } }}>Presence Dashboard</Typography>

          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center' }}>
            <FormControl size='small' sx={{ minWidth: 200 }}>
              <InputLabel id='db-select-label'>Select Dashboard</InputLabel>
              <Select
                labelId='db-select-label'
                label='Select Dashboard'
                value={dashboards.length > 0 ? dashboardId : ''}
                disabled={isSettingsMode}
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

            {isSettingsMode && dashboardId !== '' && (
              <Tooltip title='Rename'>
                <IconButton color='primary' onClick={() => {
                  setRenameDbName(currentDashboardName);
                  setOpenRenameDb(true);
                }}>
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}

            {isSettingsMode && dashboardId !== '' && (
              <Tooltip title='Delete'>
                <IconButton color='error' onClick={() => {
                  handleDeleteDashboard();
                }}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title='Add Dashboard'>
              <IconButton onClick={() => setOpenAddDb(true)}><DashboardCustomizeIcon /></IconButton>
            </Tooltip>
          </Box>

          <Box display='flex' gap={1} alignItems='center'>
            {isSettingsMode ? (
              <>
                <Button
                  startIcon={<AddIcon />}
                  variant='outlined'
                  size="small"
                  onClick={() => setOpenAdd(true)}
                  sx={{ fontSize: '1rem' }}
                >
                  Add Member
                </Button>
                <Button
                  startIcon={<CheckIcon />}
                  variant='contained'
                  color='primary'
                  size="small"
                  onClick={() => { setIsSettingsMode(false); setEditingHeader(null); }}
                  sx={{ minWidth: '90px', fontSize: '1rem' }}
                >
                  Done
                </Button>
              </>
            ) : (
              <Tooltip title='Settings'>
                <IconButton onClick={() => {
                  setSortModel([]);
                  setIsSettingsMode(true);
                  setSettingsWarningOpen(true);
                }}>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {loading && dashboardId !== '' ? <Box flex={1} display='flex' justifyContent='center' alignItems='center'><CircularProgress /></Box> : (
          <Box display='flex' flex={1} overflow='hidden'>
            <Box id='left-panel' width={`${gridWidth}px`} display='flex' flexDirection='column' overflow='hidden'>
              <LegendBar onBulkSet={(status) => {
                setBulkConfirmStatus(status);
                setBulkConfirmOpen(true);
              }} />
              <Box height={`${gridHeight}px`} position='relative' sx={{ backgroundImage: isSettingsMode ? `radial-gradient(${theme.palette.divider} 1px, transparent 1px)` : 'none', backgroundSize: '20px 20px', overflow: 'auto', bgcolor: 'background.default' }}>
                {seats.map(s => <SeatItem key={s.id} seat={s} onUpdate={updateSeat} users={users} isSettingsMode={isSettingsMode} onStatusClick={(u) => setPresenceTarget(u)} prefersDarkMode={prefersDarkMode} />)}
              </Box>
              <Box
                sx={{
                  height: '5px',
                  cursor: isSettingsMode ? 'row-resize' : 'default',
                  bgcolor: isResizingHeight ? 'primary.main' : 'divider',
                  '&:hover': isSettingsMode ? { bgcolor: 'primary.main' } : {},
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
                cursor: isSettingsMode ? 'col-resize' : 'default',
                bgcolor: isResizingWidth ? 'primary.main' : 'divider',
                '&:hover': isSettingsMode ? { bgcolor: 'primary.main' } : {},
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
                sortModel={sortModel}
                onSortModelChange={(model) => setSortModel(model)}
                processRowUpdate={async (n) => {
                  await updateSeat(n.id, { team: n.team, name: n.name, note1: n.note1, note2: n.note2, note3: n.note3 });
                  return n;
                }}
                onColumnWidthChange={handleColumnWidthChange}
                hideFooter
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-columnHeader': {
                    backgroundColor: prefersDarkMode ? '#424242' : '#e0e0e0',
                  },
                  '& .MuiDataGrid-row:nth-of-type(odd)': {
                    backgroundColor: prefersDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
                  },
                  '& .MuiDataGrid-row:nth-of-type(even)': {
                    backgroundColor: prefersDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: prefersDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
                  }
                }}
              />
            </Box>
          </Box>
        )}

        <PresenceDialog
          open={!!presenceTarget}
          onClose={() => setPresenceTarget(null)}
          currentStatus={presenceTarget?.presence}
          onSelect={(status) => {
            if (presenceTarget) {
              updateSeat(presenceTarget.id, { presence: status });
            }
          }}
        />

        {/* Add Member Dialog */}
        <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogContent><Box display='flex' flexDirection='column' gap={2} pt={1}>
            <TextField label='Team' fullWidth value={newUser.team} onChange={e => setNewUser({ ...newUser, team: e.target.value })} />
            <TextField label='Name' fullWidth value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
          </Box></DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
            <Button
              onClick={handleAddMember}
              variant='contained'
              disabled={!newUser.team || !newUser.name}
            >
              Add
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dashboard Dialog */}
        <Dialog open={openAddDb} onClose={() => setOpenAddDb(false)}>
          <DialogTitle>New Dashboard</DialogTitle>
          <DialogContent><Box pt={1}><TextField label='Dashboard Name' fullWidth autoFocus value={newDbName} onChange={e => setNewDbName(e.target.value)} /></Box></DialogContent>
          <DialogActions><Button onClick={() => setOpenAddDb(false)}>Cancel</Button><Button onClick={handleAddDashboard} variant='contained' disabled={!newDbName}>Create</Button></DialogActions>
        </Dialog>

        {/* Rename Dashboard Dialog */}
        <Dialog open={openRenameDb} onClose={() => setOpenRenameDb(false)}>
          <DialogTitle>Rename Dashboard</DialogTitle>
          <DialogContent>
            <Box pt={1}>
              <TextField
                label='Dashboard Name'
                fullWidth
                autoFocus
                value={renameDbName}
                onChange={e => setRenameDbName(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenRenameDb(false)}>Cancel</Button>
            <Button onClick={handleUpdateDashboard} variant='contained' color='primary' disabled={!renameDbName}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Bulk Update Confirmation Dialog */}
        <Dialog
          open={bulkConfirmOpen}
          onClose={() => setBulkConfirmOpen(false)}
          maxWidth='xs'
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            Bulk Update Confirmation
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
              <Typography>Change the presence status of all users to:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {bulkConfirmStatus && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        bgcolor: STATUS_CONFIG[bulkConfirmStatus].color,
                        borderRadius: 0.5,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                    <Typography fontWeight='bold'>
                      {STATUS_CONFIG[bulkConfirmStatus].label}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography>Are you sure you want to proceed with this action?</Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (bulkConfirmStatus) {
                  bulkUpdatePresence(bulkConfirmStatus);
                }
                setBulkConfirmOpen(false);
              }}
              variant='contained'
              color='primary'
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        {/* Settings Mode Warning Dialog */}
        <Dialog
          open={settingsWarningOpen}
          onClose={() => setSettingsWarningOpen(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 'bold', color: 'warning.main' }}>
            Settings Mode Activated
          </DialogTitle>
          <DialogContent>
            <Typography>
              Changes made in settings mode will be reflected in real-time for all users viewing this dashboard.
            </Typography>
            <Typography sx={{ mt: 2, fontWeight: 'bold', color: 'warning.main' }}>
              Warning: Changes will be immediately visible to everyone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => { setSettingsWarningOpen(false); setIsSettingsMode(false); }}
              color='inherit'
              variant='outlined'
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onClick={() => setSettingsWarningOpen(false)}
              variant='contained'
              color='primary'
              fullWidth
            >
              OK
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
          }}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>
            {deleteTarget?.type === 'dashboard' ? 'Delete Dashboard' : 'Delete Member'}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {deleteTarget?.type === 'dashboard'
                ? `Are you sure you want to delete "${deleteTarget.name}"? This will also delete all associated users.`
                : deleteTarget?.name
                  ? `Are you sure you want to delete "${deleteTarget.name}"?`
                  : 'Are you sure you want to delete this member?'}
            </Typography>
            <Typography sx={{ mt: 2, fontWeight: 'bold', color: 'error.main' }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setDeleteConfirmOpen(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              variant='contained'
              color='error'
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}
