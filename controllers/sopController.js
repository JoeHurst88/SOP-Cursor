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
    const sop = await SOP.findOne({ _id: req.params.id, createdBy: req.userId }).populate('createdBy', 'username');
    if (!sop) return res.status(404).json({ message: 'SOP not found' });

    const puppeteer = require('puppeteer');
    const { minify } = require('html-minifier');

    // V3: A professional, CSS-driven HTML template for perfect PDF exports.
    // This version uses standard CSS for headers, footers, and page layout,
    // which is the correct and most reliable method for controlling print output.
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${sop.title}</title>
    <style>
        /* Base document styles */
        html, body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.6;
            color: #333;
        }
        
        /* Styles for the main content of the document */
        .content {
            padding: 0 1.5cm; /* Horizontal padding for content */
        }

        /* Page layout and print-specific rules */
        @media print {
            @page {
                size: A4;
                /* Margin for the entire page, providing space for header/footer */
                margin: 2.5cm 1.5cm 2.5cm 1.5cm;
            }

            /* Critical for color and background preservation in PDF */
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            /* --- HEADER & FOOTER DEFINITIONS --- */
            /* These elements are fixed and will repeat on every page */
            
            .page-header, .page-footer {
                position: fixed;
                left: 0;
                right: 0;
                font-size: 10px;
                color: #666;
                padding: 0 1.5cm; /* Match content padding */
            }

            .page-header {
                top: 0;
                height: 2.5cm;
                text-align: center;
                border-bottom: 1px solid #ddd;
                line-height: 2.5cm; /* Vertically center content */
            }

            .page-footer {
                bottom: 0;
                height: 2.5cm;
                text-align: center;
                border-top: 1px solid #ddd;
            }
            
            .page-footer .page-number::after {
                content: counter(page) ' of ' counter(pages);
            }
        }
        
        /* --- DOCUMENT STRUCTURE STYLES --- */

        .document-header {
            text-align: center;
            margin-bottom: 25px;
            padding-bottom: 15px;
            border-bottom: 2px solid #2563eb;
        }
        .document-title {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            text-transform: uppercase;
        }
        
        .metadata-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
            padding: 15px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
        }
        .metadata-item { display: flex; flex-direction: column; }
        .metadata-label { font-weight: bold; font-size: 10px; color: #4b5563; text-transform: uppercase; }
        .metadata-value { font-size: 12px; }

        .section-header {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            margin: 25px 0 10px 0;
            padding-bottom: 6px;
            border-bottom: 1px solid #cbd5e1;
        }

        .step-item {
            display: flex;
            margin-bottom: 12px;
            border-left: 3px solid #2563eb;
            padding-left: 10px;
        }
        .step-number { font-weight: bold; color: #1e40af; min-width: 25px; }
        .step-content { flex: 1; }

        .approval-section { margin-top: 40px; }
        .approval-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
        }
        .approval-box { border: 1px solid #cbd5e1; padding: 15px; text-align: center; }
        .approval-title { font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
        .signature-line { border-bottom: 1px solid #333; height: 30px; margin-bottom: 8px; }
        .signature-label { font-size: 9px; color: #666; }

        /* Page break controls */
        .metadata-section, .step-item, .approval-box, .section-header {
            page-break-inside: avoid;
        }
        .approval-section {
            page-break-before: auto;
        }
    </style>
</head>
<body>
    <!-- Header content for each page, controlled by CSS -->
    <div class="page-header">
        ${sop.title} - Standard Operating Procedure
    </div>

    <!-- Footer content for each page, controlled by CSS -->
    <div class="page-footer">
        <span class="page-number"></span>
    </div>

    <!-- Main document content -->
    <main class="content">
        <div class="document-header">
            <h1 class="document-title">${sop.title}</h1>
        </div>

        <div class="metadata-section">
            <div class="metadata-item"><strong>Department:</strong> ${sop.department}</div>
            <div class="metadata-item"><strong>Responsible Person:</strong> ${sop.responsiblePerson}</div>
            <div class="metadata-item"><strong>Effective Date:</strong> ${new Date(sop.effectiveDate).toLocaleDateString()}</div>
            <div class="metadata-item"><strong>Revision Date:</strong> ${new Date(sop.revisionDate).toLocaleDateString()}</div>
            <div class="metadata-item"><strong>Revision Number:</strong> ${sop.revisionNumber}</div>
            <div class="metadata-item"><strong>Created By:</strong> ${sop.createdBy ? sop.createdBy.username : 'N/A'}</div>
        </div>

        <h2 class="section-header">Detailed Steps</h2>
        <div class="steps-container">
            ${sop.steps.map((step, index) => `
                <div class="step-item">
                    <span class="step-number">${index + 1}.</span>
                    <span class="step-content">${step}</span>
                </div>`).join('')}
        </div>

        <div class="approval-section">
            <h2 class="section-header">Approvals</h2>
            <div class="approval-grid">
                <div class="approval-box"><div class="approval-title">Prepared By</div><div class="signature-line"></div><div class="signature-label">Signature & Date</div></div>
                <div class="approval-box"><div class="approval-title">Reviewed By</div><div class="signature-line"></div><div class="signature-label">Signature & Date</div></div>
                <div class="approval-box"><div class="approval-title">Approved By</div><div class="signature-line"></div><div class="signature-label">Signature & Date</div></div>
            </div>
        </div>
    </main>
</body>
</html>`;

    const minifiedHtml = minify(htmlTemplate, { collapseWhitespace: true, removeComments: true, minifyCSS: true });

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    await page.setContent(minifiedHtml, { waitUntil: 'networkidle0' });
    
    // Generate PDF without Puppeteer's header/footer templates
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false, // IMPORTANT: Let CSS handle headers/footers
        margin: { top: 0, right: 0, bottom: 0, left: 0 } // Margins are controlled by @page CSS
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sop.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF Export Error:', err);
    res.status(500).json({ message: 'PDF export failed', error: err.message });
  }
}; 