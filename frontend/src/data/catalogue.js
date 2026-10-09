import axios from 'axios';

// Keep the API URL in one place so it is easy to change between local and deployed setups.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';
const API_PATH = `${API_BASE_URL}/api/inft3050`;

// Manually chosen featured catalogue items: one book, one movie, and one game.
const FEATURED_STOCK_ITEM_IDS = [31, 248, 457];

// Ask for one database row by ID instead of downloading every row for the homepage.
async function fetchRecord(table, id) {
  const response = await axios.get(`${API_PATH}/${table}/${id}`);
  return response.data;
}

// The browse page needs the full set; each table is small enough for one request today.
async function fetchTable(table) {
  const response = await axios.get(`${API_PATH}/${table}`, {
    params: { limit: 1000 },
  });
  return response.data.list;
}

// SQL/API versions have used different casing for this column; accept either one.
function getSourceName(source) {
  return source.Source_name || source.SourceName || 'Format not specified';
}

function getCategoryName(genreId, genres) {
  const genre = genres.find((item) => item.genreID === genreId || item.GenreID === genreId);
  return genre?.Name || 'Other';
}

// Build one browse item for every Stocktake row, joining in its product, source, and genre.
export async function fetchCatalogueItems() {
  const [products, stockItems, sources, genres] = await Promise.all([
    fetchTable('Product'),
    fetchTable('Stocktake'),
    fetchTable('Source'),
    fetchTable('Genre'),
  ]);

  const productsById = new Map(products.map((product) => [product.ID, product]));
  const sourcesById = new Map(sources.map((source) => [source.sourceid || source.Sourceid, source]));

  return stockItems.flatMap((stockItem) => {
    const product = productsById.get(stockItem.ProductId);
    const source = sourcesById.get(stockItem.SourceId);
    if (!product || !source) return [];

    const quantity = Number(stockItem.Quantity) || 0;
    return [{
      id: stockItem.ItemId,
      productId: product.ID,
      title: product.Name,
      creator: product.Author || 'Unknown creator',
      category: getCategoryName(product.Genre, genres),
      format: getSourceName(source),
      price: Number(stockItem.Price) || 0,
      availability: quantity > 0 ? 'In stock' : 'Out of stock',
      quantity,
    }];
  });
}

// The database splits a displayable item across Stocktake, Product, Source, and Genre.
async function fetchFeaturedItem(stockItemId) {
  const stockItem = await fetchRecord('Stocktake', stockItemId);
  const [product, source] = await Promise.all([
    fetchRecord('Product', stockItem.ProductId),
    fetchRecord('Source', stockItem.SourceId),
  ]);
  const genre = await fetchRecord('Genre', product.Genre);

  // Stocktake is the purchasable format, so use its price and quantity on the card.
  const quantity = Number(stockItem.Quantity) || 0;
  return {
    id: stockItem.ItemId,
    productId: product.ID,
    title: product.Name,
    creator: product.Author || 'Unknown creator',
    category: genre.Name || 'Other',
    format: getSourceName(source),
    price: Number(stockItem.Price) || 0,
    availability: quantity > 0 ? 'In stock' : 'Out of stock',
    quantity,
  };
}

// Only load the three manually selected items shown on the homepage.
export async function fetchFeaturedCatalogueItems() {
  return Promise.all(FEATURED_STOCK_ITEM_IDS.map(fetchFeaturedItem));
}

// A details URL uses the Stocktake ID because price, format, and quantity belong to that row.
export async function fetchCatalogueItemDetails(stockItemId) {
  const stockItem = await fetchRecord('Stocktake', stockItemId);
  const [product, source] = await Promise.all([
    fetchRecord('Product', stockItem.ProductId),
    fetchRecord('Source', stockItem.SourceId),
  ]);
  const genre = await fetchRecord('Genre', product.Genre);

  // Each category has its own subgenre table in the database.
  const subgenreTable = {
    Books: 'BookGenre',
    Movies: 'MovieGenre',
    Games: 'GameGenre',
  }[genre.Name];
  const subgenreId = product.subGenre ?? product.SubGenre;
  let subgenre = null;

  if (subgenreTable && subgenreId) {
    try {
      subgenre = await fetchRecord(subgenreTable, subgenreId);
    } catch (error) {
      // Some legacy records have a missing subgenre link; the rest of the details still work.
    }
  }

  const quantity = Number(stockItem.Quantity) || 0;
  return {
    id: stockItem.ItemId,
    productId: product.ID,
    title: product.Name,
    creator: product.Author || 'Unknown creator',
    description: product.Description || 'No description is available.',
    category: genre.Name || 'Other',
    subgenre: subgenre?.Name || 'Not specified',
    published: product.Published || null,
    format: getSourceName(source),
    price: Number(stockItem.Price) || 0,
    availability: quantity > 0 ? 'In stock' : 'Out of stock',
    quantity,
  };
}