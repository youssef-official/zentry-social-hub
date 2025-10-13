import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import verificationBadge from "@/assets/verification-badge.png";

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: number;
}

const VerificationBadge = ({ isVerified, size = 16 }: VerificationBadgeProps) => {
  const [showDialog, setShowDialog] = useState(false);

  if (!isVerified) return null;

  return (
    <>
      <img
        src={verificationBadge}
        alt="Verified"
        className="cursor-pointer"
        style={{ width: size, height: size }}
        onClick={() => setShowDialog(true)}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={verificationBadge} alt="Verified" className="h-6 w-6" />
              شارة التوثيق
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-muted-foreground">
              لقد حصل هذا المستخدم على شارة الاستحقاق والتوثيق
            </p>
            
            <div className="border-t pt-4">
              <p className="font-semibold mb-2">للحصول على شارة التوثيق:</p>
              <p className="text-sm text-muted-foreground">
                تواصل مع المشرف عبر WhatsApp
              </p>
              <a
                href="https://wa.me/201108279642"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-green-600 hover:underline font-medium"
              >
                +201108279642
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerificationBadge;
