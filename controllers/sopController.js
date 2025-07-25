const SOP = require('../models/SOP');
const PDFDocument = require('pdfkit');

exports.createSOP = async (req, res) => {
  try {
    const { 
      title, 
      department, 
      steps, 
      responsiblePerson, 
      date, 
      procedure, 
      references, 
      revisionNumber, 
      effectiveDate, 
      revisionDate 
    } = req.body;
    
    const sop = new SOP({
      title,
      department,
      steps,
      responsiblePerson,
      date,
      procedure,
      references: references || [],
      revisionNumber: revisionNumber || '1.0',
      effectiveDate,
      revisionDate,
      createdBy: req.userId
    });
    
    await sop.save();
    res.status(201).json(sop);
  } catch (err) {
    console.error('Create SOP Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getSOPs = async (req, res) => {
  try {
    const sops = await SOP.find({ createdBy: req.userId }).populate('createdBy', 'username');
    res.json(sops);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSOPById = async (req, res) => {
  try {
    const sop = await SOP.findOne({ _id: req.params.id, createdBy: req.userId }).populate('createdBy', 'username');
    if (!sop) return res.status(404).json({ message: 'SOP not found' });
    res.json(sop);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSOP = async (req, res) => {
  try {
    const sop = await SOP.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      req.body,
      { new: true }
    );
    if (!sop) return res.status(404).json({ message: 'SOP not found' });
    res.json(sop);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteSOP = async (req, res) => {
  try {
    const sop = await SOP.findOneAndDelete({ _id: req.params.id, createdBy: req.userId });
    if (!sop) return res.status(404).json({ message: 'SOP not found' });
    res.json({ message: 'SOP deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.exportSOPtoPDF = async (req, res) => {
  try {
    const sop = await SOP.findOne({ _id: req.params.id, createdBy: req.userId });
    if (!sop) return res.status(404).json({ message: 'SOP not found' });

    const puppeteer = require('puppeteer');
    const { minify } = require('html-minifier');

    // Create professional HTML template for the SOP with fixed layout
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sop.title}</title>
    <style>
        /* Base document styles */
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .page-break {
            page-break-before: always;
            break-before: page;
        }
        .no-break {
            page-break-inside: avoid;
            break-inside: avoid;
        }
        .container {
            padding: 0;
            margin: 0;
        }
        .header, .section-title, .step-item {
           /* styles for these elements */
        }
        
        /* Print-specific overrides for perfect PDF layout */
        @media print {
            body {
                margin: 0;
                padding: 0;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }

            @page {
                size: A4;
                /* Define margins to create space for header and footer */
                margin: 40mm 20mm 30mm 20mm; /* Top, Right, Bottom, Left */
            }

            .page-break {
                page-break-before: always;
                break-before: page;
            }
            
            .no-break, .step-item, .metadata-grid, .approvals-grid {
                page-break-inside: avoid;
                break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
      <!-- All SOP content goes here -->
      <h1>${sop.title}</h1>
      <p>${sop.procedure || ''}</p>
      <!-- ... rest of the SOP content ... -->
    </div>
</body>
</html>`;

    const minifiedHtml = minify(htmlTemplate, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true
    });

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    const page = await browser.newPage();
    await page.setContent(minifiedHtml, { waitUntil: 'networkidle0' });

    // Generate PDF with header/footer fitting into the @page margins
    const pdfBuffer = await page.pdf({
        format: 'A4',
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 10px; color: #555; text-align: left; width: 100%; box-sizing: border-box; padding: 0 20mm; height: 40mm; display: flex; align-items: center;">
              <div style="border-bottom: 1px solid #ddd; padding-bottom: 5px; width: 100%;">Standard Operating Procedure: ${sop.title}</div>
          </div>`,
        footerTemplate: `
          <div style="font-family: Arial, sans-serif; font-size: 10px; color: #555; text-align: right; width: 100%; box-sizing: border-box; padding: 0 20mm; height: 30mm; display: flex; align-items: flex-end; justify-content: space-between;">
              <div>Revision: ${sop.revisionNumber || '1.0'}</div>
              <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
          </div>`,
        printBackground: true,
        preferCSSPageSize: true // Respect @page rule from CSS
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sop.title.replace(/ /g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF Export Error:', err);
    res.status(500).json({ message: 'Server error during PDF export' });
  }
}; 