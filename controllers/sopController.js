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
    const sops = await SOP.find({ createdBy: req.userId });
    res.json(sops);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSOPById = async (req, res) => {
  try {
    const sop = await SOP.findOne({ _id: req.params.id, createdBy: req.userId });
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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }

        .content {
            padding: 20px;
        }

        .document-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
        }

        .document-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .document-subtitle {
            font-size: 16px;
            color: #666;
            font-weight: normal;
        }

        .metadata-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        .metadata-item {
            display: flex;
            flex-direction: column;
        }

        .metadata-label {
            font-weight: bold;
            font-size: 11px;
            color: #4b5563;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }

        .metadata-value {
            font-size: 14px;
            color: #1f2937;
            padding: 8px 10px;
            background: white;
            border-radius: 4px;
            border: 1px solid #d1d5db;
        }

        .section-header {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            margin: 30px 0 15px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid #cbd5e1;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .steps-container {
            margin-top: 20px;
        }

        .step-item {
            display: flex;
            margin-bottom: 15px;
            padding: 15px;
            background-color: #fafbfc;
            border-radius: 6px;
            border-left: 4px solid #2563eb;
        }

        .step-number {
            font-weight: bold;
            color: #1e40af;
            min-width: 35px;
            font-size: 14px;
        }

        .step-content {
            flex: 1;
            font-size: 13px;
            line-height: 1.5;
            color: #374151;
        }

        .references-section {
            margin-top: 30px;
            padding: 20px;
            background-color: #f1f5f9;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
        }

        .reference-item {
            font-size: 12px;
            color: #4b5563;
            margin-bottom: 10px;
            padding-left: 20px;
            position: relative;
        }

        .reference-item:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #2563eb;
            font-weight: bold;
        }

        .procedure-overview {
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #10b981;
            margin-bottom: 25px;
            font-size: 13px;
            line-height: 1.6;
            color: #374151;
        }

        .approval-section {
            margin-top: 50px;
        }

        .approval-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }

        .approval-box {
            border: 1px solid #cbd5e1;
            padding: 20px;
            text-align: center;
            background-color: #fafbfc;
        }

        .approval-title {
            font-size: 11px;
            font-weight: bold;
            color: #4b5563;
            text-transform: uppercase;
            margin-bottom: 25px;
        }

        .signature-line {
            border-bottom: 1px solid #374151;
            height: 35px;
            margin-bottom: 10px;
        }

        .signature-label {
            font-size: 10px;
            color: #6b7280;
        }

        /* Critical Print Styles for PDF Layout */
        @media print {
            body {
                margin: 0 !important;
                padding: 0 !important;
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
            }

            @page {
                size: A4;
                margin: 20mm 20mm 25mm 20mm;
            }

            .content {
                margin-top: 10mm !important; /* space for header */
                margin-bottom: 15mm !important; /* space for footer */
                padding: 0 !important;
            }

            /* Prevent page breaks inside these elements */
            .document-header,
            .metadata-section,
            .step-item,
            .references-section,
            .procedure-overview,
            .approval-box,
            .approval-section {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }

            /* Force page breaks before major sections if needed */
            .approval-section {
                page-break-before: auto !important;
                break-before: auto !important;
            }

            /* Ensure all colors and backgrounds are preserved */
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            /* Maintain spacing between sections */
            .section-header {
                margin-top: 25px !important;
                margin-bottom: 12px !important;
            }

            .metadata-section {
                margin-bottom: 25px !important;
            }

            .steps-container {
                margin-bottom: 20px !important;
            }

            /* Ensure step items don't break awkwardly */
            .step-item {
                margin-bottom: 12px !important;
                padding: 12px !important;
            }
        }
    </style>
</head>
<body>
    <div class="content">
        <div class="document-header">
            <h1 class="document-title">${sop.title}</h1>
            <p class="document-subtitle">Standard Operating Procedure</p>
        </div>

        <div class="metadata-section">
            <div class="metadata-item">
                <span class="metadata-label">Department</span>
                <span class="metadata-value">${sop.department}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Responsible Person</span>
                <span class="metadata-value">${sop.responsiblePerson}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Document Date</span>
                <span class="metadata-value">${new Date(sop.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</span>
            </div>
            <div class="metadata-item">
                <span class="metadata-label">Revision Number</span>
                <span class="metadata-value">${sop.revisionNumber || '1.0'}</span>
            </div>
        </div>

        ${sop.procedure ? `
        <h2 class="section-header">Procedure Overview</h2>
        <div class="procedure-overview">
            ${sop.procedure}
        </div>
        ` : ''}

        <h2 class="section-header">Detailed Steps</h2>
        <div class="steps-container">
            ${sop.steps.map((step, index) => `
                <div class="step-item">
                    <span class="step-number">${index + 1}.</span>
                    <span class="step-content">${step}</span>
                </div>
            `).join('')}
        </div>

        ${sop.references && sop.references.length > 0 ? `
        <h2 class="section-header">References</h2>
        <div class="references-section">
            ${sop.references.map(ref => `
                <div class="reference-item">${ref}</div>
            `).join('')}
        </div>
        ` : ''}

        <div class="approval-section">
            <h2 class="section-header">Approvals</h2>
            <div class="approval-grid">
                <div class="approval-box">
                    <div class="approval-title">Prepared By</div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Signature & Date</div>
                </div>
                <div class="approval-box">
                    <div class="approval-title">Reviewed By</div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Signature & Date</div>
                </div>
                <div class="approval-box">
                    <div class="approval-title">Approved By</div>
                    <div class="signature-line"></div>
                    <div class="signature-label">Signature & Date</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    // Minify HTML for better performance
    const minifiedHtml = minify(htmlTemplate, {
        removeComments: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        minifyCSS: true,
        collapseWhitespace: true
    });

    // Launch puppeteer with optimized settings
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    });
    
    const page = await browser.newPage();
    
    // Set content and wait for all resources to load
    await page.setContent(minifiedHtml, { 
        waitUntil: ['networkidle0', 'domcontentloaded'],
        timeout: 30000
    });
    
    // Generate PDF with precise layout control
    const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
            top: '20mm',
            right: '20mm', 
            bottom: '25mm',
            left: '20mm'
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: `
            <div style="font-size: 10px; color: #666; width: 100%; text-align: center; padding: 0; margin: 0; height: 15mm; line-height: 15mm;">
                ${sop.title} - Standard Operating Procedure
            </div>
        `,
        footerTemplate: `
            <div style="font-size: 9px; color: #666; width: 100%; text-align: center; padding: 0; margin: 0; height: 10mm; line-height: 10mm;">
                Page <span class="pageNumber"></span> of <span class="totalPages"></span>
            </div>
        `
    });

    await browser.close();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${sop.title.replace(/[^a-z0-9]/gi, '_')}_SOP.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send PDF
    res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF Export Error:', err);
    res.status(500).json({ message: 'PDF export failed', error: err.message });
  }
}; 