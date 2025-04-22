function getShopifyOrders() {
    const accessToken = "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";
    const shop = "crepdogcrew.com";
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("MASTER"); // change to your sheet name
  
    // Step 1: Get last sync time from M2
    let lastSyncTime = sheet.getRange("M2").getValue();
    if (!lastSyncTime) {
      lastSyncTime = new Date(2000, 0, 1); // fallback to a very old date
    }
    const isoDate = Utilities.formatDate(new Date(lastSyncTime), "GMT", "yyyy-MM-dd'T'HH:mm:ss'Z'");
  
    // Step 2: Fetch orders created after last sync
    const url = `https://${shop}/admin/api/2023-10/orders.json?status=any&created_at_min=${isoDate}&limit=250`;
  
    const options = {
      method: "get",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    };
  
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
  
    if (!data.orders) {
      Logger.log("No orders found or API error: " + response.getContentText());
      return;
    }
  
    const orders = data.orders;
  
    // Set headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Order ID", "Shipping Method", "Order Name", "", "Order Date", "Shipping City",
        "Vendor Name", "Products", "", "Final Price", "Discount", "Shipping Charges"
      ]);
    }
  
    // Step 3: Avoid duplicates
    let existingOrderIDs = [];
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      existingOrderIDs = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat().map(String);
    }
  
    const newRows = [];
  
    orders.forEach(order => {
      const orderIdStr = String(order.id);
      if (!existingOrderIDs.includes(orderIdStr)) {
        const createdAt = new Date(order.created_at);
        const formattedDate = Utilities.formatDate(createdAt, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
        const shippingMethod = order.shipping_lines[0]?.title || "None";
        const shippingCharge = order.shipping_lines[0]?.price || "0";
        const shippingCity = order.shipping_address?.city || "N/A";
        const discount = order.total_discounts || "0.00";
  
        order.line_items.forEach(item => {
          const product = `${item.title} (${item.variant_title || "N/A"})`;
          const vendorName = item.vendor || "N/A";
  
          newRows.push([
            order.id,
            shippingMethod,
            order.name,
            "",
            formattedDate,
            shippingCity,
            vendorName,
            product,
            "",
            order.total_price,
            discount,
            shippingCharge
          ]);
        });
      }
    });
  
    // Step 4: Insert at top below headers
    if (newRows.length > 0) {
      sheet.insertRowsAfter(1, newRows.length);
      sheet.getRange(2, 1, newRows.length, 12).setValues(newRows);
      Logger.log(`✅ Inserted ${newRows.length} new order(s).`);
    } else {
      Logger.log("✅ No new orders to insert - Lets play 8 ball pool now!.");
    }
  
    // Step 5: Update last sync time
    const now = new Date();
    sheet.getRange("M1").setValue("Last Synced: " + Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"));
    sheet.getRange("M2").setValue(now); // Store actual last sync time here
  }
  