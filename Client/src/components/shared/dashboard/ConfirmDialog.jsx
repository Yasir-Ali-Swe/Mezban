import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

/**
 * ConfirmDialog
 *
 * Generic destructive-action confirmation dialog.
 * Currently used by Menu (delete menu item) and Deals (delete deal).
 * NOT used by Categories (which has a custom Add/Edit form dialog).
 *
 * @param {boolean}  open
 * @param {Function} onOpenChange         - (open: boolean) => void
 * @param {string}   title                - dialog title
 * @param {string}   description          - body text (can contain the item name)
 * @param {string}   [confirmLabel]       - confirm button label (default "Delete")
 * @param {Function} onConfirm            - called when the confirm button is clicked
 * @param {string}   [contentClassName]   - extra classes on DialogContent
 *                                          (menu uses "sm:max-w-106.25"; deals uses "sm:max-w-[425px]")
 */
const ConfirmDialog = ({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Delete',
    onConfirm,
    contentClassName = 'sm:max-w-[425px]',
}) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={contentClassName}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmDialog;
