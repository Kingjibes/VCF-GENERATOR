export const generateVCF = (contacts) => {
  if (!contacts || contacts.length === 0) {
    return '';
  }

  let vcfContent = '';
  contacts.forEach(contact => {
    const nameParts = contact.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    vcfContent += 'BEGIN:VCARD\r\n';
    vcfContent += 'VERSION:3.0\r\n';
    vcfContent += `N:${lastName};${firstName};;;\r\n`;
    vcfContent += `FN:${contact.name}\r\n`;
    if (contact.phone) {
      vcfContent += `TEL;TYPE=CELL:${contact.phone}\r\n`;
    }
    if (contact.email) {
      vcfContent += `EMAIL:${contact.email}\r\n`;
    }
    vcfContent += 'END:VCARD\r\n';
  });

  return vcfContent;
};

export const downloadVCF = (vcfContent, baseFilename = 'CIPHER', count = 1) => {
  if (!vcfContent) return;

  const paddedCount = String(count).padStart(3, '0');
  const filename = `${baseFilename}${paddedCount}.vcf`;

  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return filename; 
  }
  return null;
};

export const generateVCFDataURI = (vcfContent) => {
  if (!vcfContent) return '';
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcfContent)}`;
};