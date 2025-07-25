const express = require('express');
const SOP = require('../models/SOP');
const { auth } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Create SOP
router.post('/', auth, async (req, res) => {
  try {
    const sopData = {
      ...req.body,
      createdBy: req.user.userId
    };
    
    const sop = new SOP(sopData);
    await sop.save();
    res.status(201).json(sop);
  } catch (error) {
    console.error('Error creating SOP:', error);
    res.status(500).json({ error: 'Failed to create SOP: ' + error.message });
  }
});

// Get all SOPs
router.get('/', auth, async (req, res) => {
  try {
    const sops = await SOP.find().populate('createdBy', 'username').sort({ createdAt: -1 });
    res.json(sops);
  } catch (error) {
    console.error('Error fetching SOPs:', error);
    res.status(500).json({ error: 'Failed to fetch SOPs' });
  }
});

// Get SOP by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id).populate('createdBy', 'username');
    if (!sop) {
      return res.status(404).json({ error: 'SOP not found' });
    }
    res.json(sop);
  } catch (error) {
    console.error('Error fetching SOP:', error);
    res.status(500).json({ error: 'Failed to fetch SOP' });
  }
});

// Update SOP
router.put('/:id', auth, async (req, res) => {
  try {
    const sop = await SOP.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sop) {
      return res.status(404).json({ error: 'SOP not found' });
    }
    res.json(sop);
  } catch (error) {
    console.error('Error updating SOP:', error);
    res.status(500).json({ error: 'Failed to update SOP' });
  }
});

// Delete SOP
router.delete('/:id', auth, async (req, res) => {
  try {
    const sop = await SOP.findByIdAndDelete(req.params.id);
    if (!sop) {
      return res.status(404).json({ error: 'SOP not found' });
    }
    res.json({ message: 'SOP deleted successfully' });
  } catch (error) {
    console.error('Error deleting SOP:', error);
    res.status(500).json({ error: 'Failed to delete SOP' });
  }
});

// Export SOP as PDF (Professional Format)
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id).populate('createdBy', 'username');
    if (!sop) {
      return res.status(404).json({ error: 'SOP not found' });
    }

    // Create PDF document with professional margins
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 72, bottom: 72, left: 54, right: 54 }
    });
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SOP-${sop.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
    
    // Pipe the PDF to the response
    doc.pipe(res);

    // Professional Header Section
    const drawHeader = () => {
      const startY = 40;
      
      // Header border line
      doc.strokeColor('#000000')
         .lineWidth(1)
         .moveTo(54, startY + 50)
         .lineTo(doc.page.width - 54, startY + 50)
         .stroke();
    };

    // Professional Footer Section
    const drawFooter = () => {
      const footerY = doc.page.height - 60;
      
      // Footer border line
      doc.strokeColor('#000000')
         .lineWidth(1)
         .moveTo(54, footerY)
         .lineTo(doc.page.width - 54, footerY)
         .stroke();
      
      // Issue date and revision
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#000000')
         .text(`Issued on ${new Date().toLocaleDateString()} r.${sop.revisionNumber || '1.0'}`, 54, footerY + 10);
    };

    // Draw header and footer on first page
    drawHeader();
    drawFooter();

    // Start content area (closer to header)
    let currentY = 100;

    // Main Title - Professional Format
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#000000')
       .text(sop.title, 54, currentY, { align: 'center', width: doc.page.width - 108 });
    
    currentY += 60;

    // Objective Section
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('Objective:', 54, currentY);
    
    currentY += 20;
    
    doc.fontSize(11)
       .font('Helvetica')
       .text(sop.objective, 54, currentY, { 
         width: doc.page.width - 108,
         align: 'justify'
       });
    
    currentY += doc.heightOfString(sop.objective, { width: doc.page.width - 108 }) + 20;

    // Responsibilities Section
    if (sop.responsibility) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Responsibilities:', 54, currentY);
      
      currentY += 20;
      
      doc.fontSize(11)
         .font('Helvetica')
         .text(sop.responsibility, 54, currentY, { 
           width: doc.page.width - 108,
           align: 'left'
         });
      
      currentY += doc.heightOfString(sop.responsibility, { width: doc.page.width - 108 }) + 20;
    }

    // References Section
    if (sop.references && sop.references.length > 0 && sop.references[0].trim()) {
      // Check if we need a new page (more conservative)
      if (currentY > doc.page.height - 120) {
        doc.addPage();
        drawHeader();
        drawFooter();
        currentY = 100;
      }

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('References:', 54, currentY);
      
      currentY += 20;
      
      doc.fontSize(11)
         .font('Helvetica');
      
      sop.references.forEach((ref, index) => {
        if (ref.trim()) {
          doc.text(`${ref}`, 54, currentY, { 
            width: doc.page.width - 108,
            align: 'left'
          });
          currentY += 15;
        }
      });
      
      currentY += 10;
    }

    // Procedure Section
    if (sop.procedure) {
      // Check if we need a new page (more conservative)
      if (currentY > doc.page.height - 120) {
        doc.addPage();
        drawHeader();
        drawFooter();
        currentY = 100;
      }

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Procedure', 54, currentY);
      
      currentY += 20;
      
      doc.fontSize(11)
         .font('Helvetica')
         .text(sop.procedure, 54, currentY, { 
           width: doc.page.width - 108,
           align: 'justify'
         });
      
      currentY += doc.heightOfString(sop.procedure, { width: doc.page.width - 108 }) + 20;
    }

    // Steps Section
    if (sop.steps && sop.steps.length > 0 && sop.steps[0].trim()) {
      // Check if we need a new page (more conservative)
      if (currentY > doc.page.height - 120) {
        doc.addPage();
        drawHeader();
        drawFooter();
        currentY = 100;
      }

      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('Detailed Steps:', 54, currentY);
      
      currentY += 20;
      
      doc.fontSize(11)
         .font('Helvetica');
      
      sop.steps.forEach((step, index) => {
        if (step.trim()) {
          // Check if we need a new page for this step
          const stepHeight = doc.heightOfString(`${index + 1}. ${step}`, { width: doc.page.width - 108 });
          if (currentY + stepHeight > doc.page.height - 100) {
            doc.addPage();
            drawHeader();
            drawFooter();
            currentY = 100;
          }

          doc.text(`${index + 1}. ${step}`, 54, currentY, { 
            width: doc.page.width - 108,
            align: 'left'
          });
          currentY += stepHeight + 10;
        }
      });
    }

    // Finalize the PDF
    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  }
});

// Export SOP as Custom PDF
router.post('/:id/pdf/custom', auth, async (req, res) => {
  try {
    const sop = await SOP.findById(req.params.id).populate('createdBy', 'username');
    if (!sop) {
      return res.status(404).json({ error: 'SOP not found' });
    }

    const { config } = req.body || {};
    
    // Professional defaults
    const defaultConfig = {
      sections: {
        title: { enabled: true, fontSize: 24, fontWeight: 'bold', alignment: 'center' },
        objective: { enabled: true, fontSize: 12, fontWeight: 'normal', alignment: 'justify' },
        responsibility: { enabled: true, fontSize: 12, fontWeight: 'normal', alignment: 'left' },
        references: { enabled: true, fontSize: 11, fontWeight: 'normal', alignment: 'left' },
        procedure: { enabled: true, fontSize: 12, fontWeight: 'normal', alignment: 'justify' },
        steps: { enabled: true, fontSize: 12, fontWeight: 'normal', alignment: 'left' }
      },
      layout: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 72, bottom: 72, left: 54, right: 54 }
      },
      branding: {
        companyName: '',
        companyLogo: null
      },
      headerFooter: {
        header: { enabled: false, showLogo: false, showCompanyName: false, showDate: false },
        footer: { enabled: false, showPageNumbers: false, showCompanyName: false, showDate: false }
      }
    };

    // Merge configurations
    const mergedConfig = {
      sections: { ...defaultConfig.sections, ...(config?.sections || {}) },
      layout: { ...defaultConfig.layout, ...(config?.layout || {}) },
      branding: { ...defaultConfig.branding, ...(config?.branding || {}) },
      headerFooter: {
        header: { ...defaultConfig.headerFooter.header, ...(config?.headerFooter?.header || {}) },
        footer: { ...defaultConfig.headerFooter.footer, ...(config?.headerFooter?.footer || {}) }
      }
    };

    // Create PDF document
    const doc = new PDFDocument({ 
      size: mergedConfig.layout.pageSize || 'A4',
      layout: mergedConfig.layout.orientation || 'portrait',
      margins: mergedConfig.layout.margins
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sop.title.replace(/[^a-z0-9]/gi, '_')}_Custom.pdf"`);
    doc.pipe(res);

    // Header/Footer functions (only called when enabled)
    const drawCustomHeader = (pageNumber = 1) => {
      if (!mergedConfig.headerFooter.header.enabled) return 0;
      
      const startY = 40;
      let headerHeight = 0;
      
      // Company name
      if (mergedConfig.headerFooter.header.showCompanyName && mergedConfig.branding.companyName) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text(mergedConfig.branding.companyName, mergedConfig.layout.margins.left, startY + headerHeight, {
             align: 'center',
             width: doc.page.width - mergedConfig.layout.margins.left - mergedConfig.layout.margins.right
           });
        headerHeight += 20;
      }
      
      // Date
      if (mergedConfig.headerFooter.header.showDate) {
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Generated: ${new Date().toLocaleDateString()}`, 
                 doc.page.width - 150, startY, { align: 'right' });
        headerHeight = Math.max(headerHeight, 15);
      }
      
      // Header separator line
      if (headerHeight > 0) {
        doc.strokeColor('#cccccc')
           .lineWidth(1)
           .moveTo(mergedConfig.layout.margins.left, startY + headerHeight + 10)
           .lineTo(doc.page.width - mergedConfig.layout.margins.right, startY + headerHeight + 10)
           .stroke();
        headerHeight += 20;
      }
      
      return headerHeight;
    };

    const drawCustomFooter = (pageNumber = 1) => {
      if (!mergedConfig.headerFooter.footer.enabled) return;
      
      const footerY = doc.page.height - mergedConfig.layout.margins.bottom;
      
      // Footer separator line
      doc.strokeColor('#cccccc')
         .lineWidth(1)
         .moveTo(mergedConfig.layout.margins.left, footerY - 20)
         .lineTo(doc.page.width - mergedConfig.layout.margins.right, footerY - 20)
         .stroke();
      
      // Page numbers
      if (mergedConfig.headerFooter.footer.showPageNumbers) {
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Page ${pageNumber}`, mergedConfig.layout.margins.left, footerY - 10);
      }
      
      // Company name in footer
      if (mergedConfig.headerFooter.footer.showCompanyName && mergedConfig.branding.companyName) {
        doc.text(mergedConfig.branding.companyName, 
                doc.page.width / 2 - 50, footerY - 10, { align: 'center' });
      }
      
      // Date in footer
      if (mergedConfig.headerFooter.footer.showDate) {
        doc.text(new Date().toLocaleDateString(), 
                doc.page.width - 150, footerY - 10, { align: 'right' });
      }
    };

    // Draw initial header and footer
    let pageNumber = 1;
    const headerHeight = drawCustomHeader(pageNumber);
    drawCustomFooter(pageNumber);
    
    // Start content
    let currentY = mergedConfig.layout.margins.top + headerHeight;

    // Render sections based on configuration
    const renderSection = (sectionKey, content) => {
      const section = mergedConfig.sections[sectionKey];
      if (!section || !section.enabled || !content) return;

      // Check if we need a new page
      const estimatedHeight = doc.heightOfString(content, { width: doc.page.width - mergedConfig.layout.margins.left - mergedConfig.layout.margins.right });
      const footerSpace = mergedConfig.headerFooter.footer.enabled ? 60 : 20;
      
      if (currentY + estimatedHeight > doc.page.height - mergedConfig.layout.margins.bottom - footerSpace) {
        doc.addPage();
        pageNumber++;
        const newHeaderHeight = drawCustomHeader(pageNumber);
        drawCustomFooter(pageNumber);
        currentY = mergedConfig.layout.margins.top + newHeaderHeight;
      }

      // Section title
      const title = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1) + ':';
      doc.fontSize(section.fontSize + 2)
         .font(section.fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica-Bold')
         .text(title, mergedConfig.layout.margins.left, currentY);
      
      currentY += 20;

      // Section content
      doc.fontSize(section.fontSize)
         .font(section.fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica')
         .text(content, mergedConfig.layout.margins.left, currentY, {
           width: doc.page.width - mergedConfig.layout.margins.left - mergedConfig.layout.margins.right,
           align: section.alignment
         });
      
      currentY += doc.heightOfString(content, { 
        width: doc.page.width - mergedConfig.layout.margins.left - mergedConfig.layout.margins.right 
      }) + 20;
    };

    // Title section
    if (mergedConfig.sections.title.enabled) {
      doc.fontSize(mergedConfig.sections.title.fontSize)
         .font(mergedConfig.sections.title.fontWeight === 'bold' ? 'Helvetica-Bold' : 'Helvetica')
         .text(sop.title, mergedConfig.layout.margins.left, currentY, {
           width: doc.page.width - mergedConfig.layout.margins.left - mergedConfig.layout.margins.right,
           align: mergedConfig.sections.title.alignment
         });
      currentY += 40;
    }

    // Render enabled sections
    renderSection('objective', sop.objective);
    renderSection('responsibility', sop.responsibility);
    
    // References section (special handling for array)
    if (mergedConfig.sections.references.enabled && sop.references && sop.references.length > 0) {
      const referencesContent = sop.references.filter(ref => ref.trim()).join('\n');
      renderSection('references', referencesContent);
    }
    
    renderSection('procedure', sop.procedure);
    
    // Steps section (special handling for array)
    if (mergedConfig.sections.steps.enabled && sop.steps && sop.steps.length > 0) {
      const stepsContent = sop.steps
        .filter(step => step.trim())
        .map((step, index) => `${index + 1}. ${step}`)
        .join('\n');
      renderSection('steps', stepsContent);
    }

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  }
});

// Update SOP configuration
router.put('/:id/pdf-config', auth, async (req, res) => {
  try {
    const { config } = req.body;
    const sop = await SOP.findByIdAndUpdate(
      req.params.id,
      { pdfConfig: config },
      { new: true }
    );
    
    if (!sop) {
      return res.status(404).json({ error: 'SOP not found' });
    }
    
    res.json({ message: 'Configuration saved successfully', sop });
  } catch (error) {
    console.error('Config save error:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

module.exports = router; 