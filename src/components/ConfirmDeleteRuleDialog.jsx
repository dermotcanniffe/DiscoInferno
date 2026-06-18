import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Button } from '@/components/ui/button';

function ConfirmDeleteRuleDialog({ open, onConfirm, onCancel, ruleText }) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-xl max-w-md w-full z-50">
          <AlertDialog.Title className="text-lg font-bold">Delete Rule</AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-gray-600">
            Are you sure you want to delete the rule &quot;{ruleText}&quot;? This will also delete all examples belonging to this rule. This action cannot be undone.
          </AlertDialog.Description>
          <div className="mt-4 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <Button variant="outline">Cancel</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button className="bg-red-600 text-white hover:bg-red-700" onClick={onConfirm}>Delete</Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export default ConfirmDeleteRuleDialog;
