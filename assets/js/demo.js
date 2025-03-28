const newsInput = document.getElementById('news-input');
const newsResultDiv = document.getElementById('news-result');
const newsExplanationP = document.getElementById('news-explanation');
let newsDebounceTimer; // Define debounce timer variable

newsInput.addEventListener('input', function() {
    const text = this.value.trim();
    const words = text.split(' ').filter(word => word.trim() !== '');

    // Clear previous results immediately if input is too short
    if (words.length <= 3) {
        newsResultDiv.innerHTML = ''; // Clear previous results and colored words
        newsExplanationP.style.display = 'none';
        return;
    }

    // Debounce mechanism
    clearTimeout(newsDebounceTimer);
    newsDebounceTimer = setTimeout(() => {
        fetchNewsClassification(text);
    }, 500); // Wait 500ms after user stops typing
});

// Add listener for Enter key on news input
newsInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission/newline behavior
        const text = this.value.trim();
        const words = text.split(' ').filter(word => word.trim() !== '');
        if (words.length > 3) {
            clearTimeout(newsDebounceTimer); // Clear any pending debounce
            fetchNewsClassification(text); // Trigger classification immediately
        }
    }
});


function fetchNewsClassification(text) {
    newsResultDiv.innerHTML = '<span class="loading-message">Classifying...</span>'; // Show loading message
    newsExplanationP.style.display = 'none';

    fetch('https://bkrv0f4amc.execute-api.us-east-1.amazonaws.com/news_classify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: text })
    })
    .then(response => {
        if (!response.ok) {
            // Try to get error message from API response body if possible
             return response.json().catch(() => ({})).then(errBody => {
                throw new Error(`HTTP error! status: ${response.status}. ${errBody.message || ''}`);
             });
        }
        return response.json();
    })
    .then(data => {
        if (data.category && data.title && data.colors && data.gradients) {
            displayNewsClassification(data.category, data.title, data.colors, data.gradients);
        } else {
             // Handle cases where the API might return success but not the expected data
             console.warn('API response structure might be incorrect:', data);
             throw new Error('Invalid response structure from API.');
        }
    })
    .catch(error => {
        console.error('Error fetching news classification:', error);
        newsResultDiv.innerHTML = `<span class="error-message">Failed to classify: ${error.message}.</span>`;
        newsExplanationP.style.display = 'none';
    });
}

function displayNewsClassification(category, titles, colors, gradients) {
    // Clear previous content first
    newsResultDiv.innerHTML = '';

    // Display category
    const categorySpan = document.createElement('span');
    categorySpan.textContent = 'Classification: ' + category;
    newsResultDiv.appendChild(categorySpan);
    newsResultDiv.appendChild(document.createElement('br')); // Line break

    // Create container for colored words
    const wordsContainer = document.createElement('div');
    wordsContainer.style.marginTop = '10px'; // Add some space

    titles.forEach((title, index) => {
        const wordContainer = document.createElement('div');
        wordContainer.className = 'word-container';
        // Ensure color is a valid CSS color, provide fallback if needed
        wordContainer.style.backgroundColor = colors[index] || '#888'; // Fallback color
        wordContainer.textContent = title;

        const gradientSpan = document.createElement('span');
        gradientSpan.className = 'gradient-value';
        // Check if gradient is a number before formatting
        const gradientValue = typeof gradients[index] === 'number' ? gradients[index].toFixed(2) : 'N/A';
        gradientSpan.textContent = ' (' + gradientValue + ')'; // Simplified display
        wordContainer.appendChild(gradientSpan);

        wordsContainer.appendChild(wordContainer);
    });

    newsResultDiv.appendChild(wordsContainer);
    newsExplanationP.style.display = 'block'; // Show explanation
}


// --- Script for Semantic Product Search ---
const searchInput = document.getElementById('product-search-input');
const searchButton = document.getElementById('product-search-button');
const searchResultsDiv = document.getElementById('product-search-results');

// Function to trigger search
function performProductSearch() {
    const query = searchInput.value.trim();

    if (!query) {
        searchResultsDiv.innerHTML = '<p class="error-message">Please enter a search query.</p>';
        return;
    }

    searchResultsDiv.innerHTML = '<p class="loading-message">Searching for products...</p>'; // Show loading message

    // !!! IMPORTANT: Ensure this is your correct API endpoint !!!
    const apiUrl = 'https://bkrv0f4amc.execute-api.us-east-1.amazonaws.com/semantic-product-search';

    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: query }) // Ensure your API expects { "title": "query" }
    })
    .then(response => {
        if (!response.ok) {
             // Try to get error message from API response body if possible
             return response.json().catch(() => ({})).then(errBody => {
                throw new Error(`HTTP error! status: ${response.status}. ${errBody.message || 'Check API logs.'}`);
             });
        }
        return response.json();
    })
    .then(data => {
        // Assuming the API returns an object with a 'product_details' key which is an array
        // Adjust 'product_details' if your API uses a different key (e.g., 'results', 'products')
        const products = data.product_details;

        // ** THE FIX: Use console.log for debugging, or remove this line **
        console.log("Received products:", products); // Use console.log, not print()

        if (Array.isArray(products) && products.length > 0) {
            displayProductResults(products);
        } else if (Array.isArray(products) && products.length === 0) {
            searchResultsDiv.innerHTML = '<p>No products found matching your query.</p>';
        } else {
            // Handle cases where data.product_details is not an array or is missing
            console.error('Invalid data format received, expected product_details array:', data);
            searchResultsDiv.innerHTML = '<p class="error-message">Received unexpected data format from the server.</p>';
        }
    })
    .catch(error => {
        console.error('Error fetching product search results:', error);
        // Display a more informative error message
        searchResultsDiv.innerHTML = `<p class="error-message">Failed to fetch results: ${error.message}. Please check the console and API endpoint/logs.</p>`;
    });
}

// Add listener for button click
searchButton.addEventListener('click', performProductSearch);

// Add listener for Enter key on search input
searchInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission behavior
        performProductSearch(); // Trigger the search
    }
});


function displayProductResults(products) {
    // Clear previous results or loading message
    searchResultsDiv.innerHTML = '';

    // Create table structure
    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create table header row
    const headerRow = document.createElement('tr');
    // **CHECK API RESPONSE**: Make sure these keys match your actual product data
    const headers = ['Product Title', 'Brand', 'Description']; // Adjusted order based on potential API response
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Populate table body with product data
    products.slice(0, 5).forEach(product => { // Display top 5 results
        const row = document.createElement('tr');

        // **CHECK API RESPONSE**: Adjust property names based on your actual API response
        // Example: product.title, product.brandName, product.descriptionText etc.
        const title = product.product_title || 'N/A';
        const brand = product.product_brand || 'N/A';        // Swapped with description based on your example data
        const description = product.product_description || 'N/A'; // Swapped with brand based on your example data


        // Match data order to header order
        [title, brand, description].forEach(text => {
            const td = document.createElement('td');
            // Sanitize text before inserting to prevent XSS if data comes from untrusted source
            // For basic display, textContent is safer than innerHTML
            td.textContent = text;
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    searchResultsDiv.appendChild(table);
}
