import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, TextField, Button
} from '@mui/material';

type DashboardDialogProps = {
    open: boolean;
    onClose: () => void;
    mode: 'add' | 'rename';
    dashboardName: string;
    setDashboardName: (name: string) => void;
    onSubmit: () => void;
};

export const DashboardDialog = ({
    open,
    onClose,
    mode,
    dashboardName,
    setDashboardName,
    onSubmit
}: DashboardDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>{mode === 'add' ? 'New Dashboard' : 'Rename Dashboard'}</DialogTitle>
            <DialogContent>
                <Box pt={1}>
                    <TextField
                        label='Dashboard Name'
                        fullWidth
                        autoFocus
                        value={dashboardName}
                        onChange={e => setDashboardName(e.target.value)}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={onSubmit}
                    variant='contained'
                    color='primary'
                    disabled={!dashboardName}
                >
                    {mode === 'add' ? 'Create' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
