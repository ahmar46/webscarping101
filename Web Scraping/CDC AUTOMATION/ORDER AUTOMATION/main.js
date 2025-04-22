function getShopifyOrders() {
    const accessToken = "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";
    const shop = "crepdogcrew.com";
    const url = `https://${shop}/admin/api/2023-10/orders.json?status=any&limit=50`;
  
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
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
    // Set headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Order ID",
        "Shipping Method",
        "Order Name",
        "", // Blank
        "Order Date",
        "Shipping City",
        "Vendor Name",
        "Products",
        "", // Blank
        "Final Price",
        "Discount",
        "Shipping Charges"
      ]);
    }
  
    let existingOrderIDs = [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    existingOrderIDs = sheet
      .getRange(2, 1, lastRow - 1, 1)
      .getValues()
      .flat()
      .map(String);
  }
  
  
    const newRows = [];
  
    orders.forEach(order => {
      const orderIdStr = String(order.id);
      if (!existingOrderIDs.includes(orderIdStr)) {
        const products = order.line_items
          .map(item => `${item.title} (${item.variant_title || "N/A"})`)
          .join(", ");
        const vendorName = order.line_items.length > 0 ? order.line_items[0].vendor : "N/A";
        const shippingMethod = order.shipping_lines.length > 0 ? order.shipping_lines[0].title : "None";
        const shippingCharge = order.shipping_lines.length > 0 ? order.shipping_lines[0].price : "0";
        const shippingCity = order.shipping_address ? order.shipping_address.city : "N/A";
        const createdAt = new Date(order.created_at);
        const formattedDate = Utilities.formatDate(createdAt, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");
        const discount = order.total_discounts || "0.00";
  
        newRows.push([
          order.id,
          shippingMethod,
          order.name,
          "", // Blank
          formattedDate,
          shippingCity,
          vendorName,
          products,
          "", // Blank
          order.total_price,
          discount,
          shippingCharge
        ]);
      }
    });
  
  if (Array.isArray(newRows) && newRows.length > 0) {
    sheet.insertRows(2, newRows.length);
    sheet.getRange(2, 1, newRows.length, 12).setValues(newRows);
    Logger.log(`✅ Inserted ${newRows.length} new order(s).`);
  } else {
    Logger.log("✅ No new orders to insert — all caught up!");
  }
  
  
  
    // Timestamp in cell M1
    const now = new Date();
    const formattedNow = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    sheet.getRange("M1").setValue("Last Synced: " + formattedNow);
  }
  