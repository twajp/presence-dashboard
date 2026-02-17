import { useState } from 'react';
import { Box, TextField, Checkbox } from '@mui/material';
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
    onSave: (newSettings: Partial<DashboardSettings>) => void;
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
        onSave({ [fieldKey]: tempValue });
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
                <Checkbox
                    checked={!settings[hideFieldKey]}
                    onChange={(e) => {
                        e.stopPropagation();
                        onSave({ [hideFieldKey]: !e.target.checked });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    title='Show/Hide'
                    size='small'
                    sx={{ padding: 0 }}
                />
            )}
        </Box>
    );
};
