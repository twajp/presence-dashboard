import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Button
} from '@mui/material';

type DeleteConfirmDialogProps = {
    open: boolean;
    onClose: () => void;
    deleteTarget: { type: 'member' | 'dashboard'; id?: number; name?: string } | null;
    onConfirm: () => void;
};

export const DeleteConfirmDialog = ({
    open,
    onClose,
    deleteTarget,
    onConfirm
}: DeleteConfirmDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
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
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} variant='contained' color='error'>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};
