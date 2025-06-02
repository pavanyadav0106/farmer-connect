let retryInterval = 30000;

async function fetchMarketPrices(page = 1) {
  try {
    const response = await fetch(`https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd0000011d1a465aad6d431b755d0dbc757078c7&format=json&page=${page}`);

    if (!response.ok) throw new Error("API response not OK");

    const data = await response.json();

    if (data.records) {
      const uniquePrices = {};
      data.records.forEach(record => {
        if (!uniquePrices[record.commodity]) {
          uniquePrices[record.commodity] = `${record.commodity}: ₹${record.modal_price}/quintal`;
        }
      });

      document.getElementById("market-ticker").textContent = 
        Object.values(uniquePrices).join(" | ") || "Market data unavailable. Stay tuned!";
      
      retryInterval = 30000;
    } else {
      throw new Error("No market data available");
    }
  } catch (error) {
    console.error("Error fetching prices:", error);
    document.getElementById("market-ticker").textContent = "Waiting for market data...";
    retryInterval = Math.min(retryInterval * 2, 300000);
  }

  setTimeout(fetchMarketPrices, retryInterval);
}

document.addEventListener('DOMContentLoaded', () => {
  fetchMarketPrices();
  setInterval(fetchMarketPrices, 60000);
});