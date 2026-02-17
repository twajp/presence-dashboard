import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataGrid, type GridSortModel } from '@mui/x-data-grid';
import {
  Button, CircularProgress, Box, ThemeProvider, createTheme, CssBaseline,
  useMediaQuery, Select, MenuItem, FormControl, InputLabel, Typography,
  IconButton, TextField, Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  DashboardCustomize as DashboardCustomizeIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon
} from '@mui/icons-material';

// Hooks
import { useDashboards } from './hooks/useDashboards';
import { useUsers } from './hooks/useUsers';
import { useSettings } from './hooks/useSettings';

// Components
import { PresenceDialog } from './components/PresenceDialog';
import { LegendBar } from './components/LegendBar';
import { SeatItem } from './components/SeatItem';
import { createDataGridColumns } from './components/DataGridColumns';
import {
  AddMemberDialog,
  DashboardDialog,
  BulkUpdateConfirmDialog,
  SettingsWarningDialog,
  DeleteConfirmDialog
} from './components/dialogs';

// Types
import type { User } from './types/dashboard.types';
import type { PresenceStatus } from './config/presence';

export default function App() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = useMemo(
    () => createTheme({ palette: { mode: prefersDarkMode ? 'dark' : 'light' } }),
    [prefersDarkMode]
  );

  // UI State
  const [isSettingsMode, setIsSettingsMode] = useState(false);
  const [settingsWarningOpen, setSettingsWarningOpen] = useState(false);
  const [editingHeader, setEditingHeader] = useState<string | null>(null);
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  // Dialog State
  const [openAdd, setOpenAdd] = useState(false);
  const [openAddDb, setOpenAddDb] = useState(false);
  const [openRenameDb, setOpenRenameDb] = useState(false);
  const [presenceTarget, setPresenceTarget] = useState<User | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkConfirmStatus, setBulkConfirmStatus] = useState<PresenceStatus | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'member' | 'dashboard';
    id?: number;
    name?: string;
  } | null>(null);

  // Form State
  const [newUser, setNewUser] = useState({ name: '', team: '' });
  const [newDbName, setNewDbName] = useState('');
  const [renameDbName, setRenameDbName] = useState('');

  // Resize State
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [isResizingHeight, setIsResizingHeight] = useState(false);

  // Custom Hooks
  const {
    dashboards,
    dashboardId,
    setDashboardId,
    createDashboard: createDashboardApi,
    updateDashboard: updateDashboardApi,
    deleteDashboard: deleteDashboardApi
  } = useDashboards();

  const {
    users,
    seats,
    loading,
    updateUser,
    createUser: createUserApi,
    deleteUser: deleteUserApi,
    bulkUpdatePresence,
    moveUser
  } = useUsers(dashboardId, isSettingsMode);

  const {
    settings,
    gridWidth,
    gridHeight,
    notes,
    setNotes,
    updateSettings,
    updateGridWidth,
    updateGridHeight,
    updateNotes
  } = useSettings(dashboardId, isSettingsMode);

  // Computed Values
  const currentDashboardName =
    dashboards.find(d => d.id === dashboardId)?.dashboard_name || '';

  // Handlers
  const handleAddMember = async () => {
    await createUserApi(newUser);
    setOpenAdd(false);
    setNewUser({ name: '', team: '' });
  };

  const handleDeleteMember = (id: number) => {
    const user = users.find(u => u.id === id);
    setDeleteTarget({ type: 'member', id, name: user?.name });
    setDeleteConfirmOpen(true);
  };

  const handleAddDashboard = async () => {
    await createDashboardApi(newDbName);
    setOpenAddDb(false);
    setNewDbName('');
  };

  const handleUpdateDashboard = async () => {
    if (dashboardId === '') return;
    await updateDashboardApi(dashboardId, renameDbName);
    setOpenRenameDb(false);
  };

  const handleDeleteDashboard = () => {
    if (dashboardId === '') return;
    setDeleteTarget({ type: 'dashboard', name: currentDashboardName });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'member' && deleteTarget.id) {
      await deleteUserApi(deleteTarget.id);
    } else if (deleteTarget.type === 'dashboard' && dashboardId !== '') {
      const success = await deleteDashboardApi(dashboardId);
      if (success) {
        setOpenRenameDb(false);
        setIsSettingsMode(false);
      }
    }

    setDeleteConfirmOpen(false);
    setDeleteTarget(null);
  };

  const handleColumnWidthChange = useCallback(
    async (params: { colDef: { field: string; width?: number }; width: number }) => {
      const field = params.colDef.field;
      const width = params.width;
      const widthFieldMap: Record<string, keyof typeof settings> = {
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

      const newSettings = { ...settings, [widthField]: width };
      await updateSettings(newSettings);
    },
    [dashboardId, settings, updateSettings]
  );

  // Resize handlers
  const handleWidthResizeStart = () => {
    if (!isSettingsMode) return;
    setIsResizingWidth(true);
  };

  const handleHeightResizeStart = () => {
    if (!isSettingsMode) return;
    setIsResizingHeight(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
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
    },
    [isResizingWidth, isResizingHeight]
  );

  const handleMouseUp = useCallback(() => {
    if (isResizingWidth) {
      const leftPanel = document.getElementById('left-panel');
      if (leftPanel) {
        const finalWidth = parseInt(leftPanel.style.width);
        updateGridWidth(finalWidth);
      }
      setIsResizingWidth(false);
    } else if (isResizingHeight) {
      const leftPanel = document.getElementById('left-panel');
      if (leftPanel) {
        const gridArea = leftPanel.children[1] as HTMLElement;
        if (gridArea) {
          const finalHeight = parseInt(gridArea.style.height);
          updateGridHeight(finalHeight);
        }
      }
      setIsResizingHeight(false);
    }
  }, [isResizingWidth, isResizingHeight, updateGridWidth, updateGridHeight]);

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

  // DataGrid columns
  const columns = useMemo(
    () =>
      createDataGridColumns({
        settings,
        isSettingsMode,
        editingHeader,
        setEditingHeader,
        onSettingsUpdate: updateSettings,
        onPresenceClick: setPresenceTarget,
        onUserUpdate: updateUser,
        onMoveUser: moveUser,
        onDeleteMember: handleDeleteMember,
        users
      }),
    [settings, isSettingsMode, editingHeader, updateSettings, updateUser, moveUser, users]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display='flex' flexDirection='column' width='100vw' height='100vh'>
        {/* Header */}
        <Box
          px={3}
          py={1}
          display='flex'
          alignItems='center'
          bgcolor='background.paper'
          borderBottom={1}
          borderColor='divider'
          sx={{ height: '64px' }}
        >
          <Typography
            variant='h6'
            fontSize='1.5rem'
            fontWeight='bold'
            sx={{ display: { xs: 'none', md: 'block' } }}
          >
            Presence Dashboard
          </Typography>

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
                  setDashboardId(val);
                }}
              >
                {dashboards.map(db => (
                  <MenuItem key={db.id} value={db.id}>
                    {db.dashboard_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {isSettingsMode && dashboardId !== '' && (
              <Tooltip title='Rename'>
                <IconButton
                  color='primary'
                  onClick={() => {
                    setRenameDbName(currentDashboardName);
                    setOpenRenameDb(true);
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}

            {isSettingsMode && dashboardId !== '' && (
              <Tooltip title='Delete'>
                <IconButton color='error' onClick={handleDeleteDashboard}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title='Add Dashboard'>
              <IconButton onClick={() => setOpenAddDb(true)}>
                <DashboardCustomizeIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Box display='flex' gap={1} alignItems='center'>
            {isSettingsMode ? (
              <>
                <Button
                  startIcon={<AddIcon />}
                  variant='outlined'
                  size='small'
                  onClick={() => setOpenAdd(true)}
                  sx={{ fontSize: '1rem' }}
                >
                  Add Member
                </Button>
                <Button
                  startIcon={<CheckIcon />}
                  variant='contained'
                  color='primary'
                  size='small'
                  onClick={() => {
                    setIsSettingsMode(false);
                    setEditingHeader(null);
                  }}
                  sx={{ minWidth: '90px', fontSize: '1rem' }}
                >
                  Done
                </Button>
              </>
            ) : (
              <Tooltip title='Settings'>
                <IconButton
                  onClick={() => {
                    setSortModel([]);
                    setIsSettingsMode(true);
                    setSettingsWarningOpen(true);
                  }}
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Main Content */}
        {loading && dashboardId !== '' ? (
          <Box flex={1} display='flex' justifyContent='center' alignItems='center'>
            <CircularProgress />
          </Box>
        ) : (
          <Box display='flex' flex={1} overflow='hidden'>
            {/* Left Panel */}
            <Box
              id='left-panel'
              width={`${gridWidth}px`}
              display='flex'
              flexDirection='column'
              overflow='hidden'
            >
              <LegendBar
                onBulkSet={(status) => {
                  setBulkConfirmStatus(status);
                  setBulkConfirmOpen(true);
                }}
              />
              <Box
                height={`${gridHeight}px`}
                position='relative'
                sx={{
                  backgroundImage: isSettingsMode
                    ? `radial-gradient(${theme.palette.divider} 1px, transparent 1px)`
                    : 'none',
                  backgroundSize: '20px 20px',
                  overflow: 'auto',
                  bgcolor: 'background.default'
                }}
              >
                {seats.map(s => (
                  <SeatItem
                    key={s.id}
                    seat={s}
                    onUpdate={updateUser}
                    users={users}
                    isSettingsMode={isSettingsMode}
                    onStatusClick={(u) => setPresenceTarget(u)}
                    prefersDarkMode={prefersDarkMode}
                  />
                ))}
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
                  onBlur={() => updateNotes(notes)}
                  minRows={4}
                  sx={{ height: '100%', '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start' } }}
                />
              </Box>
            </Box>

            {/* Resize Handle */}
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

            {/* Right Panel - DataGrid */}
            <Box flex={1} borderLeft={1} borderColor='divider' sx={{ minWidth: 0 }}>
              <DataGrid
                rows={users}
                columns={columns}
                columnHeaderHeight={28}
                rowHeight={28}
                sortModel={sortModel}
                onSortModelChange={(model) => setSortModel(model)}
                processRowUpdate={async (n) => {
                  await updateUser(n.id, {
                    team: n.team,
                    name: n.name,
                    note1: n.note1,
                    note2: n.note2,
                    note3: n.note3
                  });
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

        {/* Dialogs */}
        <PresenceDialog
          open={!!presenceTarget}
          onClose={() => setPresenceTarget(null)}
          currentStatus={presenceTarget?.presence}
          onSelect={(status) => {
            if (presenceTarget) {
              updateUser(presenceTarget.id, { presence: status });
            }
          }}
        />

        <AddMemberDialog
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          newUser={newUser}
          setNewUser={setNewUser}
          onAdd={handleAddMember}
        />

        <DashboardDialog
          open={openAddDb}
          onClose={() => setOpenAddDb(false)}
          mode='add'
          dashboardName={newDbName}
          setDashboardName={setNewDbName}
          onSubmit={handleAddDashboard}
        />

        <DashboardDialog
          open={openRenameDb}
          onClose={() => setOpenRenameDb(false)}
          mode='rename'
          dashboardName={renameDbName}
          setDashboardName={setRenameDbName}
          onSubmit={handleUpdateDashboard}
        />

        <BulkUpdateConfirmDialog
          open={bulkConfirmOpen}
          onClose={() => setBulkConfirmOpen(false)}
          status={bulkConfirmStatus}
          onConfirm={() => {
            if (bulkConfirmStatus) {
              bulkUpdatePresence(bulkConfirmStatus);
            }
            setBulkConfirmOpen(false);
          }}
        />

        <SettingsWarningDialog
          open={settingsWarningOpen}
          onClose={() => setSettingsWarningOpen(false)}
          onCancel={() => {
            setSettingsWarningOpen(false);
            setIsSettingsMode(false);
          }}
        />

        <DeleteConfirmDialog
          open={deleteConfirmOpen}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
          }}
          deleteTarget={deleteTarget}
          onConfirm={confirmDelete}
        />
      </Box>
    </ThemeProvider>
  );
}
