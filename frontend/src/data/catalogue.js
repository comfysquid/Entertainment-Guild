// AI-assisted (Claude Code): simplified/refactored, then reviewed and re-commented by me.
// Prompt: "Review my largest React pages and simplify the code where possible without changing too much
//   functionality or the appearance/styling of the app. Keep the changes focused and explain what you changed,
//   where, and why."

import axios from 'axios';

// inft3050 api url
const API_URL = 'http://localhost:3001/api/inft3050';

// stocktake IDs for homepage
const FEATURED_ITEM_IDS = [31, 248, 457];

// Gets a single row from a table
async function getRow(table, id) {
  const response = await axios.get(API_URL + '/' + table + '/' + id);
  return response.data;
}

// Gets every row from a table. The API only returns a few rows unless we ask for more hence limit param
async function getAllRows(table) {
  const response = await axios.get(API_URL + '/' + table, { params: { limit: 1000 } });
  return response.data.list;
}

// The data for one item is spread across 4 tables:
//   Stocktake = price and quantity, Product = title and author,
//   Source = format (e.g. DVD), Genre = category (e.g. Books).
// makeItem combines into one object
function makeItem(stockItem, product, source, genre) {
  // Some products have no genre, so put them under 'Other'.
  let category = 'Other';
  if (genre) {
    category = genre.Name;
  }

  return {
    id: stockItem.ItemId,
    title: product.Name,
    creator: product.Author || 'Unknown creator',
    category: category,
    format: source.Source_name,
    price: stockItem.Price,
    quantity: stockItem.Quantity,
  };
}

// Used by the search page: loads all items in the catalogue.
export async function fetchCatalogueItems() {
  const stockItems = await getAllRows('Stocktake');
  const products = await getAllRows('Product');
  const sources = await getAllRows('Source');
  const genres = await getAllRows('Genre');

  const items = [];

  for (const stockItem of stockItems) {
    // Find the matching row in each of the other tables.
    const product = products.find((p) => p.ID === stockItem.ProductId);
    const source = sources.find((s) => s.sourceid === stockItem.SourceId);

    // Skip any stock rows that dont have a matching product or source
    if (!product || !source) {
      continue;
    }

    const genre = genres.find((g) => g.genreID === product.Genre);
    items.push(makeItem(stockItem, product, source, genre));
  }

  return items;
}

// Load 1 item by its Stocktake ID
async function fetchItem(itemId) {
  const stockItem = await getRow('Stocktake', itemId);
  const product = await getRow('Product', stockItem.ProductId);
  const source = await getRow('Source', stockItem.SourceId);
  const genre = await getRow('Genre', product.Genre);

  return makeItem(stockItem, product, source, genre);
}

// For homepage: loads only the three featured items.
export async function fetchFeaturedCatalogueItems() {
  const items = [];

  for (const id of FEATURED_ITEM_IDS) {
    const item = await fetchItem(id);
    items.push(item);
  }

  return items;
}

// Used by the product details page: loads one item plus its description and subgenre.
export async function fetchCatalogueItemDetails(itemId) {
  const stockItem = await getRow('Stocktake', itemId);
  const product = await getRow('Product', stockItem.ProductId);
  const source = await getRow('Source', stockItem.SourceId);
  const genre = await getRow('Genre', product.Genre);

  const item = makeItem(stockItem, product, source, genre);
  item.description = product.Description || 'No description is available.';
  item.published = product.Published;

  // Books, movies and games each have their own subgenre table.
  let subgenreTable = '';
  if (genre.Name === 'Books') {
    subgenreTable = 'BookGenre';
  } else if (genre.Name === 'Movies') {
    subgenreTable = 'MovieGenre';
  } else if (genre.Name === 'Games') {
    subgenreTable = 'GameGenre';
  }

  item.subgenre = 'Not specified';
  if (subgenreTable !== '' && product.subGenre) {
    try {
      const subgenre = await getRow(subgenreTable, product.subGenre);
      item.subgenre = subgenre.Name;
    } catch (error) {
      // If no subgenre, leave as not specified
    }
  }

  return item;
}
