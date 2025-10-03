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
            invoicesPage = figma.createPage(); // REMOVED: const declaration
            invoicesPage.name = "Invoices";
            figma.root.appendChild(invoicesPage);
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
        invoiceFrame.layoutMode = 'VERTICAL';
        invoiceFrame.itemSpacing = 20;
        invoiceFrame.paddingLeft = 40;
        invoiceFrame.paddingRight = 40;
        invoiceFrame.paddingTop = 40;
        invoiceFrame.paddingBottom = 40;
        
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
    
    // Header section with two columns
    const header = figma.createFrame();
    header.layoutMode = 'HORIZONTAL';
    header.primaryAxisAlignItems = 'SPACE_BETWEEN';
    header.counterAxisSizingMode = 'AUTO';
    header.resize(520, 150);
    header.fills = [];
    
    // Left column - Company info
    const leftColumn = figma.createFrame();
    leftColumn.layoutMode = 'VERTICAL';
    leftColumn.counterAxisSizingMode = 'AUTO';
    leftColumn.itemSpacing = 8;
    leftColumn.fills = [];
    
    // In the addInvoiceContent function, update the logo section:

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
    
    // Invoice details row
    const detailsRow = figma.createFrame();
    detailsRow.layoutMode = 'HORIZONTAL';
    detailsRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
    detailsRow.counterAxisSizingMode = 'AUTO';
    detailsRow.resize(520, 20);
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
    
    // Line items table
    const tableFrame = figma.createFrame();
    tableFrame.layoutMode = 'VERTICAL';
    tableFrame.counterAxisSizingMode = 'AUTO';
    tableFrame.resize(520, 200);
    tableFrame.fills = [];
    
    // Table header
    const tableHeader = figma.createFrame();
    tableHeader.layoutMode = 'HORIZONTAL';
    tableHeader.primaryAxisAlignItems = 'SPACE_BETWEEN';
    tableHeader.counterAxisSizingMode = 'AUTO';
    tableHeader.resize(520, 20);
    tableHeader.fills = [];
    
    const descHeader = createText('DESCRIPTION', 11, 'LEFT', true);
    const qtyHeader = createText('QTY', 11, 'CENTER', true);
    const rateHeader = createText('RATE', 11, 'CENTER', true);
    const amountHeader = createText('AMOUNT', 11, 'RIGHT', true);
    
    // Set widths for proper alignment
    descHeader.resize(300, 20);
    qtyHeader.resize(60, 20);
    rateHeader.resize(80, 20);
    amountHeader.resize(80, 20);
    
    tableHeader.appendChild(descHeader);
    tableHeader.appendChild(qtyHeader);
    tableHeader.appendChild(rateHeader);
    tableHeader.appendChild(amountHeader);
    
    tableFrame.appendChild(tableHeader);
    
    // Separator line
    const separator = figma.createLine();
    separator.resize(520, 0);
    separator.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
    tableFrame.appendChild(separator);
    
    // Line items
    if (data.lineItems && data.lineItems.length > 0) {
        for (const item of data.lineItems) {
            const itemRow = figma.createFrame();
            itemRow.layoutMode = 'HORIZONTAL';
            itemRow.primaryAxisAlignItems = 'SPACE_BETWEEN';
            itemRow.counterAxisSizingMode = 'AUTO';
            itemRow.resize(520, 20);
            itemRow.fills = [];
            
            const desc = item.desc || '';
            const qty = item.qty || '0';
            const rate = item.rate || '0';
            const amount = item.amount || '$0.00';
            
            const descText = createText(desc, 11, 'LEFT');
            const qtyText = createText(qty, 11, 'CENTER');
            const rateText = createText(`$${parseFloat(rate).toFixed(2)}`, 11, 'CENTER');
            const amountText = createText(amount, 11, 'RIGHT');
            
            // Set consistent widths
            descText.resize(300, 20);
            qtyText.resize(60, 20);
            rateText.resize(80, 20);
            amountText.resize(80, 20);
            
            itemRow.appendChild(descText);
            itemRow.appendChild(qtyText);
            itemRow.appendChild(rateText);
            itemRow.appendChild(amountText);
            
            tableFrame.appendChild(itemRow);
        }
    } else {
        const noItemsText = createText('No items added', 11, 'CENTER');
        noItemsText.resize(520, 20);
        tableFrame.appendChild(noItemsText);
    }
    
    frame.appendChild(tableFrame);
    
    // Totals section
    const totalsFrame = figma.createFrame();
    totalsFrame.layoutMode = 'VERTICAL';
    totalsFrame.counterAxisSizingMode = 'AUTO';
    totalsFrame.primaryAxisAlignItems = 'MAX';
    totalsFrame.resize(200, 100);
    totalsFrame.fills = [];
    totalsFrame.x = 340;
    
    const subtotalText = createText(`Subtotal: ${data.subtotal || '$0.00'}`, 12, 'LEFT');
    const taxText = createText(`Tax: ${data.taxAmount || '$0.00'}`, 12, 'LEFT');
    const totalText = createText(`TOTAL: ${data.total || '$0.00'}`, 14, 'LEFT', true);
    
    totalsFrame.appendChild(subtotalText);
    totalsFrame.appendChild(taxText);
    totalsFrame.appendChild(totalText);
    
    frame.appendChild(totalsFrame);
    
    // Message
    if (data.message) {
        const messageText = createText(data.message, 11, 'LEFT');
        messageText.resize(520, 50);
        messageText.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
        frame.appendChild(messageText);
    }
}

async function createImageNode(imageData) {
    return new Promise((resolve) => {
        try {
            // Create a temporary image element to handle loading
            const img = new Image();
            
            img.onload = function() {
                try {
                    // Create canvas to convert to proper format
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    
                    // Convert to base64
                    const base64Data = canvas.toDataURL('image/png').split(',')[1];
                    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                    
                    // Create Figma image
                    const image = figma.createImage(imageBytes);
                    const imageNode = figma.createRectangle();
                    imageNode.resize(120, 60);
                    imageNode.fills = [{
                        type: 'IMAGE',
                        imageHash: image.hash,
                        scaleMode: 'FIT'
                    }];
                    
                    resolve(imageNode);
                } catch (error) {
                    console.error('Error processing loaded image:', error);
                    resolve(null);
                }
            };
            
            img.onerror = function() {
                console.log('Image loading failed');
                resolve(null);
            };
            
            img.src = imageData;
            
        } catch (error) {
            console.error('Error in createImageNode:', error);
            resolve(null);
        }
    });
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