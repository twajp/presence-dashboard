import { Box, Typography } from '@mui/material';
import { type PresenceStatus, PRESENCE_STATUSES, PRESENCE_STATUS_CONFIG } from '../config/presence';

type LegendBarProps = {
    onBulkSet: (status: PresenceStatus) => void;
};

export const LegendBar = ({ onBulkSet }: LegendBarProps) => {
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
            {PRESENCE_STATUSES.map((status) => (
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
                            bgcolor: PRESENCE_STATUS_CONFIG[status].color,
                            borderRadius: 0.5,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    />
                    <Typography variant='caption'>
                        {PRESENCE_STATUS_CONFIG[status].label}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};
