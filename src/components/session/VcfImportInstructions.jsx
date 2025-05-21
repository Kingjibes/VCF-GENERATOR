import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Smartphone, DownloadCloud } from 'lucide-react';
import { motion } from 'framer-motion';

const VcfImportInstructions = () => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, delay: 0.2 } }
  };
  return (
    <motion.div variants={itemVariants} className="mt-8">
      <Card className="bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <DownloadCloud className="mr-3 h-6 w-6 text-primary" />
            How to Import VCF Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground">
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              <Smartphone className="mr-2 h-5 w-5 text-green-500" /> Android Devices:
            </h3>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Download the .vcf file (e.g., CIPHER001.vcf) to your device.</li>
              <li>Open your <strong>Files</strong> app (or a file manager) and locate the downloaded .vcf file.</li>
              <li>Tap on the .vcf file.</li>
              <li>Your phone should prompt you to open it with your <strong>Contacts</strong> app. Select it.</li>
              <li>Choose the account (e.g., Google account, Phone contacts) where you want to save the contacts.</li>
              <li>Confirm the import. Your contacts should now be added.</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              <Smartphone className="mr-2 h-5 w-5 text-blue-500" /> iOS Devices (iPhone/iPad):
            </h3>
            <p className="mb-2">The easiest way is often via Email or iCloud:</p>
            <strong className="block mb-1">Method 1: Email Attachment</strong>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Email the .vcf file to yourself.</li>
              <li>Open the email on your iOS device and tap the .vcf file attachment.</li>
              <li>Tap <strong>Share</strong> (square with an upward arrow icon), then choose <strong>Contacts</strong>. Or, iOS might directly ask if you want to add the contacts.</li>
              <li>You may be prompted to <strong>Create New Contacts</strong> or <strong>Add to Existing Contacts</strong>. Choose the appropriate option.</li>
              <li>Confirm to import all contacts from the file.</li>
            </ol>
            <strong className="block mt-3 mb-1">Method 2: iCloud (via Computer)</strong>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>On a computer, go to <a href="https://www.icloud.com/contacts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">icloud.com/contacts</a> and sign in.</li>
              <li>Click the gear icon (Settings) in the bottom-left corner.</li>
              <li>Select <strong>Import vCard...</strong></li>
              <li>Choose the .vcf file from your computer and click Open.</li>
              <li>The contacts will be added to your iCloud Contacts and sync to your iOS devices.</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default VcfImportInstructions;