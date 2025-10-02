// Figma Plugin Code
figma.showUI(__html__, { width: 500, height: 700 });

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'export-invoice') {
        await createInvoiceFrame(msg.data);
    }
};

async function createInvoiceFrame(invoiceData) {
    try {
        // Create or find Invoices page
        let invoicesPage = figma.root.children.find(page => 
            page.name === "Invoices" && page.type === "PAGE"
        );
        
        if (!invoicesPage) {
            const invoicesPage = figma.createPage();
            invoicesPage.name = "Invoices";
        }
        
        figma.currentPage = invoicesPage;
        
        // Create invoice artboard
        const invoiceFrame = figma.createFrame();
        invoiceFrame.name = `Invoice-${invoiceData.invoiceNumber || '001'}`;
        invoiceFrame.resize(600, 800);
        invoiceFrame.x = 100;
        invoiceFrame.y = 100;
        invoiceFrame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        invoiceFrame.clipsContent = false;
        
        // Add invoice content
        await addInvoiceContent(invoiceFrame, invoiceData);
        
        // Select the new frame
        invoicesPage.appendChild(invoiceFrame);
        figma.currentPage.selection = [invoiceFrame];
        figma.viewport.scrollAndZoomIntoView([invoiceFrame]);
        
        figma.notify('Invoice created successfully!');
        
    } catch (error) {
        console.error('Error creating invoice:', error);
        figma.notify('Error creating invoice: ' + error.message);
    }
}

async function addInvoiceContent(frame, data) {
    // Load font first
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
    await figma.loadFontAsync({ family: "Inter", style: "Bold" });
    
    let yPosition = 40;
    
    // Header section with two columns
    const header = figma.createFrame();
    header.resize(520, 150);
    header.x = 40;
    header.y = yPosition;
    header.fills = [];
    header.layoutMode = 'HORIZONTAL';
    header.primaryAxisAlignItems = 'SPACE_BETWEEN';
    header.counterAxisSizingMode = 'AUTO';
    
    // Left column - Company info
    const leftColumn = figma.createFrame();
    leftColumn.resize(250, 150);
    leftColumn.fills = [];
    leftColumn.layoutMode = 'VERTICAL';
    leftColumn.counterAxisSizingMode = 'AUTO';
    leftColumn.itemSpacing = 8;
    
    // Add logo if available (simplified - just skip if there's an error)
    if (data.logo) {
        try {
            const logoImage = await createImageNode(data.logo);
            if (logoImage) {
                logoImage.resize(50, 30);
                leftColumn.appendChild(logoImage);
            }
        } catch (error) {
            console.log('Skipping logo due to error:', error);
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
    rightColumn.resize(250, 150);
    rightColumn.fills = [];
    rightColumn.layoutMode = 'VERTICAL';
    rightColumn.counterAxisSizingMode = 'AUTO';
    
    const clientText = createText(
        `Bill To:\n${data.clientCompany || 'Client Company'}\nAttn: ${data.clientContact || 'Contact Person'}\n${data.clientAddress || 'Client Address'}`,
        12,
        'RIGHT'
    );
    rightColumn.appendChild(clientText);
    
    header.appendChild(leftColumn);
    header.appendChild(rightColumn);
    frame.appendChild(header);
    
    yPosition += 160;
    
    // Invoice title
    const invoiceTitle = createText(
        `INVOICE #${data.invoiceNumber || '001'}`,
        24,
        'LEFT',
        true
    );
    invoiceTitle.x = 40;
    invoiceTitle.y = yPosition;
    frame.appendChild(invoiceTitle);
    
    yPosition += 40;
    
    // Invoice details
    const invoiceDetails = createText(
        `Date: ${data.invoiceDate || 'N/A'}          Due Date: ${data.dueDate || 'N/A'}`,
        12,
        'LEFT'
    );
    invoiceDetails.x = 40;
    invoiceDetails.y = yPosition;
    frame.appendChild(invoiceDetails);
    
    yPosition += 40;
    
    // Line items header
    const itemsHeader = createText(
        'DESCRIPTION                                                             QTY      RATE       AMOUNT',
        11,
        'LEFT',
        true
    );
    itemsHeader.x = 40;
    itemsHeader.y = yPosition;
    frame.appendChild(itemsHeader);
    
    yPosition += 25;
    
    // Line separator
    const separator = figma.createLine();
    separator.x = 40;
    separator.y = yPosition;
    separator.resize(520, 0);
    separator.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
    frame.appendChild(separator);
    
    yPosition += 20;
    
    // Line items
    if (data.lineItems && data.lineItems.length > 0) {
        for (const item of data.lineItems) {
            const desc = item.desc || '';
            const qty = item.qty || '0';
            const rate = item.rate || '0';
            const amount = item.amount || '$0.00';
            
            const itemText = createText(
                `${desc}`,
                11,
                'LEFT'
            );
            itemText.x = 40;
            itemText.y = yPosition;
            frame.appendChild(itemText);
            
            const qtyText = createText(
                qty,
                11,
                'LEFT'
            );
            qtyText.x = 400;
            qtyText.y = yPosition;
            frame.appendChild(qtyText);
            
            const rateText = createText(
                `$${parseFloat(rate).toFixed(2)}`,
                11,
                'LEFT'
            );
            rateText.x = 450;
            rateText.y = yPosition;
            frame.appendChild(rateText);
            
            const amountText = createText(
                amount,
                11,
                'RIGHT'
            );
            amountText.x = 520;
            amountText.y = yPosition;
            amountText.resize(80, 20);
            frame.appendChild(amountText);
            
            yPosition += 20;
        }
    } else {
        const noItemsText = createText(
            'No items added',
            11,
            'CENTER'
        );
        noItemsText.x = 40;
        noItemsText.y = yPosition;
        noItemsText.resize(520, 20);
        frame.appendChild(noItemsText);
        yPosition += 30;
    }
    
    yPosition += 20;
    
    // Totals section
    const totalsFrame = figma.createFrame();
    totalsFrame.resize(200, 100);
    totalsFrame.x = 340;
    totalsFrame.y = yPosition;
    totalsFrame.fills = [];
    totalsFrame.layoutMode = 'VERTICAL';
    totalsFrame.counterAxisSizingMode = 'AUTO';
    totalsFrame.itemSpacing = 5;
    
    const subtotalText = createText(
        `Subtotal: ${data.subtotal}`,
        12,
        'LEFT'
    );
    totalsFrame.appendChild(subtotalText);
    
    const taxText = createText(
        `Tax: ${data.taxAmount}`,
        12,
        'LEFT'
    );
    totalsFrame.appendChild(taxText);
    
    const totalText = createText(
        `TOTAL: ${data.total}`,
        14,
        'LEFT',
        true
    );
    totalsFrame.appendChild(totalText);
    
    frame.appendChild(totalsFrame);
    
    yPosition += 120;
    
    // Message
    if (data.message) {
        const messageText = createText(
            data.message,
            11,
            'LEFT'
        );
        messageText.x = 40;
        messageText.y = yPosition;
        messageText.resize(520, 50);
        messageText.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
        frame.appendChild(messageText);
    }
}

// Simplified image creation
async function createImageNode(imageData) {
    try {
        // Extract base64 data
        const base64Data = imageData.split(',')[1];
        if (!base64Data) {
            throw new Error('Invalid image data');
        }
        
        // Convert base64 to bytes
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Create image
        const image = figma.createImage(imageBytes);
        
        // Create rectangle for the image
        const imageNode = figma.createRectangle();
        imageNode.resize(60, 30);
        imageNode.fills = [{
            type: 'IMAGE',
            imageHash: image.hash,
            scaleMode: 'FILL'
        }];
        
        return imageNode;
    } catch (error) {
        console.error('Error creating image:', error);
        return null;
    }
}

// Simplified text creation
function createText(characters, fontSize, textAlignHorizontal, bold = false) {
    const textNode = figma.createText();
    
    // Set font
    textNode.fontName = { 
        family: "Inter", 
        style: bold ? "Bold" : "Regular" 
    };
    textNode.fontSize = fontSize;
    textNode.characters = characters;
    textNode.textAlignHorizontal = textAlignHorizontal;
    
    return textNode;
}