// Global variables
let selectedTemplate = "modern";
let currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  CHF: "Fr",
  CNY: "元",
  SEK: "kr",
  NZD: "NZ$",
  INR: "₹",
  BDT: "৳",
  RUB: "₽",
  BRL: "R$",
  ZAR: "R",
  KRW: "₩",
  MXN: "Mex$",
};

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initApp();
  setupEventListeners();
});

// Initialize app with default values
function initApp() {
  // Set current year in footer
  document.getElementById("current-year").textContent =
    new Date().getFullYear();

  // Set default dates
  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + 30); // Default due date: 30 days from today

  document.getElementById("invoiceDate").valueAsDate = today;
  document.getElementById("dueDate").valueAsDate = dueDate;

  // Generate a default invoice number
  const defaultInvoiceNumber =
    "INV-" +
    String(today.getFullYear()).slice(-2) +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0") +
    "-" +
    Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
  document.getElementById("invoiceNumber").value = defaultInvoiceNumber;

  // Initialize the first item row
  updateItemTotal(document.querySelector(".item-row"));
  calculateTotals();
}

// Set up all event listeners
function setupEventListeners() {
  // Template selection
  document.querySelectorAll(".template").forEach((template) => {
    template.addEventListener("click", function () {
      document
        .querySelectorAll(".template")
        .forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      selectedTemplate = this.getAttribute("data-template");
    });
  });

  // Item input changes
  document
    .getElementById("items-container")
    .addEventListener("input", function (e) {
      if (e.target.tagName === "INPUT") {
        const itemRow = e.target.closest(".item-row");
        updateItemTotal(itemRow);
        calculateTotals();
      }
    });

  // Add item button
  document.getElementById("add-item").addEventListener("click", function () {
    addItemRow();
  });

  // Remove item button delegation
  document
    .getElementById("items-container")
    .addEventListener("click", function (e) {
      if (
        e.target.classList.contains("remove-item") ||
        e.target.closest(".remove-item")
      ) {
        const itemRow = e.target.closest(".item-row");
        if (document.querySelectorAll(".item-row").length > 1) {
          itemRow.remove();
          calculateTotals();
        } else {
          // Don't remove the last row, just clear it
          const inputs = itemRow.querySelectorAll("input");
          inputs.forEach(
            (input) =>
              (input.value = input.type === "number" ? input.min || 0 : "")
          );
          updateItemTotal(itemRow);
          calculateTotals();
        }
      }
    });

  // Tax and discount changes
  document.getElementById("taxRate").addEventListener("input", calculateTotals);
  document
    .getElementById("discountRate")
    .addEventListener("input", calculateTotals);
  document
    .getElementById("currency")
    .addEventListener("change", calculateTotals);

  // Preview invoice
  document
    .getElementById("preview-invoice")
    .addEventListener("click", function () {
      generateInvoicePreview();
      document.getElementById("preview-modal").style.display = "block";
    });

  // Close modal
  document.querySelector(".close-modal").addEventListener("click", function () {
    document.getElementById("preview-modal").style.display = "none";
  });

  // Close modal when clicking outside
  window.addEventListener("click", function (e) {
    const modal = document.getElementById("preview-modal");
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Download PDF button
  document
    .getElementById("download-pdf")
    .addEventListener("click", generatePDF);
  document
    .getElementById("download-from-preview")
    .addEventListener("click", generatePDF);

  // Print invoice
  document
    .getElementById("print-invoice")
    .addEventListener("click", printInvoice);
  document
    .getElementById("print-from-preview")
    .addEventListener("click", printInvoice);

  // Edit invoice from preview
  document
    .getElementById("edit-invoice")
    .addEventListener("click", function () {
      document.getElementById("preview-modal").style.display = "none";
    });

  // Reset form
  document.getElementById("reset-form").addEventListener("click", function () {
    if (
      confirm(
        "Are you sure you want to reset the form? All entered data will be lost."
      )
    ) {
      document.querySelector(".invoice-form").reset();

      // Clear all item rows except the first one
      const itemRows = document.querySelectorAll(".item-row");
      for (let i = 1; i < itemRows.length; i++) {
        itemRows[i].remove();
      }

      // Reset the first item row
      const firstRow = document.querySelector(".item-row");
      const inputs = firstRow.querySelectorAll("input");
      inputs.forEach(
        (input) => (input.value = input.type === "number" ? input.min || 0 : "")
      );
      updateItemTotal(firstRow);

      // Re-initialize the app
      initApp();
    }
  });
}

// Add a new item row
function addItemRow() {
  const itemsContainer = document.getElementById("items-container");
  const newRow = document.createElement("div");
  newRow.className = "item-row";

  newRow.innerHTML = `
        <div class="item-description">
            <input type="text" placeholder="Item description">
        </div>
        <div class="item-quantity">
            <input type="number" min="1" value="1">
        </div>
        <div class="item-price">
            <input type="number" min="0" step="0.01" value="0.00">
        </div>
        <div class="item-total">0.00</div>
        <div class="item-actions">
            <button class="remove-item"><i class="fas fa-trash"></i></button>
        </div>
    `;

  itemsContainer.appendChild(newRow);
  updateItemTotal(newRow);
}

// Update the total for a single item row
function updateItemTotal(row) {
  const quantityInput = row.querySelector(".item-quantity input");
  const priceInput = row.querySelector(".item-price input");
  const totalCell = row.querySelector(".item-total");

  const quantity = parseFloat(quantityInput.value) || 0;
  const price = parseFloat(priceInput.value) || 0;
  const total = quantity * price;

  totalCell.textContent = total.toFixed(2);
}

// Calculate subtotal, tax, discount, and total
function calculateTotals() {
  let subtotal = 0;
  const items = document.querySelectorAll(".item-row");

  items.forEach((item) => {
    subtotal += parseFloat(item.querySelector(".item-total").textContent) || 0;
  });

  const taxRate = parseFloat(document.getElementById("taxRate").value) || 0;
  const discountRate =
    parseFloat(document.getElementById("discountRate").value) || 0;

  const discountAmount = (subtotal * discountRate) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * taxRate) / 100;
  const total = afterDiscount + taxAmount;

  // Get currency symbol
  const currency = document.getElementById("currency").value;
  const currencySymbol = currencySymbols[currency] || "$";

  // Update summary section
  document.getElementById(
    "subtotal"
  ).textContent = `${currencySymbol}${subtotal.toFixed(2)}`;
  document.getElementById(
    "discount"
  ).textContent = `${currencySymbol}${discountAmount.toFixed(2)}`;
  document.getElementById(
    "tax"
  ).textContent = `${currencySymbol}${taxAmount.toFixed(2)}`;
  document.getElementById(
    "total"
  ).textContent = `${currencySymbol}${total.toFixed(2)}`;
}

// Generate the invoice preview
function generateInvoicePreview() {
  const previewContainer = document.getElementById("invoice-preview");
  const currency = document.getElementById("currency").value;
  const currencySymbol = currencySymbols[currency] || "$";

  // Collect all form data
  const invoiceData = {
    yourName: document.getElementById("yourName").value || "Your Business Name",
    yourEmail: document.getElementById("yourEmail").value || "your@email.com",
    yourPhone: document.getElementById("yourPhone").value || "",
    yourAddress: document.getElementById("yourAddress").value || "",

    clientName: document.getElementById("clientName").value || "Client Name",
    clientEmail: document.getElementById("clientEmail").value || "",
    clientPhone: document.getElementById("clientPhone").value || "",
    clientAddress: document.getElementById("clientAddress").value || "",

    invoiceNumber: document.getElementById("invoiceNumber").value || "INV-001",
    invoiceDate:
      formatDate(document.getElementById("invoiceDate").value) || "N/A",
    dueDate: formatDate(document.getElementById("dueDate").value) || "N/A",

    items: [],

    taxRate: parseFloat(document.getElementById("taxRate").value) || 0,
    discountRate:
      parseFloat(document.getElementById("discountRate").value) || 0,

    notes: document.getElementById("notes").value || "",
    paymentTerms:
      document.getElementById("paymentTerms").value || "Payment due on receipt",
  };

  // Collect items
  document.querySelectorAll(".item-row").forEach((row) => {
    const description = row.querySelector(".item-description input").value;
    const quantity =
      parseFloat(row.querySelector(".item-quantity input").value) || 0;
    const price = parseFloat(row.querySelector(".item-price input").value) || 0;
    const total = parseFloat(row.querySelector(".item-total").textContent) || 0;

    if (description || quantity > 0 || price > 0) {
      invoiceData.items.push({
        description,
        quantity,
        price,
        total,
      });
    }
  });

  // Calculate totals
  let subtotal = 0;
  invoiceData.items.forEach((item) => {
    subtotal += item.total;
  });

  const discountAmount = (subtotal * invoiceData.discountRate) / 100;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * invoiceData.taxRate) / 100;
  const total = afterDiscount + taxAmount;

  // Generate HTML for the invoice preview
  let invoiceHTML = "";

  switch (selectedTemplate) {
    case "classic":
      invoiceHTML = generateClassicTemplate(
        invoiceData,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        currencySymbol
      );
      break;
    case "minimal":
      invoiceHTML = generateMinimalTemplate(
        invoiceData,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        currencySymbol
      );
      break;
    case "modern":
    default:
      invoiceHTML = generateModernTemplate(
        invoiceData,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        currencySymbol
      );
      break;
  }

  previewContainer.innerHTML = invoiceHTML;
  previewContainer.className = "fade-in";
}

// Generate Modern Template
function generateModernTemplate(
  data,
  subtotal,
  discount,
  tax,
  total,
  currencySymbol
) {
  let itemsHTML = "";
  data.items.forEach((item) => {
    itemsHTML += `
            <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${currencySymbol}${item.price.toFixed(2)}</td>
                <td>${currencySymbol}${item.total.toFixed(2)}</td>
            </tr>
        `;
  });

  return `
        <div class="invoice-template modern">
            <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                <div>
                    <h2 style="color: #4361ee; font-size: 28px; margin-bottom: 5px;">${
                      data.yourName
                    }</h2>
                    <p>${data.yourEmail}</p>
                    <p>${data.yourPhone}</p>
                    <p style="white-space: pre-line;">${data.yourAddress}</p>
                </div>
                <div style="text-align: right;">
                    <h1 style="color: #4361ee; font-size: 32px; margin-bottom: 10px;">INVOICE</h1>
                    <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                    <p><strong>Date:</strong> ${data.invoiceDate}</p>
                    <p><strong>Due Date:</strong> ${data.dueDate}</p>
                </div>
            </div>
            
            <div style="margin-bottom: 40px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
                <h3 style="color: #4361ee; margin-bottom: 10px;">Bill To:</h3>
                <p><strong>${data.clientName}</strong></p>
                <p>${data.clientEmail}</p>
                <p>${data.clientPhone}</p>
                <p style="white-space: pre-line;">${data.clientAddress}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background-color: #4361ee; color: white;">
                        <th style="padding: 12px; text-align: left;">Description</th>
                        <th style="padding: 12px; text-align: center;">Quantity</th>
                        <th style="padding: 12px; text-align: right;">Unit Price</th>
                        <th style="padding: 12px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            
            <div style="display: flex; justify-content: flex-end;">
                <div style="width: 300px;">
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                        <span>Subtotal:</span>
                        <span>${currencySymbol}${subtotal.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                        <span>Discount (${data.discountRate}%):</span>
                        <span>${currencySymbol}${discount.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6;">
                        <span>Tax (${data.taxRate}%):</span>
                        <span>${currencySymbol}${tax.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 15px 0; font-weight: bold; font-size: 18px; color: #4361ee;">
                        <span>Total:</span>
                        <span>${currencySymbol}${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 40px;">
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #4361ee; margin-bottom: 10px;">Payment Terms</h3>
                    <p>${data.paymentTerms}</p>
                </div>
                
                <div>
                    <h3 style="color: #4361ee; margin-bottom: 10px;">Notes</h3>
                    <p>${data.notes}</p>
                </div>
            </div>
        </div>
    `;
}

// Generate Classic Template
function generateClassicTemplate(
  data,
  subtotal,
  discount,
  tax,
  total,
  currencySymbol
) {
  let itemsHTML = "";
  data.items.forEach((item) => {
    itemsHTML += `
            <tr>
                <td style="padding: 8px; border: 1px solid #000;">${
                  item.description
                }</td>
                <td style="padding: 8px; border: 1px solid #000; text-align: center;">${
                  item.quantity
                }</td>
                <td style="padding: 8px; border: 1px solid #000; text-align: right;">${currencySymbol}${item.price.toFixed(
      2
    )}</td>
                <td style="padding: 8px; border: 1px solid #000; text-align: right;">${currencySymbol}${item.total.toFixed(
      2
    )}</td>
            </tr>
        `;
  });

  return `
        <div class="invoice-template classic" style="font-family: 'Times New Roman', serif; border: 5px double #000; padding: 30px;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
                <h1 style="font-size: 28px; margin-bottom: 5px;">INVOICE</h1>
                <p style="font-style: italic;">${data.yourName}</p>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div>
                    <h3 style="margin-bottom: 10px; text-decoration: underline;">From:</h3>
                    <p>${data.yourName}</p>
                    <p>${data.yourEmail}</p>
                    <p>${data.yourPhone}</p>
                    <p style="white-space: pre-line;">${data.yourAddress}</p>
                </div>
                <div>
                    <h3 style="margin-bottom: 10px; text-decoration: underline;">Bill To:</h3>
                    <p>${data.clientName}</p>
                    <p>${data.clientEmail}</p>
                    <p>${data.clientPhone}</p>
                    <p style="white-space: pre-line;">${data.clientAddress}</p>
                </div>
                <div>
                    <h3 style="margin-bottom: 10px; text-decoration: underline;">Invoice Details:</h3>
                    <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                    <p><strong>Date:</strong> ${data.invoiceDate}</p>
                    <p><strong>Due Date:</strong> ${data.dueDate}</p>
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 2px solid #000;">
                <thead>
                    <tr style="background-color: #f0f0f0;">
                        <th style="padding: 10px; border: 1px solid #000; text-align: left;">Description</th>
                        <th style="padding: 10px; border: 1px solid #000; text-align: center;">Quantity</th>
                        <th style="padding: 10px; border: 1px solid #000; text-align: right;">Unit Price</th>
                        <th style="padding: 10px; border: 1px solid #000; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            
            <div style="display: flex; justify-content: flex-end;">
                <table style="width: 300px; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; text-align: left;">Subtotal:</td>
                        <td style="padding: 8px; text-align: right;">${currencySymbol}${subtotal.toFixed(
    2
  )}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; text-align: left;">Discount (${
                          data.discountRate
                        }%):</td>
                        <td style="padding: 8px; text-align: right;">${currencySymbol}${discount.toFixed(
    2
  )}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; text-align: left;">Tax (${
                          data.taxRate
                        }%):</td>
                        <td style="padding: 8px; text-align: right;">${currencySymbol}${tax.toFixed(
    2
  )}</td>
                    </tr>
                    <tr style="font-weight: bold; border-top: 2px solid #000;">
                        <td style="padding: 8px; text-align: left;">Total:</td>
                        <td style="padding: 8px; text-align: right;">${currencySymbol}${total.toFixed(
    2
  )}</td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-top: 40px;">
                <div style="margin-bottom: 20px; border-top: 1px solid #000; padding-top: 20px;">
                    <h3 style="margin-bottom: 10px; text-decoration: underline;">Payment Terms</h3>
                    <p>${data.paymentTerms}</p>
                </div>
                
                <div>
                    <h3 style="margin-bottom: 10px; text-decoration: underline;">Notes</h3>
                    <p>${data.notes}</p>
                </div>
            </div>
        </div>
    `;
}

// Generate Minimal Template
function generateMinimalTemplate(
  data,
  subtotal,
  discount,
  tax,
  total,
  currencySymbol
) {
  let itemsHTML = "";
  data.items.forEach((item) => {
    itemsHTML += `
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${
                  item.description
                }</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center;">${
                  item.quantity
                }</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${currencySymbol}${item.price.toFixed(
      2
    )}</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">${currencySymbol}${item.total.toFixed(
      2
    )}</td>
            </tr>
        `;
  });

  return `
        <div class="invoice-template minimal" style="font-family: Arial, sans-serif; color: #333;">
            <div style="margin-bottom: 40px;">
                <h2 style="font-size: 24px; font-weight: 300; margin-bottom: 5px;">${
                  data.yourName
                }</h2>
                <div style="font-size: 14px; color: #666;">
                    <div>${data.yourEmail} | ${data.yourPhone}</div>
                    <div style="white-space: pre-line;">${
                      data.yourAddress
                    }</div>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
                <div>
                    <h2 style="font-size: 32px; font-weight: 300; margin-bottom: 20px;">Invoice</h2>
                    <div style="margin-bottom: 20px;">
                        <div style="font-weight: bold; margin-bottom: 5px;">Bill To</div>
                        <div>${data.clientName}</div>
                        <div>${data.clientEmail}</div>
                        <div>${data.clientPhone}</div>
                        <div style="white-space: pre-line;">${
                          data.clientAddress
                        }</div>
                    </div>
                </div>
                <div>
                    <table style="text-align: right;">
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Invoice Number:</td>
                            <td style="padding: 5px 0 5px 20px;">${
                              data.invoiceNumber
                            }</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Invoice Date:</td>
                            <td style="padding: 5px 0 5px 20px;">${
                              data.invoiceDate
                            }</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0; font-weight: bold;">Due Date:</td>
                            <td style="padding: 5px 0 5px 20px;">${
                              data.dueDate
                            }</td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="border-bottom: 2px solid #eee;">
                        <th style="padding: 10px 0; text-align: left;">Description</th>
                        <th style="padding: 10px 0; text-align: center;">Quantity</th>
                        <th style="padding: 10px 0; text-align: right;">Unit Price</th>
                        <th style="padding: 10px 0; text-align: right;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
            
            <div style="display: flex; justify-content: flex-end;">
                <table style="width: 300px;">
                    <tr>
                        <td style="padding: 5px 0; text-align: left;">Subtotal:</td>
                        <td style="padding: 5px 0; text-align: right;">${currencySymbol}${subtotal.toFixed(
    2
  )}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; text-align: left;">Discount (${
                          data.discountRate
                        }%):</td>
                        <td style="padding: 5px 0; text-align: right;">${currencySymbol}${discount.toFixed(
    2
  )}</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px 0; text-align: left;">Tax (${
                          data.taxRate
                        }%):</td>
                        <td style="padding: 5px 0; text-align: right;">${currencySymbol}${tax.toFixed(
    2
  )}</td>
                    </tr>
                    <tr style="font-weight: bold;">
                        <td style="padding: 15px 0 5px; text-align: left; border-top: 2px solid #eee;">Total Due:</td>
                        <td style="padding: 15px 0 5px; text-align: right; border-top: 2px solid #eee;">${currencySymbol}${total.toFixed(
    2
  )}</td>
                    </tr>
                </table>
            </div>
            
            <div style="margin-top: 40px; font-size: 14px;">
                <div style="margin-bottom: 20px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">Payment Terms</div>
                    <div>${data.paymentTerms}</div>
                </div>
                
                <div>
                    <div style="font-weight: bold; margin-bottom: 5px;">Notes</div>
                    <div>${data.notes}</div>
                </div>
            </div>
        </div>
    `;
}

// Format date in a human-readable format
function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const options = { year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

// Generate PDF using html2canvas and jsPDF
function generatePDF() {
  // Make sure the preview is generated first
  generateInvoicePreview();

  // Show a loading message
  const previewContainer = document.getElementById("invoice-preview");
  const originalContent = previewContainer.innerHTML;
  previewContainer.innerHTML =
    '<div style="text-align: center; padding: 50px;"><h3>Generating PDF...</h3><p>Please wait</p></div>';

  // Delay to allow the loading message to render
  setTimeout(() => {
    // Restore original content
    previewContainer.innerHTML = originalContent;

    const { jsPDF } = window.jspdf;

    // Use html2canvas to render the invoice to a canvas
    html2canvas(document.getElementById("invoice-preview").firstElementChild, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/jpeg", 1.0);

      // Create PDF in the appropriate orientation
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const imgWidth = 595; // A4 width in points
      const imgHeight = 842; // A4 height in points
      const ratio = Math.min(
        imgWidth / canvas.width,
        imgHeight / canvas.height
      );
      const imgX = (imgWidth - canvas.width * ratio) / 2;

      pdf.addImage(
        imgData,
        "JPEG",
        imgX,
        20,
        canvas.width * ratio,
        canvas.height * ratio
      );

      // Save the PDF
      const invoiceNumber =
        document.getElementById("invoiceNumber").value || "invoice";
      pdf.save(`${invoiceNumber}.pdf`);
    });
  }, 100);
}

// Print the invoice
function printInvoice() {
  // Make sure the preview is generated first
  generateInvoicePreview();

  // Delay to ensure the preview is rendered
  setTimeout(() => {
    window.print();
  }, 100);
}
