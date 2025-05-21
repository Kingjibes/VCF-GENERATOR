import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { validatePhoneNumber } from '@/lib/utils';

const ContactForm = ({ onSubmit, formSubmitting }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const { toast } = useToast();

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  const handlePhoneChange = (e) => {
    setPhone(e.target.value);
    if (phoneError) {
      setPhoneError('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter both name and phone number.', variant: 'destructive' });
      return;
    }
    if (!validatePhoneNumber(phone)) {
      setPhoneError('Invalid phone number. Must start with +countrycode (e.g., +233xxxxxxxxx).');
      toast({ title: 'Validation Error', description: 'Invalid phone number. Please include your country code (e.g., +233xxxxxxxxx) with no spaces.', variant: 'destructive' });
      return;
    }
    setPhoneError('');
    onSubmit({ name, phone, email: email.trim() || null });
    setName('');
    setPhone('');
    setEmail('');
  };

  return (
    <motion.form onSubmit={handleSubmit} className="space-y-6" variants={itemVariants}>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-lg">Full Name</Label>
        <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Jane Doe" required className="text-lg p-3" disabled={formSubmitting} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-lg">Phone Number</Label>
        <Input 
          id="phone" 
          type="tel" 
          value={phone} 
          onChange={handlePhoneChange} 
          placeholder="+233xxxxxxxxxx" 
          required 
          className={`text-lg p-3 ${phoneError ? 'border-destructive focus:shadow-[0_0_15px_hsl(var(--destructive)/0.5)]' : ''}`} 
          disabled={formSubmitting} 
        />
        {phoneError && <p className="text-sm text-destructive mt-1">{phoneError}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-lg">Email (Optional)</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g., jane.doe@example.com" className="text-lg p-3" disabled={formSubmitting} />
      </div>
      <Button type="submit" size="lg" className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-primary-foreground shadow-lg hover:shadow-primary/50 text-lg py-3" disabled={formSubmitting}>
        {formSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
        Submit Contact
      </Button>
    </motion.form>
  );
};

export default ContactForm;