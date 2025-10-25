const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const PDFDocument = require('pdfkit'); // Import the PDF library

/**
 * Reads a CSV file from the given path and returns its content as a promise.
 * @param {string} filePath - The full path to the CSV file.
 * @returns {Promise<object[]>} A promise that resolves to an array of objects from the CSV.
 */
const readCsv = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv({
                // Automatically trim whitespace from the header names
                mapHeaders: ({ header }) => header.trim(),
            }))
            .on('data', (data) => {
                // Get the headers from the current row
                const headers = Object.keys(data);
                // Ensure the row has at least two columns to be valid
                if (headers.length >= 2) {
                    results.push({
                        code: data[headers[0]] || '', // First column is the code
                        description: data[headers[1]] || '' // Second column is the description
                    });
                }
            })
            .on('end', () => {
                // Successfully finished reading the file
                resolve(results);
            })
            .on('error', (error) => {
                // An error occurred during reading
                reject(error);
            });
    });
};

/**
 * @desc    Get all HSN and SAC codes as JSON.
 * @route   GET /api/hsn-sac
 * @access  Public
 */
exports.getHsnSacCodes = async (req, res) => {
    try {
        // Define the full paths to the CSV files
        const hsnPath = path.join(__dirname, '..', 'data', 'HSN_MSTR.csv');
        const sacPath = path.join(__dirname, '..', 'data', 'SAC_MSTR.csv');

        // Check if the files exist
        if (!fs.existsSync(hsnPath) || !fs.existsSync(sacPath)) {
            const message = 'HSN_MSTR.csv or SAC_MSTR.csv not found in the `zooogle_backend/data` directory.';
            console.error(message);
            return res.status(500).json({ message });
        }
        
        // Read both files
        const [hsnCodes, sacCodes] = await Promise.all([
            readCsv(hsnPath),
            readCsv(sacPath)
        ]);

        // Combine the results
        const allCodes = [...hsnCodes, ...sacCodes];
        
        // Send the combined list as a JSON response
        res.status(200).json(allCodes);

    } catch (error) {
        // Handle errors
        console.error('Error processing HSN/SAC CSV files:', error);
        res.status(500).json({ message: 'Server error while fetching HSN/SAC codes' });
    }
};

/**
 * @desc    Get all HSN and SAC codes as a PDF document.
 * @route   GET /api/hsn-sac/pdf
 * @access  Public
 */
exports.getHsnSacPdf = async (req, res) => {
    try {
        // Define the full paths to the CSV files
        const hsnPath = path.join(__dirname, '..', 'data', 'HSN_MSTR.csv');
        const sacPath = path.join(__dirname, '..', 'data', 'SAC_MSTR.csv');

        // Check if the files exist
        if (!fs.existsSync(hsnPath) || !fs.existsSync(sacPath)) {
            const message = 'HSN_MSTR.csv or SAC_MSTR.csv not found in the `zooogle_backend/data` directory.';
            console.error(message);
            return res.status(500).json({ message });
        }

        // Read both files
        const [hsnCodes, sacCodes] = await Promise.all([
            readCsv(hsnPath),
            readCsv(sacPath)
        ]);

        // --- Create PDF ---
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        // Set headers to trigger PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=HSN_SAC_Codes.pdf');

        // Pipe the PDF directly to the response
        doc.pipe(res);

        // Add a title
        doc.fontSize(18).text('HSN and SAC Codes', { align: 'center' });
        doc.moveDown(2);

        // --- HSN Codes Section ---
        doc.fontSize(16).font('Helvetica-Bold').text('HSN Codes', { underline: true });
        doc.moveDown();

        // Add HSN Table Header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Code', 50, doc.y, { width: 100, continued: true });
        doc.text('Description', 150, doc.y);
        doc.moveDown();
        doc.font('Helvetica'); // Reset font

        // Add HSN Data
        for (const item of hsnCodes) {
            // Check if we need to add a new page
            if (doc.y > 700) {
                doc.addPage();
            }
            doc.text(item.code, 50, doc.y, { width: 100, continued: true });
            doc.text(item.description, 150, doc.y, { width: 400 });
            doc.moveDown(0.5);
        }

        // --- SAC Codes Section ---
        doc.addPage();
        doc.fontSize(16).font('Helvetica-Bold').text('SAC Codes', { underline: true });
        doc.moveDown();

        // Add SAC Table Header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Code', 50, doc.y, { width: 100, continued: true });
        doc.text('Description', 150, doc.y);
        doc.moveDown();
        doc.font('Helvetica'); // Reset font

        // Add SAC Data
        for (const item of sacCodes) {
            // Check if we need to add a new page
            if (doc.y > 700) {
                doc.addPage();
            }
            doc.text(item.code, 50, doc.y, { width: 100, continued: true });
            doc.text(item.description, 150, doc.y, { width: 400 });
            doc.moveDown(0.5);
        }

        // Finalize the PDF
        doc.end();

    } catch (error) {
        // Handle errors
        console.error('Error generating HSN/SAC PDF:', error);
        res.status(500).send('Server error while generating PDF');
    }
};