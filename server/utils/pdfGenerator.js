const jsPDF = require('jspdf');
const html2canvas = require('html2canvas');

// Generate PDF for contract
const generateContractPDF = async (contract) => {
  try {
    const doc = new jsPDF();
    
    // Set up the document
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('MOVING CONTRACT', 105, 20, { align: 'center' });
    
    // Contract ID
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Contract ID: ${contract.contractId}`, 20, 35);
    doc.text(`Date: ${new Date(contract.createdAt).toLocaleDateString()}`, 20, 42);
    doc.text(`Status: ${contract.status.toUpperCase()}`, 20, 49);
    
    // Line separator
    doc.line(20, 55, 190, 55);
    
    // Customer Information
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('CUSTOMER INFORMATION', 20, 65);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${contract.customerId?.name || 'N/A'}`, 20, 75);
    doc.text(`Email: ${contract.customerId?.email || 'N/A'}`, 20, 82);
    doc.text(`Phone: ${contract.customerId?.phone || 'N/A'}`, 20, 89);
    
    // Move Details
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('MOVE DETAILS', 20, 105);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`From: ${contract.moveDetails?.fromAddress || 'N/A'}`, 20, 115);
    doc.text(`To: ${contract.moveDetails?.toAddress || 'N/A'}`, 20, 122);
    doc.text(`Move Date: ${new Date(contract.moveDetails?.moveDate).toLocaleDateString() || 'N/A'}`, 20, 129);
    doc.text(`Service Type: ${contract.moveDetails?.serviceType || 'N/A'}`, 20, 136);
    
    // Pricing Details
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('PRICING DETAILS', 20, 150);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Base Price: $${contract.pricing?.basePrice || 0}`, 20, 160);
    
    // Additional Services
    if (contract.pricing?.additionalServices && contract.pricing.additionalServices.length > 0) {
      doc.text('Additional Services:', 20, 167);
      let yPos = 174;
      contract.pricing.additionalServices.forEach((service, index) => {
        doc.text(`  ${service.service}: $${service.price}`, 20, yPos);
        yPos += 7;
      });
    }
    
    const totalY = contract.pricing?.additionalServices ? 
      174 + (contract.pricing.additionalServices.length * 7) : 167;
    
    doc.text(`Total Price: $${contract.pricing?.totalPrice || 0}`, 20, totalY + 7);
    doc.text(`Deposit: $${contract.pricing?.deposit || 0}`, 20, totalY + 14);
    doc.text(`Balance Due: $${contract.pricing?.balance || 0}`, 20, totalY + 21);
    
    // Payment Method
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('PAYMENT METHOD', 20, totalY + 35);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Type: ${contract.paymentMethod?.type?.replace('_', ' ').toUpperCase() || 'N/A'}`, 20, totalY + 45);
    
    // Terms and Conditions
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('TERMS AND CONDITIONS', 20, totalY + 60);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    
    // Split text into multiple lines if too long
    const liabilityText = contract.terms?.liability || 'Standard moving liability coverage';
    const liabilityLines = doc.splitTextToSize(liabilityText, 170);
    doc.text('Liability Coverage:', 20, totalY + 70);
    doc.text(liabilityLines, 20, totalY + 77);
    
    const cancellationText = contract.terms?.cancellation || '24-hour notice required for cancellation';
    const cancellationLines = doc.splitTextToSize(cancellationText, 170);
    doc.text('Cancellation Policy:', 20, totalY + 90);
    doc.text(cancellationLines, 20, totalY + 97);
    
    if (contract.terms?.additionalTerms) {
      const additionalLines = doc.splitTextToSize(contract.terms.additionalTerms, 170);
      doc.text('Additional Terms:', 20, totalY + 110);
      doc.text(additionalLines, 20, totalY + 117);
    }
    
    // Approval Information
    if (contract.approval) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('APPROVAL INFORMATION', 20, totalY + 140);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      if (contract.approval.approvedAt) {
        doc.text(`Approved Date: ${new Date(contract.approval.approvedAt).toLocaleDateString()}`, 20, totalY + 150);
      }
      
      if (contract.approval.notes) {
        const notesLines = doc.splitTextToSize(contract.approval.notes, 170);
        doc.text('Approval Notes:', 20, totalY + 157);
        doc.text(notesLines, 20, totalY + 164);
      }
      
      if (contract.approval.rejectionReason) {
        const rejectionLines = doc.splitTextToSize(contract.approval.rejectionReason, 170);
        doc.text('Rejection Reason:', 20, totalY + 180);
        doc.text(rejectionLines, 20, totalY + 187);
      }
    }
    
    // Signatures
    if (contract.signatures) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('SIGNATURES', 20, totalY + 210);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Customer Signed: ${contract.signatures.customerSigned ? 'Yes' : 'No'}`, 20, totalY + 220);
      doc.text(`Manager Signed: ${contract.signatures.managerSigned ? 'Yes' : 'No'}`, 20, totalY + 227);
      
      if (contract.signatures.signedAt) {
        doc.text(`Signed Date: ${new Date(contract.signatures.signedAt).toLocaleDateString()}`, 20, totalY + 234);
      }
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('This contract is generated automatically by the Moving Service Management System.', 20, 280);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 287);
    
    return doc;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

// Generate PDF buffer for download
const generateContractPDFBuffer = async (contract) => {
  try {
    const doc = await generateContractPDF(contract);
    return doc.output('arraybuffer');
  } catch (error) {
    console.error('Error generating PDF buffer:', error);
    throw error;
  }
};

module.exports = {
  generateContractPDF,
  generateContractPDFBuffer
};
