function getShopifyOrders() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders'); // Specify your sheet name
    const url = 'https://your-store.myshopify.com/admin/api/2023-10/orders.json?status=any&limit=250'; // Update your store's URL and API version
    const apiKey = 'shpat_XXXXXXXXXXXX'; // Your private app API key
    const password = 'XXXXXXXXXXXX'; // Your private app API password
    
    // Make the API request to fetch orders
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        'Authorization': 'Basic ' + Utilities.base64Encode(apiKey + ':' + password)
      }
    });
  
    const json = JSON.parse(response.getContentText());
    const orders = json.orders || [];
  
    // Collect existing Order IDs to avoid duplicates
    let existingOrderIDs = [];
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      existingOrderIDs = sheet
        .getRange(2, 1, lastRow - 1, 1)
        .getValues()
        .flat()
        .map(String);
    }
  
    // Collect new order data
    const newRows = [];
    orders.forEach(order => {
      const orderID = order.id;
      if (existingOrderIDs.indexOf(String(orderID)) === -1) { // Check if Order ID is already present
        const orderDate = new Date(order.created_at).toLocaleString(); // Convert to local date format
        const shippingCity = order.shipping_address ? order.shipping_address.city : 'N/A';
        const shippingMethod = order.shipping_lines ? order.shipping_lines.map(line => line.title).join(', ') : 'N/A';
        const products = order.line_items.map(item => item.title + ' (' + item.variant_title + ')').join(', ');
  
        newRows.push([
          orderID, 
          shippingMethod, 
          `#${orderID}`, 
          '', // Blank column after Order Name
          orderDate, 
          shippingCity, 
          order.vendor || 'Unknown', // Vendor Name
          products, 
          '', // Blank column after Products
          order.total_price, 
          order.discount_codes.length ? order.discount_codes[0].amount : '0', // Discount amount
          order.total_shipping_price_set ? order.total_shipping_price_set.shop_money.amount : '0' // Shipping Charges
        ]);
      }
    });
  
    // If there are new orders, insert them
    if (newRows.length > 0) {
      sheet.insertRows(2, newRows.length); // Insert at the top (row 2), keeping the header intact
      sheet.getRange(2, 1, newRows.length, 12).setValues(newRows); // Insert the new data
      Logger.log(`Inserted ${newRows.length} new orders.`);
    } else {
      Logger.log('No new orders found.');
    }
  
    // Timestamp of last sync
    const timestamp = new Date();
    sheet.getRange('A1').setValue(`Last Sync: ${timestamp}`);
  }
  