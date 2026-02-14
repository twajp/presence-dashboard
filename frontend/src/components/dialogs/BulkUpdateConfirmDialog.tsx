import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Button
} from '@mui/material';
import { type PresenceStatus, PRESENCE_STATUS_CONFIG } from '../../config/presence';

type BulkUpdateConfirmDialogProps = {
    open: boolean;
    onClose: () => void;
    status: PresenceStatus | null;
    onConfirm: () => void;
};

export const BulkUpdateConfirmDialog = ({
    open,
    onClose,
    status,
    onConfirm
}: BulkUpdateConfirmDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
            <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                Bulk Update Confirmation
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 1 }}>
                    <Typography>Change the presence status of all users to:</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {status && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                    sx={{
                                        width: 20,
                                        height: 20,
                                        bgcolor: PRESENCE_STATUS_CONFIG[status].color,
                                        borderRadius: 0.5,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                />
                                <Typography fontWeight='bold'>
                                    {PRESENCE_STATUS_CONFIG[status].label}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Typography>Are you sure you want to proceed with this action?</Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} variant='contained' color='primary'>
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
};
