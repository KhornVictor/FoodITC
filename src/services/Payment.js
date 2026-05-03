const PAYMENTS_DATA_URL = "/public/data/payments.json";

export const fetchPayments = async () => {
  try {
    const response = await fetch(PAYMENTS_DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load payments: ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  } catch (error) {
    console.error(`Error fetching payments: ${error.message}`);
    return [];
  }
};
