import { useState } from 'react';
import { Box, TextField } from '@mui/material';
import type { DashboardSettings } from '../types/dashboard.types';

type EditableHeaderProps = {
    label: string;
    fieldKey: keyof DashboardSettings;
    hideFieldKey?: keyof DashboardSettings;
    isEditable?: boolean;
    isSettingsMode: boolean;
    editingHeader: string | null;
    setEditingHeader: (key: string | null) => void;
    settings: DashboardSettings;
    onSave: (newSettings: DashboardSettings) => void;
};

export const EditableHeader = ({
    label,
    fieldKey,
    hideFieldKey,
    isEditable = true,
    isSettingsMode,
    editingHeader,
    setEditingHeader,
    settings,
    onSave
}: EditableHeaderProps) => {
    const [tempValue, setTempValue] = useState(label);

    const handleSave = () => {
        const next = { ...settings, [fieldKey]: tempValue };
        onSave(next);
    };

    if (isEditable && isSettingsMode && editingHeader === fieldKey) {
        return (
            <TextField
                variant='standard'
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleSave();
                    }
                }}
                sx={{ input: { fontSize: '0.875rem', fontWeight: 'bold' } }}
            />
        );
    }

    return (
        <Box
            sx={{
                cursor: isEditable && isSettingsMode ? 'pointer' : 'inherit',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5
            }}
            onClick={() => isEditable && isSettingsMode && setEditingHeader(fieldKey)}
        >
            {label}
            {isEditable && isSettingsMode && hideFieldKey && (
                <input
                    type='checkbox'
                    checked={!settings[hideFieldKey]}
                    onChange={(e) => {
                        e.stopPropagation();
                        const next = { ...settings, [hideFieldKey]: !e.target.checked };
                        onSave(next);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    title='Show/Hide'
                    style={{ width: 14, height: 14, cursor: 'pointer' }}
                />
            )}
        </Box>
    );
};
