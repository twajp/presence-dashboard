import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Button
} from '@mui/material';

type SettingsWarningDialogProps = {
    open: boolean;
    onClose: () => void;
    onCancel: () => void;
};

export const SettingsWarningDialog = ({
    open,
    onClose,
    onCancel
}: SettingsWarningDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
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
                <Button onClick={onCancel} color='inherit' variant='outlined' fullWidth>
                    Cancel
                </Button>
                <Button onClick={onClose} variant='contained' color='primary' fullWidth>
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    );
};
