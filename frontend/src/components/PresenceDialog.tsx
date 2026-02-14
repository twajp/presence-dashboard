import {
    Dialog, DialogTitle, DialogContent, Button, Stack
} from '@mui/material';
import { type PresenceStatus, PRESENCE_STATUSES, PRESENCE_STATUS_CONFIG } from '../config/presence';

type PresenceDialogProps = {
    open: boolean;
    onClose: () => void;
    currentStatus?: PresenceStatus;
    onSelect: (status: PresenceStatus) => void;
};

export const PresenceDialog = ({ open, onClose, currentStatus, onSelect }: PresenceDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
            <DialogTitle sx={{ textAlign: 'center' }}>
                Set Presence
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} py={1}>
                    {PRESENCE_STATUSES.map((status) => (
                        <Button
                            key={status}
                            variant={currentStatus === status ? 'contained' : 'outlined'}
                            onClick={() => {
                                onSelect(status);
                                onClose();
                            }}
                            sx={{
                                py: 1.5,
                                borderColor: PRESENCE_STATUS_CONFIG[status].color,
                                fontSize: '1.5rem',
                                color: currentStatus === status ? '#fff' : PRESENCE_STATUS_CONFIG[status].color,
                                backgroundColor: currentStatus === status ? PRESENCE_STATUS_CONFIG[status].color : 'transparent',
                                '&:hover': {
                                    backgroundColor: PRESENCE_STATUS_CONFIG[status].color,
                                    color: '#fff'
                                }
                            }}
                        >
                            {PRESENCE_STATUS_CONFIG[status].label}
                        </Button>
                    ))}
                </Stack>
            </DialogContent>
        </Dialog>
    );
};
