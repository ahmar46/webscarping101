function getMainstreetLowestPricesForMany() {
    const urls = [
      {
        name: "Yeezy 350 V2 Onyx",
        url: "https://marketplace.mainstreet.co.in/products/yeezy-350-v2-onyx-11"
      },
      {
        name: "Jordan 1 Retro High OG University Blue",
        url: "https://marketplace.mainstreet.co.in/products/jordan-1-retro-high-og-university-blue-2"
      },
      {
        name: "Nike Dunk Low Panda",
        url: "https://marketplace.mainstreet.co.in/products/nike-dunk-low-retro-white-black-1"
      }
      // 👉 Add more products here as needed
    ];
  
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.clearContents();
    sheet.appendRow(["Product", "Lowest Price"]);
  
    urls.forEach(item => {
      try {
        const html = UrlFetchApp.fetch(item.url, { muteHttpExceptions: true }).getContentText();
        const variantPriceRegex = /"price":(\d+)/g;
        let match;
        let prices = [];
  
        while ((match = variantPriceRegex.exec(html)) !== null) {
          prices.push(parseInt(match[1]));
        }
  
        if (prices.length > 0) {
          const lowest = Math.min(...prices) / 100;
          const formatted = `₹${lowest.toFixed(2)}`;
          sheet.appendRow([item.name, formatted]);
        } else {
          sheet.appendRow([item.name, "Price Not Found"]);
        }
      } catch (e) {
        sheet.appendRow([item.name, "Error fetching"]);
      }
    });
  }
  