const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY;

const APILAYER_URL = 'https://api.apilayer.com/exchangerates_data/convert';
const FREE_FALLBACK_URL = 'https://api.frankfurter.app/latest';

const formatSymbol = (value) => Math.round((value + Number.EPSILON) * 1000000) / 1000000;

export const fetchExchangeRate = async (fromCurrency, toCurrency) => {
  if (!fromCurrency || !toCurrency) {
    throw new Error('Both base and target currencies are required');
  }

  const apiUrl = new URL(APILAYER_URL);
  apiUrl.searchParams.set('from', fromCurrency);
  apiUrl.searchParams.set('to', toCurrency);
  apiUrl.searchParams.set('amount', '1');
  const apiUrlString = apiUrl.toString();

  console.log('Exchange Rate API URL:', apiUrlString);
  console.log('Exchange Rate API key present:', Boolean(EXCHANGERATE_API_KEY));

  if (EXCHANGERATE_API_KEY) {
    let response;
    try {
      response = await fetch(apiUrlString, {
        headers: {
          apikey: EXCHANGERATE_API_KEY,
        },
      });
    } catch (err) {
      console.error('Exchange rate fetch failed', { url: apiUrlString, error: err.message });
      response = null;
    }

    if (response && response.ok) {
      const data = await response.json();
      if (typeof data.result !== 'number') {
        throw new Error('Unexpected exchange rate response');
      }
      return formatSymbol(data.result);
    }

    if (response) {
      console.error('Exchange rate provider error, falling back', { status: response.status, url: response.url });
    }
  } else {
    console.warn('Missing exchange rate API key, using fallback provider');
  }

  const fallbackUrl = new URL(FREE_FALLBACK_URL);
  fallbackUrl.searchParams.set('from', fromCurrency);
  fallbackUrl.searchParams.set('to', toCurrency);
  const fallbackUrlString = fallbackUrl.toString();
  console.log('Exchange Rate fallback URL:', fallbackUrlString);

  let fallbackResponse;
  try {
    fallbackResponse = await fetch(fallbackUrlString);
  } catch (err) {
    console.error('Exchange rate fallback fetch failed', { url: fallbackUrlString, error: err.message });
    const error = new Error('Exchange rate service unavailable');
    error.statusCode = 502;
    throw error;
  }

  if (!fallbackResponse.ok) {
    const body = await fallbackResponse.text().catch(() => '');
    console.error('Exchange rate fallback provider error', { status: fallbackResponse.status, body: body.slice(0, 200) });
    const error = new Error('Exchange rate fallback provider error');
    error.statusCode = 502;
    throw error;
  }

  const fallbackData = await fallbackResponse.json();
  if (!fallbackData || !fallbackData.rates || typeof fallbackData.rates[toCurrency] !== 'number') {
    console.error('Unexpected exchange rate fallback response', { data: fallbackData });
    const error = new Error('Unexpected exchange rate fallback response');
    error.statusCode = 502;
    throw error;
  }

  return formatSymbol(fallbackData.rates[toCurrency]);
};
