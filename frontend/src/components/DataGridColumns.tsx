import { type GridColDef } from '@mui/x-data-grid';
import { Button, Box, IconButton, Stack } from '@mui/material';
import {
    Delete as DeleteIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
} from '@mui/icons-material';
import { PRESENCE_STATUS_CONFIG } from '../config/presence';
import { EditableHeader } from './EditableHeader';
import type { User, DashboardSettings } from '../types/dashboard.types';
import type { PresenceStatus } from '../config/presence';

type CreateColumnsParams = {
    settings: DashboardSettings;
    isSettingsMode: boolean;
    editingHeader: string | null;
    setEditingHeader: (key: string | null) => void;
    onSettingsUpdate: (newSettings: DashboardSettings) => void;
    onPresenceClick: (user: User) => void;
    onUserUpdate: (id: number, data: Partial<User>) => void;
    onMoveUser: (index: number, direction: 'up' | 'down') => void;
    onDeleteMember: (id: number) => void;
    users: User[];
};

export const createDataGridColumns = ({
    settings,
    isSettingsMode,
    editingHeader,
    setEditingHeader,
    onSettingsUpdate,
    onPresenceClick,
    onUserUpdate,
    onMoveUser,
    onDeleteMember,
    users
}: CreateColumnsParams): GridColDef[] => {
    const columns: GridColDef[] = [
        {
            field: 'team',
            headerName: settings.team_label,
            width: settings.team_width ?? 120,
            editable: isSettingsMode,
            sortable: !isSettingsMode,
            disableColumnMenu: true,
            resizable: isSettingsMode,
            renderHeader: () => (
                <EditableHeader
                    label={settings.team_label}
                    fieldKey='team_label'
                    isEditable={isSettingsMode}
                    isSettingsMode={isSettingsMode}
                    editingHeader={editingHeader}
                    setEditingHeader={setEditingHeader}
                    settings={settings}
                    onSave={onSettingsUpdate}
                />
            )
        },
        {
            field: 'name',
            headerName: settings.name_label,
            width: settings.name_width ?? 100,
            editable: isSettingsMode,
            sortable: !isSettingsMode,
            disableColumnMenu: true,
            resizable: isSettingsMode,
            renderHeader: () => (
                <EditableHeader
                    label={settings.name_label}
                    fieldKey='name_label'
                    isEditable={isSettingsMode}
                    isSettingsMode={isSettingsMode}
                    editingHeader={editingHeader}
                    setEditingHeader={setEditingHeader}
                    settings={settings}
                    onSave={onSettingsUpdate}
                />
            )
        },
        {
            field: 'presence',
            headerName: settings.presence_label,
            width: settings.presence_width ?? 100,
            sortable: !isSettingsMode,
            disableColumnMenu: true,
            resizable: isSettingsMode,
            renderHeader: () => (
                <EditableHeader
                    label={settings.presence_label}
                    fieldKey='presence_label'
                    isEditable={false}
                    isSettingsMode={isSettingsMode}
                    editingHeader={editingHeader}
                    setEditingHeader={setEditingHeader}
                    settings={settings}
                    onSave={onSettingsUpdate}
                />
            ),
            renderCell: (p) => (
                <Button
                    size='small'
                    variant='contained'
                    disabled={isSettingsMode}
                    onClick={() => onPresenceClick(p.row as User)}
                    sx={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: PRESENCE_STATUS_CONFIG[p.row.presence as PresenceStatus].color,
                        color: '#fff',
                        '&:hover': {
                            opacity: 0.8,
                            backgroundColor: PRESENCE_STATUS_CONFIG[p.row.presence as PresenceStatus].color
                        }
                    }}
                >
                    {PRESENCE_STATUS_CONFIG[p.row.presence as PresenceStatus].label}
                </Button>
            ),
        },
        ...(!settings.hide_note1 || isSettingsMode ? [{
            field: 'note1',
            headerName: settings.note1_label,
            ...(settings.note1_width ? { flex: settings.note1_width } : { flex: 100 }),
            editable: true,
            sortable: !isSettingsMode,
            disableColumnMenu: true,
            resizable: isSettingsMode,
            renderHeader: () => (
                <EditableHeader
                    label={settings.note1_label}
                    fieldKey='note1_label'
                    hideFieldKey='hide_note1'
                    isSettingsMode={isSettingsMode}
                    editingHeader={editingHeader}
                    setEditingHeader={setEditingHeader}
                    settings={settings}
                    onSave={onSettingsUpdate}
                />
            )
        }] : []),
        ...(!settings.hide_note2 || isSettingsMode ? [{
            field: 'note2',
            headerName: settings.note2_label,
            ...(settings.note2_width ? { flex: settings.note2_width } : { flex: 100 }),
            editable: true,
            sortable: !isSettingsMode,
            disableColumnMenu: true,
            resizable: isSettingsMode,
            renderHeader: () => (
                <EditableHeader
                    label={settings.note2_label}
                    fieldKey='note2_label'
                    hideFieldKey='hide_note2'
                    isSettingsMode={isSettingsMode}
                    editingHeader={editingHeader}
                    setEditingHeader={setEditingHeader}
                    settings={settings}
                    onSave={onSettingsUpdate}
                />
            )
        }] : []),
        ...(!settings.hide_note3 || isSettingsMode ? [{
            field: 'note3',
            headerName: settings.note3_label,
            ...(settings.note3_width ? { flex: settings.note3_width } : { flex: 100 }),
            editable: true,
            sortable: !isSettingsMode,
            disableColumnMenu: true,
            resizable: isSettingsMode,
            renderHeader: () => (
                <EditableHeader
                    label={settings.note3_label}
                    fieldKey='note3_label'
                    hideFieldKey='hide_note3'
                    isSettingsMode={isSettingsMode}
                    editingHeader={editingHeader}
                    setEditingHeader={setEditingHeader}
                    settings={settings}
                    onSave={onSettingsUpdate}
                />
            )
        }] : []),
        ...(!settings.hide_check1 || isSettingsMode ? [{
            field: 'check1',
            headerName: settings.check1_label,
            width: settings.check1_width ?? 80,
            sortable: !isSettingsMode,
            disableColumnMenu: true,
            resizable: isSettingsMode,
            renderHeader: () => (
                <EditableHeader
                    label={settings.check1_label}
                    fieldKey='check1_label'
                    hideFieldKey='hide_check1'
                    isSettingsMode={isSettingsMode}
                    editingHeader={editingHeader}
                    setEditingHeader={setEditingHeader}
                    settings={settings}
                    onSave={onSettingsUpdate}
                />
            ),
            renderCell: (p: any) => (
                <Box display='flex' justifyContent='center' alignItems='center' width='100%' height='100%'>
                    <input
                        type='checkbox'
                        checked={p.row.check1 || false}
                        onChange={(e) => onUserUpdate(p.row.id, { check1: e.target.checked })}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                </Box>
            ),
        }] : []),
        ...(!settings.hide_check2 || isSettingsMode ? [{
            field: 'check2',
            headerName: settings.check2_label,
            width: settings.check2_width ?? 80,
            sortable: !isSettingsMode,
            disableColumnMenu: true,
            resizable: isSettingsMode,
            renderHeader: () => (
                <EditableHeader
                    label={settings.check2_label}
                    fieldKey='check2_label'
                    hideFieldKey='hide_check2'
                    isSettingsMode={isSettingsMode}
                    editingHeader={editingHeader}
                    setEditingHeader={setEditingHeader}
                    settings={settings}
                    onSave={onSettingsUpdate}
                />
            ),
            renderCell: (p: any) => (
                <Box display='flex' justifyContent='center' alignItems='center' width='100%' height='100%'>
                    <input
                        type='checkbox'
                        checked={p.row.check2 || false}
                        onChange={(e) => onUserUpdate(p.row.id, { check2: e.target.checked })}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                </Box>
            ),
        }] : []),
        ...(!settings.hide_check3 || isSettingsMode ? [{
            field: 'check3',
            headerName: settings.check3_label,
            width: settings.check3_width ?? 80,
            sortable: !isSettingsMode,
            disableColumnMenu: true,
            resizable: isSettingsMode,
            renderHeader: () => (
                <EditableHeader
                    label={settings.check3_label}
                    fieldKey='check3_label'
                    hideFieldKey='hide_check3'
                    isSettingsMode={isSettingsMode}
                    editingHeader={editingHeader}
                    setEditingHeader={setEditingHeader}
                    settings={settings}
                    onSave={onSettingsUpdate}
                />
            ),
            renderCell: (p: any) => (
                <Box display='flex' justifyContent='center' alignItems='center' width='100%' height='100%'>
                    <input
                        type='checkbox'
                        checked={p.row.check3 || false}
                        onChange={(e) => onUserUpdate(p.row.id, { check3: e.target.checked })}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                </Box>
            ),
        }] : []),
        ...(!settings.hide_updated_at || isSettingsMode ? [{
            field: 'updated_at',
            headerName: settings.updated_at_label,
            width: settings.updated_at_width ?? 100,
            editable: false,
            sortable: !isSettingsMode,
            disableColumnMenu: true,
            resizable: isSettingsMode,
            renderHeader: () => (
                <EditableHeader
                    label={settings.updated_at_label}
                    fieldKey='updated_at_label'
                    hideFieldKey='hide_updated_at'
                    isSettingsMode={isSettingsMode}
                    editingHeader={editingHeader}
                    setEditingHeader={setEditingHeader}
                    settings={settings}
                    onSave={onSettingsUpdate}
                />
            ),
            renderCell: (p: any) => {
                if (!p.row.updated_at) return null;
                const date = new Date(p.row.updated_at);
                const isToday = date.toDateString() === new Date().toDateString();
                return (
                    <span style={{ color: isToday ? 'inherit' : 'gray' }}>
                        {date.toLocaleString('ja-JP', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </span>
                );
            },
        }] : []),
        ...(isSettingsMode ? [{
            field: 'actions',
            headerName: 'Actions',
            width: 105,
            sortable: false,
            disableColumnMenu: true,
            renderHeader: () => (
                <EditableHeader
                    label={'Actions'}
                    fieldKey={'actions' as any}
                    isEditable={false}
                    isSettingsMode={isSettingsMode}
                    editingHeader={editingHeader}
                    setEditingHeader={setEditingHeader}
                    settings={settings}
                    onSave={onSettingsUpdate}
                />
            ),
            renderCell: (p: any) => {
                const index = users.findIndex(u => u.id === p.row.id);
                return (
                    <Stack direction='row' spacing={0}>
                        <IconButton
                            size='small'
                            disabled={index === 0}
                            onClick={() => onMoveUser(index, 'up')}
                        >
                            <ArrowUpwardIcon fontSize='small' />
                        </IconButton>
                        <IconButton
                            size='small'
                            disabled={index === users.length - 1}
                            onClick={() => onMoveUser(index, 'down')}
                        >
                            <ArrowDownwardIcon fontSize='small' />
                        </IconButton>
                        <IconButton
                            size='small'
                            color='error'
                            onClick={() => onDeleteMember(p.row.id)}
                        >
                            <DeleteIcon fontSize='small' />
                        </IconButton>
                    </Stack>
                );
            }
        }] : [])
    ];

    return columns;
};
