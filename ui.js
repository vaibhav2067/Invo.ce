// UI Logic for Invoice Generator
document.addEventListener('DOMContentLoaded', function() {
    // Initialize
    initializeLineItems();
    setupEventListeners();
    setDefaultDates();
});

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateString = dueDate.toISOString().split('T')[0];
    
    document.getElementById('invoiceDate').value = today;
    document.getElementById('dueDate').value = dueDateString;
}

function initializeLineItems() {
    addLineItem(); // Start with one empty line item
}
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const logoPreview = document.getElementById('logoPreview');
            const logoPreviewImg = document.getElementById('logoPreviewImg');
            logoPreviewImg.src = e.target.result;
            logoPreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    }
}

function setupEventListeners() {
    // Info button
    document.getElementById('infoButton').addEventListener('click', showInfoModal);
    document.getElementById('modalClose').addEventListener('click', hideInfoModal);
    
    // Main buttons
    document.getElementById('previewBtn').addEventListener('click', showPreview);
    document.getElementById('backBtn').addEventListener('click', showForm);
    document.getElementById('exportBtn').addEventListener('click', exportToFigma);
    
    // Line items
    document.getElementById('addItemBtn').addEventListener('click', addLineItem);
    
    // Calculation listeners
    document.getElementById('taxRate').addEventListener('input', calculateTotals);
    document.getElementById('discount').addEventListener('input', calculateTotals);
}

function showInfoModal() {
    document.getElementById('infoModal').style.display = 'flex';
}

function hideInfoModal() {
    document.getElementById('infoModal').style.display = 'none';
}

function addLineItem() {
    const tbody = document.getElementById('lineItemsBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="item-desc" placeholder="Item description"></td>
        <td><input type="number" class="item-qty" value="1" min="0"></td>
        <td><input type="number" class="item-rate" value="0" min="0" step="0.01"></td>
        <td><input type="text" class="item-amount" value="$0.00" readonly></td>
    `;
    
    tbody.appendChild(row);
    
    // Add event listeners to new inputs
    const qtyInput = row.querySelector('.item-qty');
    const rateInput = row.querySelector('.item-rate');
    
    qtyInput.addEventListener('input', () => calculateLineItem(row));
    rateInput.addEventListener('input', () => calculateLineItem(row));
}

function calculateLineItem(row) {
    const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
    const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
    const amount = qty * rate;
    
    row.querySelector('.item-amount').value = formatCurrency(amount);
    calculateTotals();
}

function calculateTotals() {
    const rows = document.querySelectorAll('#lineItemsBody tr');
    let subtotal = 0;
    
    rows.forEach(row => {
        const amountText = row.querySelector('.item-amount').value;
        const amount = parseFloat(amountText.replace(/[^0-9.-]+/g,"")) || 0;
        subtotal += amount;
    });
    
    const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
    const discount = parseFloat(document.getElementById('discount').value) || 0;
    
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount - discount;
    
    document.getElementById('subtotalValue').textContent = formatCurrency(subtotal);
    document.getElementById('taxAmount').textContent = formatCurrency(taxAmount);
    document.getElementById('totalValue').textContent = formatCurrency(total);
}

function formatCurrency(amount) {
    return '$' + amount.toFixed(2);
}

function showPreview() {
    generatePreview();
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('previewContainer').style.display = 'block';
    document.getElementById('previewBtn').style.display = 'none';
    document.getElementById('backBtn').style.display = 'block';
}

function showForm() {
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('previewBtn').style.display = 'block';
    document.getElementById('backBtn').style.display = 'none';
}

function generatePreview() {
    const preview = document.getElementById('invoicePreview');
    
    preview.innerHTML = `
        <div class="preview-header">
            <div class="preview-company">
                <div class="preview-logo"></div>
                <strong>${document.getElementById('companyName').value || 'Your Company'}</strong><br>
                ${document.getElementById('companyAddress').value || 'Your Address'}<br>
                Phone: ${document.getElementById('companyPhone').value || 'N/A'}<br>
                Email: ${document.getElementById('companyEmail').value || 'N/A'}<br>
                Tax ID: ${document.getElementById('companyTaxId').value || 'N/A'}
            </div>
            <div class="preview-client" style="text-align: right;">
                <strong>Bill To:</strong><br>
                ${document.getElementById('clientCompany').value || 'Client Company'}<br>
                Attn: ${document.getElementById('clientContact').value || 'Contact Person'}<br>
                ${document.getElementById('clientAddress').value || 'Client Address'}
            </div>
        </div>
        
        <div class="preview-title">
            INVOICE #${document.getElementById('invoiceNumber').value || '001'}
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px;">
            <div><strong>Date:</strong> ${document.getElementById('invoiceDate').value || 'N/A'}</div>
            <div><strong>Due Date:</strong> ${document.getElementById('dueDate').value || 'N/A'}</div>
        </div>
        
        <table class="preview-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${generatePreviewLineItems()}
            </tbody>
        </table>
        
        <div class="preview-totals">
            ${generatePreviewTotals()}
        </div>
        
        <div class="preview-message">
            ${document.getElementById('thankYouMessage').value || 'Thank you for your business!'}
        </div>
    `;
}

function generatePreviewLineItems() {
    const rows = document.querySelectorAll('#lineItemsBody tr');
    let html = '';
    
    rows.forEach(row => {
        const desc = row.querySelector('.item-desc').value || '';
        const qty = row.querySelector('.item-qty').value || '0';
        const rate = row.querySelector('.item-rate').value || '0';
        const amount = row.querySelector('.item-amount').value || '$0.00';
        
        if (desc || qty !== '0' || rate !== '0') {
            html += `
                <tr>
                    <td>${desc}</td>
                    <td>${qty}</td>
                    <td>${formatCurrency(parseFloat(rate))}</td>
                    <td>${amount}</td>
                </tr>
            `;
        }
    });
    
    return html || '<tr><td colspan="4" style="text-align: center;">No items added</td></tr>';
}

function generatePreviewTotals() {
    const subtotal = document.getElementById('subtotalValue').textContent;
    const taxAmount = document.getElementById('taxAmount').textContent;
    const total = document.getElementById('totalValue').textContent;
    const taxRate = document.getElementById('taxRate').value || '0';
    const discount = document.getElementById('discount').value || '0';
    
    return `
        <div class="preview-total-row">
            <span>Subtotal:</span>
            <span>${subtotal}</span>
        </div>
        <div class="preview-total-row">
            <span>Tax (${taxRate}%):</span>
            <span>${taxAmount}</span>
        </div>
        <div class="preview-total-row">
            <span>Discount:</span>
            <span>-${formatCurrency(parseFloat(discount))}</span>
        </div>
        <div class="preview-total-row final">
            <span>TOTAL:</span>
            <span>${total}</span>
        </div>
    `;
}

function exportToFigma() {
    let logoData = null;
    const logoPreviewImg = document.getElementById('logoPreviewImg');
    if (logoPreviewImg && logoPreviewImg.src) {
        logoData = logoPreviewImg.src;
    }
    // Collect all data
    const invoiceData = {
        companyName: document.getElementById('companyName').value,
        companyAddress: document.getElementById('companyAddress').value,
        companyPhone: document.getElementById('companyPhone').value,
        companyEmail: document.getElementById('companyEmail').value,
        companyTaxId: document.getElementById('companyTaxId').value,
        clientCompany: document.getElementById('clientCompany').value,
        clientContact: document.getElementById('clientContact').value,
        clientAddress: document.getElementById('clientAddress').value,
        invoiceNumber: document.getElementById('invoiceNumber').value,
        invoiceDate: document.getElementById('invoiceDate').value,
        dueDate: document.getElementById('dueDate').value,
        lineItems: getLineItemsData(),
        subtotal: document.getElementById('subtotalValue').textContent,
        taxAmount: document.getElementById('taxAmount').textContent,
        total: document.getElementById('totalValue').textContent,
        message: document.getElementById('thankYouMessage').value
        logo: logoData
    };
    
    // Send data to Figma
    parent.postMessage({ pluginMessage: { type: 'export-invoice', data: invoiceData } }, '*');
}

function getLineItemsData() {
    const rows = document.querySelectorAll('#lineItemsBody tr');
    const items = [];
    
    rows.forEach(row => {
        const desc = row.querySelector('.item-desc').value;
        const qty = row.querySelector('.item-qty').value;
        const rate = row.querySelector('.item-rate').value;
        const amount = row.querySelector('.item-amount').value;
        
        if (desc || qty !== '0' || rate !== '0') {
            items.push({ desc, qty, rate, amount });
        }
    });
    
    return items;
}