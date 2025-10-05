// Figma Plugin Code
figma.showUI(__html__, { width: 500, height: 700 });

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'export-invoice') {
        await createInvoiceFrame(msg.data);
    }
};

async function createInvoiceFrame(invoiceData) {
    try {
        // Create or find Invoices page (FIXED: variable scope)
        let invoicesPage = figma.root.children.find(page => 
            page.name === "Invoices" && page.type === "PAGE"
        );
        
        if (!invoicesPage) {
            invoicesPage = figma.createPage();
            invoicesPage.name = "Invoices";
            figma.root.appendChild(invoicesPage);
        }
        
        await figma.setCurrentPageAsync(invoicesPage);
        
        // Create invoice artboard - YOUR CHANGE: 600 -> 420
        const invoiceFrame = figma.createFrame();
        invoiceFrame.name = `Invoice-${invoiceData.invoiceNumber || '001'}`;
        invoiceFrame.resize(420, 900); // CHANGED: 600 -> 420
        invoiceFrame.x = 100;
        invoiceFrame.y = 100;
        invoiceFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        invoiceFrame.clipsContent = false;
        invoiceFrame.layoutMode = 'VERTICAL';
        invoiceFrame.itemSpacing = 20;
        invoiceFrame.paddingLeft = 40;
        invoiceFrame.paddingRight = 40;
        invoiceFrame.paddingTop = 40;
        invoiceFrame.paddingBottom = 40;
        invoiceFrame.cornerRadius = 16; 

        // ADDED: Drop shadow effect
        invoiceFrame.effects = [
            {
                type: 'DROP_SHADOW',
                color: { r: 0, g: 0, b: 0, a: 0.25 },
                offset: { x: 4, y: 4 },
                radius: 40,
                spread: 0,
                visible: true,
                blendMode: 'NORMAL'
            }
        ];
        
        // Add invoice content
        await addInvoiceContent(invoiceFrame, invoiceData);
        
        // Select the new frame
        figma.currentPage.selection = [invoiceFrame];
        figma.viewport.scrollAndZoomIntoView([invoiceFrame]);
        
        figma.notify('Invoice created successfully!');
        
    } catch (error) {
        console.error('Error creating invoice:', error);
        figma.notify('Error creating invoice: ' + error.message);
    }
}

async function addInvoiceContent(frame, data) {
    // Load fonts
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    
    // Header section with two columns - YOUR CHANGE: 540 -> 340
    const header = figma.createFrame();
    header.layoutMode = 'HORIZONTAL';
    header.primaryAxisAlignItems = 'SPACE_BETWEEN';
    header.counterAxisSizingMode = 'AUTO';
    header.resize(340, 75); // CHANGED: 540 -> 340
    header.fills = [];
    
    // Left column - Company info
    const leftColumn = figma.createFrame();
    leftColumn.layoutMode = 'VERTICAL';
    leftColumn.counterAxisSizingMode = 'AUTO';
    leftColumn.itemSpacing = 8;
    leftColumn.fills = [];
    
    // Add logo if available - with better error handling and fallback
    if (data.logo) {
        try {
            const logoImage = await createImageNode(data.logo);
            if (logoImage) {
                // Add some spacing after logo
                leftColumn.appendChild(logoImage);
                
                // Add a small spacer frame
                const spacer = figma.createFrame();
                spacer.resize(1, 10); // 10px height spacer
                spacer.fills = [];
                leftColumn.appendChild(spacer);
            } else {
                console.log('Logo image creation returned null');
            }
        } catch (error) {
            console.log('Error creating logo:', error);
            // Add a placeholder text if logo fails
            const logoPlaceholder = createText(
                data.companyName || 'Your Company',
                14,
                'LEFT',
                true
            );
            leftColumn.appendChild(logoPlaceholder);
        }
    }
    
    // Company text
    const companyText = createText(
        `${data.companyName || 'Your Company'}\n${data.companyAddress || 'Your Address'}\nPhone: ${data.companyPhone || 'N/A'}\nEmail: ${data.companyEmail || 'N/A'}\nTax ID: ${data.companyTaxId || 'N/A'}`,
        12,
        'LEFT'
    );
    leftColumn.appendChild(companyText);
    
    // Right column - Client info
    const rightColumn = figma.createFrame();
    rightColumn.layoutMode = 'VERTICAL';
    rightColumn.counterAxisSizingMode = 'AUTO';
    rightColumn.fills = [];
    
    const clientText = createText(
        `Bill To:\n${data.clientCompany || 'Client Company'}\nAttn: ${data.clientContact || 'Contact Person'}\n${data.clientAddress || 'Client Address'}`,
        12,
        'RIGHT'
    );
    rightColumn.appendChild(clientText);
    
    header.appendChild(leftColumn);
    header.appendChild(rightColumn);
    frame.appendChild(header);
    
    // Invoice title
    const invoiceTitle = createText(
        `INVOICE #${data.invoiceNumber || '001'}`,
        24,
        'LEFT',
        true
    );
    frame.appendChild(invoiceTitle);
    
    // Invoice details row - UPDATED: width from 520 to 340
    const detailsRow = figma.createFrame();
    detailsRow.layoutMode = 'HORIZONTAL';
    detailsRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
    detailsRow.counterAxisSizingMode = 'AUTO';
    detailsRow.resize(340, 20); // CHANGED: 520 -> 340
    detailsRow.fills = [];
    
    const dateText = createText(
        `Date: ${data.invoiceDate || 'N/A'}`,
        12,
        'LEFT'
    );
    
    const dueDateText = createText(
        `Due Date: ${data.dueDate || 'N/A'}`,
        12,
        'RIGHT'
    );
    
    detailsRow.appendChild(dateText);
    detailsRow.appendChild(dueDateText);
    frame.appendChild(detailsRow);
    
    // Line items table - UPDATED: width from 520 to 340
    const tableFrame = figma.createFrame();
    tableFrame.layoutMode = 'VERTICAL';
    tableFrame.counterAxisSizingMode = 'AUTO';
    tableFrame.resize(340, 200); // CHANGED: 520 -> 340
    tableFrame.fills = [];
    
    // Table header - UPDATED: width from 520 to 340
    const tableHeader = figma.createFrame();
    tableHeader.layoutMode = 'HORIZONTAL';
    tableHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
    tableHeader.counterAxisSizingMode = 'AUTO';
    tableHeader.resize(340, 20); // CHANGED: 520 -> 340
    tableHeader.fills = [];
    
    const descHeader = createText('DESCRIPTION', 11, 'LEFT', true);
    const qtyHeader = createText('QTY', 11, 'CENTER', true);
    const rateHeader = createText('RATE', 11, 'CENTER', true);
    const amountHeader = createText('AMOUNT', 11, 'RIGHT', true);
    
    // Set widths for proper alignment - UPDATED: adjusted for new total width
    descHeader.resize(180, 20); // CHANGED: 300 -> 180
    qtyHeader.resize(40, 20);   // CHANGED: 60 -> 40
    rateHeader.resize(60, 20);  // CHANGED: 80 -> 60
    amountHeader.resize(60, 20); // CHANGED: 80 -> 60
    
    tableHeader.appendChild(descHeader);
    tableHeader.appendChild(qtyHeader);
    tableHeader.appendChild(rateHeader);
    tableHeader.appendChild(amountHeader);
    
    tableFrame.appendChild(tableHeader);
    
    // Separator line - UPDATED: width from 520 to 340
    const separator = figma.createLine();
    separator.resize(340, 0); // CHANGED: 520 -> 340
    separator.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
    tableFrame.appendChild(separator);
    
    // Line items
    if (data.lineItems && data.lineItems.length > 0) {
        for (const item of data.lineItems) {
            const itemRow = figma.createFrame();
            itemRow.layoutMode = 'HORIZONTAL';
            itemRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
            itemRow.counterAxisSizingMode = 'AUTO';
            itemRow.resize(340, 20); // CHANGED: 520 -> 340
            itemRow.fills = [];
            
            const desc = item.desc || '';
            const qty = item.qty || '0';
            const rate = item.rate || '0';
            const amount = item.amount || '0.00';
            
            // FIXED: Use the formatted values from the UI
            const descText = createText(desc, 11, 'LEFT');
            const qtyText = createText(qty, 11, 'CENTER');
            const rateText = createText(item.formattedRate || formatCurrencyFallback(parseFloat(rate), data.currency), 11, 'CENTER');
            const amountText = createText(amount, 11, 'RIGHT');
            
            // Set consistent widths - UPDATED: same as header widths
            descText.resize(180, 20); // CHANGED: 300 -> 180
            qtyText.resize(40, 20);   // CHANGED: 60 -> 40
            rateText.resize(60, 20);  // CHANGED: 80 -> 60
            amountText.resize(60, 20); // CHANGED: 80 -> 60
            
            itemRow.appendChild(descText);
            itemRow.appendChild(qtyText);
            itemRow.appendChild(rateText);
            itemRow.appendChild(amountText);
            
            tableFrame.appendChild(itemRow);
        }
    } else {
        const noItemsText = createText('No items added', 11, 'CENTER');
        noItemsText.resize(340, 20); // CHANGED: 520 -> 340
        tableFrame.appendChild(noItemsText);
    }
    
    frame.appendChild(tableFrame);
    
    // Totals section - UPDATED: position and width
    const totalsFrame = figma.createFrame();
    totalsFrame.layoutMode = 'VERTICAL';
    totalsFrame.counterAxisSizingMode = 'AUTO';
    totalsFrame.primaryAxisAlignItems = 'MAX';
    totalsFrame.resize(140, 100); // CHANGED: 200 -> 140
    totalsFrame.fills = [];
    totalsFrame.x = 200; // CHANGED: 340 -> 200 (adjusted for new width)
    
    // Use the formatted values from data (they already include proper currency formatting)
    const subtotalText = createText(`Subtotal: ${data.subtotal || '$0.00'}`, 12, 'LEFT');
    const taxText = createText(`Tax: ${data.taxAmount || '$0.00'}`, 12, 'LEFT');
    const totalText = createText(`TOTAL: ${data.total || '$0.00'}`, 14, 'LEFT', true);
    
    totalsFrame.appendChild(subtotalText);
    totalsFrame.appendChild(taxText);
    totalsFrame.appendChild(totalText);
    
    frame.appendChild(totalsFrame);
    
    // Message - UPDATED: width from 520 to 340
    if (data.message) {
        const messageText = createText(data.message, 11, 'LEFT');
        messageText.resize(340, 50); // CHANGED: 520 -> 340
        messageText.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
        frame.appendChild(messageText);
    }
    
    // NEW: Terms & Conditions Section - UPDATED: width from 520 to 340
    if (data.termsConditions && data.termsConditions.trim() !== '') {
        // Add separator line
        const termsSeparator = figma.createLine();
        termsSeparator.resize(340, 0); // CHANGED: 520 -> 340
        termsSeparator.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
        frame.appendChild(termsSeparator);

        // Add "Terms and Conditions" label (bold, centered)
        const termsLabel = createText("Terms and Conditions", 11, 'CENTER', true);
        termsLabel.resize(340, 13); // CHANGED: 520 -> 340
        termsLabel.fills = [{ type: 'SOLID', color: { r: 0.2, g: 0.2, b: 0.2 } }];
        frame.appendChild(termsLabel);
        
        // Add terms text (centered, smaller font)
        const termsText = createText(data.termsConditions, 10, 'CENTER');
        termsText.resize(340, 60); // CHANGED: 520 -> 340
        termsText.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
        frame.appendChild(termsText);
    }
}

// NEW: Fallback currency formatting for code.js
function formatCurrencyFallback(amount, currencyCode) {
    const symbols = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 
        'CAD': 'C$', 'AUD': 'A$', 'CHF': 'CHF', 
        'CNY': '¥', 'INR': '₹', 'BRL': 'R$'
    };
    
    const symbol = symbols[currencyCode] || '$';
    
    // Basic formatting - for more advanced formatting, we rely on the UI
    return `${symbol}${amount.toFixed(2)}`;
}

// FIXED: Simplified createImageNode for Figma plugin environment
async function createImageNode(imageData) {
    try {
        // For Figma plugins, we can directly use the base64 data
        // Remove the data URL prefix if present
        const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
        
        // Convert base64 to Uint8Array
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Create Figma image
        const image = figma.createImage(imageBytes);
        const imageNode = figma.createRectangle();
        
        // Set reasonable logo dimensions
        imageNode.resize(120, 60);
        imageNode.fills = [{
            type: 'IMAGE',
            imageHash: image.hash,
            scaleMode: 'FIT'
        }];
        
        return imageNode;
    } catch (error) {
        console.error('Error creating image node:', error);
        return null;
    }
}

function createText(characters, fontSize, textAlignHorizontal, bold = false) {
    const textNode = figma.createText();
    textNode.fontName = { 
        family: "Inter", 
        style: bold ? "Bold" : "Regular" 
    };
    textNode.fontSize = fontSize;
    textNode.characters = characters;
    textNode.textAlignHorizontal = textAlignHorizontal;
    return textNode;
}