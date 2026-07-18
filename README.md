# El Dorado Scraper

Extrae todos los productos de una categoría de [eldorado.com.uy](https://www.eldorado.com.uy/)
(nombre, precio actual, URL del producto, URL de la imagen y categoría) con **Node.js, Axios y
Cheerio**. El resultado se guarda en un archivo JSON.

Scrapes all products of a single category from [eldorado.com.uy](https://www.eldorado.com.uy/)
(name, current price, product URL, image URL and category) using **Node.js, Axios and Cheerio**.
The output is saved to a JSON file.

---

## Español

### Requisitos

- **Node.js 18 o superior** (verificá con `node -v`)
- **npm** (viene incluido con Node.js)
- Conexión a internet (el script consulta el sitio en vivo)

Si no tenés Node.js, descargalo desde [nodejs.org](https://nodejs.org/).

### 1. Instalar las dependencias

Abrí una terminal dentro de la carpeta del proyecto y ejecutá:

```bash
npm install
```

Esto lee `package.json` y descarga Axios y Cheerio en una carpeta nueva `node_modules`.

### 2. Ejecutar el scraper

```bash
npm start
```

Por defecto recorre toda la categoría *Jugos y Jugos en Polvo* (todas sus páginas, hasta que una
página no devuelve productos), muestra un resumen en la terminal y guarda los resultados en
`output/<categoría>.json`.

### 3. Controlar el volumen

Sin `--pages` ni `--limit` recorre la categoría completa. Para limitar el volumen, pasá las opciones
después del separador `--`:

```bash
npm start -- --pages=3                 # solo 3 páginas
npm start -- --limit=100               # se detiene a los 100 productos
npm start -- --pages=5 --limit=200     # combina ambas
npm start -- --out=jugos.json          # guarda en otro archivo
```

Para scrapear otra categoría usá `--category` (recorre la categoría completa por defecto):

```bash
npm start -- --category=https://www.eldorado.com.uy/frescos/postres
npm start -- --category=https://www.eldorado.com.uy/kiosko/cigarros
```

### Opciones

| Opción       | Por defecto            | Descripción                              |
| ------------ | ---------------------- | ---------------------------------------- |
| `--pages`    | todas                  | Cantidad de páginas a recorrer           |
| `--limit`    | (ninguno)              | Se detiene al llegar a esta cantidad     |
| `--category` | Jugos y Jugos en Polvo | URL de la categoría a scrapear           |
| `--out`      | output/&lt;categoría&gt;.json | Archivo donde se guardan los resultados |

### Salida

Mientras se ejecuta, el script imprime cada producto en la consola (nombre, precio y URL) y guarda
los resultados en `output/<categoría>.json`. Es un archivo por categoría, así distintas corridas no
se pisan entre sí. El archivo envuelve los productos (los cinco campos cada uno) con algo de metadata:

```json
{
  "category": "Jugos y Jugos en Polvo",
  "categoryUrl": "https://www.eldorado.com.uy/bebidas/bebidas-sin-alcohol/jugos-y-jugos-en-polvo",
  "scrapedAt": "2026-07-18T12:34:56.789Z",
  "count": 168,
  "products": [
    {
      "name": "Jugo Ades Multi10 Manzana 1Lt",
      "price": 123,
      "currency": "UYU",
      "url": "https://www.eldorado.com.uy/jugo-ades-multi10-manzana-1lt/p",
      "image": "https://eldoradouy.vtexassets.com/arquivos/ids/1176698/1574244.jpg",
      "category": "Jugos y Jugos en Polvo"
    }
  ]
}
```

### Pruebas

```bash
npm test
```

Ejecuta las pruebas unitarias del parser con el test runner incluido en Node (sin configuración
extra).

### Cómo funciona

El Dorado usa VTEX y renderiza los precios en el navegador, por lo que el precio no está en el HTML
que descarga Axios. En lugar de scrapear la grilla de productos, el script lee el bloque
`application/ld+json` que VTEX incluye en cada página de categoría: ahí figura cada producto con su
nombre, URL, imagen y precio. La paginación usa el parámetro `?page=N`, y el scraper se detiene
apenas una página no devuelve productos.

### Solución de problemas

- **No se reconoce `node` o `npm`**: instalá Node.js desde [nodejs.org](https://nodejs.org/); npm
  viene incluido.
- **`UNABLE_TO_VERIFY_LEAF_SIGNATURE` o errores de certificado**: estás detrás de un proxy
  corporativo o VPN que inspecciona el tráfico TLS. Indicale a Node que confíe en los certificados
  del sistema:
  - PowerShell: `$env:NODE_OPTIONS='--use-system-ca'; npm start`
  - CMD: `set NODE_OPTIONS=--use-system-ca && npm start`
  - macOS / Linux: `NODE_OPTIONS=--use-system-ca npm start`
- **"No products found"**: verificá que la URL de `--category` sea una página de categoría válida y
  que tengas conexión a internet.

---

## English

### Requirements

- **Node.js 18 or newer** (check with `node -v`)
- **npm** (comes bundled with Node.js)
- An internet connection (the script requests the live website)

If you don't have Node.js, download it from [nodejs.org](https://nodejs.org/).

### 1. Install the dependencies

Open a terminal inside the project folder and run:

```bash
npm install
```

This reads `package.json` and downloads Axios and Cheerio into a new `node_modules` folder.

### 2. Run the scraper

```bash
npm start
```

By default it scrapes the whole *Jugos y Jugos en Polvo* category (every page, until a page returns
no products), prints a summary in the terminal, and writes the results to `output/<category>.json`.

### 3. Control how much to scrape

Without `--pages` or `--limit` it walks the entire category. To cap the volume, pass options after a
`--` separator:

```bash
npm start -- --pages=3                 # only 3 pages
npm start -- --limit=100               # stop after 100 products
npm start -- --pages=5 --limit=200     # combine both
npm start -- --out=jugos.json          # save to a different file
```

Scrape a different category with `--category` (it walks the whole category by default):

```bash
npm start -- --category=https://www.eldorado.com.uy/frescos/postres
npm start -- --category=https://www.eldorado.com.uy/kiosko/cigarros
```

### Options

| Flag         | Default                | Description                          |
| ------------ | ---------------------- | ------------------------------------ |
| `--pages`    | all                    | Number of category pages to walk     |
| `--limit`    | (none)                 | Stop after this many products        |
| `--category` | Jugos y Jugos en Polvo | Category URL to scrape               |
| `--out`      | output/&lt;category&gt;.json | File to write the results to         |

### Output

As it runs, the script prints each scraped product to the console (name, price and URL) and saves
the full results to `output/<category>.json`. One file per category, so different runs don't
overwrite each other. The file wraps the products (all five fields each) with some metadata:

```json
{
  "category": "Jugos y Jugos en Polvo",
  "categoryUrl": "https://www.eldorado.com.uy/bebidas/bebidas-sin-alcohol/jugos-y-jugos-en-polvo",
  "scrapedAt": "2026-07-18T12:34:56.789Z",
  "count": 168,
  "products": [
    {
      "name": "Jugo Ades Multi10 Manzana 1Lt",
      "price": 123,
      "currency": "UYU",
      "url": "https://www.eldorado.com.uy/jugo-ades-multi10-manzana-1lt/p",
      "image": "https://eldoradouy.vtexassets.com/arquivos/ids/1176698/1574244.jpg",
      "category": "Jugos y Jugos en Polvo"
    }
  ]
}
```

### Tests

```bash
npm test
```

Runs the parser unit tests with Node's built-in test runner (no extra setup needed).

### How it works

El Dorado runs on VTEX and renders prices in the browser, so the price is not present in the raw
HTML that Axios downloads. Instead of scraping the product grid, the script reads the
`application/ld+json` block that VTEX embeds in every category page, which lists each product with
its name, URL, image and price. Pagination uses the `?page=N` query parameter, and the scraper stops
as soon as a page returns no products.

### Troubleshooting

- **`node` / `npm` not recognized**: install Node.js from [nodejs.org](https://nodejs.org/); npm is
  included.
- **`UNABLE_TO_VERIFY_LEAF_SIGNATURE` or certificate errors**: you are behind a corporate proxy or
  VPN that inspects TLS traffic. Tell Node to trust your system certificate store:
  - PowerShell: `$env:NODE_OPTIONS='--use-system-ca'; npm start`
  - CMD: `set NODE_OPTIONS=--use-system-ca && npm start`
  - macOS / Linux: `NODE_OPTIONS=--use-system-ca npm start`
- **"No products found"**: make sure the `--category` URL is a real category page and that you have
  internet access.
