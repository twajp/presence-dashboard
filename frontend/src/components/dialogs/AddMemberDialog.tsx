import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, TextField, Button
} from '@mui/material';

type AddMemberDialogProps = {
    open: boolean;
    onClose: () => void;
    newUser: { name: string; team: string };
    setNewUser: (user: { name: string; team: string }) => void;
    onAdd: () => void;
};

export const AddMemberDialog = ({
    open,
    onClose,
    newUser,
    setNewUser,
    onAdd
}: AddMemberDialogProps) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogContent>
                <Box display='flex' flexDirection='column' gap={2} pt={1}>
                    <TextField
                        label='Team'
                        fullWidth
                        value={newUser.team}
                        onChange={e => setNewUser({ ...newUser, team: e.target.value })}
                    />
                    <TextField
                        label='Name'
                        fullWidth
                        value={newUser.name}
                        onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={onAdd}
                    variant='contained'
                    disabled={!newUser.team || !newUser.name}
                >
                    Add
                </Button>
            </DialogActions>
        </Dialog>
    );
};
