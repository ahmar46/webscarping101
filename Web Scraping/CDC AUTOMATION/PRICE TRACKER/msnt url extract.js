function getMainstreetProductLinks() {
    const collectionUrl = "https://marketplace.mainstreet.co.in/collections/sneakers?page=7"; // Your collection URL
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Get the first empty row to start appending data
    const lastRow = sheet.getLastRow();
    
    // Append headers only if the sheet is empty
    if (lastRow === 0) {
      sheet.appendRow(["Product Name", "Product URL"]);
    }
    
    try {
      const html = UrlFetchApp.fetch(collectionUrl, { muteHttpExceptions: true }).getContentText();
      
      // Use a regular expression to extract product URLs (e.g., /products/product-name)
      const productUrlRegex = /\/products\/[a-z0-9\-]+/g;
      let match;
      const productUrls = [];
      
      while ((match = productUrlRegex.exec(html)) !== null) {
        const fullUrl = "https://marketplace.mainstreet.co.in" + match[0];
        productUrls.push(fullUrl);
      }
  
      // Add the extracted URLs to the sheet starting from the first empty row
      if (productUrls.length > 0) {
        productUrls.forEach(url => {
          sheet.appendRow([url.split("/")[4], url]); // Extract the product name from URL for display
        });
      } else {
        sheet.appendRow(["No Products Found", ""]);
      }
    } catch (e) {
      Logger.log(`Error fetching page: ${e.message}`);
      sheet.appendRow(["Error fetching product links", ""]);
    }
  }
  